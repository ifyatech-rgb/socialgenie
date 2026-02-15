import { NextRequest, NextResponse } from "next/server";
import { getAuthUserEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CACHE_DURATION_MS = 30_000; // 30 seconds
const scriptsCache = new Map<string, { data: { scripts: unknown[] }; cacheTime: number }>();

export async function GET(request: NextRequest) {
  try {
    const userEmail = await getAuthUserEmail(request);
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized", code: "no_session" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const cached = scriptsCache.get(user.id);
    if (cached && Date.now() - cached.cacheTime < CACHE_DURATION_MS) {
      return NextResponse.json({ ...cached.data, cached: true });
    }

    const scripts = await prisma.script.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        topic: true,
        platform: true,
        tone: true,
        length: true,
        content: true,
        status: true,
        lifecycleStatus: true,
        refinementCount: true,
        chatHistory: true,
        finalizedAt: true,
        creditCharged: true,
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
      orderBy: { createdAt: "desc" },
    });

    const data = { scripts };
    scriptsCache.set(user.id, { data, cacheTime: Date.now() });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching scripts:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch scripts" },
      { status: 500 }
    );
  }
}
