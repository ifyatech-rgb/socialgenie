import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/dashboard
 * Fetch all dashboard data for the current user
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        avatarUrl: true,
        avatarStatus: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if user has a training video (using avatarUrl as indicator)
    const hasTrainingVideo = !!(user.avatarUrl && user.avatarStatus === 'ready');

    // Count scripts
    const scriptsCount = await prisma.script.count({
      where: { userId: user.id },
    });

    // Count videos with generated video URL
    const videosCount = await prisma.script.count({
      where: { 
        userId: user.id,
        generatedVideoUrl: { not: null },
      },
    });

    // Get recent scripts
    const recentScripts = await prisma.script.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        topic: true,
        platform: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      hasTrainingVideo,
      trainingVideoUrl: user.avatarUrl,
      scriptsCount,
      videosCount,
      recentScripts: recentScripts.map(s => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
      })),
    });

  } catch (error) {
    console.error('[Dashboard] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
