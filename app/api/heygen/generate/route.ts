import { NextRequest, NextResponse } from "next/server";
import { getAuthUserEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getHeyGenClient } from "@/lib/heygenClient";
import { cleanScript } from "@/lib/scriptCleaner";
import { stripSectionHeadersForTTS } from "@/lib/scriptFormatter";
import { trackCreditsUsage, trackVideoGeneration } from "@/lib/tracking";
import { calculateVideoCreditCost, canCreateVideo } from "@/lib/plans";

export const dynamic = "force-dynamic";

/** Estimate duration in seconds from script word count (~2.5 words per second). */
function estimateDurationSeconds(script: string): number {
  const words = script.trim().split(/\s+/).filter(Boolean).length;
  return Math.min(300, Math.max(15, Math.ceil(words / 2.5)));
}

export async function POST(request: NextRequest) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const emailNormalized = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: emailNormalized },
      select: {
        id: true,
        credits: true,
        videoCredits: true,
        videoCreditsUsed: true,
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
    const creditCost = calculateVideoCreditCost(estimatedDuration);
    const videoCreditsAvailable = user.videoCredits ?? user.credits ?? 0;
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
    });

    const newVideoCredits = Math.max(0, videoCreditsAvailable - creditCost);
    const newCreditsLegacy = Math.max(0, (user.credits ?? 0) - creditCost);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        videoCredits: newVideoCredits,
        videoCreditsUsed: (user.videoCreditsUsed ?? 0) + creditCost,
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
      const scriptRecord = await prisma.script.findFirst({
        where: { id: scriptId.trim(), userId: user.id },
        select: {
          id: true,
          topic: true,
          platform: true,
          content: true,
          tone: true,
          length: true,
          projectName: true,
        },
      });
      if (scriptRecord) {
        try {
          const gv = await prisma.generatedVideo.create({
            data: {
              userId: user.id,
              scriptId: scriptRecord.id,
              generatedVideoId: videoResult.videoId,
              videoProvider: "heygen",
              videoStatus: "processing",
              videoProgress: 10,
              projectName: scriptRecord.projectName ?? scriptRecord.topic,
            },
          });
          projectId = gv.id;
        } catch {
          const newScript = await prisma.script.create({
            data: {
              userId: user.id,
              topic: scriptRecord.topic,
              platform: scriptRecord.platform,
              content: scriptRecord.content,
              tone: scriptRecord.tone,
              length: scriptRecord.length,
              status: "video_processing",
              generatedVideoId: videoResult.videoId,
              videoProvider: "heygen",
              videoStatus: "processing",
              videoProgress: 10,
              projectName: scriptRecord.projectName ?? scriptRecord.topic,
            },
          });
          projectId = newScript.id;
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
