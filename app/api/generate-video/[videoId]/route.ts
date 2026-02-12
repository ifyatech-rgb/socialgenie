import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkVideoStatus } from "@/lib/video-generation";

/**
 * GET /api/generate-video/[videoId]
 *
 * Check the status of a HeyGen video generation
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ videoId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.HEYGEN_API_KEY) {
      return NextResponse.json(
        { error: "HeyGen API key not configured" },
        { status: 500 }
      );
    }

    const { videoId } = await context.params;
    const status = await checkVideoStatus(videoId, "heygen");

    const searchParams = request.nextUrl.searchParams;
    const scriptId = searchParams.get("scriptId");

    if (status.status === "done" && status.resultUrl && scriptId) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      if (user) {
        await prisma.script.update({
          where: { id: scriptId, userId: user.id },
          data: {
            status: "video_ready",
            generatedVideoUrl: status.resultUrl ?? undefined,
            videoStatus: "completed",
          },
        });
      }
    }

    return NextResponse.json({
      videoId,
      status: status.status,
      videoUrl: status.resultUrl ?? null,
      isReady: status.status === "done",
      error: status.error ?? null,
    });
  } catch (error: unknown) {
    console.error("Video status check error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check video status" },
      { status: 500 }
    );
  }
}
