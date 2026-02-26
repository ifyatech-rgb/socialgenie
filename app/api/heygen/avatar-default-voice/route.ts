import { NextRequest, NextResponse } from "next/server";
import { getAuthUserEmail } from "@/lib/auth";
import { getHeyGenClient } from "@/lib/heygenClient";

export const dynamic = "force-dynamic";

/**
 * GET /api/heygen/avatar-default-voice?avatarId=xxx
 * Returns the default voice ID for an avatar (for one-step avatar → voice flow).
 */
export async function GET(request: NextRequest) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const avatarId = searchParams.get("avatarId")?.trim();
    if (!avatarId) {
      return NextResponse.json(
        { error: "invalid_input", message: "avatarId is required" },
        { status: 400 }
      );
    }

    const heygen = getHeyGenClient();
    const details = await heygen.getAvatarDetails(avatarId);
    if (details?.defaultVoice) {
      return NextResponse.json({ voiceId: details.defaultVoice, source: "avatar_details" });
    }

    const voices = await heygen.getVoicesForAvatar(avatarId);
    const first = voices[0]?.voice_id;
    if (first) {
      return NextResponse.json({ voiceId: first, source: "avatar_voices" });
    }

    const allVoices = await heygen.getVoices();
    const fallback = allVoices[0]?.voice_id ?? null;
    return NextResponse.json({ voiceId: fallback, source: fallback ? "all_voices" : null });
  } catch (error) {
    console.error("[HeyGen avatar-default-voice] Failed:", error);
    return NextResponse.json(
      { error: "fetch_failed", voiceId: null, message: error instanceof Error ? error.message : "Failed to get default voice" },
      { status: 200 }
    );
  }
}
