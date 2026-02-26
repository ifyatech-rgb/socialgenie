import { NextRequest, NextResponse } from "next/server";
import { getAuthUserEmail } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scriptsCache, CACHE_DURATION_MS } from "@/lib/dashboard-cache";

export async function GET(request: NextRequest) {
  try {
    const userEmail = await getAuthUserEmail(request);
    if (!userEmail) {
      return NextResponse.json({ error: "Unauthorized", code: "no_session" }, { status: 401 });
    }

    const emailNorm = userEmail.trim().toLowerCase();
    const user = await prisma.users.findUnique({
      where: { email: emailNorm },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const cached = scriptsCache.get(user.id);
    if (cached && Date.now() - cached.cacheTime < CACHE_DURATION_MS) {
      return NextResponse.json({ ...cached.data, cached: true });
    }

    const rows = await prisma.scripts.findMany({
      where: { user_id: user.id },
      select: {
        id: true,
        topic: true,
        platform: true,
        content_style: true,
        estimated_duration: true,
        script_text: true,
        status: true,
        lifecycle_status: true,
        genie_edits_count: true,
        chat_history: true,
        finalized_at: true,
        credit_charged: true,
        is_favorite: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { created_at: "desc" },
    });

    const scripts = rows.map((s) => ({
      id: s.id,
      topic: s.topic,
      platform: s.platform,
      tone: s.content_style ?? undefined,
      length: s.estimated_duration ?? undefined,
      content: s.script_text ?? "",
      status: s.status ?? undefined,
      lifecycleStatus: s.lifecycle_status ?? "draft",
      refinementCount: s.genie_edits_count ?? 0,
      chatHistory: s.chat_history ?? [],
      finalizedAt: s.finalized_at ? new Date(s.finalized_at).toISOString() : null,
      creditCharged: s.credit_charged ?? false,
      generatedVideoUrl: null,
      generatedVideoId: null,
      videoStatus: null,
      videoProgress: null,
      videoError: null,
      projectName: null,
      thumbnailUrl: null,
      duration: null,
      views: null,
      lastViewedAt: null,
      isFavorite: s.is_favorite ?? false,
      tags: null,
      createdAt: s.created_at ? new Date(s.created_at).toISOString() : new Date().toISOString(),
      updatedAt: s.updated_at ? new Date(s.updated_at).toISOString() : new Date().toISOString(),
    }));

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
