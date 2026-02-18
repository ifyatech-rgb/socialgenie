import { NextRequest, NextResponse } from "next/server";
import { getAuthUserEmail } from "@/lib/auth";
import { getHeyGenClient } from "@/lib/heygenClient";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes
/** Cache public (stock) avatars only; custom avatars are user-specific and not cached. */
let cachePublicFree: { list: Awaited<ReturnType<ReturnType<typeof getHeyGenClient>["getAvatars"]>>; time: number } | null = null;
let cachePublicAll: { list: Awaited<ReturnType<ReturnType<typeof getHeyGenClient>["getAvatars"]>>; time: number } | null = null;

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
    thumbnail: a.videoPreview,
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

  const publicFormatted = publicList.map((a) => ({
    id: a.id,
    name: a.name,
    preview: a.preview || a.videoPreview,
    thumbnail: a.videoPreview,
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
  }));

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

  const formatted = [...customFormatted, ...publicFormatted, ...ugcFormatted];
  const ugcInPublic = publicFormatted.filter((a) => a.avatarType === "ugc").length;
  const publicStockCount = publicFormatted.length - ugcInPublic;
  const totalUgc = ugcInPublic + ugcFormatted.length;

  console.log(
    "[HeyGen Avatars API] Sync: custom=",
    customFormatted.length,
    "public/stock=",
    publicStockCount,
    "ugc(total)=",
    totalUgc,
    "ugc_from_list.get=",
    ugcFormatted.length,
    "total avatars=",
    formatted.length
  );

  return {
    success: true as const,
    avatars: formatted,
    count: formatted.length,
    customCount: customFormatted.length,
    publicCount: publicFormatted.length + ugcFormatted.length,
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

    const emailNormalized = email.trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { email: emailNormalized },
      select: { id: true, customAvatarIds: true },
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const dbCustomIds = await prisma.avatar
      .findMany({
        where: { userId: user.id },
        select: { heygenAvatarId: true },
      })
      .then((rows) => rows.map((r) => r.heygenAvatarId).filter(Boolean) as string[]);
    const jsonIds = Array.isArray(user.customAvatarIds) ? (user.customAvatarIds as string[]) : [];
    const allowedCustomIds = new Set<string>([...dbCustomIds, ...jsonIds]);

    const data = await buildAvatarResponse(freeOnly, allowedCustomIds);

    return NextResponse.json({ ...data, cached: false });
  } catch (error) {
    console.error("[HeyGen Avatars] Failed:", error);
    return NextResponse.json({ error: "fetch_failed", message: String(error) }, { status: 500 });
  }
}
