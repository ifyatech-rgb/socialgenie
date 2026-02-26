import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserEmail, getSessionForRequest } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getTrialStatus } from '@/lib/payment';
import { dashboardCache, CACHE_DURATION_MS } from '@/lib/dashboard-cache';

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

    // Resolve user: prefer session.user.id, then email (schema: users)
    const userIdFromSession = session?.user?.id ?? null;
    const emailNormalized = userEmail?.trim().toLowerCase() || undefined;
    let user = userIdFromSession
      ? await prisma.users.findUnique({ where: { id: userIdFromSession } })
      : null;
    if (!user && emailNormalized) {
      user = await prisma.users.findUnique({ where: { email: emailNormalized } });
    }
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const cached = dashboardCache.get(user.id);
    if (cached && Date.now() - cached.cacheTime < CACHE_DURATION_MS) {
      return NextResponse.json({ ...cached.data, cached: true });
    }

    const subscription = null; // schema has subscription_events, not embedded subscription

    const trialStatus = getTrialStatus(user.created_at ?? new Date());
    const trial =
      user.plan === 'trial'
        ? {
            isActive: true,
            daysRemaining: trialStatus.daysRemaining,
            isExpired: trialStatus.isExpired,
          }
        : { isActive: false, daysRemaining: 0, isExpired: false };

    const videoCreditsDb = user.video_credits ?? 0;
    const genieEditsDb = user.genie_edits ?? 0;
    const creditsLegacy = user.credits ?? user.video_credits ?? 0;
    const hasTrainingVideo = !!(user.avatar_url && user.avatar_status === 'ready');
    const userId = user.id;

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    // Single source of truth: prisma.scripts (user_id, script_text, lifecycle_status, created_at)
    const [
      scriptsCount,
      draftScriptsCount,
      finalizedScriptsCount,
      scriptsThisWeek,
      recentScriptsRows,
      recentActivityRows,
    ] = await Promise.all([
      prisma.scripts.count({ where: { user_id: userId } }),
      prisma.scripts.count({
        where: { user_id: userId, lifecycle_status: { not: 'finalized' } },
      }),
      prisma.scripts.count({ where: { user_id: userId, lifecycle_status: 'finalized' } }),
      prisma.scripts.count({
        where: { user_id: userId, created_at: { gte: weekStart } },
      }),
      prisma.scripts.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        take: 5,
        select: { id: true, topic: true, platform: true, script_text: true, created_at: true },
      }),
      prisma.user_activity_log.findMany({
        where: { user_id: userId },
        orderBy: { created_at: 'desc' },
        take: 10,
        select: { id: true, activity_type: true, metadata: true, created_at: true },
      }),
    ]);

    const videosCount = 0; // schema has no generated_video_url on scripts; can add when video table exists
    const videosThisWeek = 0;

    const activitiesFormatted = recentActivityRows.map((a) => {
      const metadata = (a.metadata as Record<string, string>) ?? {};
      const actionMap: Record<string, { type: string; text: string; action: string }> = {
        'script.generated': { type: 'script', text: `Script generated: '${metadata.topic || 'Untitled'}'`, action: 'View' },
        'script.deleted': { type: 'script', text: `Script deleted: '${metadata.topic || 'Untitled'}'`, action: 'Undo' },
        'video.uploaded': { type: 'upload', text: `Video uploaded: '${metadata.filename || 'Untitled'}'`, action: 'View' },
        'video.created': { type: 'video', text: 'Video created from script', action: 'Download' },
        'user.login': { type: 'login', text: 'Logged in', action: 'View' },
        'user.signup': { type: 'signup', text: 'Account created', action: 'View' },
        'onboarding.completed': { type: 'onboarding', text: 'Completed onboarding', action: 'View' },
      };
      const config = actionMap[a.activity_type] || { type: 'other', text: a.activity_type, action: 'View' };
      const created = a.created_at ? new Date(a.created_at).getTime() : 0;
      const diffMs = Date.now() - created;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      const time = diffMins < 1 ? 'Just now' : diffMins < 60 ? `${diffMins} min ago` : diffHours < 24 ? `${diffHours}h ago` : diffDays < 7 ? `${diffDays}d ago` : new Date(created).toLocaleDateString();
      return { id: a.id, type: config.type, text: config.text, action: config.action, time };
    });

    const responseData = {
      hasTrainingVideo,
      trainingVideoUrl: user.avatar_url,
      avatarStatus: user.avatar_status ?? null,
      trial,
      scriptsCount,
      draftScriptsCount: draftScriptsCount ?? 0,
      finalizedScriptsCount: finalizedScriptsCount ?? 0,
      videosCount,
      scriptsThisWeek: scriptsThisWeek ?? 0,
      videosThisWeek,
      credits: creditsLegacy,
      subscription,
      customAvatarsLimit: user.custom_avatars_limit ?? 1,
      customAvatarsUsed: user.custom_avatars_used ?? 0,
      videoCredits: videoCreditsDb,
      genieEdits: genieEditsDb,
      recentScripts: recentScriptsRows.map((s) => ({
        id: s.id,
        topic: s.topic,
        platform: s.platform,
        content: s.script_text ?? '',
        createdAt: s.created_at ? new Date(s.created_at).toISOString() : new Date().toISOString(),
      })),
      recentVideos: [] as Array<{ id: string; topic: string; platform: string; generatedVideoUrl: null; createdAt: string; length: number; videoStatus: null }>,
      activities: activitiesFormatted,
    };
    dashboardCache.set(user.id, { data: responseData, cacheTime: Date.now() });
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('[Dashboard] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
