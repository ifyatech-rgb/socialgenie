import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserEmail } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/dashboard
 * Fetch all dashboard data for the current user (Prisma + optional Supabase credits sync)
 */
export async function GET(request: NextRequest) {
  try {
    const userEmail = await getAuthUserEmail(request);
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { subscriptions: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const subscription = user.subscriptions
      ? {
          status: user.subscriptions.status,
          duplicatePaymentMethod: user.subscriptions.duplicatePaymentMethod ?? false,
          trialEndsAt: user.subscriptions.trialEndsAt?.toISOString() ?? null,
        }
      : null;

    // Credits: prefer Prisma (source of truth). Use Supabase only if Prisma has no value.
    let credits = user.credits != null ? user.credits : 0;
    if (credits === 0) {
      try {
        const { createAdminClient } = await import('@/lib/supabase/server');
        const supabase = createAdminClient();
        const { data } = await supabase
          .from('profiles')
          .select('credits')
          .eq('email', user.email)
          .maybeSingle();
        const profile = data as { credits?: number | null } | null;
        if (profile?.credits != null && typeof profile.credits === 'number') {
          credits = profile.credits;
        }
      } catch {
        // keep Prisma value
      }
    }

    const hasTrainingVideo = !!(user.avatarUrl && user.avatarStatus === 'ready');
    const userId = user.id;

    // Run independent queries in parallel for faster response
    const [scriptsCount, videosCount, recentScripts, recentVideos] = await Promise.all([
      prisma.script.count({ where: { userId } }),
      prisma.script.count({
        where: { userId, generatedVideoUrl: { not: null } },
      }),
      prisma.script.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, topic: true, platform: true, createdAt: true },
      }),
      prisma.script.findMany({
        where: { userId, generatedVideoUrl: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: {
          id: true,
          topic: true,
          platform: true,
          generatedVideoUrl: true,
          createdAt: true,
          length: true,
        },
      }),
    ]);

    return NextResponse.json({
      hasTrainingVideo,
      trainingVideoUrl: user.avatarUrl,
      avatarStatus: user.avatarStatus ?? null,
      scriptsCount,
      videosCount,
      credits,
      subscription,
      recentScripts: recentScripts.map(s => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
      })),
      recentVideos: recentVideos.map(s => ({
        id: s.id,
        topic: s.topic,
        platform: s.platform,
        generatedVideoUrl: s.generatedVideoUrl,
        createdAt: s.createdAt.toISOString(),
        length: s.length,
      })),
    });

  } catch (error) {
    console.error('[Dashboard] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
