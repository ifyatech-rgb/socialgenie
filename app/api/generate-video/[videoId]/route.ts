import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTalkStatus } from "@/lib/d-id";

/**
 * GET /api/generate-video/[videoId]
 * 
 * Check the status of a D-ID video generation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if D-ID API key is configured
    if (!process.env.DID_API_KEY) {
      return NextResponse.json(
        { error: "D-ID API key not configured" },
        { status: 500 }
      );
    }

    const { videoId } = params;

    // Get status from D-ID
    const status = await getTalkStatus(videoId);

    // Get scriptId from query params if provided
    const searchParams = request.nextUrl.searchParams;
    const scriptId = searchParams.get("scriptId");

    // If video is done and we have a scriptId, update the script record
    if (status.status === "done" && status.result_url && scriptId) {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (user) {
        await prisma.script.update({
          where: { 
            id: scriptId,
            userId: user.id,
          },
          data: {
            status: "video_ready",
            videoUrl: status.result_url,
          },
        });
      }
    }

    return NextResponse.json({
      videoId,
      status: status.status,
      videoUrl: status.result_url || null,
      isReady: status.status === "done",
      error: status.error || null,
    });

  } catch (error: any) {
    console.error("Video status check error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check video status" },
      { status: 500 }
    );
  }
}
