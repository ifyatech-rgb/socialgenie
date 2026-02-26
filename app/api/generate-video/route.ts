import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateVideo, getAvailableAvatars, getAvailableVoices } from "@/lib/video-generation";
import { canAccessApp, canUseFeature } from "@/lib/payment";
import { sanitizeVideoError, USER_FRIENDLY_VIDEO_ERRORS } from "@/lib/sanitize-video-errors";
import { getAvatarVoiceFromCache } from "@/lib/resolve-avatar-voice";

const CREDITS_PER_VIDEO = 5;

/**
 * POST /api/generate-video
 *
 * Generate a talking avatar video. Deducts credits, creates a project, and refunds on failure.
 * Body: scriptId?, script?, voiceId?, avatarId?, avatarName?, avatarLook?
 */
export async function POST(request: NextRequest) {
  let project: { id: string } | null = null;
  let creditsDeducted = false;

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email.trim().toLowerCase();
    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        credits: true,
        video_credits: true,
        video_credits_used: true,
        plan: true,
        created_at: true,
        payment_status: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!canAccessApp(user.payment_status ?? undefined)) {
      return NextResponse.json(
        { error: "Complete your payment to use this feature.", code: "payment_required" },
        { status: 403 }
      );
    }

    const creditsAvailable = user.video_credits ?? user.credits ?? 0;
    const featureCheck = canUseFeature({
      plan: user.plan ?? null,
      videoCredits: user.video_credits ?? 0,
      credits: user.credits ?? 0,
      createdAt: user.created_at ?? new Date(),
    });
    if (!featureCheck.allowed) {
      return NextResponse.json(
        {
          error: featureCheck.error,
          code: featureCheck.code,
          creditsRemaining: creditsAvailable,
        },
        { status: 402 }
      );
    }
    if (creditsAvailable < CREDITS_PER_VIDEO) {
      return NextResponse.json(
        {
          error: `Not enough credits. You need ${CREDITS_PER_VIDEO} credits to generate a video.`,
          code: "out_of_credits",
          creditsRequired: CREDITS_PER_VIDEO,
          creditsRemaining: creditsAvailable,
        },
        { status: 402 }
      );
    }

    if (!process.env.HEYGEN_API_KEY) {
      return NextResponse.json(
        { error: USER_FRIENDLY_VIDEO_ERRORS.API_KEY_INVALID },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      scriptId,
      script: scriptText,
      voiceId: bodyVoiceId,
      avatarId: bodyAvatarId,
      avatarName: bodyAvatarName,
      avatarLook: bodyAvatarLook,
      videoSize,
      aspectRatio: bodyAspectRatio,
      isTalkingPhoto: bodyIsTalkingPhoto,
    } = body;

    console.log("[generate-video] Request body (keys):", {
      scriptId: !!scriptId,
      scriptLength: typeof scriptText === "string" ? scriptText.length : 0,
      voiceId: !!bodyVoiceId,
      avatarId: bodyAvatarId,
      avatarName: bodyAvatarName,
      videoSize,
      aspectRatio: bodyAspectRatio,
    });

    const aspectRatioFromSize =
      videoSize === "horizontal"
        ? "16:9" as const
        : videoSize === "square"
          ? "1:1" as const
          : "9:16" as const;
    const allowedRatios = ["9:16", "16:9", "1:1"] as const;
    const effectiveAspectRatio =
      (bodyAspectRatio && allowedRatios.includes(bodyAspectRatio as typeof allowedRatios[number]))
        ? (bodyAspectRatio as typeof allowedRatios[number])
        : aspectRatioFromSize;

    let content: string;
    let scriptRecord: { id: string; topic: string; platform: string | null } | null = null;

    if (scriptId) {
      const scriptRow = await prisma.scripts.findFirst({
        where: { id: scriptId, user_id: user.id },
        select: { id: true, script_text: true, topic: true, platform: true },
      });
      if (!scriptRow) {
        return NextResponse.json({ error: "Script not found" }, { status: 404 });
      }
      scriptRecord = {
        id: scriptRow.id,
        topic: scriptRow.topic,
        platform: scriptRow.platform,
      };
      content = (scriptRow.script_text ?? "").trim();
      if (!content) {
        return NextResponse.json({ error: "Script has no content" }, { status: 400 });
      }
      if (content.length > 10000) {
        return NextResponse.json(
          { error: "Script is too long (max 10,000 characters). Please shorten it." },
          { status: 400 }
        );
      }
      await prisma.scripts.update({
        where: { id: scriptId },
        data: { video_status: "processing", video_error: null },
      }).catch(() => {});
    } else if (scriptText && typeof scriptText === "string") {
      content = scriptText.trim();
      if (!content) {
        return NextResponse.json({ error: "Script text is empty" }, { status: 400 });
      }
      if (content.length > 10000) {
        return NextResponse.json(
          { error: "Script is too long (max 10,000 characters). Please shorten it." },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Either scriptId or script text is required" },
        { status: 400 }
      );
    }

    const avatarId = typeof bodyAvatarId === "string" ? bodyAvatarId.trim() : "";
    if (!avatarId) {
      return NextResponse.json(
        { error: USER_FRIENDLY_VIDEO_ERRORS.INVALID_AVATAR },
        { status: 400 }
      );
    }

    // Use voice from request (state) first — it's already on the confirmation page
    const requestVoiceId =
      typeof bodyVoiceId === "string" && bodyVoiceId.trim() && bodyVoiceId.trim().toLowerCase() !== avatarId.toLowerCase()
        ? bodyVoiceId.trim()
        : null;
    const avatarCache = requestVoiceId ? null : await getAvatarVoiceFromCache(avatarId, bodyAvatarName);
    const effectiveVoiceId = requestVoiceId ?? avatarCache?.default_voice_id ?? null;

    if (!effectiveVoiceId) {
      return NextResponse.json(
        { error: "Avatar voice not found. Please select a different avatar." },
        { status: 400 }
      );
    }

    // Deduct credits before calling provider
    await prisma.users.update({
      where: { id: user.id },
      data: {
        video_credits: { decrement: CREDITS_PER_VIDEO },
        video_credits_used: { increment: CREDITS_PER_VIDEO },
      },
    });
    creditsDeducted = true;

    const projectName = scriptRecord?.topic ?? "Video";
    project = await prisma.projects.create({
      data: {
        user_id: user.id,
        name: projectName,
        description: `Video for: ${projectName}`,
        script_id: scriptRecord?.id ?? null,
        script_text: content,
        avatar_id: avatarId,
        avatar_name: bodyAvatarName ?? "Avatar",
        avatar_look: bodyAvatarLook ?? null,
        is_talking_photo: bodyIsTalkingPhoto === true,
        platform: scriptRecord?.platform ?? null,
        status: "pending",
        credits_used: CREDITS_PER_VIDEO,
      },
      select: { id: true },
    });

    const generationPayload = {
      script: content,
      scriptId: scriptRecord?.id ?? "",
      provider: "heygen" as const,
      voiceId: effectiveVoiceId,
      avatarId,
      aspectRatio: effectiveAspectRatio,
      avatarStyle: bodyAvatarLook ?? undefined,
      useTalkingPhoto: bodyIsTalkingPhoto === true,
    };
    const heygenPayloadPreview = {
      video_inputs: [
        {
          character: { type: bodyIsTalkingPhoto ? "talking_photo" : "avatar", avatar_id: avatarId, avatar_style: bodyAvatarLook ?? "normal" },
          voice: { type: "text", voice_id: effectiveVoiceId, input_text: content?.substring(0, 50) + "…" },
        },
      ],
      dimension: { width: 720, height: 1280 },
    };
    console.log("=== HEYGEN PAYLOAD (exact structure) ===");
    console.log(JSON.stringify(heygenPayloadPreview, null, 2));
    console.log("avatar_id sent to HeyGen:", avatarId);
    console.log("voice_id sent to HeyGen:", effectiveVoiceId);
    console.log("script length:", content?.length ?? 0);
    console.log("aspect_ratio:", effectiveAspectRatio);
    console.log("useTalkingPhoto:", bodyIsTalkingPhoto === true);

    const result = await generateVideo(generationPayload);

    if (!result.success || !result.videoId) {
      console.log("=== HEYGEN RAW RESPONSE (FAILURE) ===");
      console.log("result.error:", result.error);
      console.log("result.rawError:", result.rawError ?? "(none)");
      const realError = result.error ?? "Video generation failed";
      const userError =
        (result.rawError && result.rawError.length < 500
          ? result.rawError
          : realError.replace(/\bheygen\b/gi, "video service").trim()) || "Video generation failed";
      const providerError = result.rawError ?? result.error ?? null;
      console.error("[generate-video] HeyGen generation failed:", {
        projectId: project.id,
        realError,
        rawError: result.rawError ? result.rawError.substring(0, 500) : undefined,
      });
      await prisma.projects.update({
        where: { id: project.id },
        data: {
          status: "failed",
          error_message: userError,
          provider_error: providerError,
          failed_at: new Date(),
        },
      });
      if (scriptRecord) {
        await prisma.scripts.update({
          where: { id: scriptRecord.id },
          data: { video_status: "failed", video_error: userError },
        }).catch(() => {});
      }
      await prisma.users.update({
        where: { id: user.id },
        data: {
          video_credits: { increment: CREDITS_PER_VIDEO },
          video_credits_used: { decrement: CREDITS_PER_VIDEO },
        },
      });
      await prisma.projects.update({
        where: { id: project.id },
        data: { credits_refunded: true, status: "refunded" },
      });
      creditsDeducted = false;
      return NextResponse.json(
        {
          error: userError,
          projectId: project.id,
          creditsRefunded: true,
        },
        { status: 500 }
      );
    }

    await prisma.projects.update({
      where: { id: project.id },
      data: { status: "processing", video_id: result.videoId },
    });
    if (scriptRecord) {
      await prisma.scripts.update({
        where: { id: scriptRecord.id },
        data: {
          video_status: "processing",
          generated_video_id: result.videoId,
          video_error: null,
        },
      }).catch(() => {});
    }

    const creditsRemaining = (user.video_credits ?? user.credits ?? 0) - CREDITS_PER_VIDEO;
    return NextResponse.json({
      success: true,
      message: "Video generation started. Redirecting to project...",
      project: {
        id: project.id,
        videoId: result.videoId,
        status: "processing",
        name: projectName,
      },
      projectId: project.id,
      videoId: result.videoId,
      status: result.status,
      scriptId: scriptRecord?.id ?? null,
      creditsUsed: CREDITS_PER_VIDEO,
      creditsRemaining: Math.max(0, creditsRemaining),
      checkStatusUrl: `/api/generate-video/${result.videoId}`,
    });
  } catch (error: unknown) {
    console.error("Video generation error:", error);
    const userError = sanitizeVideoError(error);

    if (creditsDeducted && project) {
      try {
        const session = await getServerSession(authOptions).catch(() => null);
        if (session?.user?.email) {
          const u = await prisma.users.findUnique({
            where: { email: session.user.email.trim().toLowerCase() },
            select: { id: true },
          });
          if (u) {
            await prisma.users.update({
              where: { id: u.id },
              data: {
                video_credits: { increment: CREDITS_PER_VIDEO },
                video_credits_used: { decrement: CREDITS_PER_VIDEO },
              },
            });
            await prisma.projects.update({
              where: { id: project.id },
              data: {
                status: "refunded",
                error_message: userError,
                credits_refunded: true,
                failed_at: new Date(),
              },
            });
          }
        }
      } catch (refundErr) {
        console.error("Refund error:", refundErr);
      }
    }

    return NextResponse.json(
      {
        error: userError,
        projectId: project?.id ?? undefined,
        creditsRefunded: creditsDeducted,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/generate-video - Get available voices and avatars (D-ID)
 */
export async function GET() {
  const avatars = await getAvailableAvatars("did");
  return NextResponse.json({
    voices: getAvailableVoices("did"),
    avatars,
    defaultVoice: "en-US-JennyNeural",
  });
}
