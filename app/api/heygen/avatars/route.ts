import { NextRequest, NextResponse } from "next/server";
import { getAuthUserEmail } from "@/lib/auth";
import { getHeyGenClient } from "@/lib/heygenClient";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour - aggressive cache for fast repeat loads
const HEYGEN_FETCH_TIMEOUT_MS = 20_000; // 20s - avoid intermittent timeouts
const HEYGEN_FETCH_RETRIES = 3;
const HEYGEN_FETCH_RETRY_DELAY_MS = 1000;

/** Cache public (stock) avatars only; custom avatars are user-specific and not cached. */
let cachePublicFree: { list: Awaited<ReturnType<ReturnType<typeof getHeyGenClient>["getAvatars"]>>; time: number } | null = null;
let cachePublicAll: { list: Awaited<ReturnType<ReturnType<typeof getHeyGenClient>["getAvatars"]>>; time: number } | null = null;

/** Stale fallback: last successful full API response (avatars + grouped) for when HeyGen fails. */
let staleFullResponse: { data: Awaited<ReturnType<typeof buildAvatarResponse>>; time: number } | null = null;

async function buildAvatarResponse(
  freeOnly: boolean,
  allowedCustomIds: Set<string>
) {
  const heygen = getHeyGenClient();
  const now = Date.now();
  const publicCache = freeOnly ? cachePublicFree : cachePublicAll;
  const publicList =
    publicCache && now - publicCache.time < CACHE_DURATION_MS
      ? publicCache.list
      : await heygen.getAvatars({ freeOnly });
  if (!publicCache || now - publicCache.time >= CACHE_DURATION_MS) {
    if (freeOnly) cachePublicFree = { list: publicList, time: now };
    else cachePublicAll = { list: publicList, time: now };
  }

  const customResult = await heygen.getCustomAvatars();
  const allCustomFromHeyGen = customResult.success ? customResult.avatars : [];
  const customAvatars = allCustomFromHeyGen.filter((a) => allowedCustomIds.has(a.id));

  const ugcResult = await heygen.getUgcAvatars();
  const ugcFromList = ugcResult.success ? ugcResult.avatars : [];
  const ugcIds = new Set(publicList.filter((a) => a.avatarType === "ugc").map((a) => a.id));
  ugcFromList.forEach((u) => ugcIds.add(u.id));

  const customFormatted = customAvatars.map((a) => ({
    id: a.id,
    name: a.name,
    preview: a.preview || a.videoPreview,
    thumbnail: a.preview || a.videoPreview,
    gender: "unknown" as const,
    style: "normal" as const,
    isPaid: false,
    isPublic: false,
    isCustom: true,
    category: "custom" as const,
    aspectRatio: "9:16" as const,
    width: 1080,
    height: 1920,
    avatarType: "custom" as const,
  }));

  const publicFormatted = publicList.map((a) => {
    const imagePreview = (a as { imagePreview?: string }).imagePreview;
    const isTalkingPhoto = (a as { isTalkingPhoto?: boolean }).isTalkingPhoto;
    return {
    id: a.id,
    name: a.name,
    preview: a.preview || a.videoPreview,
    thumbnail: imagePreview || a.videoPreview || a.preview,
    gender: (a.gender ?? "unknown") as string,
    style: (a.style ?? "normal") as string,
    isPaid: a.isPaid,
    isPublic: a.isPublic,
    isCustom: false,
    category: (a.category ?? "lifestyle") as string,
    aspectRatio: (a.aspectRatio ?? "9:16") as string,
    width: a.width ?? 1080,
    height: a.height ?? 1920,
    avatarType: (a.avatarType ?? "public") as "public" | "ugc",
    ...(isTalkingPhoto && { isTalkingPhoto: true }),
  };
  });

  const ugcFromApiOnly = ugcFromList.filter((u) => !ugcIds.has(u.id));
  const ugcFormatted = ugcFromApiOnly.map((a) => ({
    id: a.id,
    name: a.name,
    preview: a.preview || a.videoPreview,
    thumbnail: a.preview || a.videoPreview,
    gender: "unknown" as const,
    style: "normal" as const,
    isPaid: false,
    isPublic: true,
    isCustom: false,
    category: "ugc" as const,
    aspectRatio: "9:16" as const,
    width: 1080,
    height: 1920,
    avatarType: "ugc" as const,
  }));

  let formatted = [...customFormatted, ...publicFormatted, ...ugcFormatted];

  // Only show avatars that have a valid voice in heygen_avatar_cache (so video generation works)
  try {
    const cachedRows = await prisma.heygen_avatar_cache.findMany({
      where: { default_voice_id: { not: "" } },
      select: { heygen_avatar_id: true },
    });
    const cachedIds = new Set(cachedRows.map((r) => r.heygen_avatar_id));
    formatted = formatted.filter((a) => (a as { isCustom?: boolean }).isCustom === true || cachedIds.has(a.id));
  } catch (e) {
    console.warn("[Avatars API] Could not filter by cache, returning all:", (e as Error)?.message);
  }

  const ugcInPublic = publicFormatted.filter((a) => a.avatarType === "ugc").length;
  const publicStockCount = publicFormatted.length - ugcInPublic;
  const totalUgc = ugcInPublic + ugcFormatted.length;

  const grouped = groupAvatarsByCharacter(formatted);

  console.log(
    "[Avatars API] Sync: custom=",
    customFormatted.length,
    "public/stock=",
    publicStockCount,
    "ugc(total)=",
    totalUgc,
    "groups=",
    grouped.length,
    "total avatars (filtered by cache)=",
    formatted.length
  );

  return {
    success: true as const,
    avatars: formatted,
    grouped,
    count: formatted.length,
    groupCount: grouped.length,
    customCount: customFormatted.length,
    publicCount: publicFormatted.length + ugcFormatted.length,
    filtered: freeOnly,
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("Avatars request timed out")), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

type FormattedAvatar = {
  id: string;
  name: string;
  preview?: string | null;
  thumbnail?: string | null;
  gender?: string;
  avatarType?: string;
  [key: string]: unknown;
};

function getBaseNameFromName(name: string): string {
  const first = (name ?? "").trim().split(/\s+/)[0];
  return first || "Other";
}

function groupAvatarsByCharacter(avatars: FormattedAvatar[]): {
  name: string;
  count: number;
  primaryAvatar: FormattedAvatar;
  avatars: FormattedAvatar[];
}[] {
  const map = new Map<
    string,
    { avatars: FormattedAvatar[]; primaryAvatar: FormattedAvatar | null }
  >();
  for (const a of avatars) {
    const base = getBaseNameFromName(a.name);
    let entry = map.get(base);
    if (!entry) {
      entry = { avatars: [], primaryAvatar: null };
      map.set(base, entry);
    }
    entry.avatars.push(a);
    if (!entry.primaryAvatar) entry.primaryAvatar = a;
    else if (
      a.name.toLowerCase().includes("default") ||
      a.name.toLowerCase().includes("casual")
    ) {
      entry.primaryAvatar = a;
    }
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, { avatars: list, primaryAvatar }]) => ({
      name,
      count: list.length,
      primaryAvatar: primaryAvatar ?? list[0],
      avatars: list.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")),
    }));
}


export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const showAll = url.searchParams.get("all") === "true";
  const freeOnly = url.searchParams.get("free") !== "false" && !showAll;

  const envKey = process.env.HEYGEN_API_KEY?.trim();
  if (!envKey) {
    return NextResponse.json(
      {
        success: true,
        avatars: [],
        count: 0,
        customCount: 0,
        publicCount: 0,
        filtered: freeOnly,
        warning: "Video service is not configured. Please contact support or try again later.",
        error: "missing_api_key",
      },
      { status: 200 }
    );
  }

  let dbWarning: string | undefined;
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const emailNormalized = email.trim().toLowerCase();
    let allowedCustomIds = new Set<string>();

    try {
      const user = await prisma.users.findUnique({
        where: { email: emailNormalized },
        select: { id: true },
      });
      if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
      // Custom avatar IDs from DB can be added here when avatar table exists.
    } catch (dbError) {
      console.warn("[Avatars API] Database unreachable, loading public/UGC avatars only:", dbError);
      dbWarning = "Database temporarily unavailable. Showing public and UGC avatars only.";
    }

    let data: Awaited<ReturnType<typeof buildAvatarResponse>> | null = null;
    for (let attempt = 0; attempt < HEYGEN_FETCH_RETRIES; attempt++) {
      try {
        const result = await withTimeout(
          buildAvatarResponse(freeOnly, allowedCustomIds),
          HEYGEN_FETCH_TIMEOUT_MS
        );
        data = result;
        staleFullResponse = { data: result, time: Date.now() };
        break;
      } catch (err) {
        if (attempt === HEYGEN_FETCH_RETRIES - 1) throw err;
        await new Promise((r) => setTimeout(r, HEYGEN_FETCH_RETRY_DELAY_MS));
      }
    }
    if (!data) throw new Error("Avatars fetch failed after retries");

    const json = {
      ...data,
      cached: false,
      ...(dbWarning && { warning: dbWarning }),
    };
    const res = NextResponse.json(json);
    res.headers.set("Cache-Control", "private, s-maxage=3600, stale-while-revalidate=86400");
    return res;
  } catch (error) {
    console.error("[Avatars API] Failed:", error);
    if (staleFullResponse?.data) {
      console.log("[Avatars API] Returning stale cache after error");
      const res = NextResponse.json({
        ...staleFullResponse.data,
        cached: true,
        warning: "Avatars loaded from cache. Some data may be outdated.",
      });
      res.headers.set("Cache-Control", "private, s-maxage=60, stale-while-revalidate=300");
      return res;
    }
    return NextResponse.json(
      {
        success: true,
        avatars: [],
        count: 0,
        customCount: 0,
        publicCount: 0,
        filtered: true,
        warning: "Unable to load avatars. Please refresh the page or try again later.",
        error: "fetch_failed",
      },
      { status: 200 }
    );
  }
}
