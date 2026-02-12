import { NextRequest, NextResponse } from "next/server";
import { getAuthUserEmail } from "@/lib/auth";
import { getHeyGenClient } from "@/lib/heygenClient";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const avatarId = new URL(request.url).searchParams.get("avatarId")?.trim();
    if (!avatarId) return NextResponse.json({ error: "Avatar ID required" }, { status: 400 });

    const heygen = getHeyGenClient();
    const [avatarDetails, voices] = await Promise.all([
      heygen.getAvatarDetails(avatarId),
      heygen.getVoicesForAvatar(avatarId),
    ]);

    const formattedVoices = voices.map((v) => ({
      id: v.voice_id,
      name: v.display_name ?? v.voice_id,
      gender: v.gender,
      accent: v.accent,
      preview: v.preview_audio_url,
    }));

    return NextResponse.json({
      success: true,
      avatar: avatarDetails ?? { id: avatarId, name: "", preview: undefined, defaultVoice: undefined, gender: undefined, style: undefined },
      voices: formattedVoices,
      defaultVoice: avatarDetails?.defaultVoice,
    });
  } catch (error) {
    console.error("[HeyGen Avatar Voices] Failed:", error);
    return NextResponse.json({ error: "fetch_failed", message: String(error) }, { status: 500 });
  }
}
