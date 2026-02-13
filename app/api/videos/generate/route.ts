import { NextRequest, NextResponse } from 'next/server';
import { getAuthUserEmail } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { generateVideo, checkVideoStatus } from '@/lib/video-generation';
import { trackVideoGeneration, trackCreditsUsage, trackError } from '@/lib/tracking';
import { syncVideoToSupabase } from '@/lib/supabase-sync';
import { canAccessApp } from '@/lib/payment';

// Cost per video generation (in credits)
const VIDEO_GENERATION_COST = 5;

export const dynamic = 'force-dynamic';

/**
 * POST /api/videos/generate
 * Generate a video from a script using D-ID
 */
export async function POST(request: NextRequest) {
  console.log('[VideoGen] POST /api/videos/generate received');
  try {
    const userEmail = await getAuthUserEmail(request);
    console.log('[VideoGen] Auth:', userEmail ? `user ${userEmail}` : 'no user');

    if (!userEmail) {
      const cookieHeader = request.headers.get('cookie') ?? '';
      const hasCookie = cookieHeader.includes('next-auth.session-token') || cookieHeader.includes('__Secure-next-auth.session-token');
      const message = !hasCookie
        ? 'Session not found. Use the same URL you used to sign in (e.g. http://localhost:3000), then try again.'
        : 'Unauthorized';
      const code = !hasCookie ? 'no_session_cookie' : 'session_invalid';
      const res = NextResponse.json(
        { error: message, code },
        { status: 401 }
      );
      if (process.env.NODE_ENV === 'development') {
        res.headers.set('X-Auth-Debug', !hasCookie ? 'no-cookie' : 'cookie-present-decode-failed');
      }
      return res;
    }

    // Get user with credits, payment status, and avatar
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        credits: true,
        payment_status: true,
        avatarId: true,
        avatarStatus: true,
        avatarVoiceId: true,
      },
    });

    if (!user) {
      console.log('[VideoGen] User not found for email');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!canAccessApp(user.payment_status)) {
      return NextResponse.json(
        { error: 'Complete your payment to use this feature.', code: 'payment_required' },
        { status: 403 }
      );
    }
    console.log('[VideoGen] User id:', user.id, 'credits:', user.credits);

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
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch (e) {
      console.error('[VideoGen] Invalid JSON body:', e);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    const {
      scriptId,
      voiceId: bodyVoiceId,
      useClonedVoice: bodyUseClonedVoice,
      avatarId: bodyAvatarId,
      aspectRatio = '9:16',
      backgroundType,
      backgroundValue,
      backgroundColor,
      backgroundImageUrl,
      captionsEnabled: bodyCaptionsEnabled,
      captionStyle,
    } = body;

    const useClonedVoice = bodyUseClonedVoice === true;
    const bodyVoiceIdStr = typeof bodyVoiceId === 'string' ? bodyVoiceId.trim() : undefined;

    // Voice binding validation: cloned voice and voice ID are mutually exclusive
    if (useClonedVoice && bodyVoiceIdStr) {
      console.error('[VideoGen] Invalid: cannot use both cloned voice and voice ID');
      return NextResponse.json(
        { error: 'Invalid voice configuration: cannot use cloned voice with a selected voice ID.' },
        { status: 400 }
      );
    }
    if (!useClonedVoice && !bodyVoiceIdStr) {
      console.error('[VideoGen] Stock avatar requires a voice selection');
      return NextResponse.json(
        { error: 'Stock avatar requires a voice selection. Please choose a voice.' },
        { status: 400 }
      );
    }

    const scriptIdTrimmed = typeof scriptId === 'string' ? scriptId.trim() : '';
    if (!scriptIdTrimmed) {
      return NextResponse.json(
        { error: 'Script ID is required. Send scriptId in the request body when starting video generation.' },
        { status: 400 }
      );
    }

    // Get the script
    const script = await prisma.script.findUnique({
      where: { id: scriptIdTrimmed },
    });

    if (!script) {
      return NextResponse.json({ error: 'Script not found' }, { status: 404 });
    }

    // Verify ownership
    if (script.userId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized', code: 'forbidden_script' }, { status: 403 });
    }

    // Check if video generation is already in progress
    if (script.videoStatus === 'processing') {
      return NextResponse.json(
        { error: 'Video generation already in progress', videoId: script.generatedVideoId },
        { status: 409 }
      );
    }

    // D-ID: prefer selected avatar from request; fallback to user's custom avatar
    const heygenAvatarId =
      typeof bodyAvatarId === 'string' && bodyAvatarId.trim()
        ? bodyAvatarId.trim()
        : user.avatarId && user.avatarStatus === 'ready'
          ? user.avatarId
          : undefined;

    if (!heygenAvatarId) {
      console.log('[VideoGen] No avatar ID: bodyAvatarId=%s user.avatarId=%s', bodyAvatarId, user.avatarId);
      return NextResponse.json(
        { error: 'Please select an avatar. If you have a custom avatar, ensure it is ready.' },
        { status: 400 }
      );
    }
    console.log('[VideoGen] Avatar:', heygenAvatarId, 'useClonedVoice:', useClonedVoice, 'voiceId:', bodyVoiceIdStr ?? 'none');

    const bgValue =
      (typeof backgroundImageUrl === "string" ? backgroundImageUrl : undefined) ||
      (typeof backgroundValue === "string" ? backgroundValue : undefined) ||
      (typeof backgroundColor === "string" ? backgroundColor : undefined);
    const aspectRatioVal =
      aspectRatio === "16:9" || aspectRatio === "1:1" ? aspectRatio : "9:16";
    const backgroundTypeVal =
      backgroundType === "image" || backgroundType === "color" || backgroundType === "green_screen"
        ? backgroundType
        : undefined;
    const result = await generateVideo({
      script: script.content,
      scriptId: script.id,
      provider: 'did',
      useClonedVoice,
      voiceId: useClonedVoice ? undefined : (bodyVoiceIdStr || 'en-US-JennyNeural'),
      avatarId: heygenAvatarId,
      aspectRatio: aspectRatioVal,
      backgroundType: backgroundTypeVal,
      backgroundValue: bgValue,
      captionsEnabled: !!bodyCaptionsEnabled,
      openCaption: bodyCaptionsEnabled ? captionStyle !== 'closed' : undefined,
    });

    if (!result.success) {
      console.error('[VideoGen] generateVideo failed:', result.error);
      const userMessage =
        result.error?.includes('API key') || result.error?.includes('rejected')
          ? result.error
          : result.error || 'Video generation failed';
      return NextResponse.json(
        { error: userMessage, code: 'generation_failed' },
        { status: 500 }
      );
    }

    console.log('[VideoGen] D-ID clip created:', result.videoId, 'updating script and deducting credits');

    // Update script with video generation info and deduct credits atomically
    const [updatedScript, updatedUser] = await prisma.$transaction([
      prisma.script.update({
        where: { id: script.id },
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
          scriptId: script.id,
          videoId: result.videoId,
          provider: result.provider,
          creditsUsed: VIDEO_GENERATION_COST,
        }),
      },
    }).catch(err => console.error('Failed to log activity:', err));

    // Supabase tracking (non-blocking)
    trackVideoGeneration({
      user_id: user.id,
      script_id: script.id,
      video_id: result.videoId,
      provider: result.provider,
      status: 'processing',
      credits_used: VIDEO_GENERATION_COST,
    });
    trackCreditsUsage({
      user_id: user.id,
      amount: -VIDEO_GENERATION_COST,
      reason: 'video_generation',
      reference_type: 'script',
      reference_id: script.id,
      balance_after: updatedUser.credits,
    });

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
    const message = error instanceof Error ? error.message : 'Internal server error';
    const stack = error instanceof Error ? error.stack : undefined;
    console.error('[VideoGen] Error:', message, stack ?? '');
    const userEmail = await getAuthUserEmail(request).catch(() => null);
    const user = userEmail ? await prisma.user.findUnique({ where: { email: userEmail }, select: { id: true } }).catch(() => null) : null;
    trackError({
      user_id: user?.id ?? null,
      endpoint: '/api/videos/generate',
      error_message: message,
      error_stack: stack ?? undefined,
      status_code: 500,
      metadata: { code: 'server_error' },
    });
    return NextResponse.json(
      { error: message, code: 'server_error' },
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
    const userEmail = await getAuthUserEmail(request);
    if (!userEmail) {
      const hasCookie = (request.headers.get('cookie') ?? '').includes('next-auth.session-token') || (request.headers.get('cookie') ?? '').includes('__Secure-next-auth.session-token');
      return NextResponse.json(
        { error: hasCookie ? 'Unauthorized' : 'Session not found. Use the same URL you used to sign in.', code: hasCookie ? 'session_invalid' : 'no_session_cookie' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const scriptId = searchParams.get('scriptId')?.trim();

    if (!scriptId) {
      const accept = request.headers.get('accept') ?? '';
      const wantsHtml = accept.includes('text/html');
      if (wantsHtml) {
        const base = request.headers.get('x-forwarded-proto') && request.headers.get('x-forwarded-host')
          ? `${request.headers.get('x-forwarded-proto')}://${request.headers.get('x-forwarded-host')}`
          : process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
        return new NextResponse(
          `<!DOCTYPE html><html><head><meta charset="utf-8"><meta http-equiv="refresh" content="2;url=${base}/dashboard"><title>Video status</title></head><body style="font-family:system-ui;max-width:32rem;margin:2rem auto;padding:1rem;background:#0f172a;color:#e2e8f0;"><p>This is an API endpoint. Redirecting you to the dashboard…</p><p><a href="${base}/dashboard" style="color:#818cf8;">Go to Dashboard</a></p></body></html>`,
          { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
      return NextResponse.json(
        { error: 'Script ID is required. Use ?scriptId=YOUR_SCRIPT_ID to check video generation status.' },
        { status: 400 }
      );
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
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
      return NextResponse.json({ error: 'Unauthorized', code: 'forbidden_script' }, { status: 403 });
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

    // Check status with D-ID
    const statusResult = await checkVideoStatus(
      script.generatedVideoId,
      'did'
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

      syncVideoToSupabase({
        id: script.generatedVideoId!,
        user_id: user.id,
        script_id: scriptId,
        url: statusResult.resultUrl,
        status: 'uploaded',
      }).catch(() => {});

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
      const errorMessage = typeof statusResult.error === 'string'
        ? statusResult.error
        : (statusResult.error as unknown as { message?: string; detail?: string })?.message
          || (statusResult.error as unknown as { message?: string; detail?: string })?.detail
          || 'Video generation failed';
      
      await prisma.script.update({
        where: { id: scriptId },
        data: {
          videoStatus: 'failed',
          videoError: errorMessage,
          status: 'error',
        },
      });

      return NextResponse.json({
        status: 'failed',
        error: errorMessage,
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
