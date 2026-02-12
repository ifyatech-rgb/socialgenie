import { NextResponse } from "next/server";
import { getAuthUserEmail } from "@/lib/auth";
import { getHeyGenClient } from "@/lib/heygenClient";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const heygen = getHeyGenClient();
    const voices = await heygen.getVoices();

    const formatted = voices.map((v) => ({
      id: v.voice_id,
      name: v.display_name ?? v.voice_id,
      language: v.language,
      gender: v.gender,
      preview: v.preview_audio_url,
      accent: v.accent,
    }));

    const grouped = formatted.reduce<Record<string, typeof formatted>>((acc, v) => {
      const lang = v.language ?? "English";
      if (!acc[lang]) acc[lang] = [];
      acc[lang].push(v);
      return acc;
    }, {});

    return NextResponse.json({ success: true, voices: formatted, grouped });
  } catch (error) {
    console.error("[HeyGen Voices] Failed:", error);
    return NextResponse.json({ error: "fetch_failed", message: String(error) }, { status: 500 });
  }
}
