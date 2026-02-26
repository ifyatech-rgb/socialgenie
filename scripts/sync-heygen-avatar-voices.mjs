/**
 * Sync HeyGen avatars and their default voice IDs to heygen_avatar_cache table.
 * Run after: npx prisma db push (or migrate)
 * Usage: node scripts/sync-heygen-avatar-voices.mjs
 *
 * Requires: HEYGEN_API_KEY and DATABASE_URL in .env
 * Rate limiting: 200ms delay between each avatar; failures are non-blocking.
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const p = resolve(process.cwd(), file);
    if (!existsSync(p)) continue;
    const content = readFileSync(p, "utf8");
    content.split("\n").forEach((line) => {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+?)\s*$/);
      if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "").trim();
    });
  }
}
loadEnv();

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY?.trim();
const HEYGEN_API_URL = "https://api.heygen.com/v2";
const DELAY_BETWEEN_AVATARS_MS = 200;
const PROGRESS_LOG_EVERY = 50;

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchHeyGen(endpoint, method = "GET", body) {
  const url = `${HEYGEN_API_URL}${endpoint}`;
  const options = {
    method,
    headers: { "X-Api-Key": HEYGEN_API_KEY, "Content-Type": "application/json" },
  };
  if (body && method === "POST") options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const err = new Error(data.message || data.error || `HeyGen ${res.status}: ${text.slice(0, 200)}`);
    err.status = res.status;
    err.statusCode = res.status;
    err.response = data;
    err.body = data;
    throw err;
  }
  return data;
}

function logError(avatarId, label, e) {
  console.warn(`  [${label}] ${avatarId}`, {
    message: e?.message ?? "Unknown error",
    status: e?.status ?? e?.statusCode,
    response: e?.response ?? e?.body,
    stack: e?.stack ? e.stack.split("\n").slice(0, 3).join("\n") : undefined,
  });
}

async function main() {
  if (!HEYGEN_API_KEY) {
    console.error("HEYGEN_API_KEY not set in .env or .env.local");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL not set. Run with .env loaded.");
    process.exit(1);
  }

  const { PrismaClient } = await import("@prisma/client");
  const prisma = new PrismaClient();

  console.log("Fetching avatars from HeyGen...");
  let listData;
  try {
    listData = await fetchHeyGen("/avatars");
  } catch (e) {
    console.error("Failed to fetch avatar list:", {
      message: e?.message,
      status: e?.status ?? e?.statusCode,
      response: e?.response ?? e?.body,
    });
    process.exit(1);
  }

  const avatars = listData?.data?.avatars ?? [];
  const total = avatars.length;
  console.log(`Starting sync of ${total} avatars (${DELAY_BETWEEN_AVATARS_MS}ms delay between each)...`);

  let voicesMap = null;
  let globalFirstVoiceId = null;
  let globalFirstVoiceName = "Default";

  async function loadVoicesMap() {
    if (voicesMap) return;
    try {
      const voicesData = await fetchHeyGen("/voices");
      const list = voicesData?.data?.voices ?? [];
      voicesMap = Object.fromEntries(list.map((v) => [v.voice_id, v.display_name || v.voice_id]));
      if (list.length > 0) {
        globalFirstVoiceId = list[0].voice_id;
        globalFirstVoiceName = list[0].display_name || list[0].voice_id || "Default";
      }
    } catch (e) {
      console.warn("Could not load global voices:", e?.message);
    }
  }

  async function getVoiceName(voiceId) {
    if (!voiceId) return globalFirstVoiceName || "Default";
    await loadVoicesMap();
    return voicesMap?.[voiceId] || voiceId;
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < avatars.length; i++) {
    const avatar = avatars[i];
    const heygen_avatar_id = avatar?.avatar_id?.trim?.();

    if (!heygen_avatar_id) {
      console.warn("  [skip] Invalid avatar (no avatar_id):", avatar);
      skipped++;
      await delay(DELAY_BETWEEN_AVATARS_MS);
      continue;
    }

    try {
      const display_name = (avatar?.avatar_name || avatar?.avatar_id || "Unnamed").trim();
      const preview_url = avatar?.preview_image_url || avatar?.preview_video_url || null;
      let default_voice_id = avatar?.default_voice_id?.trim?.() || avatar?.voice_id?.trim?.() || null;

      if (!default_voice_id) {
        try {
          const details = await fetchHeyGen(`/avatar/${encodeURIComponent(heygen_avatar_id)}/details`);
          default_voice_id = details?.data?.default_voice_id?.trim?.() || null;
        } catch (e) {
          logError(heygen_avatar_id, "details failed", e);
        }
      }

      if (!default_voice_id) {
        try {
          const voicesData = await fetchHeyGen(`/avatar/${encodeURIComponent(heygen_avatar_id)}/voices`);
          const first = voicesData?.data?.voices?.[0];
          if (first?.voice_id) default_voice_id = first.voice_id.trim();
        } catch {
          // ignore
        }
      }

      if (!default_voice_id) {
        await loadVoicesMap();
        default_voice_id = globalFirstVoiceId || null;
      }
      if (!default_voice_id) {
        skipped++;
        await delay(DELAY_BETWEEN_AVATARS_MS);
        continue;
      }

      const default_voice_name = await getVoiceName(default_voice_id);
      const voice_id = default_voice_id;
      const voice_name = default_voice_name || globalFirstVoiceName || "Default";

      try {
        const existing = await prisma.heygen_avatar_cache.findUnique({
          where: { heygen_avatar_id },
        });
        if (existing) {
          await prisma.heygen_avatar_cache.update({
            where: { heygen_avatar_id },
            data: {
              display_name,
              default_voice_id: voice_id,
              default_voice_name: voice_name,
              preview_url,
            },
          });
          updated++;
        } else {
          await prisma.heygen_avatar_cache.create({
            data: {
              heygen_avatar_id,
              display_name,
              default_voice_id: voice_id,
              default_voice_name: voice_name,
              preview_url,
            },
          });
          created++;
        }
      } catch (e) {
        console.error("  [DB error]", heygen_avatar_id, {
          message: e?.message,
          stack: e?.stack ? e.stack.split("\n").slice(0, 2).join("\n") : undefined,
        });
        failed++;
      }

      if ((i + 1) % PROGRESS_LOG_EVERY === 0) {
        console.log(`  Processed ${i + 1} of ${total} avatars (created: ${created}, updated: ${updated}, skipped: ${skipped}, failed: ${failed})`);
      }
    } catch (e) {
      failed++;
      logError(heygen_avatar_id ?? avatar?.avatar_id ?? "?", "avatar loop error", e);
    }
    await delay(DELAY_BETWEEN_AVATARS_MS);
  }

  const success = created + updated;
  console.log(`Sync complete: ${success} success, ${failed} failed, ${skipped} skipped out of ${total} total`);
  console.log(`  Created: ${created}, Updated: ${updated}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("Fatal error:", {
    message: e?.message,
    stack: e?.stack,
  });
  process.exit(1);
});
