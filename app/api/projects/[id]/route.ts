import { NextRequest, NextResponse } from "next/server";
import { getAuthUserEmail, getSessionForRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getHeyGenClient } from "@/lib/heygenClient";
import { sanitizeVideoError } from "@/lib/sanitize-video-errors";

export const dynamic = "force-dynamic";

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

/**
 * GET /api/projects/[id]
 * Return one project; sync status with HeyGen if processing.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const project = await prisma.projects.findFirst({
      where: { id, user_id: userId },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const status = (project.status ?? "").toLowerCase();
    if (
      (status === "processing" || status === "pending") &&
      project.video_id &&
      process.env.HEYGEN_API_KEY
    ) {
      try {
        const heygen = getHeyGenClient();
        const heygenStatus = await heygen.getVideoStatus(project.video_id);
        const normalized = (heygenStatus.status ?? "").toLowerCase();
        if (normalized === "completed" && heygenStatus.video_url) {
          await prisma.projects.update({
            where: { id },
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
          const updated = await prisma.projects.findFirst({
            where: { id, user_id: userId },
          });
          return NextResponse.json({ success: true, project: updated ?? project });
        }
        if (normalized === "failed" || normalized === "error") {
          const errMsg =
            (typeof heygenStatus.error === "string" ? heygenStatus.error : null) ||
            "Video generation failed";
          const userErr = sanitizeVideoError(new Error(errMsg));
          await prisma.projects.update({
            where: { id },
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
          const updated = await prisma.projects.findFirst({
            where: { id, user_id: userId },
          });
          return NextResponse.json({ success: true, project: updated ?? project });
        }
      } catch (err) {
        console.error("[Projects] GET [id] sync error:", err);
      }
    }

    const fresh = await prisma.projects.findFirst({
      where: { id, user_id: userId },
    });
    return NextResponse.json({ success: true, project: fresh ?? project });
  } catch (error) {
    console.error("[Projects] GET [id] error:", error);
    return NextResponse.json(
      { error: "Unable to load project. Please try again.", code: "UNKNOWN_ERROR" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete a project (must belong to current user).
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await context.params;
    if (!projectId) {
      return NextResponse.json({ error: "Missing project id" }, { status: 400 });
    }

    const deleted = await prisma.projects.deleteMany({
      where: { id: projectId, user_id: userId },
    });

    if (deleted.count > 0) {
      return NextResponse.json({ success: true, deleted: "project" });
    }

    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  } catch (error) {
    console.error("[Projects] DELETE error:", error);
    return NextResponse.json(
      { error: "delete_failed", message: String(error) },
      { status: 500 }
    );
  }
}
