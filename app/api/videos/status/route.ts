import { NextRequest, NextResponse } from "next/server";
import { getAuthUserEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkVideoStatus } from "@/lib/video-generation";

export const dynamic = "force-dynamic";

/**
 * GET /api/videos/status?scriptId=xxx
 * Returns video generation status for polling (progress, estimatedTime for UI).
 */
export async function GET(request: NextRequest) {
  try {
    const userEmail = await getAuthUserEmail(request);
    if (!userEmail) {
      return NextResponse.json(
        { error: "Unauthorized", code: "no_session" },
        { status: 401 }
      );
    }

    const scriptId = request.nextUrl.searchParams.get("scriptId")?.trim();
    if (!scriptId) {
      return NextResponse.json(
        { error: "scriptId is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const script = await prisma.script.findUnique({
      where: { id: scriptId },
    });
    if (!script || script.userId !== user.id) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    if (!script.generatedVideoId || !script.videoProvider) {
      return NextResponse.json({
        status: "not_started",
        progress: 0,
        message: "No video generation started",
      });
    }

    if (script.videoStatus === "completed" && script.generatedVideoUrl) {
      return NextResponse.json({
        status: "completed",
        videoUrl: script.generatedVideoUrl,
        progress: 100,
        provider: script.videoProvider,
      });
    }

    if (script.videoStatus === "failed") {
      return NextResponse.json({
        status: "failed",
        error: script.videoError ?? "Video generation failed",
        progress: 0,
        provider: script.videoProvider,
      });
    }

    const statusResult = await checkVideoStatus(script.generatedVideoId, "did");

    if (statusResult.status === "done" && statusResult.resultUrl) {
      await prisma.script.update({
        where: { id: scriptId },
        data: {
          generatedVideoUrl: statusResult.resultUrl,
          videoStatus: "completed",
          status: "video_ready",
        },
      });
      return NextResponse.json({
        status: "completed",
        videoUrl: statusResult.resultUrl,
        progress: 100,
        provider: script.videoProvider,
      });
    }

    if (statusResult.status === "error") {
      const errorMessage =
        typeof statusResult.error === "string"
          ? statusResult.error
          : (statusResult.error as { message?: string })?.message ?? "Video generation failed";
      await prisma.script.update({
        where: { id: scriptId },
        data: {
          videoStatus: "failed",
          videoError: errorMessage,
          status: "error",
        },
      });
      return NextResponse.json({
        status: "failed",
        error: errorMessage,
        progress: 0,
        provider: script.videoProvider,
      });
    }

    const created = script.createdAt.getTime();
    const elapsed = (Date.now() - created) / 1000;
    const estimatedTotal = 120;
    const progress = Math.min(95, Math.round((elapsed / estimatedTotal) * 100));

    return NextResponse.json({
      status: "processing",
      videoId: script.generatedVideoId,
      progress,
      estimatedTimeSeconds: Math.max(0, Math.round(estimatedTotal - elapsed)),
      message: "Video is being generated.",
      provider: script.videoProvider,
    });
  } catch (error) {
    console.error("[Videos/Status]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
