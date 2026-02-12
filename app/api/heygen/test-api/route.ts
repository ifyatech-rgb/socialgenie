import { NextResponse } from "next/server";
import { getHeyGenClient } from "@/lib/heygenClient";

export const dynamic = "force-dynamic";

/** GET /api/heygen/test-api - Test HeyGen API key and connectivity. Check server logs for details. */
export async function GET() {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🧪 HEYGEN API CONNECTION TEST");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const apiKey = process.env.HEYGEN_API_KEY;
  const apiKeyExists = !!apiKey;
  const apiKeyPrefix = apiKey ? apiKey.substring(0, 10) + "..." : "";

  const results: { test: string; ok: boolean; message?: string }[] = [];

  if (!apiKey) {
    console.log("❌ HEYGEN_API_KEY is not set");
    return NextResponse.json({
      message: "Check server console for test results",
      apiKeyExists: false,
      results: [{ test: "API Key", ok: false, message: "HEYGEN_API_KEY not set" }],
    });
  }

  console.log("✅ API Key present:", apiKeyPrefix);

  try {
    const heygen = getHeyGenClient();

    console.log("\n📡 Test 1: Fetching avatars list...");
    try {
      const avatars = await heygen.getAvatars();
      const count = Array.isArray(avatars) ? avatars.length : 0;
      console.log("✅ Avatars fetched:", count);
      results.push({ test: "List avatars", ok: true, message: `Fetched ${count} avatars` });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("❌ Avatars fetch failed:", msg);
      results.push({ test: "List avatars", ok: false, message: msg });
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
    results.push({
      test: "HeyGen client",
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  return NextResponse.json({
    message: "Check server console for full test results",
    apiKeyExists,
    apiKeyPrefix,
    results,
  });
}
