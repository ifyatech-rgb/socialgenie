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
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const video = await prisma.video.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    return NextResponse.json({ video });
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
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const video = await prisma.video.findFirst({
      where: {
        id,
        userId: user.id,
      },
    });

    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // Delete video record
    await prisma.video.delete({
      where: { id },
    });

    // Try to delete the file
    try {
      const fs = require("fs");
      const path = require("path");
      const filepath = path.join(process.cwd(), "public", video.url);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    } catch (fileError) {
      console.error("Failed to delete video file:", fileError);
    }

    return NextResponse.json({ success: true, message: "Video deleted" });
  } catch (error: any) {
    console.error("Error deleting video:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete video" },
      { status: 500 }
    );
  }
}
