import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTalk, getTalkStatus, DID_VOICES, DID_PRESENTERS } from "@/lib/d-id";

/**
 * POST /api/generate-video
 * 
 * Generate a talking avatar video using D-ID
 * 
 * Body:
 * - scriptId: string (optional) - ID of existing script to use
 * - script: string (required if no scriptId) - Text for the avatar to speak
 * - voiceId: string (optional) - Voice ID (default: en-US-JennyNeural)
 * - sourceUrl: string (optional) - Image URL for avatar (default: D-ID presenter)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if D-ID API key is configured
    if (!process.env.DID_API_KEY) {
      return NextResponse.json(
        { 
          error: "D-ID API key not configured. Please add DID_API_KEY to your .env file.",
          helpUrl: "https://studio.d-id.com/account-settings"
        },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { scriptId, script: scriptText, voiceId = "en-US-JennyNeural", sourceUrl } = body;

    // Get script content
    let content: string;
    let scriptRecord = null;

    if (scriptId) {
      // Use existing script
      scriptRecord = await prisma.script.findFirst({
        where: {
          id: scriptId,
          userId: user.id,
        },
      });

      if (!scriptRecord) {
        return NextResponse.json({ error: "Script not found" }, { status: 404 });
      }

      content = scriptRecord.content;

      // Update script status
      await prisma.script.update({
        where: { id: scriptId },
        data: { status: "video_processing" },
      });
    } else if (scriptText) {
      // Use provided text
      content = scriptText;
    } else {
      return NextResponse.json(
        { error: "Either scriptId or script text is required" },
        { status: 400 }
      );
    }

    // Validate voice ID
    if (voiceId && !DID_VOICES[voiceId as keyof typeof DID_VOICES]) {
      return NextResponse.json(
        { 
          error: "Invalid voice ID",
          availableVoices: Object.keys(DID_VOICES),
        },
        { status: 400 }
      );
    }

    console.log("Creating D-ID talk...", { voiceId, hasSourceUrl: !!sourceUrl });

    // Create the talk (video generation request)
    const talk = await createTalk(content, {
      voiceId,
      sourceUrl: sourceUrl || DID_PRESENTERS.default,
    });

    console.log("D-ID talk created:", talk.id);

    return NextResponse.json({
      success: true,
      message: "Video generation started! It will be ready in 1-2 minutes.",
      videoId: talk.id,
      status: talk.status,
      scriptId: scriptRecord?.id,
      checkStatusUrl: `/api/generate-video/${talk.id}`,
    });

  } catch (error: any) {
    console.error("Video generation error:", error);

    if (error.message?.includes("Invalid D-ID API key")) {
      return NextResponse.json(
        { error: "Invalid D-ID API key. Please check your DID_API_KEY." },
        { status: 401 }
      );
    }

    if (error.message?.includes("credits")) {
      return NextResponse.json(
        { error: "D-ID credits exhausted. Please add credits to your account." },
        { status: 402 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to generate video" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/generate-video
 * 
 * Get available voices and presenters
 */
export async function GET() {
  return NextResponse.json({
    voices: DID_VOICES,
    presenters: DID_PRESENTERS,
    defaultVoice: "en-US-JennyNeural",
    defaultPresenter: DID_PRESENTERS.default,
  });
}
