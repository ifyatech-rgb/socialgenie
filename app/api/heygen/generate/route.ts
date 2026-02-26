import { NextRequest, NextResponse } from "next/server";
import { getAuthUserEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getHeyGenClient } from "@/lib/heygenClient";
import { checkAvatarAccess } from "@/lib/checkAvatarAccess";
import { cleanScript } from "@/lib/scriptCleaner";
import { stripSectionHeadersForTTS } from "@/lib/scriptFormatter";
import { trackCreditsUsage, trackVideoGeneration } from "@/lib/tracking";
import { syncGeneratedVideoToSupabase, syncScriptToSupabase } from "@/lib/supabase-sync";
import { calculateVideoCreditCost, canCreateVideo, getPlan } from "@/lib/plans";
import { validateVideoLength } from "@/lib/videoLimits";

export const dynamic = "force-dynamic";

/** Estimate duration in seconds from script word count (~2.5 words per second). Any length up to 1h. */
function estimateDurationSeconds(script: string): number {
  const words = script.trim().split(/\s+/).filter(Boolean).length;
  return Math.min(3600, Math.max(15, Math.ceil(words / 2.5)));
}

export async function POST(request: NextRequest) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const emailNormalized = email.trim().toLowerCase();
    const user = await prisma.users.findUnique({
      where: { email: emailNormalized },
      select: {
        id: true,
        credits: true,
        plan: true,
        video_credits: true,
        video_credits_used: true,
      },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    let body: { script: string; avatarId: string; voiceId: string; platform?: string; scriptId?: string; aspectRatio?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "invalid_input", message: "Invalid JSON" }, { status: 400 });
    }

    const { script, avatarId, voiceId, platform, scriptId, aspectRatio: requestedAspect } = body;
    if (!script?.trim() || !avatarId?.trim() || !voiceId?.trim()) {
      return NextResponse.json({ error: "invalid_input", message: "Missing script, avatarId, voiceId" }, { status: 400 });
    }

    const cleanedScript = stripSectionHeadersForTTS(cleanScript(script.trim()));
    const estimatedDuration = estimateDurationSeconds(cleanedScript);
    const planConfig = getPlan(user.plan ?? null);
    const maxVideoLength = planConfig.limits.maxVideoLength;
    if (maxVideoLength != null) {
      const lengthCheck = validateVideoLength(estimatedDuration, user.plan ?? "trial");
      if (!lengthCheck.valid) {
        return NextResponse.json(
          {
            error: "video_too_long",
            message: lengthCheck.message,
            maxSeconds: maxVideoLength,
            upgradeRequired: true,
          },
          { status: 400 }
        );
      }
    }
    const creditCost = calculateVideoCreditCost(estimatedDuration);
    const videoCreditsAvailable = user.video_credits ?? user.credits ?? 0;
    if (!canCreateVideo({ videoCredits: videoCreditsAvailable }, estimatedDuration)) {
      return NextResponse.json(
        {
          error: "insufficient_credits",
          message: `Need ${creditCost} video credit(s) for this length (≈${estimatedDuration}s)`,
          currentCredits: videoCreditsAvailable,
          needed: creditCost,
          upgradeRequired: true,
        },
        { status: 402 }
      );
    }

    const canUseAvatar = await checkAvatarAccess(user.id, avatarId.trim());
    if (!canUseAvatar) {
      return NextResponse.json(
        { error: "forbidden", message: "You do not have access to this avatar" },
        { status: 403 }
      );
    }

    const heygen = getHeyGenClient();
    const details = await heygen.getAvatarDetailsWithResolution(avatarId.trim());
    const fallbackRes = { width: 1080, height: 1920, aspectRatio: "9:16" as const };
    const nativeResolution = details.nativeResolution ?? fallbackRes;
    if (!nativeResolution.width || !nativeResolution.height) {
      return NextResponse.json(
        { error: "avatar_fetch_failed", message: "Could not retrieve avatar resolution" },
        { status: 500 }
      );
    }
    const aspectRatio = (requestedAspect === "16:9" || requestedAspect === "9:16" || requestedAspect === "1:1")
      ? requestedAspect
      : nativeResolution.aspectRatio;
    const dimension = aspectRatio === "16:9"
      ? { width: 1280, height: 720 }
      : aspectRatio === "1:1"
        ? { width: 720, height: 720 }
        : { width: 720, height: 1280 };

    const videoResult = await heygen.generateVideo(cleanedScript, avatarId.trim(), voiceId.trim(), {
      aspectRatio,
      dimension,
      useNativeResolution: true,
      background: { type: "color", value: "#000000" },
      trialWatermark: planConfig.hasWatermark === true,
    });

    const newVideoCredits = Math.max(0, videoCreditsAvailable - creditCost);
    const newCreditsLegacy = Math.max(0, (user.credits ?? 0) - creditCost);
    await prisma.users.update({
      where: { id: user.id },
      data: {
        video_credits: newVideoCredits,
        video_credits_used: (user.video_credits_used ?? 0) + creditCost,
        credits: newCreditsLegacy,
      },
    });

    trackCreditsUsage({
      user_id: user.id,
      amount: -creditCost,
      reason: "heygen_video_generation",
      reference_type: "video",
      reference_id: videoResult.videoId,
      balance_after: newVideoCredits,
    });
    trackVideoGeneration({
      user_id: user.id,
      video_id: videoResult.videoId,
      provider: "heygen",
      status: "processing",
      credits_used: creditCost,
    });

    let projectId: string | null = null;
    if (scriptId?.trim()) {
      const scriptRecord = await prisma.scripts.findFirst({
        where: { id: scriptId.trim(), user_id: user.id },
        select: {
          id: true,
          topic: true,
          platform: true,
          script_text: true,
          content_style: true,
          estimated_duration: true,
        },
      });
      if (scriptRecord) {
        try {
          await prisma.scripts.update({
            where: { id: scriptRecord.id },
            data: {
              generated_video_id: videoResult.videoId,
              video_status: "processing",
              video_provider: "heygen",
            },
          });
          projectId = scriptRecord.id;
          syncScriptToSupabase({
            id: scriptRecord.id,
            user_id: user.id,
            topic: scriptRecord.topic,
            platform: scriptRecord.platform,
            content: scriptRecord.script_text,
            tone: scriptRecord.content_style ?? undefined,
            length: scriptRecord.estimated_duration ?? undefined,
            status: "processing",
            generated_video_id: videoResult.videoId,
            video_provider: "heygen",
            video_status: "processing",
          }).catch(() => {});
        } catch {
          // ignore sync errors
        }
      }
    }

    return NextResponse.json({
      success: true,
      videoId: videoResult.videoId,
      projectId,
      status: "processing",
      progress: 10,
      resolution: `${dimension.width}x${dimension.height}`,
      aspectRatio,
      creditsUsed: creditCost,
      remainingCredits: newVideoCredits,
    });
  } catch (error) {
    console.error("[HeyGen Generate] Failed:", error);
    return NextResponse.json({ error: "generation_failed", message: String(error) }, { status: 500 });
  }
}
