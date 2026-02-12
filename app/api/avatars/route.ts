import { NextRequest, NextResponse } from "next/server";
import { getAuthUserEmail } from "@/lib/auth";
import { getHeyGenClient } from "@/lib/heygenClient";

export const dynamic = "force-dynamic";

/** Allowed avatar types: only lifestyle, UGC, and community (no studio/premium/professional). */
const ALLOWED_TYPES = ["lifestyle", "ugc", "community"];

/**
 * GET /api/avatars
 * Returns HeyGen avatars filtered to lifestyle, UGC, and community only.
 * Optional query: ?types=lifestyle,ugc,community (default)
 */
export async function GET(request: NextRequest) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const typesParam = request.nextUrl.searchParams.get("types");
    const requestedTypes = typesParam
      ? typesParam.split(",").map((t) => t.trim().toLowerCase())
      : ALLOWED_TYPES;
    const allowedSet = new Set(
      requestedTypes.length > 0 ? requestedTypes : ALLOWED_TYPES
    );

    const heygen = getHeyGenClient();
    const [publicList, customResult] = await Promise.all([
      heygen.getAvatars({ freeOnly: false }),
      heygen.getCustomAvatars(),
    ]);

    const customAvatars = customResult.success ? customResult.avatars : [];
    const customFormatted = customAvatars.map((a) => ({
      id: a.id,
      name: a.name,
      type: "custom",
      gender: "unknown",
      preview_image_url: a.preview || a.videoPreview,
      preview_video_url: a.videoPreview,
      isCustom: true,
    }));

    const publicFormatted = publicList
      .filter((a) => allowedSet.has(a.category?.toLowerCase() ?? "lifestyle"))
      .map((a) => ({
        id: a.id,
        name: a.name,
        type: a.category ?? "lifestyle",
        gender: a.gender ?? "unknown",
        preview_image_url: a.preview || a.imagePreview,
        preview_video_url: a.videoPreview,
        isCustom: false,
      }));

    const avatars = [...customFormatted, ...publicFormatted];

    return NextResponse.json({
      success: true,
      avatars,
      count: avatars.length,
    });
  } catch (error) {
    console.error("[API Avatars] Failed:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch avatars" },
      { status: 500 }
    );
  }
}
