/**
 * Resolve real HeyGen voice_id and display name for an avatar.
 * Never use "Default Voice" as voice_id — always resolve to a real HeyGen ID from cache or API.
 */

import { prisma } from "@/lib/prisma";
import { getHeyGenClient } from "@/lib/heygenClient";

const INVALID_VOICE_LABELS = new Set(["default voice", "default"]);
function isInvalidVoiceId(voiceId: string | undefined | null, avatarId: string): boolean {
  if (!voiceId || typeof voiceId !== "string" || !voiceId.trim()) return true;
  const v = voiceId.trim().toLowerCase();
  if (INVALID_VOICE_LABELS.has(v)) return true;
  if (v === avatarId.trim().toLowerCase()) return true;
  return false;
}

/**
 * Returns true if the given voiceId must not be sent to HeyGen (display label or invalid).
 */
export function isInvalidOrPlaceholderVoiceId(voiceId: string | undefined | null, avatarId: string): boolean {
  return isInvalidVoiceId(voiceId, avatarId);
}

export interface ResolvedAvatarVoice {
  voice_id: string;
  voice_name: string;
}

/**
 * Get the real HeyGen default voice_id and name for an avatar from synced heygen_avatar_cache only.
 * Only avatars with a valid voice in the cache can be used for video generation.
 */
export async function getDefaultVoiceForAvatar(avatarId: string): Promise<ResolvedAvatarVoice | null> {
  if (!avatarId?.trim()) return null;

  const id = avatarId.trim();

  try {
    const cached = await prisma.heygen_avatar_cache.findFirst({
      where: { heygen_avatar_id: id },
      select: { default_voice_id: true, default_voice_name: true },
    });
    if (cached?.default_voice_id) {
      return {
        voice_id: cached.default_voice_id,
        voice_name: cached.default_voice_name || "Default",
      };
    }
  } catch {
    // DB may fail
  }

  return null;
}

/**
 * Get avatar + voice from synced cache for video generation. Returns null if not in cache or no voice.
 * Tries by heygen_avatar_id first, then by display_name (e.g. "Aiden") so lookup works even when
 * frontend sends avatar name instead of HeyGen avatar ID.
 */
export async function getAvatarVoiceFromCache(
  selectedAvatarId: string,
  avatarName?: string | null
): Promise<{
  heygen_avatar_id: string;
  default_voice_id: string;
  default_voice_name: string;
} | null> {
  const id = selectedAvatarId?.trim();
  if (!id && !avatarName?.trim()) return null;
  try {
    const name = avatarName?.trim();
    const where =
      id && name
        ? { OR: [{ heygen_avatar_id: id }, { display_name: { contains: name, mode: "insensitive" as const } }] }
        : id
          ? { heygen_avatar_id: id }
          : name
            ? { display_name: { contains: name, mode: "insensitive" as const } }
            : null;
    if (!where) return null;
    const row = await prisma.heygen_avatar_cache.findFirst({
      where,
      select: { heygen_avatar_id: true, default_voice_id: true, default_voice_name: true },
    });
    if (row?.default_voice_id) {
      return {
        heygen_avatar_id: row.heygen_avatar_id,
        default_voice_id: row.default_voice_id,
        default_voice_name: row.default_voice_name || "Default",
      };
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Resolve voice_id for video generation: if request voice is invalid/placeholder, use avatar default.
 * Returns null if no valid voice can be resolved.
 */
export async function resolveVoiceIdForGeneration(
  avatarId: string,
  requestVoiceId: string | undefined | null
): Promise<ResolvedAvatarVoice | null> {
  if (!avatarId?.trim()) return null;

  const validRequest =
    requestVoiceId &&
    typeof requestVoiceId === "string" &&
    requestVoiceId.trim() &&
    !isInvalidVoiceId(requestVoiceId, avatarId);

  if (validRequest) {
    const heygen = getHeyGenClient();
    const validVoices = await heygen.getVoicesForAvatar(avatarId);
    const match = validVoices.find((v) => v.voice_id === requestVoiceId.trim());
    if (match) {
      return {
        voice_id: match.voice_id,
        voice_name: match.display_name ?? match.voice_id,
      };
    }
  }

  return getDefaultVoiceForAvatar(avatarId);
}
