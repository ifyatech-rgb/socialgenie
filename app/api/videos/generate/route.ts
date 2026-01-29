import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateVideo, checkVideoStatus } from '@/lib/video-generation';

// Cost per video generation (in credits)
const VIDEO_GENERATION_COST = 5;

/**
 * POST /api/videos/generate
 * Generate a video from a script using D-ID or HeyGen
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with credits and avatar (Express Avatar = avatarId + avatarVoiceId from D-ID video clone)
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { 
        id: true, 
        credits: true,
        avatarUrl: true,
        avatarId: true,
        avatarStatus: true,
        avatarVoiceId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check credits
    if (user.credits < VIDEO_GENERATION_COST) {
      return NextResponse.json(
        { 
          error: `Insufficient credits. Video generation costs ${VIDEO_GENERATION_COST} credits.`,
          creditsRequired: VIDEO_GENERATION_COST,
          creditsRemaining: user.credits,
        },
        { status: 402 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { scriptId, provider = 'did', voiceId, avatarId, aspectRatio = '9:16' } = body;

    if (!scriptId) {
      return NextResponse.json({ error: 'Script ID is required' }, { status: 400 });
    }

    // Get the script
    const script = await prisma.script.findUnique({
      where: { id: scriptId },
    });

    if (!script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 });
    }

    // Verify ownership
    if (script.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if video generation is already in progress
    if (script.videoStatus === 'processing') {
      return NextResponse.json(
        { error: 'Video generation already in progress', videoId: script.generatedVideoId },
        { status: 409 }
      );
    }

    // Generate video - use Express Avatar (video clone + cloned voice) when available
    const hasExpressAvatar = user.avatarId && user.avatarStatus === 'ready' && user.avatarVoiceId;
    const userAvatarUrl = !hasExpressAvatar && user.avatarUrl && user.avatarStatus === 'ready' ? user.avatarUrl : undefined;

    console.log(`[VideoGen] Starting generation for script ${scriptId} with ${provider}`);
    if (hasExpressAvatar) {
      console.log(`[VideoGen] Using Express Avatar (cloned face + voice): ${user.avatarId}`);
    } else if (userAvatarUrl) {
      console.log(`[VideoGen] Using custom avatar image: ${userAvatarUrl}`);
    }

    const result = await generateVideo({
      script: script.content,
      scriptId: script.id,
      provider,
      voiceId: hasExpressAvatar ? user.avatarVoiceId! : voiceId,
      avatarId: hasExpressAvatar ? user.avatarId! : avatarId,
      avatarUrl: userAvatarUrl,
      expressVoiceId: hasExpressAvatar ? user.avatarVoiceId! : undefined,
      aspectRatio,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Video generation failed' },
        { status: 500 }
      );
    }

    // Update script with video generation info and deduct credits atomically
    const [updatedScript, updatedUser] = await prisma.$transaction([
      prisma.script.update({
        where: { id: scriptId },
        data: {
          generatedVideoId: result.videoId,
          videoProvider: result.provider,
          videoStatus: 'processing',
          status: 'video_processing',
        },
      }),
      prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: VIDEO_GENERATION_COST } },
        select: { credits: true },
      }),
    ]);

    // Log activity (non-blocking)
    prisma.activity.create({
      data: {
        userId: user.id,
        action: 'video.generation_started',
        details: JSON.stringify({
          scriptId,
          videoId: result.videoId,
          provider: result.provider,
          creditsUsed: VIDEO_GENERATION_COST,
        }),
      },
    }).catch(err => console.error('Failed to log activity:', err));

    console.log(`[VideoGen] Video generation started: ${result.videoId}`);

    return NextResponse.json({
      success: true,
      videoId: result.videoId,
      status: result.status,
      provider: result.provider,
      estimatedDuration: result.estimatedDuration,
      creditsUsed: VIDEO_GENERATION_COST,
      creditsRemaining: updatedUser.credits,
      message: 'Video generation started. Check status to monitor progress.',
    });

  } catch (error) {
    console.error('[VideoGen] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/videos/generate?scriptId=xxx
 * Check video generation status
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scriptId = searchParams.get('scriptId');

    if (!scriptId) {
      return NextResponse.json({ error: 'Script ID is required' }, { status: 400 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the script
    const script = await prisma.script.findUnique({
      where: { id: scriptId },
    });

    if (!script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 });
    }

    // Verify ownership
    if (script.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // If no video generation started
    if (!script.generatedVideoId || !script.videoProvider) {
      return NextResponse.json({
        status: 'not_started',
        message: 'No video generation has been started for this script',
      });
    }

    // If already completed or failed, return cached status
    if (script.videoStatus === 'completed' && script.generatedVideoUrl) {
      return NextResponse.json({
        status: 'completed',
        videoUrl: script.generatedVideoUrl,
        provider: script.videoProvider,
      });
    }

    if (script.videoStatus === 'failed') {
      return NextResponse.json({
        status: 'failed',
        error: script.videoError,
        provider: script.videoProvider,
      });
    }

    // Check status with provider
    const statusResult = await checkVideoStatus(
      script.generatedVideoId,
      script.videoProvider as 'did' | 'heygen'
    );

    // Update database based on status
    if (statusResult.status === 'done' && statusResult.resultUrl) {
      await prisma.script.update({
        where: { id: scriptId },
        data: {
          generatedVideoUrl: statusResult.resultUrl,
          videoStatus: 'completed',
          status: 'video_ready',
        },
      });

      // Log activity (non-blocking)
      prisma.activity.create({
        data: {
          userId: user.id,
          action: 'video.generation_completed',
          details: JSON.stringify({
            scriptId,
            videoId: script.generatedVideoId,
            provider: script.videoProvider,
          }),
        },
      }).catch(err => console.error('Failed to log activity:', err));

      return NextResponse.json({
        status: 'completed',
        videoUrl: statusResult.resultUrl,
        provider: script.videoProvider,
      });
    }

    if (statusResult.status === 'error') {
      await prisma.script.update({
        where: { id: scriptId },
        data: {
          videoStatus: 'failed',
          videoError: statusResult.error,
          status: 'error',
        },
      });

      return NextResponse.json({
        status: 'failed',
        error: statusResult.error,
        provider: script.videoProvider,
      });
    }

    // Still processing
    return NextResponse.json({
      status: 'processing',
      videoId: script.generatedVideoId,
      provider: script.videoProvider,
      message: 'Video is still being generated. Please check back in a few moments.',
    });

  } catch (error) {
    console.error('[VideoGen] Status check error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
