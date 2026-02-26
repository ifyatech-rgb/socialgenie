import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getHeyGenClient } from "@/lib/heygenClient";
import { sanitizeVideoError } from "@/lib/sanitize-video-errors";

export const dynamic = "force-dynamic";

const STATUS_CHECK_TIMEOUT_MS = 8000;

/**
 * POST /api/projects/check-status
 * Body: { videoId: string, projectId: string }
 * Checks HeyGen video status, updates project in DB, returns current status + progress for real-time UI.
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { videoId, projectId } = body as { videoId?: string; projectId?: string };

    if (!videoId || !projectId) {
      return NextResponse.json(
        { error: "Missing videoId or projectId" },
        { status: 400 }
      );
    }

    const email = session.user.email.trim().toLowerCase();
    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const project = await prisma.projects.findFirst({
      where: { id: projectId, user_id: user.id },
      select: { id: true, video_id: true, status: true, script_id: true },
    });

    if (!project || project.video_id !== videoId) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const heygen = getHeyGenClient();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Status check timeout")), STATUS_CHECK_TIMEOUT_MS)
    );
    const statusResult = await Promise.race([
      heygen.getVideoStatus(videoId),
      timeoutPromise,
    ]);

    const checkDuration = Date.now() - startTime;
    const videoStatus = (statusResult.status ?? "").toLowerCase();
    const progress = statusResult.progress ?? 0;

    console.log(`[${new Date().toLocaleTimeString()}] [${checkDuration}ms] video ${videoId} status=${videoStatus} progress=${progress}`);

    const isCompleted = videoStatus === "completed" || videoStatus === "complete";
    const isFailed = videoStatus === "failed" || videoStatus === "error";

    if (isCompleted && statusResult.video_url) {
      const duration =
        statusResult.duration != null
          ? Math.round(Number(statusResult.duration))
          : undefined;
      await prisma.projects.update({
        where: { id: projectId },
        data: {
          status: "completed",
          video_url: statusResult.video_url,
          thumbnail_url: statusResult.thumbnail_url ?? undefined,
          duration: duration ?? undefined,
          completed_at: new Date(),
        },
      });
      if (project.script_id) {
        await prisma.scripts.update({
          where: { id: project.script_id },
          data: {
            video_status: "completed",
            generated_video_url: statusResult.video_url,
            video_error: null,
          },
        }).catch(() => {});
      }
      return NextResponse.json({
        success: true,
        status: "completed",
        videoUrl: statusResult.video_url,
        thumbnailUrl: statusResult.thumbnail_url ?? undefined,
        duration,
        progress: 100,
        message: "Your video is ready!",
      });
    }

    if (isFailed) {
      const errMsg = sanitizeVideoError(
        new Error(
          typeof statusResult.error === "string"
            ? statusResult.error
            : "Video generation failed"
        )
      );
      await prisma.projects.update({
        where: { id: projectId },
        data: {
          status: "failed",
          error_message: errMsg,
          failed_at: new Date(),
        },
      });
      if (project.script_id) {
        await prisma.scripts.update({
          where: { id: project.script_id },
          data: { video_status: "failed", video_error: errMsg },
        }).catch(() => {});
      }
      return NextResponse.json({
        success: true,
        status: "failed",
        error: errMsg,
        message: "Video generation failed",
      });
    }

    return NextResponse.json({
      success: true,
      status: videoStatus === "pending" ? "pending" : "processing",
      progress,
      message: `Generating video... ${progress}%`,
    });
  } catch (error) {
    console.error("[Projects check-status] Error:", error);
    return NextResponse.json(
      {
        success: false,
        status: "error",
        error: error instanceof Error ? error.message : "Failed to check status",
        retryable: true,
      },
      { status: 200 }
    );
  }
}
