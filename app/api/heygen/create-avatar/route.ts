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

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, payment_status: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (!canAccessApp(user.payment_status)) {
      return NextResponse.json(
        { error: "Complete your payment to use this feature.", code: "payment_required" },
        { status: 403 }
      );
    }

    const formData = await request.formData();
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

    const heygen = getHeyGenClient();
    let result: { success: boolean; avatarId?: string; status?: string; message?: string; error?: string };

    if (avatarType === "photo") {
      result = await heygen.createPhotoAvatar(buffer, avatarName, mimeType);
    } else {
      const uploadResult = await heygen.uploadVideoFile(buffer, mimeType, file.name || "avatar-video.mp4");
      if (!uploadResult.success || !uploadResult.videoId) {
        return NextResponse.json(
          { error: "creation_failed", message: uploadResult.error ?? "Video upload failed" },
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
      return NextResponse.json(
        { error: "creation_failed", message: result.error ?? "Failed to create avatar" },
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

    return NextResponse.json({
      success: true,
      avatarId: result.avatarId,
      status: result.status,
      message: result.message,
      estimatedTime: avatarType === "photo" ? "5-15 minutes" : "15-30 minutes",
    });
  } catch (error) {
    console.error("[HeyGen create-avatar]", error);
    const email = await getAuthUserEmail(request).catch(() => null);
    const user = email ? await prisma.user.findUnique({ where: { email }, select: { id: true } }).catch(() => null) : null;
    trackError({
      user_id: user?.id ?? null,
      endpoint: "/api/heygen/create-avatar",
      error_message: error instanceof Error ? error.message : "Failed to create avatar",
      status_code: 500,
    });
    return NextResponse.json(
      { error: "server_error", message: error instanceof Error ? error.message : "Failed to create avatar" },
      { status: 500 }
    );
  }
}
