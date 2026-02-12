import { NextRequest, NextResponse } from "next/server";
import { getAuthUserEmail } from "@/lib/auth";
import { getHeyGenClient } from "@/lib/heygenClient";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const email = await getAuthUserEmail(request);
    if (!email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const avatarId = searchParams.get("avatarId");

    if (!avatarId) {
      return NextResponse.json({ error: "Missing avatar ID" }, { status: 400 });
    }

    const heygen = getHeyGenClient();
    const result = await heygen.getAvatarCreationStatus(avatarId);

    if (!result.success) {
      return NextResponse.json(
        { error: "status_check_failed", message: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      status: result.status,
      progress: result.progress,
      avatar: result.avatar,
    });
  } catch (error) {
    console.error("[HeyGen avatar-status]", error);
    return NextResponse.json(
      { error: "server_error", message: error instanceof Error ? error.message : "Failed to get status" },
      { status: 500 }
    );
  }
}
