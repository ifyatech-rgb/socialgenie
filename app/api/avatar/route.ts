import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getExpressAvatarStatus } from '@/lib/did';

const DID_API_URL = 'https://api.d-id.com';
const DID_API_KEY = process.env.DID_API_KEY;

/**
 * GET /api/avatar
 * Get user's avatar status. If avatar is processing (D-ID Express), poll D-ID and sync when done.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        avatarId: true,
        avatarUrl: true,
        avatarStatus: true,
        avatarVoiceId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // If D-ID Express avatar is processing, poll and sync
    if (user.avatarStatus === 'processing' && user.avatarId) {
      const status = await getExpressAvatarStatus(user.avatarId);
      if (status) {
        if (status.status === 'done') {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              avatarUrl: status.thumbnail_url || user.avatarUrl,
              avatarStatus: 'ready',
              avatarVoiceId: status.voice_id ?? undefined,
            },
          });
          const tv = await prisma.trainingVideo.findFirst({
            where: { userId: user.id, didAvatarId: user.avatarId },
          });
          if (tv) {
            await prisma.trainingVideo.update({
              where: { id: tv.id },
              data: { processingStatus: 'completed' },
            });
          }
          return NextResponse.json({
            hasAvatar: true,
            avatarId: user.avatarId,
            avatarUrl: status.thumbnail_url || user.avatarUrl,
            avatarStatus: 'ready',
            hasVoiceClone: !!status.voice_id,
          });
        }
        if (status.status === 'error' || status.status === 'failed') {
          await prisma.user.update({
            where: { id: user.id },
            data: { avatarStatus: 'failed' },
          });
          const tv = await prisma.trainingVideo.findFirst({
            where: { userId: user.id, didAvatarId: user.avatarId },
          });
          if (tv) {
            await prisma.trainingVideo.update({
              where: { id: tv.id },
              data: { processingStatus: 'failed' },
            });
          }
        }
      }
    }

    return NextResponse.json({
      hasAvatar: !!(user.avatarUrl && user.avatarStatus === 'ready'),
      avatarId: user.avatarId,
      avatarUrl: user.avatarUrl,
      avatarStatus: user.avatarStatus,
      hasVoiceClone: !!user.avatarVoiceId,
    });
  } catch (error) {
    console.error('[Avatar] Get error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/avatar
 * Create avatar from uploaded image or video
 * Body: FormData with 'image' file (accepts both images and videos)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check content type
    const contentType = request.headers.get('content-type') || '';
    let avatarUrl: string;
    let isVideo = false;

    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await request.formData();
      const file = formData.get('image') as File;

      if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
      }

      // Check file type
      const fileType = file.type;
      isVideo = fileType.startsWith('video/');
      const isImage = fileType.startsWith('image/');

      if (!isVideo && !isImage) {
        return NextResponse.json(
          { error: 'Please upload an image (JPG, PNG) or video (MP4, MOV, WebM)' },
          { status: 400 }
        );
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars');
      try {
        await mkdir(uploadsDir, { recursive: true });
      } catch (err) {
        // Directory might already exist
      }

      // Generate unique filename
      const ext = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
      const filename = `avatar_${user.id}_${Date.now()}.${ext}`;
      const filepath = path.join(uploadsDir, filename);

      // Save file locally
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      // Create public URL
      avatarUrl = `/uploads/avatars/${filename}`;
      console.log('[Avatar] File saved locally:', avatarUrl);

      // If it's an image and D-ID API is configured, also try to upload to D-ID
      if (isImage && DID_API_KEY) {
        try {
          const uploadFormData = new FormData();
          uploadFormData.append('image', file);

          console.log('[Avatar] Uploading image to D-ID...');
          const uploadResponse = await fetch(`${DID_API_URL}/images`, {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${DID_API_KEY}`,
            },
            body: uploadFormData,
          });

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            avatarUrl = uploadData.url; // Use D-ID URL if successful
            console.log('[Avatar] Image uploaded to D-ID:', avatarUrl);
          } else {
            console.log('[Avatar] D-ID upload failed, using local URL');
          }
        } catch (didError) {
          console.error('[Avatar] D-ID upload error:', didError);
          // Continue with local URL
        }
      }
    } else {
      // Handle JSON with image URL
      const body = await request.json();
      avatarUrl = body.imageUrl;

      if (!avatarUrl) {
        return NextResponse.json({ error: 'No image URL provided' }, { status: 400 });
      }
    }

    // Store the avatar info
    await prisma.user.update({
      where: { id: user.id },
      data: {
        avatarUrl: avatarUrl,
        avatarId: `custom_${user.id}`,
        avatarStatus: 'ready',
      },
    });

    // Log activity
    prisma.activity.create({
      data: {
        userId: user.id,
        action: 'avatar.created',
        details: JSON.stringify({ avatarUrl, isVideo }),
      },
    }).catch(err => console.error('Failed to log activity:', err));

    console.log('[Avatar] Avatar created for user:', user.id);

    return NextResponse.json({
      success: true,
      avatarUrl: avatarUrl,
      avatarId: `custom_${user.id}`,
      isVideo,
      message: isVideo 
        ? 'Video uploaded! For best AI video results, we recommend also uploading a clear photo of your face.'
        : 'Avatar created successfully! Your videos will now use your face.',
    });

  } catch (error) {
    console.error('[Avatar] Create error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/avatar
 * Remove user's custom avatar
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        avatarId: null,
        avatarUrl: null,
        avatarStatus: null,
        avatarVoiceId: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Avatar removed. Videos will use default presenter.',
    });

  } catch (error) {
    console.error('[Avatar] Delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
