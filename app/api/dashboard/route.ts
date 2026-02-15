import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserEmail, getSessionForRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const CACHE_DURATION_MS = 30_000; // 30 seconds
const dashboardCache = new Map<string, { data: object; cacheTime: number }>();

/**
 * GET /api/dashboard
 * Fetch all dashboard data for the current user. Credits from Prisma only (single source of truth).
 * Responses are cached per user for 30s to reduce load.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionForRequest(request);
    const userEmail = await getAuthUserEmail(request);
    if (!session?.user && !userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Resolve user: prefer session.user.id (logged-in user) so dashboard and sidebar always show same user
    const userIdFromSession = session?.user?.id ?? null;
    const emailNormalized = userEmail?.trim().toLowerCase() || undefined;
    let user =
      userIdFromSession
        ? await prisma.user.findUnique({
            where: { id: userIdFromSession },
            include: { subscriptions: true },
          })
        : null;
    if (!user && emailNormalized) {
      user = await prisma.user.findUnique({
        where: { email: emailNormalized },
        include: { subscriptions: true },
      });
    }
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const cached = dashboardCache.get(user.id);
    if (cached && Date.now() - cached.cacheTime < CACHE_DURATION_MS) {
      return NextResponse.json({ ...cached.data, cached: true });
    }

    const subscription = user.subscriptions
      ? {
          status: user.subscriptions.status,
          duplicatePaymentMethod: user.subscriptions.duplicatePaymentMethod ?? false,
          trialEndsAt: user.subscriptions.trialEndsAt?.toISOString() ?? null,
        }
      : null;

    // Credits: use only Prisma (single source of truth). Do not sync from Supabase to avoid dashboard/sidebar mismatch.
    const videoCreditsDb = user.videoCredits ?? 0;
    const genieEditsDb = user.genieEdits ?? 0;
    const creditsLegacy = user.credits ?? user.videoCredits ?? 0;

    const hasTrainingVideo = !!(user.avatarUrl && user.avatarStatus === 'ready');
    const userId = user.id;

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    // Run all queries in parallel (dashboard + activity in one round-trip)
    const [
      scriptsCount,
      draftScriptsCount,
      finalizedScriptsCount,
      videosCount,
      scriptsThisWeek,
      videosThisWeek,
      recentScripts,
      recentVideos,
      recentActivities,
    ] = await Promise.all([
      prisma.script.count({ where: { userId } }),
      prisma.script.count({
        where: {
          userId,
          lifecycleStatus: { not: "finalized" },
        },
      }),
      prisma.script.count({ where: { userId, lifecycleStatus: 'finalized' } }),
      prisma.script.count({
        where: { userId, generatedVideoUrl: { not: null } },
      }),
      prisma.script.count({
        where: { userId, createdAt: { gte: weekStart } },
      }),
      prisma.script.count({
        where: { userId, generatedVideoUrl: { not: null }, createdAt: { gte: weekStart } },
      }),
      prisma.script.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, topic: true, platform: true, content: true, createdAt: true },
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
          videoStatus: true,
        },
      }),
      prisma.activity.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    const activitiesFormatted = recentActivities.map((a) => {
      const details = a.details ? (JSON.parse(a.details) as Record<string, string>) : {};
      const actionMap: Record<string, { type: string; text: string; action: string }> = {
        'script.generated': { type: 'script', text: `Script generated: '${details.topic || 'Untitled'}'`, action: 'View' },
        'script.deleted': { type: 'script', text: `Script deleted: '${details.topic || 'Untitled'}'`, action: 'Undo' },
        'video.uploaded': { type: 'upload', text: `Video uploaded: '${details.filename || 'Untitled'}'`, action: 'View' },
        'video.created': { type: 'video', text: 'Video created from script', action: 'Download' },
        'user.login': { type: 'login', text: 'Logged in', action: 'View' },
        'user.signup': { type: 'signup', text: 'Account created', action: 'View' },
        'onboarding.completed': { type: 'onboarding', text: 'Completed onboarding', action: 'View' },
      };
      const config = actionMap[a.action] || { type: 'other', text: a.action, action: 'View' };
      const diffMs = Date.now() - new Date(a.createdAt).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      const time = diffMins < 1 ? 'Just now' : diffMins < 60 ? `${diffMins} min ago` : diffHours < 24 ? `${diffHours}h ago` : diffDays < 7 ? `${diffDays}d ago` : new Date(a.createdAt).toLocaleDateString();
      return { id: a.id, type: config.type, text: config.text, action: config.action, time };
    });

    const responseData = {
      hasTrainingVideo,
      trainingVideoUrl: user.avatarUrl,
      avatarStatus: user.avatarStatus ?? null,
      scriptsCount,
      draftScriptsCount: draftScriptsCount ?? 0,
      finalizedScriptsCount: finalizedScriptsCount ?? 0,
      videosCount,
      scriptsThisWeek: scriptsThisWeek ?? 0,
      videosThisWeek: videosThisWeek ?? 0,
      credits: creditsLegacy,
      subscription,
      customAvatarsLimit: user.customAvatarsLimit ?? 1,
      customAvatarsUsed: user.customAvatarsUsed ?? 0,
      videoCredits: videoCreditsDb,
      genieEdits: genieEditsDb,
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
        videoStatus: s.videoStatus ?? null,
      })),
      activities: activitiesFormatted,
    };
    dashboardCache.set(user.id, { data: responseData, cacheTime: Date.now() });
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('[Dashboard] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
