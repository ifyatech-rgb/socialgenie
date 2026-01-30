import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateVideo, DID_VOICES } from "@/lib/d-id";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const script = await prisma.script.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
      include: {
        video: true,
      },
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    // Check if D-ID API key is configured
    if (!process.env.DID_API_KEY) {
      return NextResponse.json(
        { error: "D-ID API key not configured. Please add DID_API_KEY to your .env file." },
        { status: 500 }
      );
    }

    // Update script status to processing
    await prisma.script.update({
      where: { id: script.id },
      data: { status: "video_processing" },
    });

    console.log("Generating video with D-ID for script:", script.id);

    try {
      // Parse request body for optional settings
      let voiceId = "en-US-JennyNeural";
      let sourceUrl = undefined;
      
      try {
        const body = await request.json();
        if (body.voiceId && DID_VOICES[body.voiceId as keyof typeof DID_VOICES]) {
          voiceId = body.voiceId;
        }
        if (body.sourceUrl) {
          sourceUrl = body.sourceUrl;
        }
      } catch {
        // No body provided, use defaults
      }

      // Generate video with D-ID (don't wait for completion due to timeout issues)
      const result = await generateVideo(script.content, {
        voiceId,
        sourceUrl,
        waitForCompletion: false, // Changed to false to avoid timeout
      });

      // Video is being generated, keep status as processing
      return NextResponse.json({
        success: true,
        message: "Video generation started! Check your D-ID dashboard at https://studio.d-id.com/talks for the result.",
        mode: "d-id",
        videoId: result.videoId,
        status: result.status,
        note: "Due to D-ID API timeout issues, please check your D-ID dashboard to download the video once it's ready (usually 1-2 minutes).",
        dashboardUrl: `https://studio.d-id.com/talks/${result.videoId}`,
      });

    } catch (error: any) {
      console.error("D-ID video generation error:", error);

      // Reset script status on error
      await prisma.script.update({
        where: { id: script.id },
        data: { status: "generated" },
      });

      throw error;
    }

  } catch (error: any) {
    console.error("Video generation error:", error);

    // Handle specific D-ID errors
    if (error.message?.includes("Invalid D-ID API key")) {
      return NextResponse.json(
        { error: "Invalid D-ID API key. Please check your DID_API_KEY in .env file." },
        { status: 401 }
      );
    }

    if (error.message?.includes("credits exhausted")) {
      return NextResponse.json(
        { error: "D-ID credits exhausted. Please add more credits to your D-ID account." },
        { status: 402 }
      );
    }

    if (error.message?.includes("rate limit")) {
      return NextResponse.json(
        { error: "D-ID rate limit exceeded. Please try again in a moment." },
        { status: 429 }
      );
    }

    if (error.message?.includes("Unsupported file url")) {
      return NextResponse.json(
        { error: "The default avatar image is not supported. Please upload a training video or provide a custom avatar image URL." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to generate video" },
      { status: 500 }
    );
  }
}

// GET - Check video generation status
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const script = await prisma.script.findFirst({
      where: {
        id: params.id,
        userId: user.id,
      },
    });

    if (!script) {
      return NextResponse.json({ error: "Script not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: script.status,
      videoUrl: script.generatedVideoUrl,
      hasVideo: !!script.generatedVideoUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to check status" },
      { status: 500 }
    );
  }
}
