import { NextRequest, NextResponse } from "next/server";
import { getAuthUserEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getHeyGenClient } from "@/lib/heygenClient";
import { cleanScript } from "@/lib/scriptCleaner";
import { stripSectionHeadersForTTS } from "@/lib/scriptFormatter";

const VIDEO_CREDITS = 5;
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, credits: true } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if ((user.credits ?? 0) < VIDEO_CREDITS) {
      return NextResponse.json({
        error: "insufficient_credits",
        message: `Need ${VIDEO_CREDITS} credits`,
        currentCredits: user.credits ?? 0,
        needed: VIDEO_CREDITS,
      }, { status: 402 });
    }

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

    await prisma.user.update({
      where: { id: user.id },
      data: { credits: Math.max(0, (user.credits ?? 0) - VIDEO_CREDITS) },
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
      creditsUsed: VIDEO_CREDITS,
      remainingCredits: Math.max(0, (user.credits ?? 0) - VIDEO_CREDITS),
    });
  } catch (error) {
    console.error("[HeyGen Generate] Failed:", error);
    return NextResponse.json({ error: "generation_failed", message: String(error) }, { status: 500 });
  }
}
