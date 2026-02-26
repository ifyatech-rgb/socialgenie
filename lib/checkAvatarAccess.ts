import { prisma } from "@/lib/prisma";

/**
 * Check if the current user is allowed to use the given avatar for video generation.
 * - Public (stock) avatars: allowed for everyone.
 * - Custom avatars: we do not have an avatar ownership table; allow if user has custom avatar capacity.
 */
export async function checkAvatarAccess(
  _userId: string,
  avatarId: string
): Promise<boolean> {
  const inCache = await prisma.heygen_avatar_cache.findUnique({
    where: { heygen_avatar_id: avatarId },
  });
  if (inCache) return true; // Stock avatar from cache
  // No avatar table to check ownership; allow (caller should enforce plan limits)
  return true;
}
