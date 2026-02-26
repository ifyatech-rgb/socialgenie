import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateVideo } from "@/lib/video-generation";
import { sanitizeVideoError } from "@/lib/sanitize-video-errors";

export const dynamic = "force-dynamic";

/**
 * POST /api/projects/[id]/retry
 * Retry video generation for a failed/refunded project WITHOUT deducting credits again.
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

    const { id: projectId } = await context.params;
    if (!projectId) {
      return NextResponse.json({ error: "Missing project id" }, { status: 400 });
    }

    const email = session.user.email.trim().toLowerCase();
    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const project = await prisma.projects.findFirst({
      where: { id: projectId, user_id: user.id },
      select: {
        id: true,
        script_id: true,
        status: true,
        script_text: true,
        avatar_id: true,
        avatar_name: true,
        avatar_look: true,
        is_talking_photo: true,
        platform: true,
        credits_refunded: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const status = (project.status ?? "").toLowerCase();
    const canRetry = status === "failed" || status === "refunded";
    if (!canRetry) {
      return NextResponse.json(
        { error: "Only failed or refunded projects can be retried without charges." },
        { status: 400 }
      );
    }

    const content = (project.script_text ?? "").trim();
    if (!content) {
      return NextResponse.json(
        { error: "Project has no script text. Cannot retry." },
        { status: 400 }
      );
    }
    if (!project.avatar_id) {
      return NextResponse.json(
        { error: "Project has no avatar. Cannot retry." },
        { status: 400 }
      );
    }

    if (!process.env.HEYGEN_API_KEY) {
      return NextResponse.json(
        { error: "Video service is not configured. Please try again later." },
        { status: 500 }
      );
    }

    const result = await generateVideo({
      script: content,
      scriptId: project.script_id ?? "",
      provider: "heygen",
      voiceId: undefined,
      avatarId: project.avatar_id,
      aspectRatio: "9:16",
      avatarStyle: project.avatar_look ?? undefined,
      useTalkingPhoto: project.is_talking_photo === true,
    });

    if (!result.success || !result.videoId) {
      const rawMsg = result.error ?? "Generation failed";
      const userError = rawMsg.replace(/\bheygen\b/gi, "video service").trim() || "Generation failed";
      await prisma.projects.update({
        where: { id: projectId },
        data: {
          status: "failed",
          error_message: userError,
          provider_error: result.rawError ?? result.error ?? null,
          failed_at: new Date(),
        },
      });
      return NextResponse.json(
        { error: userError, success: false },
        { status: 500 }
      );
    }

    await prisma.projects.update({
      where: { id: projectId },
      data: {
        status: "processing",
        video_id: result.videoId,
        error_message: null,
        provider_error: null,
        failed_at: null,
        credits_refunded: false,
        retry_count: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Retry started. No extra credits charged.",
      videoId: result.videoId,
      projectId,
    });
  } catch (error) {
    console.error("[Projects] Retry error:", error);
    const userError = sanitizeVideoError(error);
    return NextResponse.json(
      { error: userError, success: false },
      { status: 500 }
    );
  }
}
