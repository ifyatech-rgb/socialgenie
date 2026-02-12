import { NextRequest, NextResponse } from "next/server";
import { getSessionForRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionForRequest(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized", code: "no_session" }, { status: 401 });
    }

    const scripts = await prisma.script.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        topic: true,
        platform: true,
        tone: true,
        length: true,
        content: true,
        status: true,
        generatedVideoUrl: true,
        generatedVideoId: true,
        videoStatus: true,
        videoProgress: true,
        videoError: true,
        projectName: true,
        thumbnailUrl: true,
        duration: true,
        views: true,
        lastViewedAt: true,
        isFavorite: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ scripts });
  } catch (error: any) {
    console.error("Error fetching scripts:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch scripts" },
      { status: 500 }
    );
  }
}
