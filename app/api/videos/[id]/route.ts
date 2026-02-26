import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Video may be stored as project (video_id) or script (generated_video_id)
    const project = await prisma.projects.findFirst({
      where: { video_id: id, user_id: user.id },
      select: { id: true, video_id: true, video_url: true, status: true },
    });
    if (project) {
      return NextResponse.json({
        video: {
          id: project.video_id,
          url: project.video_url,
          status: project.status,
        },
      });
    }
    const script = await prisma.scripts.findFirst({
      where: { generated_video_id: id, user_id: user.id },
      select: { id: true, generated_video_id: true, generated_video_url: true, video_status: true },
    });
    if (script) {
      return NextResponse.json({
        video: {
          id: script.generated_video_id,
          url: script.generated_video_url,
          status: script.video_status,
        },
      });
    }
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  } catch (error: any) {
    console.error("Error fetching video:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch video" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const project = await prisma.projects.findFirst({
      where: { video_id: id, user_id: user.id },
    });
    if (project) {
      await prisma.projects.update({
        where: { id: project.id },
        data: { video_id: null, video_url: null, status: "cancelled" },
      });
      return NextResponse.json({ success: true, message: "Video deleted" });
    }
    const script = await prisma.scripts.findFirst({
      where: { generated_video_id: id, user_id: user.id },
    });
    if (script) {
      await prisma.scripts.update({
        where: { id: script.id },
        data: { generated_video_id: null, generated_video_url: null, video_status: null },
      });
      return NextResponse.json({ success: true, message: "Video deleted" });
    }
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  } catch (error: any) {
    console.error("Error deleting video:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete video" },
      { status: 500 }
    );
  }
}
