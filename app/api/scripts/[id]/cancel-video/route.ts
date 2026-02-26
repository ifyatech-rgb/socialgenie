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
    const email = session.user.email.trim().toLowerCase();
    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const script = await prisma.scripts.findFirst({
      where: { id, user_id: user.id },
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    const vStatus = (script.video_status ?? "").toLowerCase();
    if (vStatus !== "processing" && vStatus !== "pending") {
      return NextResponse.json(
        { error: "No video generation in progress for this script" },
        { status: 400 }
      );
    }

    const updated = await prisma.scripts.update({
      where: { id },
      data: { video_status: "cancelled", video_error: null },
    });

    return NextResponse.json({
      success: true,
      message: "Video generation cancelled successfully",
      script: { id: updated.id, video_status: updated.video_status },
    });

  } catch (error: any) {
    console.error("Cancel video error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel video generation" },
      { status: 500 }
    );
  }
}
