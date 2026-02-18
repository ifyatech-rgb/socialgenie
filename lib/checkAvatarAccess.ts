import { prisma } from "@/lib/prisma";

/**
 * Check if the current user is allowed to use the given avatar for video generation.
 * - Public (stock) avatars: allowed for everyone.
 * - Custom avatars: only the owner (userId in our DB) may use them.
 */
export async function checkAvatarAccess(
  userId: string,
  avatarId: string
): Promise<boolean> {
  const owner = await prisma.avatar.findFirst({
    where: { heygenAvatarId: avatarId },
    select: { userId: true },
  });
  if (!owner) return true; // Not in our DB => treat as public avatar
  return owner.userId === userId;
}
