import { NextRequest, NextResponse } from "next/server";
import { getAuthUserEmail } from "@/lib/auth";
import { getHeyGenClient } from "@/lib/heygenClient";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(request.url);
    const showAll = url.searchParams.get("all") === "true";
    const freeOnly = url.searchParams.get("free") !== "false" && !showAll;
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

    return NextResponse.json({
      success: true,
      avatars: formatted,
      count: formatted.length,
      customCount: customFormatted.length,
      publicCount: publicFormatted.length,
      filtered: freeOnly,
    });
  } catch (error) {
    console.error("[HeyGen Avatars] Failed:", error);
    return NextResponse.json({ error: "fetch_failed", message: String(error) }, { status: 500 });
  }
}
