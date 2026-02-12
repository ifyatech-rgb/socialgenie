import { NextRequest, NextResponse } from "next/server";
import { getAuthUserEmail, getSessionForRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

/**
 * DELETE /api/projects/[id]
 * Remove a project from the list:
 * - If id is a GeneratedVideo id: delete that row.
 * - If id is a legacy Script id: clear video fields so it no longer appears in projects.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getCurrentUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: projectId } = await params;
    if (!projectId) {
      return NextResponse.json({ error: "Missing project id" }, { status: 400 });
    }

    // 1) Try to delete a GeneratedVideo row (user must own it)
    const deleted = await prisma.generatedVideo.deleteMany({
      where: { id: projectId, userId },
    });

    if (deleted.count > 0) {
      return NextResponse.json({ success: true, deleted: "generated_video" });
    }

    // 2) Try to clear video data on a Script (legacy project) so it drops out of the list
    const updated = await prisma.script.updateMany({
      where: { id: projectId, userId },
      data: {
        generatedVideoId: null,
        generatedVideoUrl: null,
        videoProvider: null,
        videoStatus: null,
        videoProgress: null,
        videoError: null,
        thumbnailUrl: null,
        duration: null,
      },
    });

    if (updated.count > 0) {
      return NextResponse.json({ success: true, deleted: "legacy_script_cleared" });
    }

    // Not found or not owned
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  } catch (error) {
    console.error("[Projects] DELETE error:", error);
    return NextResponse.json(
      { error: "delete_failed", message: String(error) },
      { status: 500 }
    );
  }
}
