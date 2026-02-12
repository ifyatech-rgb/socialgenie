import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getHeyGenClient } from "@/lib/heygenClient";

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
    const heygen = getHeyGenClient();
    const heygenStatus = await heygen.getVideoStatus(videoId);
    const isDone = heygenStatus.status === "completed";
    const resultUrl = heygenStatus.video_url ?? null;
    const status = {
      status: isDone ? ("done" as const) : heygenStatus.status === "failed" ? ("error" as const) : ("started" as const),
      resultUrl,
      error: heygenStatus.error ?? null,
    };

    const searchParams = request.nextUrl.searchParams;
    const scriptId = searchParams.get("scriptId");

    if (status.status === "done" && resultUrl && scriptId) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });
      if (user) {
        await prisma.script.update({
          where: { id: scriptId, userId: user.id },
          data: {
            status: "video_ready",
            generatedVideoUrl: resultUrl,
            videoStatus: "completed",
          },
        });
      }
    }

    return NextResponse.json({
      videoId,
      status: status.status,
      videoUrl: resultUrl,
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
