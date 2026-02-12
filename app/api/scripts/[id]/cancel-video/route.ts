import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/scripts/[id]/cancel-video
 * 
 * Cancel ongoing video generation and reset script status
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const script = await prisma.script.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    // Check if video is being generated
    if (script.status !== "video_processing") {
      return NextResponse.json(
        { error: "No video generation in progress for this script" },
        { status: 400 }
      );
    }

    // HeyGen doesn't support cancelling in-flight jobs; we reset our DB state only.
    // The video may still complete on HeyGen's side but won't be linked to this script.

    const updatedScript = await prisma.script.update({
      where: { id },
      data: {
        status: "generated",
        generatedVideoUrl: null,
        generatedVideoId: null,
        videoProvider: null,
        videoStatus: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Video generation cancelled successfully",
      script: updatedScript,
    });

  } catch (error: any) {
    console.error("Cancel video error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel video generation" },
      { status: 500 }
    );
  }
}
