import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getHeyGenClient } from "@/lib/heygenClient";
import { generateVideo } from "@/lib/video-generation";
import { trackVideoGeneration, trackError } from "@/lib/tracking";
import { canAccessApp, canUseFeature } from "@/lib/payment";
import { syncScriptToSupabase } from "@/lib/supabase-sync";
import { sanitizeVideoError } from "@/lib/sanitize-video-errors";

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
    const email = session.user.email.trim().toLowerCase();
    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        credits: true,
        video_credits: true,
        plan: true,
        created_at: true,
        payment_status: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!canAccessApp(user.payment_status ?? undefined)) {
      return NextResponse.json(
        { error: "Complete your payment to use this feature.", code: "payment_required" },
        { status: 403 }
      );
    }

    const featureCheck = canUseFeature({
      plan: user.plan ?? null,
      videoCredits: user.video_credits ?? 0,
      credits: user.credits ?? 0,
      createdAt: user.created_at ?? new Date(),
    });
    if (!featureCheck.allowed) {
      const creditsRemaining = user.video_credits ?? user.credits ?? 0;
      return NextResponse.json(
        {
          error: featureCheck.error,
          code: featureCheck.code,
          creditsRemaining,
        },
        { status: 402 }
      );
    }

    const script = await prisma.scripts.findFirst({
      where: { id, user_id: user.id },
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    if (!process.env.HEYGEN_API_KEY) {
      return NextResponse.json(
        { error: sanitizeVideoError(new Error("API key not configured")) },
        { status: 500 }
      );
    }

    await prisma.scripts.update({
      where: { id: script.id },
      data: { video_status: "processing", video_error: null },
    }).catch(() => {});
    syncScriptToSupabase({
      id: script.id,
      user_id: script.user_id,
      topic: script.topic,
      platform: script.platform,
      content: script.script_text ?? "",
      tone: script.content_style ?? undefined,
      length: script.estimated_duration ?? undefined,
      status: script.status ?? "draft",
      video_status: "processing",
      created_at: script.created_at?.toISOString(),
      updated_at: new Date().toISOString(),
    }).catch(() => {});

    console.log("Generating video for script:", script.id);

    try {
      let avatarId: string | undefined;
      try {
        const body = await request.json();
        if (body.avatarId) avatarId = body.avatarId;
      } catch {
        // No body
      }

      const result = await generateVideo({
        script: script.script_text ?? "",
        scriptId: script.id,
        provider: "heygen",
        avatarId,
      });

      if (!result.success || !result.videoId) {
        const rawMsg = result.error ?? "Video generation failed";
        const userError = rawMsg.replace(/\bheygen\b/gi, "video service").trim() || "Video generation failed";
        await prisma.scripts.update({
          where: { id: script.id },
          data: { video_status: "failed", video_error: userError },
        }).catch(() => {});
        syncScriptToSupabase({ id: script.id, user_id: script.user_id, topic: script.topic, platform: script.platform, content: script.script_text ?? "", status: script.status ?? "draft", video_status: "failed", created_at: script.created_at?.toISOString(), updated_at: new Date().toISOString() }).catch(() => {});
        return NextResponse.json(
          { error: userError },
          { status: 500 }
        );
      }

      await prisma.scripts.update({
        where: { id: script.id },
        data: { video_status: "processing", generated_video_id: result.videoId, video_error: null },
      }).catch(() => {});
      syncScriptToSupabase({
        id: script.id,
        user_id: script.user_id,
        topic: script.topic,
        platform: script.platform,
        content: script.script_text ?? "",
        tone: script.content_style ?? undefined,
        length: script.estimated_duration ?? undefined,
        status: script.status ?? "draft",
        generated_video_id: result.videoId,
        video_provider: "heygen",
        video_status: "processing",
        created_at: script.created_at?.toISOString(),
        updated_at: new Date().toISOString(),
      }).catch(() => {});

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
        videoId: result.videoId,
        status: result.status,
        note: "Poll GET /api/scripts/[id]/generate-video to check status.",
      });
    } catch (error: unknown) {
      console.error("Video generation error:", error);
      const userError = sanitizeVideoError(error);
      await prisma.scripts.update({
        where: { id: script.id },
        data: { video_status: "failed", video_error: userError },
      }).catch(() => {});
      syncScriptToSupabase({ id: script.id, user_id: script.user_id, topic: script.topic, platform: script.platform, content: script.script_text ?? "", status: script.status ?? "draft", video_status: "failed", created_at: script.created_at?.toISOString(), updated_at: new Date().toISOString() }).catch(() => {});
      throw error;
    }
  } catch (error: unknown) {
    console.error("Video generation error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate video";
    const session = await getServerSession(authOptions).catch(() => null);
    const user = session?.user?.email
      ? await prisma.users.findUnique({ where: { email: session.user.email.trim().toLowerCase() }, select: { id: true } }).catch(() => null)
      : null;
    trackError({
      user_id: user?.id ?? null,
      endpoint: "/api/scripts/[id]/generate-video",
      error_message: message,
      status_code: 500,
    });
    const userError = sanitizeVideoError(error);
    if (message.includes("API key") && message.includes("configured")) {
      return NextResponse.json({ error: userError }, { status: 401 });
    }
    if (message.includes("credits")) {
      return NextResponse.json({ error: userError }, { status: 402 });
    }
    if (message.includes("rate limit")) {
      return NextResponse.json({ error: userError }, { status: 429 });
    }
    return NextResponse.json({ error: userError }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const email = session.user.email.trim().toLowerCase();
    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let script = await prisma.scripts.findFirst({
      where: { id, user_id: user.id },
      select: { id: true, user_id: true, topic: true, platform: true, script_text: true, content_style: true, estimated_duration: true, created_at: true, status: true, video_status: true, generated_video_id: true, generated_video_url: true, video_error: true },
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    const vs = (script.video_status ?? "").toLowerCase();
    if ((vs === "processing" || vs === "pending") && script.generated_video_id && process.env.HEYGEN_API_KEY) {
      try {
        const heygen = getHeyGenClient();
        const providerStatus = await heygen.getVideoStatus(script.generated_video_id);
        if (providerStatus.status === "completed" && providerStatus.video_url) {
          await prisma.scripts.update({
            where: { id: script.id },
            data: { video_status: "completed", generated_video_url: providerStatus.video_url, video_error: null },
          });
          script = { ...script, video_status: "completed", generated_video_url: providerStatus.video_url, video_error: null };
        } else if (providerStatus.status === "failed") {
          await prisma.scripts.update({
            where: { id: script.id },
            data: { video_status: "failed", video_error: providerStatus.error ?? "Video generation failed" },
          });
          script = { ...script, video_status: "failed", video_error: providerStatus.error ?? "Video generation failed" };
        }
      } catch {
        // keep current state
      }
    }

    const vs2 = (script.video_status ?? "").toLowerCase();
    const videoStatus = vs2 === "processing" || vs2 === "pending" ? "processing" : vs2 === "completed" || vs2 === "complete" ? "completed" : vs2 === "failed" || vs2 === "error" ? "failed" : null;
    return NextResponse.json({
      status: videoStatus ?? "draft",
      videoStatus,
      videoUrl: script.generated_video_url ?? null,
      hasVideo: !!script.generated_video_url,
      error: script.video_error ?? undefined,
    });
  } catch (error: unknown) {
    console.error("Video status error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to check status" },
      { status: 500 }
    );
  }
}
