import { NextRequest, NextResponse } from "next/server";
import { getHeyGenClient } from "@/lib/heygenClient";

export const dynamic = "force-dynamic";

/**
 * GET /api/test-heygen?videoId=xxx
 * Manual test endpoint to check HeyGen video status (debugging).
 * Call from browser: /api/test-heygen?videoId=YOUR_HEYGEN_VIDEO_ID
 */
export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get("videoId")?.trim();
  if (!videoId) {
    return NextResponse.json(
      { error: "videoId required. Use: /api/test-heygen?videoId=YOUR_VIDEO_ID" },
      { status: 400 }
    );
  }

  const apiKeySet = !!process.env.HEYGEN_API_KEY;

  try {
    const heygen = getHeyGenClient();
    const status = await heygen.getVideoStatus(videoId);

    return NextResponse.json({
      videoId,
      apiKey: apiKeySet ? "SET" : "NOT SET",
      heygenResponse: {
        status: status.status,
        progress: status.progress,
        video_url: status.video_url ? "yes" : "no",
        thumbnail_url: status.thumbnail_url ? "yes" : "no",
        duration: status.duration,
        error: status.error,
      },
    });
  } catch (error) {
    console.error("[test-heygen] Error:", error);
    return NextResponse.json(
      {
        videoId,
        apiKey: apiKeySet ? "SET" : "NOT SET",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
