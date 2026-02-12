import { NextRequest, NextResponse } from "next/server";
import { getAuthUserEmail, getSessionForRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkVideoStatus } from "@/lib/video-generation";
import { getHeyGenClient } from "@/lib/heygenClient";

export const dynamic = "force-dynamic";

type ProjectItem = {
  id: string;
  scriptId?: string;
  videoId: string | null;
  videoProvider?: string | null;
  topic: string;
  platform: string;
  script: string;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  errorMessage?: string | null;
  videoUrl?: string | null;
  thumbnailUrl?: string | null;
  duration?: number | null;
  projectName?: string | null;
  createdAt: string;
  updatedAt: string;
};

function mapStatus(
  videoStatus: string | null | undefined
): "pending" | "processing" | "completed" | "failed" {
  if (!videoStatus) return "pending";
  const s = videoStatus.toLowerCase();
  if (s === "completed" || s === "complete") return "completed";
  if (s === "failed" || s === "error") return "failed";
  if (s === "processing" || s === "pending") return "processing";
  return "pending";
}

/** Resolve current user id: email lookup first, then session id fallback so Projects always syncs. */
async function getCurrentUserId(request: NextRequest): Promise<string | null> {
  const email = await getAuthUserEmail(request);
  if (email) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (user) return user.id;
  }
  const session = await getSessionForRequest(request);
  if (session?.user?.id) return session.user.id;
  return null;
}

/** Sync a single GeneratedVideo with D-ID or HeyGen and update DB + in-memory row. Only call for status processing/pending. */
async function syncGeneratedVideo(
  gv: Awaited<ReturnType<typeof prisma.generatedVideo.findMany>>[0] & {
    script: { id: string; topic: string; platform: string; content: string; projectName: string | null } | null;
  }
): Promise<void> {
  const videoId = gv.generatedVideoId;
  const status = (gv.videoStatus ?? "").toLowerCase();
  const provider = (gv.videoProvider ?? "heygen").toLowerCase();

  console.log(`[Projects] 🔍 syncGeneratedVideo: id=${gv.id} videoId=${videoId} provider=${provider} dbStatus=${gv.videoStatus}`);

  if (!videoId) {
    console.log(`[Projects]   ↳ SKIP: no videoId`);
    return;
  }
  // Defense in depth: never sync completed/failed (read from DB only).
  if (status === "completed" || status === "complete" || status === "failed" || status === "error") {
    console.log(`[Projects]   ↳ SKIP: already terminal status`);
    return;
  }

  try {
    if (provider === "heygen") {
      console.log(`[Projects]   ↳ Calling HeyGen API for videoId=${videoId}`);
      const heygen = getHeyGenClient();
      const heygenStatus = await heygen.getVideoStatus(videoId);
      const normalized = (heygenStatus.status ?? "").toLowerCase();
      const isCompleted = normalized === "completed" || normalized === "complete";
      const isFailed = normalized === "failed" || normalized === "error";

      console.log(`[Projects]   ↳ HeyGen response: status=${heygenStatus.status} progress=${heygenStatus.progress} video_url=${heygenStatus.video_url ? "yes" : "no"}`);

      if (isCompleted && heygenStatus.video_url) {
        await prisma.generatedVideo.update({
          where: { id: gv.id },
          data: {
            generatedVideoUrl: heygenStatus.video_url,
            videoStatus: "completed",
            videoProgress: 100,
            thumbnailUrl: heygenStatus.thumbnail_url ?? undefined,
            duration: heygenStatus.duration ?? undefined,
          },
        });
        (gv as { generatedVideoUrl: string | null; videoStatus: string | null; videoProgress: number | null }).generatedVideoUrl = heygenStatus.video_url;
        (gv as { videoStatus: string | null }).videoStatus = "completed";
        (gv as { videoProgress: number | null }).videoProgress = 100;
        console.log(`[Projects]   ✅ DB updated: completed, progress=100`);
      } else if (isFailed) {
        const errMsg =
          (typeof heygenStatus.error === "string" ? heygenStatus.error : null) ||
          "Video generation failed";
        await prisma.generatedVideo.update({
          where: { id: gv.id },
          data: { videoStatus: "failed", videoProgress: 0, videoError: errMsg },
        });
        (gv as { videoStatus: string | null }).videoStatus = "failed";
        (gv as { videoProgress: number | null }).videoProgress = 0;
        (gv as { videoError: string | null }).videoError = errMsg;
        console.log(`[Projects]   ❌ DB updated: failed (stop syncing) error=${errMsg}`);
      } else {
        const progress = heygenStatus.progress ?? (normalized === "processing" ? 50 : 10);
        await prisma.generatedVideo.update({
          where: { id: gv.id },
          data: { videoStatus: heygenStatus.status ?? "processing", videoProgress: progress },
        });
        (gv as { videoStatus: string | null }).videoStatus = heygenStatus.status ?? "processing";
        (gv as { videoProgress: number | null }).videoProgress = progress;
        console.log(`[Projects]   ⏳ DB updated: processing progress=${progress}`);
      }
      return;
    }

    if (provider === "did") {
      console.log(`[Projects]   ↳ Calling D-ID API for videoId=${videoId}`);
      const result = await checkVideoStatus(videoId, "did");
      console.log(`[Projects]   ↳ D-ID response: status=${result.status} resultUrl=${result.resultUrl ? "yes" : "no"}`);
      if (result.status === "done" && result.resultUrl) {
        await prisma.generatedVideo.update({
          where: { id: gv.id },
          data: {
            generatedVideoUrl: result.resultUrl,
            videoStatus: "completed",
            videoProgress: 100,
          },
        });
        (gv as { generatedVideoUrl: string | null; videoStatus: string | null; videoProgress: number | null }).generatedVideoUrl = result.resultUrl;
        (gv as { videoStatus: string | null }).videoStatus = "completed";
        (gv as { videoProgress: number | null }).videoProgress = 100;
      } else if (result.status === "error") {
        const errMsg = typeof result.error === "string" ? result.error : (result.error as unknown as { message?: string })?.message ?? "Video generation failed";
        await prisma.generatedVideo.update({
          where: { id: gv.id },
          data: { videoStatus: "failed", videoProgress: 0, videoError: errMsg },
        });
        (gv as { videoStatus: string | null }).videoStatus = "failed";
        (gv as { videoProgress: number | null }).videoProgress = 0;
        (gv as { videoError: string | null }).videoError = errMsg;
      } else {
        const progress = result.status === "created" ? 5 : result.status === "started" ? 50 : 50;
        await prisma.generatedVideo.update({
          where: { id: gv.id },
          data: { videoStatus: "processing", videoProgress: progress },
        });
        (gv as { videoStatus: string | null }).videoStatus = "processing";
        (gv as { videoProgress: number | null }).videoProgress = progress;
      }
    }
  } catch (err) {
    console.error("[Projects] ❌ syncGeneratedVideo failed for", gv.id, "error:", err);
    const errMsg = err instanceof Error ? err.message : String(err);
    const createdTime = new Date(gv.createdAt).getTime();
    const minutesElapsed = (Date.now() - createdTime) / 1000 / 60;
    if (minutesElapsed > 5) {
      await prisma.generatedVideo.update({
        where: { id: gv.id },
        data: {
          videoStatus: "failed",
          videoProgress: 0,
          videoError: `HeyGen error: ${errMsg.substring(0, 300)}`,
        },
      });
      (gv as { videoStatus: string | null }).videoStatus = "failed";
      (gv as { videoProgress: number | null }).videoProgress = 0;
      (gv as { videoError: string | null }).videoError = errMsg.substring(0, 300);
      console.log(`[Projects]   💾 Marked as FAILED after ${Math.round(minutesElapsed)} min of errors (stop syncing)`);
    }
  }
}

/** Sync a legacy Script with D-ID or HeyGen and update DB + in-memory row. Only call for status processing/pending. */
async function syncLegacyScript(
  s: Awaited<ReturnType<typeof prisma.script.findMany>>[0]
): Promise<void> {
  const videoId = s.generatedVideoId;
  const status = (s.videoStatus ?? "").toLowerCase();
  const provider = (s.videoProvider ?? "did").toLowerCase();
  console.log(`[Projects] 🔍 syncLegacyScript: scriptId=${s.id} videoId=${videoId} provider=${provider} dbStatus=${s.videoStatus}`);
  if (!videoId) {
    console.log(`[Projects]   ↳ SKIP: no videoId`);
    return;
  }
  // Defense in depth: never sync completed/failed (read from DB only).
  if (status === "completed" || status === "complete" || status === "failed" || status === "error") {
    console.log(`[Projects]   ↳ SKIP: already terminal status`);
    return;
  }

  try {
    if (provider === "heygen") {
      console.log(`[Projects]   ↳ Calling HeyGen API for videoId=${videoId}`);
      const heygen = getHeyGenClient();
      const heygenStatus = await heygen.getVideoStatus(videoId);
      const normalized = (heygenStatus.status ?? "").toLowerCase();
      const isCompleted = normalized === "completed" || normalized === "complete";
      const isFailed = normalized === "failed" || normalized === "error";
      console.log(`[Projects]   ↳ HeyGen response: status=${heygenStatus.status} progress=${heygenStatus.progress} video_url=${heygenStatus.video_url ? "yes" : "no"}`);
      if (isCompleted && heygenStatus.video_url) {
        await prisma.script.update({
          where: { id: s.id },
          data: {
            generatedVideoUrl: heygenStatus.video_url,
            videoStatus: "completed",
            videoProgress: 100,
            status: "video_ready",
            thumbnailUrl: heygenStatus.thumbnail_url ?? undefined,
            duration: heygenStatus.duration ?? undefined,
          },
        });
        (s as { generatedVideoUrl: string | null }).generatedVideoUrl = heygenStatus.video_url;
        (s as { videoStatus: string | null }).videoStatus = "completed";
        (s as { videoProgress: number | null }).videoProgress = 100;
        console.log(`[Projects]   ✅ Script DB updated: completed`);
      } else if (isFailed) {
        const errMsg =
          (typeof heygenStatus.error === "string" ? heygenStatus.error : null) ||
          "Video generation failed";
        await prisma.script.update({
          where: { id: s.id },
          data: { videoStatus: "failed", videoError: errMsg, videoProgress: 0, status: "error" },
        });
        (s as { videoStatus: string | null }).videoStatus = "failed";
        (s as { videoProgress: number | null }).videoProgress = 0;
        (s as { videoError: string | null }).videoError = errMsg;
        console.log(`[Projects]   ❌ Script DB updated: failed (stop syncing)`);
      } else {
        const progress = heygenStatus.progress ?? (normalized === "processing" ? 50 : 10);
        await prisma.script.update({
          where: { id: s.id },
          data: { videoStatus: heygenStatus.status ?? "processing", videoProgress: progress },
        });
        (s as { videoStatus: string | null }).videoStatus = heygenStatus.status ?? "processing";
        (s as { videoProgress: number | null }).videoProgress = progress;
        console.log(`[Projects]   ⏳ Script DB updated: processing progress=${progress}`);
      }
      return;
    }

    console.log(`[Projects]   ↳ Calling D-ID API for videoId=${videoId}`);
    const result = await checkVideoStatus(videoId, "did");
    console.log(`[Projects]   ↳ D-ID response: status=${result.status} resultUrl=${result.resultUrl ? "yes" : "no"}`);
    if (result.status === "done" && result.resultUrl) {
      await prisma.script.update({
        where: { id: s.id },
        data: {
          generatedVideoUrl: result.resultUrl,
          videoStatus: "completed",
          videoProgress: 100,
          status: "video_ready",
        },
      });
      (s as { generatedVideoUrl: string | null }).generatedVideoUrl = result.resultUrl;
      (s as { videoStatus: string | null }).videoStatus = "completed";
      (s as { videoProgress: number | null }).videoProgress = 100;
    } else if (result.status === "error") {
      const errMsg = typeof result.error === "string" ? result.error : (result.error as unknown as { message?: string })?.message ?? "Video generation failed";
      await prisma.script.update({
        where: { id: s.id },
        data: { videoStatus: "failed", videoError: errMsg, videoProgress: 0, status: "error" },
      });
      (s as { videoStatus: string | null }).videoStatus = "failed";
      (s as { videoProgress: number | null }).videoProgress = 0;
      (s as { videoError: string | null }).videoError = errMsg;
    } else {
      const progress = result.status === "created" ? 5 : 50;
      await prisma.script.update({
        where: { id: s.id },
        data: { videoStatus: "processing", videoProgress: progress },
      });
      (s as { videoStatus: string | null }).videoStatus = "processing";
      (s as { videoProgress: number | null }).videoProgress = progress;
    }
  } catch (err) {
    console.error("[Projects] ❌ syncLegacyScript failed for", s.id, "error:", err);
    const errMsg = err instanceof Error ? err.message : String(err);
    const createdTime = new Date(s.createdAt).getTime();
    const minutesElapsed = (Date.now() - createdTime) / 1000 / 60;
    if (minutesElapsed > 5) {
      await prisma.script.update({
        where: { id: s.id },
        data: {
          videoStatus: "failed",
          videoProgress: 0,
          videoError: `HeyGen error: ${errMsg.substring(0, 300)}`,
          status: "error",
        },
      });
      (s as { videoStatus: string | null }).videoStatus = "failed";
      (s as { videoProgress: number | null }).videoProgress = 0;
      (s as { videoError: string | null }).videoError = errMsg.substring(0, 300);
      console.log(`[Projects]   💾 Script marked as FAILED after ${Math.round(minutesElapsed)} min (stop syncing)`);
    }
  }
}

/**
 * GET /api/projects
 * Returns all video projects for the current user with ACTUAL status (syncs processing projects with D-ID/HeyGen first).
 * - GeneratedVideo rows (HeyGen studio flow) with script details
 * - Scripts with video data that don't have a GeneratedVideo (legacy script generate-video flow)
 */
export async function GET(request: NextRequest) {
  console.log("========================================");
  console.log("[Projects] 📊 GET /api/projects called at:", new Date().toISOString());

  try {
    const userId = await getCurrentUserId(request);
    if (!userId) {
      console.log("[Projects] ❌ Unauthorized (no userId)");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("[Projects] userId:", userId);

    type GeneratedVideoWithScript = Awaited<
      ReturnType<
        typeof prisma.generatedVideo.findMany<{
          include: { script: { select: { id: true; topic: true; platform: true; content: true; projectName: true } } };
        }>
      >
    >[number];
    let generatedVideos: GeneratedVideoWithScript[] = [];

    // 1) Fetch GeneratedVideo rows
    try {
      const result = await prisma.generatedVideo.findMany({
        where: { userId },
        include: {
          script: {
            select: {
              id: true,
              topic: true,
              platform: true,
              content: true,
              projectName: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      generatedVideos = result;
    } catch (e) {
      console.warn("[Projects] GeneratedVideo query skipped:", e);
    }

    console.log("[Projects] 📦 GeneratedVideos in DB:", generatedVideos.length);
    const gvByStatus = {
      processing: generatedVideos.filter((gv) => (gv.videoStatus ?? "").toLowerCase() === "processing").length,
      pending: generatedVideos.filter((gv) => (gv.videoStatus ?? "").toLowerCase() === "pending").length,
      completed: generatedVideos.filter((gv) => ["completed", "complete"].includes((gv.videoStatus ?? "").toLowerCase())).length,
      failed: generatedVideos.filter((gv) => ["failed", "error"].includes((gv.videoStatus ?? "").toLowerCase())).length,
      other: generatedVideos.filter((gv) => {
        const s = (gv.videoStatus ?? "").toLowerCase();
        return !["processing", "pending", "completed", "complete", "failed", "error"].includes(s);
      }).length,
    };
    console.log("[Projects] GeneratedVideo status breakdown:", gvByStatus);
    generatedVideos.forEach((gv) => {
      console.log(`[Projects]   - id=${gv.id} generatedVideoId=${gv.generatedVideoId} videoStatus=${JSON.stringify(gv.videoStatus)} videoProgress=${gv.videoProgress} provider=${gv.videoProvider}`);
    });

    // ONLY sync projects that are still generating. Use case-insensitive check so "Processing" / "pending" etc. all sync.
    const isActiveStatus = (s: string | null | undefined) => {
      const lower = (s ?? "").toLowerCase();
      return lower === "processing" || lower === "pending" || lower === "video_processing" || lower === "started" || lower === "created";
    };
    const gvProcessing = generatedVideos.filter(
      (gv) => isActiveStatus(gv.videoStatus) && gv.generatedVideoId
    );
    const gvSkipped = generatedVideos.length - gvProcessing.length;
    console.log(`[Projects] 🔄 Projects to sync (GeneratedVideo): ${gvProcessing.length} (skipping ${gvSkipped} completed/failed/other)`);
    if (gvProcessing.length > 0) {
      gvProcessing.forEach((gv) => {
        console.log(`[Projects]   Syncing: id=${gv.id} videoId=${gv.generatedVideoId} provider=${gv.videoProvider} scriptId=${gv.scriptId}`);
      });
    }
    await Promise.all(gvProcessing.map(syncGeneratedVideo));

    const scriptIdsWithGv = new Set(generatedVideos.map((gv) => gv.scriptId));

    // 2) Fetch legacy Scripts with video data
    const legacyScripts = await prisma.script.findMany({
      where: {
        userId,
        OR: [
          { generatedVideoId: { not: null } },
          { generatedVideoUrl: { not: null } },
        ],
        ...(scriptIdsWithGv.size > 0
          ? { id: { notIn: Array.from(scriptIdsWithGv) } }
          : {}),
      },
      orderBy: { updatedAt: "desc" },
    });

    // ONLY sync legacy Scripts still generating. Case-insensitive so we don't skip due to casing.
    console.log("[Projects] 📦 Legacy Scripts with video:", legacyScripts.length);
    const scriptProcessing = legacyScripts.filter(
      (s) => isActiveStatus(s.videoStatus) && s.generatedVideoId
    );
    const scriptSkipped = legacyScripts.length - scriptProcessing.length;
    console.log(`[Projects] 🔄 Projects to sync (Scripts): ${scriptProcessing.length} (skipping ${scriptSkipped})`);
    if (scriptProcessing.length > 0) {
      scriptProcessing.forEach((s) => {
        console.log(`[Projects]   Syncing script: id=${s.id} videoId=${s.generatedVideoId} status=${s.videoStatus}`);
      });
    }
    await Promise.all(scriptProcessing.map(syncLegacyScript));

    const projects: ProjectItem[] = [];

    for (const gv of generatedVideos) {
      projects.push({
        id: gv.id,
        scriptId: gv.scriptId,
        videoId: gv.generatedVideoId,
        videoProvider: gv.videoProvider ?? "heygen",
        topic: gv.script?.topic ?? "",
        platform: gv.script?.platform ?? "",
        script: gv.script?.content ?? "",
        status: mapStatus(gv.videoStatus),
        progress: gv.videoProgress ?? 0,
        errorMessage: gv.videoError ?? null,
        videoUrl: gv.generatedVideoUrl ?? null,
        thumbnailUrl: gv.thumbnailUrl ?? null,
        duration: gv.duration ?? null,
        projectName: gv.projectName ?? gv.script?.projectName ?? gv.script?.topic ?? null,
        createdAt: gv.createdAt.toISOString(),
        updatedAt: gv.updatedAt.toISOString(),
      });
    }

    for (const s of legacyScripts) {
      projects.push({
        id: s.id,
        scriptId: s.id,
        videoId: s.generatedVideoId,
        videoProvider: s.videoProvider ?? "did",
        topic: s.topic,
        platform: s.platform,
        script: s.content,
        status: mapStatus(s.videoStatus),
        progress: s.videoProgress ?? 0,
        errorMessage: s.videoError ?? null,
        videoUrl: s.generatedVideoUrl ?? null,
        thumbnailUrl: s.thumbnailUrl ?? null,
        duration: s.duration ?? null,
        projectName: s.projectName ?? s.topic ?? null,
        createdAt: s.createdAt.toISOString(),
        updatedAt: s.updatedAt.toISOString(),
      });
    }

    projects.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    const total = projects.length;
    const inProgress = projects.filter((p) => p.status === "processing").length;
    const completed = projects.filter((p) => p.status === "completed").length;
    const failed = projects.filter((p) => p.status === "failed").length;

    console.log("[Projects] 📤 Final response stats:", { total, inProgress, completed, failed });
    projects.forEach((p) => {
      console.log(`[Projects]   Response project: id=${p.id} status=${p.status} progress=${p.progress} videoUrl=${p.videoUrl ? "yes" : "no"}`);
    });
    console.log("========================================\n");

    return NextResponse.json({
      success: true,
      total,
      inProgress,
      completed,
      failed,
      projects,
    });
  } catch (error) {
    console.error("[Projects] ❌ FATAL ERROR in GET /api/projects:", error);
    return NextResponse.json(
      { error: "load_failed", message: String(error) },
      { status: 500 }
    );
  }
}
