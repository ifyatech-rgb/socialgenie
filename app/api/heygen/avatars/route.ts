import { NextRequest, NextResponse } from "next/server";
import { getAuthUserEmail } from "@/lib/auth";
import { getHeyGenClient } from "@/lib/heygenClient";

export const dynamic = "force-dynamic";

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
let cacheFree: { data: { success: true; avatars: unknown[]; count: number; customCount: number; publicCount: number; filtered: boolean }; time: number } | null = null;
let cacheAll: { data: { success: true; avatars: unknown[]; count: number; customCount: number; publicCount: number; filtered: boolean }; time: number } | null = null;

async function buildAvatarResponse(freeOnly: boolean) {
  const heygen = getHeyGenClient();
  const [publicList, customResult] = await Promise.all([
    heygen.getAvatars({ freeOnly }),
    heygen.getCustomAvatars(),
  ]);
  const customAvatars = customResult.success ? customResult.avatars : [];
  const customFormatted = customAvatars.map((a) => ({
    id: a.id,
    name: a.name,
    preview: a.preview || a.videoPreview,
    thumbnail: a.videoPreview,
    gender: "unknown",
    style: "normal",
    isPaid: false,
    isPublic: true,
    isCustom: true,
    category: "custom",
    aspectRatio: "9:16",
    width: 1080,
    height: 1920,
  }));
  const publicFormatted = publicList.map((a) => ({
    id: a.id,
    name: a.name,
    preview: a.preview || a.videoPreview,
    thumbnail: a.videoPreview,
    gender: a.gender ?? "unknown",
    style: a.style ?? "normal",
    isPaid: a.isPaid,
    isPublic: a.isPublic,
    isCustom: false,
    category: a.category ?? "lifestyle",
    aspectRatio: a.aspectRatio ?? "9:16",
    width: a.width ?? 1080,
    height: a.height ?? 1920,
  }));
  const formatted = [...customFormatted, ...publicFormatted];
  return {
    success: true as const,
    avatars: formatted,
    count: formatted.length,
    customCount: customFormatted.length,
    publicCount: publicFormatted.length,
    filtered: freeOnly,
  };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const showAll = url.searchParams.get("all") === "true";
  const freeOnly = url.searchParams.get("free") !== "false" && !showAll;

  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const now = Date.now();
    const cache = freeOnly ? cacheFree : cacheAll;

    if (cache && now - cache.time < CACHE_DURATION_MS) {
      return NextResponse.json({ ...cache.data, cached: true });
    }

    const data = await buildAvatarResponse(freeOnly);

    if (freeOnly) {
      cacheFree = { data, time: now };
    } else {
      cacheAll = { data, time: now };
    }

    return NextResponse.json({ ...data, cached: false });
  } catch (error) {
    console.error("[HeyGen Avatars] Failed:", error);
    const fallback = freeOnly ? cacheFree : cacheAll;
    if (fallback) {
      return NextResponse.json({ ...fallback.data, cached: true, stale: true });
    }
    return NextResponse.json({ error: "fetch_failed", message: String(error) }, { status: 500 });
  }
}
