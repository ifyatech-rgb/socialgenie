import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateVideo } from "@/lib/video-generation";
import { trackVideoGeneration, trackError } from "@/lib/tracking";
import { canAccessApp } from "@/lib/payment";

export async function POST(
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
      select: { id: true, credits: true, payment_status: true, avatarId: true, avatarStatus: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!canAccessApp(user.payment_status)) {
      return NextResponse.json(
        { error: "Complete your payment to use this feature.", code: "payment_required" },
        { status: 403 }
      );
    }

    const script = await prisma.script.findFirst({
      where: { id, userId: user.id },
      include: { video: true },
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    if (!process.env.HEYGEN_API_KEY) {
      return NextResponse.json(
        { error: "HeyGen API key not configured. Please add HEYGEN_API_KEY to your .env file." },
        { status: 500 }
      );
    }

    // Update script status to processing
    await prisma.script.update({
      where: { id: script.id },
      data: { status: "video_processing", videoStatus: "processing" },
    });

    console.log("Generating video with HeyGen for script:", script.id);

    try {
      let avatarId = user.avatarId && user.avatarStatus === "ready" ? user.avatarId : undefined;
      try {
        const body = await request.json();
        if (body.avatarId) avatarId = body.avatarId;
      } catch {
        // No body, use user avatar or default
      }

      const result = await generateVideo({
        script: script.content,
        scriptId: script.id,
        provider: "heygen",
        avatarId,
      });

      if (!result.success || !result.videoId) {
        await prisma.script.update({
          where: { id: script.id },
          data: { status: "generated", videoStatus: null },
        });
        return NextResponse.json(
          { error: result.error || "Video generation failed" },
          { status: 500 }
        );
      }

      await prisma.script.update({
        where: { id: script.id },
        data: {
          generatedVideoId: result.videoId,
          videoProvider: "heygen",
          videoStatus: "processing",
        },
      });

      trackVideoGeneration({
        user_id: user.id,
        script_id: script.id,
        video_id: result.videoId,
        provider: "heygen",
        status: "processing",
      });

      return NextResponse.json({
        success: true,
        message: "Video generation started. This may take 2 to 5 minutes.",
        mode: "heygen",
        videoId: result.videoId,
        status: result.status,
        note: "Poll GET /api/scripts/[id]/generate-video or use /api/videos/generate?scriptId=... to check status.",
      });
    } catch (error: unknown) {
      console.error("HeyGen video generation error:", error);
      await prisma.script.update({
        where: { id: script.id },
        data: { status: "generated", videoStatus: null },
      });
      throw error;
    }
  } catch (error: unknown) {
    console.error("Video generation error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate video";
    const session = await getServerSession(authOptions).catch(() => null);
    const user = session?.user?.email
      ? await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } }).catch(() => null)
      : null;
    trackError({
      user_id: user?.id ?? null,
      endpoint: "/api/scripts/[id]/generate-video",
      error_message: message,
      status_code: 500,
    });
    if (message.includes("HeyGen API key")) {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (message.includes("credits")) {
      return NextResponse.json({ error: message }, { status: 402 });
    }
    if (message.includes("rate limit")) {
      return NextResponse.json({ error: message }, { status: 429 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

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

    const script = await prisma.script.findFirst({
      where: { id, userId: user.id },
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: script.status,
      videoStatus: script.videoStatus,
      videoUrl: script.generatedVideoUrl,
      hasVideo: !!script.generatedVideoUrl,
    });
  } catch (error: unknown) {
    console.error("Video status error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check status" },
      { status: 500 }
    );
  }
}
