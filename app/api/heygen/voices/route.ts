import { NextRequest, NextResponse } from "next/server";
import { getAuthUserEmail } from "@/lib/auth";
import { getHeyGenClient } from "@/lib/heygenClient";

export const dynamic = "force-dynamic";

/** GET /api/heygen/voices - List all HeyGen voices (synced with avatars). */
export async function GET(request: NextRequest) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const heygen = getHeyGenClient();
    const voices = await heygen.getVoices();

    const formatted = voices.map((v) => ({
      id: v.voice_id,
      voice_id: v.voice_id,
      name: v.display_name ?? v.voice_id,
      display_name: v.display_name,
      language: v.language,
      gender: v.gender,
      preview: v.preview_audio_url,
      accent: v.accent,
    }));

    const grouped = formatted.reduce<Record<string, typeof formatted>>((acc, voice) => {
      const lang = voice.language ?? "Other";
      if (!acc[lang]) acc[lang] = [];
      acc[lang].push(voice);
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      voices: formatted,
      grouped,
      count: formatted.length,
    });
  } catch (error) {
    console.error("[HeyGen Voices] Failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: "fetch_failed",
        message: error instanceof Error ? error.message : "Failed to fetch voices",
        voices: [],
        grouped: {},
        count: 0,
      },
      { status: 200 }
    );
  }
}
