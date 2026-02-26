import { NextRequest, NextResponse } from "next/server";
import { getAuthUserEmail } from "@/lib/auth";
import { getHeyGenClient } from "@/lib/heygenClient";

export const dynamic = "force-dynamic";

/** GET /api/heygen/avatar-voices?avatarId=xxx - Voices compatible with a specific avatar (real HeyGen voice IDs only). */
export async function GET(request: NextRequest) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const avatarId = searchParams.get("avatarId")?.trim();
    if (!avatarId) {
      return NextResponse.json(
        { error: "invalid_input", message: "Avatar ID is required" },
        { status: 400 }
      );
    }

    const heygen = getHeyGenClient();
    let voices = await heygen.getVoicesForAvatar(avatarId);

    if (voices.length === 0) {
      const details = await heygen.getAvatarDetails(avatarId);
      const defaultVoiceId = details?.defaultVoice?.trim();
      if (defaultVoiceId) {
        const allVoices = await heygen.getVoices();
        const match = allVoices.find((v) => v.voice_id === defaultVoiceId);
        voices = [
          {
            voice_id: defaultVoiceId,
            display_name: match?.display_name ?? "Default",
            language: match?.language ?? "English",
            gender: match?.gender,
            preview_audio_url: match?.preview_audio_url,
            accent: match?.accent,
          },
        ];
      }
      if (voices.length === 0) {
        const allVoices = await heygen.getVoices();
        const first = allVoices[0];
        if (first?.voice_id) {
          voices = [
            {
              voice_id: first.voice_id,
              display_name: first.display_name ?? first.voice_id,
              language: first.language ?? "English",
              gender: first.gender,
              preview_audio_url: first.preview_audio_url,
              accent: first.accent,
            },
          ];
        }
      }
    }

    const formatted = voices.map((v) => ({
      id: v.voice_id,
      voice_id: v.voice_id,
      name: v.display_name ?? v.voice_id,
      display_name: v.display_name ?? v.voice_id,
      language: v.language,
      gender: v.gender,
      preview: v.preview_audio_url,
      accent: v.accent,
    }));

    if (formatted.length === 0) {
      return NextResponse.json({
        success: false,
        error: "no_voices",
        message: "No voices available for this avatar. Avatar configuration may be incomplete.",
        voices: [],
        defaultVoice: null,
        count: 0,
      });
    }

    let defaultVoice: string | null = null;
    const details = await heygen.getAvatarDetails(avatarId);
    const defaultId = details?.defaultVoice?.trim();
    if (defaultId && formatted.some((v) => v.voice_id === defaultId)) {
      defaultVoice = defaultId;
    } else {
      const english = formatted.find((v) => (v.language ?? "").toLowerCase().includes("english"));
      defaultVoice = english?.id ?? formatted[0].id;
    }

    return NextResponse.json({
      success: true,
      voices: formatted,
      defaultVoice,
      count: formatted.length,
    });
  } catch (error) {
    console.error("[Avatar Voices] Failed:", error);
    return NextResponse.json({
      success: false,
      error: "fetch_failed",
      message: "Could not load voices for this avatar. Please try again or select a different avatar.",
      voices: [],
      defaultVoice: null,
      count: 0,
    });
  }
}
