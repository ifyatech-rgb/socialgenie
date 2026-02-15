import { NextRequest, NextResponse } from "next/server";
import { getAuthUserEmail } from "@/lib/auth";
import { getHeyGenClient } from "@/lib/heygenClient";
import { prisma } from "@/lib/prisma";
import { trackAvatarEvent, trackError } from "@/lib/tracking";
import { canAccessApp } from "@/lib/payment";

export const dynamic = "force-dynamic";

const MAX_PHOTO_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_BYTES = 500 * 1024 * 1024; // 500MB

export async function POST(request: NextRequest) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const emailNormalized = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: emailNormalized },
      select: {
        id: true,
        payment_status: true,
        customAvatarsLimit: true,
        customAvatarsUsed: true,
        customAvatarIds: true,
      },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!canAccessApp(user.payment_status)) {
      return NextResponse.json(
        { error: "Complete your payment to use this feature.", code: "payment_required" },
        { status: 403 }
      );
    }

    const limit = user.customAvatarsLimit ?? 1;
    const used = user.customAvatarsUsed ?? 0;
    if (used >= limit) {
      return NextResponse.json(
        {
          error: "Custom avatar limit reached",
          code: "avatar_limit_reached",
          message:
            limit === 1
              ? "Free trial allows 1 custom avatar. Upgrade to create more!"
              : `You've used all ${limit} custom avatar slots. Upgrade for more!`,
          limit,
          used,
          remaining: 0,
        },
        { status: 403 }
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (formError) {
      console.error("[HeyGen create-avatar] FormData parse error:", formError);
      return NextResponse.json(
        {
          error: "Invalid request",
          message: "Could not read upload data. File may be too large or the request was corrupted.",
        },
        { status: 400 }
      );
    }

    const avatarName = formData.get("avatarName")?.toString()?.trim();
    const avatarType = formData.get("avatarType")?.toString()?.toLowerCase(); // 'photo' | 'video'
    const file = formData.get("file");
    const consentVideoFile = formData.get("consentVideo");

    if (!avatarName || !avatarType || !file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing required fields", message: "Please provide avatar name, type, and file" },
        { status: 400 }
      );
    }

    if (avatarType !== "photo" && avatarType !== "video") {
      return NextResponse.json(
        { error: "Invalid avatar type", message: 'Avatar type must be "photo" or "video"' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type || (avatarType === "photo" ? "image/jpeg" : "video/mp4");

    if (avatarType === "photo") {
      if (!file.type.startsWith("image/")) {
        return NextResponse.json(
          { error: "Invalid file", message: "Please upload an image (JPG, PNG)" },
          { status: 400 }
        );
      }
      if (buffer.length > MAX_PHOTO_BYTES) {
        return NextResponse.json(
          { error: "File too large", message: "Image must be under 10MB" },
          { status: 400 }
        );
      }
    } else {
      if (!file.type.startsWith("video/")) {
        return NextResponse.json(
          { error: "Invalid file", message: "Please upload a video (MP4, MOV)" },
          { status: 400 }
        );
      }
      if (buffer.length > MAX_VIDEO_BYTES) {
        return NextResponse.json(
          { error: "File too large", message: "Video must be under 100MB" },
          { status: 400 }
        );
      }
    }

    const apiKey = process.env.HEYGEN_API_KEY;
    if (!apiKey?.trim()) {
      console.error("[HeyGen create-avatar] HEYGEN_API_KEY is missing or empty");
      return NextResponse.json(
        {
          error: "creation_failed",
          message: "Custom avatars are not configured. Please add HEYGEN_API_KEY to your environment or contact support.",
          code: "heygen_not_configured",
        },
        { status: 503 }
      );
    }

    const heygen = getHeyGenClient();
    let result: { success: boolean; avatarId?: string; status?: string; message?: string; error?: string };

    if (avatarType === "photo") {
      result = await heygen.createPhotoAvatar(buffer, avatarName, mimeType);
    } else {
      const uploadResult = await heygen.uploadVideoFile(buffer, mimeType, file.name || "avatar-video.mp4");
      if (!uploadResult.success || !uploadResult.videoId) {
        const userMessage =
          uploadResult.error?.includes("404") || uploadResult.error?.includes("Not Found")
            ? "HeyGen upload service is temporarily unavailable. Please try again later or contact support."
            : uploadResult.error ?? "Video upload failed";
        return NextResponse.json(
          { error: "creation_failed", message: userMessage },
          { status: 500 }
        );
      }
      let consentVideoId: string | undefined;
      if (consentVideoFile && consentVideoFile instanceof File && consentVideoFile.size > 0) {
        const consentBuffer = Buffer.from(await consentVideoFile.arrayBuffer());
        const consentMime = consentVideoFile.type || "video/webm";
        const consentUpload = await heygen.uploadVideoFile(
          consentBuffer,
          consentMime,
          consentVideoFile.name || "consent-video.webm"
        );
        if (consentUpload.success && consentUpload.videoId) consentVideoId = consentUpload.videoId;
      }
      result = await heygen.createVideoAvatar(uploadResult.videoId, avatarName, consentVideoId);
    }

    if (!result.success) {
      const message = result.error ?? "Failed to create avatar";
      return NextResponse.json(
        { error: "creation_failed", message },
        { status: 500 }
      );
    }

    trackAvatarEvent({
      user_id: user.id,
      event_type: "avatar_created",
      avatar_id: result.avatarId ?? undefined,
      provider: "heygen",
      status: result.status,
    });

    const rawIds = user.customAvatarIds;
    const avatarIds: string[] = Array.isArray(rawIds) ? (rawIds as string[]) : [];
    const newUsed = used + 1;
    if (result.avatarId) avatarIds.push(result.avatarId);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        customAvatarsUsed: newUsed,
        customAvatarIds: avatarIds,
      },
    });

    return NextResponse.json({
      success: true,
      avatarId: result.avatarId,
      status: result.status,
      message: result.message,
      estimatedTime: avatarType === "photo" ? "5-15 minutes" : "15-30 minutes",
      avatarsUsed: newUsed,
      avatarsLimit: limit,
      avatarsRemaining: Math.max(0, limit - newUsed),
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : "Failed to create avatar";
    console.error("[HeyGen create-avatar]", errMsg);
    const email = await getAuthUserEmail(request).catch(() => null);
    const user = email ? await prisma.user.findUnique({ where: { email }, select: { id: true } }).catch(() => null) : null;
    trackError({
      user_id: user?.id ?? null,
      endpoint: "/api/heygen/create-avatar",
      error_message: errMsg,
      status_code: 500,
    });
    const userMessage =
      errMsg.includes("404") || errMsg.includes("Not Found")
        ? "HeyGen service is temporarily unavailable. Please try again later."
        : errMsg;
    return NextResponse.json(
      { error: "server_error", message: userMessage },
      { status: 500 }
    );
  }
}
