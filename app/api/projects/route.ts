import { NextRequest, NextResponse } from "next/server";
import { getAuthUserEmail, getSessionForRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getHeyGenClient } from "@/lib/heygenClient";
import { sanitizeVideoError } from "@/lib/sanitize-video-errors";

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

function mapProjectStatus(
  status: string | null | undefined
): "pending" | "processing" | "completed" | "failed" {
  if (!status) return "pending";
  const s = status.toLowerCase();
  if (s === "completed" || s === "complete") return "completed";
  if (s === "failed" || s === "error" || s === "refunded") return "failed";
  if (s === "processing" || s === "pending") return "processing";
  return "pending";
}

async function getCurrentUserId(request: NextRequest): Promise<string | null> {
  const email = await getAuthUserEmail(request);
  if (email) {
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });
    if (user) return user.id;
  }
  const session = await getSessionForRequest(request);
  if (session?.user?.id) return session.user.id;
  return null;
}

/** Sync a single project with HeyGen and update DB. Only call when status is processing/pending and video_id is set. */
async function syncProjectWithHeyGen(project: {
  id: string;
  video_id: string | null;
  status: string | null;
  user_id: string;
  script_id: string | null;
}) {
  const videoId = project.video_id;
  const status = (project.status ?? "").toLowerCase();
  if (!videoId || (status !== "processing" && status !== "pending")) return;

  try {
    const heygen = getHeyGenClient();
    const heygenStatus = await heygen.getVideoStatus(videoId);
    const normalized = (heygenStatus.status ?? "").toLowerCase();
    const isCompleted = normalized === "completed" || normalized === "complete";
    const isFailed = normalized === "failed" || normalized === "error";

    if (isCompleted && heygenStatus.video_url) {
      await prisma.projects.update({
        where: { id: project.id },
        data: {
          video_url: heygenStatus.video_url,
          thumbnail_url: heygenStatus.thumbnail_url ?? undefined,
          duration: heygenStatus.duration ?? undefined,
          status: "completed",
          completed_at: new Date(),
        },
      });
      if (project.script_id) {
        await prisma.scripts.update({
          where: { id: project.script_id },
          data: {
            video_status: "completed",
            generated_video_url: heygenStatus.video_url,
            video_error: null,
          },
        }).catch(() => {});
      }
    } else if (isFailed) {
      const errMsg =
        (typeof heygenStatus.error === "string" ? heygenStatus.error : null) ||
        "Video generation failed";
      const userErr = sanitizeVideoError(new Error(errMsg));
      await prisma.projects.update({
        where: { id: project.id },
        data: {
          status: "failed",
          error_message: userErr,
          failed_at: new Date(),
        },
      });
      if (project.script_id) {
        await prisma.scripts.update({
          where: { id: project.script_id },
          data: { video_status: "failed", video_error: userErr },
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.error("[Projects] syncProjectWithHeyGen failed:", project.id, err);
  }
}

function toProjectItem(p: {
  id: string;
  script_id: string | null;
  video_id: string | null;
  name: string;
  script_text: string;
  platform: string | null;
  status: string | null;
  error_message: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  duration: number | null;
  created_at: Date | null;
  updated_at: Date | null;
}): ProjectItem {
  const status = mapProjectStatus(p.status);
  const progress =
    status === "completed" ? 100 : status === "processing" || status === "pending" ? 50 : 0;
  return {
    id: p.id,
    scriptId: p.script_id ?? undefined,
    videoId: p.video_id,
    videoProvider: "heygen",
    topic: p.name,
    platform: p.platform ?? "",
    script: p.script_text,
    status,
    progress,
    errorMessage: p.error_message,
    videoUrl: p.video_url,
    thumbnailUrl: p.thumbnail_url,
    duration: p.duration,
    projectName: p.name,
    createdAt: (p.created_at ?? new Date()).toISOString(),
    updatedAt: (p.updated_at ?? new Date()).toISOString(),
  };
}

/**
 * GET /api/projects
 * Returns all video projects for the current user from the projects table.
 * Syncs processing projects with HeyGen before returning.
 */
export async function GET(request: NextRequest) {
  try {
    const userId = await getCurrentUserId(request);
    if (!userId) {
      console.log("[Projects] GET: no userId (Unauthorized)");
      return NextResponse.json(
        { error: "Please log in to view projects", code: "NO_SESSION" },
        { status: 401 }
      );
    }

    console.log("[Projects] GET: fetching for userId", userId);

    let rows: Array<{
      id: string;
      script_id: string | null;
      video_id: string | null;
      name: string;
      script_text: string;
      platform: string | null;
      status: string | null;
      error_message: string | null;
      video_url: string | null;
      thumbnail_url: string | null;
      duration: number | null;
      created_at: Date | null;
      updated_at: Date | null;
    }>;
    try {
      rows = await prisma.projects.findMany({
        where: { user_id: userId },
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          script_id: true,
          video_id: true,
          name: true,
          script_text: true,
          platform: true,
          status: true,
          error_message: true,
          video_url: true,
          thumbnail_url: true,
          duration: true,
          created_at: true,
          updated_at: true,
        },
      });
    } catch (dbError: unknown) {
      const err = dbError as { code?: string; message?: string };
      const msg = err?.message ?? String(dbError);
      console.error("[Projects] GET database error:", dbError);
      if (err?.code === "P2021" || /does not exist|relation.*projects/i.test(msg)) {
        return NextResponse.json(
          {
            error: "Projects feature is being set up. Please refresh in a moment.",
            code: "TABLE_NOT_FOUND",
          },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: "Unable to load projects. Please try again.", code: "UNKNOWN_ERROR" },
        { status: 500 }
      );
    }

    const processing = rows.filter(
      (r) =>
        r.video_id &&
        (r.status === "processing" || r.status === "pending")
    );
    await Promise.all(
      processing.map((r) =>
        syncProjectWithHeyGen({
          id: r.id,
          video_id: r.video_id,
          status: r.status,
          user_id: userId,
          script_id: r.script_id,
        })
      )
    );

    const refreshed =
      processing.length > 0
        ? await prisma.projects.findMany({
            where: { user_id: userId },
            orderBy: { created_at: "desc" },
            select: {
              id: true,
              script_id: true,
              video_id: true,
              name: true,
              script_text: true,
              platform: true,
              status: true,
              error_message: true,
              video_url: true,
              thumbnail_url: true,
              duration: true,
              created_at: true,
              updated_at: true,
            },
          })
        : rows;

    const projects: ProjectItem[] = refreshed.map(toProjectItem);
    const total = projects.length;
    const inProgress = projects.filter(
      (p) => p.status === "processing" || p.status === "pending"
    ).length;
    const completed = projects.filter((p) => p.status === "completed").length;
    const failed = projects.filter((p) => p.status === "failed").length;

    console.log("[Projects] GET: found", total, "projects (inProgress:", inProgress, "completed:", completed, "failed:", failed, ")");
    return NextResponse.json({
      success: true,
      total,
      inProgress,
      completed,
      failed,
      projects,
    });
  } catch (error) {
    console.error("[Projects] GET error:", error);
    return NextResponse.json(
      {
        error: "Unable to load projects. Please try again.",
        code: "UNKNOWN_ERROR",
      },
      { status: 500 }
    );
  }
}
