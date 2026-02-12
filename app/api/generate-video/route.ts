import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateVideo, getAvailableAvatars, getAvailableVoices } from "@/lib/video-generation";

/**
 * POST /api/generate-video
 *
 * Generate a talking avatar video using HeyGen
 *
 * Body:
 * - scriptId: string (optional) - ID of existing script to use
 * - script: string (required if no scriptId) - Text for the avatar to speak
 * - voiceId: string (optional)
 * - avatarId: string (optional) - HeyGen avatar ID (default: test avatar)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, avatarId: true, avatarStatus: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (!process.env.HEYGEN_API_KEY) {
      return NextResponse.json(
        {
          error: "HeyGen API key not configured. Please add HEYGEN_API_KEY to your .env file.",
          helpUrl: "https://www.heygen.com/",
        },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { scriptId, script: scriptText, voiceId, avatarId: bodyAvatarId } = body;

    let content: string;
    let scriptRecord: { id: string } | null = null;

    if (scriptId) {
      scriptRecord = await prisma.script.findFirst({
        where: { id: scriptId, userId: user.id },
      });
      if (!scriptRecord) {
        return NextResponse.json({ error: "Script not found" }, { status: 404 });
      }
      const scriptRow = await prisma.script.findUnique({
        where: { id: scriptId },
        select: { content: true },
      });
      content = scriptRow?.content ?? "";
      await prisma.script.update({
        where: { id: scriptId },
        data: { status: "video_processing", videoStatus: "processing" },
      });
    } else if (scriptText) {
      content = scriptText;
    } else {
      return NextResponse.json(
        { error: "Either scriptId or script text is required" },
        { status: 400 }
      );
    }

    const avatarId =
      bodyAvatarId ||
      (user.avatarId && user.avatarStatus === "ready" ? user.avatarId : undefined);

    const result = await generateVideo({
      script: content,
      scriptId: scriptRecord?.id ?? "",
      provider: "heygen",
      voiceId,
      avatarId,
    });

    if (!result.success || !result.videoId) {
      return NextResponse.json(
        { error: result.error || "Video generation failed" },
        { status: 500 }
      );
    }

    if (scriptRecord) {
      await prisma.script.update({
        where: { id: scriptRecord.id },
        data: {
          generatedVideoId: result.videoId,
          videoProvider: "heygen",
          videoStatus: "processing",
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Video generation started. This may take 2–5 minutes.",
      videoId: result.videoId,
      status: result.status,
      scriptId: scriptRecord?.id ?? null,
      checkStatusUrl: `/api/generate-video/${result.videoId}`,
    });
  } catch (error: unknown) {
    console.error("Video generation error:", error);
    const message = error instanceof Error ? error.message : "Failed to generate video";
    if (message.includes("HeyGen API key")) {
      return NextResponse.json({ error: message }, { status: 401 });
    }
    if (message.includes("credits")) {
      return NextResponse.json({ error: message }, { status: 402 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * GET /api/generate-video - Get available voices and avatars (D-ID)
 */
export async function GET() {
  const avatars = await getAvailableAvatars("did");
  return NextResponse.json({
    voices: getAvailableVoices("did"),
    avatars,
    defaultVoice: "en-US-JennyNeural",
  });
}
