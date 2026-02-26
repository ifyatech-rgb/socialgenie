/**
 * Sync HeyGen avatars and their default voice IDs to heygen_avatar_cache.
 * Used by cron /api/cron/sync-heygen-avatars and can be called from scripts.
 * Rate limiting: 200ms between avatars; failures are non-blocking.
 */

import { prisma } from "@/lib/prisma";

const HEYGEN_API_URL = "https://api.heygen.com/v2";
const DELAY_BETWEEN_AVATARS_MS = 200;
const PROGRESS_LOG_EVERY = 50;

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchHeyGen(
  endpoint: string,
  method: "GET" | "POST" = "GET",
  body?: unknown
): Promise<Record<string, unknown>> {
  const apiKey = process.env.HEYGEN_API_KEY?.trim();
  if (!apiKey) throw new Error("HEYGEN_API_KEY not set");

  const url = `${HEYGEN_API_URL}${endpoint}`;
  const options: RequestInit = {
    method,
    headers: { "X-Api-Key": apiKey, "Content-Type": "application/json" },
  };
  if (body && method === "POST") options.body = JSON.stringify(body);
  const res = await fetch(url, options);
  const text = await res.text();
  const data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  if (!res.ok) {
    const err = new Error(
      (data.message as string) || (data.error as string) || `HeyGen ${res.status}: ${text.slice(0, 200)}`
    ) as Error & { status?: number; statusCode?: number; response?: unknown; body?: unknown };
    err.status = res.status;
    err.statusCode = res.status;
    err.response = data;
    err.body = data;
    throw err;
  }
  return data;
}

export interface SyncHeyGenAvatarsResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
}

export async function syncHeyGenAvatars(): Promise<SyncHeyGenAvatarsResult> {
  const apiKey = process.env.HEYGEN_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("HEYGEN_API_KEY not set");
  }

  let listData: Record<string, unknown>;
  try {
    listData = await fetchHeyGen("/avatars");
  } catch (e) {
    const err = e as Error & { status?: number; response?: unknown };
    console.error("Failed to fetch avatar list:", {
      message: err?.message,
      status: err?.status,
      response: err?.response,
    });
    throw e;
  }

  const avatars = (listData?.data as { avatars?: Array<Record<string, unknown>> })?.avatars ?? [];
  const total = avatars.length;
  console.log(`[sync-heygen-avatars] Starting sync of ${total} avatars (${DELAY_BETWEEN_AVATARS_MS}ms delay between each)...`);

  let voicesMap: Record<string, string> | null = null;
  let globalFirstVoiceId: string | null = null;
  let globalFirstVoiceName = "Default";

  async function loadVoicesMap(): Promise<void> {
    if (voicesMap) return;
    try {
      const voicesData = await fetchHeyGen("/voices");
      const list = (voicesData?.data as { voices?: Array<{ voice_id: string; display_name?: string }> })?.voices ?? [];
      voicesMap = Object.fromEntries(list.map((v) => [v.voice_id, v.display_name || v.voice_id]));
      if (list.length > 0) {
        globalFirstVoiceId = list[0].voice_id;
        globalFirstVoiceName = list[0].display_name || list[0].voice_id || "Default";
      }
    } catch (e) {
      console.warn("[sync-heygen-avatars] Could not load global voices:", (e as Error)?.message);
    }
  }

  async function getVoiceName(voiceId: string | null): Promise<string> {
    if (!voiceId) return globalFirstVoiceName || "Default";
    await loadVoicesMap();
    return voicesMap?.[voiceId] ?? voiceId;
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < avatars.length; i++) {
    const avatar = avatars[i];
    const heygen_avatar_id = (avatar?.avatar_id as string)?.trim?.();

    if (!heygen_avatar_id) {
      console.warn("  [skip] Invalid avatar (no avatar_id):", avatar);
      skipped++;
      await delay(DELAY_BETWEEN_AVATARS_MS);
      continue;
    }

    try {
      const display_name = ((avatar?.avatar_name as string) || (avatar?.avatar_id as string) || "Unnamed").trim();
      const preview_url = ((avatar?.preview_image_url as string) || (avatar?.preview_video_url as string) || null) as string | null;
      let default_voice_id: string | null = ((avatar?.default_voice_id as string)?.trim?.() || (avatar?.voice_id as string)?.trim?.() || null) as string | null;

      if (!default_voice_id) {
        try {
          const details = await fetchHeyGen(`/avatar/${encodeURIComponent(heygen_avatar_id)}/details`);
          default_voice_id = ((details?.data as { default_voice_id?: string })?.default_voice_id?.trim?.() || null) as string | null;
        } catch (e) {
          console.warn(`  [details failed] ${heygen_avatar_id}`, (e as Error)?.message);
        }
      }

      if (!default_voice_id) {
        try {
          const voicesData = await fetchHeyGen(`/avatar/${encodeURIComponent(heygen_avatar_id)}/voices`);
          const voices = (voicesData?.data as { voices?: Array<{ voice_id: string }> })?.voices ?? [];
          const first = voices[0];
          if (first?.voice_id) default_voice_id = first.voice_id.trim();
        } catch {
          // ignore
        }
      }

      if (!default_voice_id) {
        await loadVoicesMap();
        default_voice_id = globalFirstVoiceId;
      }
      if (!default_voice_id) {
        skipped++;
        await delay(DELAY_BETWEEN_AVATARS_MS);
        continue;
      }

      const default_voice_name = await getVoiceName(default_voice_id);
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
              default_voice_id,
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
              default_voice_id,
              default_voice_name: voice_name,
              preview_url,
            },
          });
          created++;
        }
      } catch (e) {
        console.error("  [DB error]", heygen_avatar_id, (e as Error)?.message);
        failed++;
      }

      if ((i + 1) % PROGRESS_LOG_EVERY === 0) {
        console.log(`  [sync-heygen-avatars] Processed ${i + 1}/${total} (created: ${created}, updated: ${updated}, skipped: ${skipped}, failed: ${failed})`);
      }
    } catch (e) {
      failed++;
      console.warn(`  [avatar loop error] ${heygen_avatar_id ?? (avatar?.avatar_id as string) ?? "?"}`, (e as Error)?.message);
    }
    await delay(DELAY_BETWEEN_AVATARS_MS);
  }

  console.log(`[sync-heygen-avatars] Complete: ${created + updated} success, ${failed} failed, ${skipped} skipped out of ${total} total`);
  return { total, created, updated, skipped, failed };
}
