import { NextRequest, NextResponse } from "next/server";
import { syncHeyGenAvatars } from "@/lib/sync-heygen-avatars";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min for many avatars with delays

/**
 * GET/POST /api/cron/sync-heygen-avatars
 * Runs HeyGen avatar+voice sync. Call daily (e.g. 2am) via Vercel Cron or external cron.
 * Secured by CRON_SECRET: pass ?secret=CRON_SECRET or header Authorization: Bearer CRON_SECRET or x-cron-secret: CRON_SECRET
 */
async function runSync(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  const urlSecret = request.nextUrl.searchParams.get("secret");
  const headerSecret = request.headers.get("x-cron-secret");

  if (secret && secret.length > 0) {
    const bearerMatch = authHeader === `Bearer ${secret}`;
    const provided = urlSecret || headerSecret;
    if (!bearerMatch && provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (!process.env.HEYGEN_API_KEY?.trim()) {
    return NextResponse.json(
      { error: "HEYGEN_API_KEY not set" },
      { status: 500 }
    );
  }

  try {
    const result = await syncHeyGenAvatars();
    return NextResponse.json({
      success: true,
      message: "Avatar sync completed",
      ...result,
    });
  } catch (error) {
    console.error("[cron/sync-heygen-avatars] Sync failed:", error);
    return NextResponse.json(
      {
        error: "Sync failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return runSync(request);
}

export async function POST(request: NextRequest) {
  return runSync(request);
}
