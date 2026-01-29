/**
 * Video Generation Service
 * Supports D-ID and HeyGen APIs for generating AI avatar videos from scripts
 */

import { createScene, getSceneStatus } from '@/lib/did';

// Types
export interface VideoGenerationRequest {
  script: string;
  scriptId: string;
  provider?: 'did' | 'heygen';
  voiceId?: string;
  avatarId?: string;
  avatarUrl?: string; // User's custom avatar image URL (for Talks)
  /** When set with avatarId (Express Avatar), use D-ID Scenes with cloned voice */
  expressVoiceId?: string;
  aspectRatio?: '16:9' | '9:16' | '1:1';
}

export interface VideoGenerationResult {
  success: boolean;
  videoId?: string;
  videoUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  provider: 'did' | 'heygen';
  error?: string;
  estimatedDuration?: number;
}

export interface VideoStatus {
  id: string;
  status: 'created' | 'started' | 'done' | 'error';
  resultUrl?: string;
  error?: string;
}

// D-ID API Configuration
const DID_API_URL = 'https://api.d-id.com';
const DID_API_KEY = process.env.DID_API_KEY;

// HeyGen API Configuration
const HEYGEN_API_URL = 'https://api.heygen.com';
const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

// Default avatars (D-ID provides free presenters)
const DID_DEFAULT_AVATARS = {
  female: 'amy-Aq6OmGZnMt', // Professional female presenter
  male: 'josh-lite-Kp7mLz5pKh', // Professional male presenter
  casual_female: 'anna_costume1_20220422_001', // Casual female
};

// Default voices (D-ID uses Microsoft Azure voices)
const DID_DEFAULT_VOICES = {
  female_us: 'en-US-JennyNeural',
  male_us: 'en-US-GuyNeural',
  female_uk: 'en-GB-SoniaNeural',
  male_uk: 'en-GB-RyanNeural',
};

// Default presenter image (used when user has no custom avatar)
const DEFAULT_PRESENTER_URL = 'https://create-images-results.d-id.com/google-oauth2%7C106276897498498194000/upl_yMQqO6XGq5f5bxC5g3k6E/image.png';

/**
 * Generate video using D-ID Scenes (Express Avatar + cloned voice)
 */
async function generateVideoWithDIDScenes(
  request: VideoGenerationRequest
): Promise<VideoGenerationResult> {
  const scene = await createScene(
    request.avatarId!,
    request.script,
    request.expressVoiceId || request.voiceId!
  );
  if (!scene) {
    return {
      success: false,
      status: 'failed',
      provider: 'did',
      error: 'D-ID Scenes creation failed',
    };
  }
  return {
    success: true,
    videoId: scene.id,
    status: 'processing',
    provider: 'did',
    estimatedDuration: Math.ceil(request.script.length / 15),
  };
}

/**
 * Generate video using D-ID API (Talks for image avatars, Scenes for Express/cloned voice)
 */
export async function generateVideoWithDID(
  request: VideoGenerationRequest
): Promise<VideoGenerationResult> {
  if (!DID_API_KEY) {
    return {
      success: false,
      status: 'failed',
      provider: 'did',
      error: 'D-ID API key not configured',
    };
  }

  // D-ID Express Avatar (video clone): use Scenes with cloned voice
  if (request.avatarId && request.expressVoiceId) {
    console.log('[D-ID] Using Express Avatar (Scenes) with cloned voice');
    return generateVideoWithDIDScenes(request);
  }

  try {
    // Use user's custom avatar if provided, otherwise use default presenter
    const sourceUrl = request.avatarUrl || DEFAULT_PRESENTER_URL;
    console.log(`[D-ID] Using source image: ${sourceUrl}`);

    // Create talk video with D-ID
    const response = await fetch(`${DID_API_URL}/talks`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${DID_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        // Use user's avatar or default presenter
        source_url: sourceUrl,
        script: {
          type: 'text',
          input: request.script,
          provider: {
            type: 'microsoft',
            voice_id: request.voiceId || DID_DEFAULT_VOICES.female_us,
          },
        },
        config: {
          fluent: true,
          pad_audio: 0.5,
          stitch: true,
        },
        // Video settings
        ...(request.aspectRatio === '9:16' && {
          driver_url: 'bank://lively',
          config: {
            result_format: 'mp4',
            fluent: true,
            pad_audio: 0.5,
          },
        }),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[D-ID] API Error:', response.status, errorData);
      return {
        success: false,
        status: 'failed',
        provider: 'did',
        error: errorData.message || `D-ID API error: ${response.status}`,
      };
    }

    const data = await response.json();
    console.log('[D-ID] Video created:', data.id);

    return {
      success: true,
      videoId: data.id,
      status: 'processing',
      provider: 'did',
      estimatedDuration: Math.ceil(request.script.length / 15), // Rough estimate: 15 chars/sec
    };
  } catch (error) {
    console.error('[D-ID] Generation error:', error);
    return {
      success: false,
      status: 'failed',
      provider: 'did',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check D-ID video status
 */
export async function checkDIDVideoStatus(videoId: string): Promise<VideoStatus> {
  if (!DID_API_KEY) {
    return { id: videoId, status: 'error', error: 'D-ID API key not configured' };
  }

  // D-ID Scenes (Express Avatar + cloned voice) use /scenes/{id}
  if (videoId.startsWith('scn_')) {
    try {
      const scene = await getSceneStatus(videoId);
      if (!scene) {
        return { id: videoId, status: 'error', error: 'Scene status check failed' };
      }
      const statusMap: Record<string, VideoStatus['status']> = {
        done: 'done',
        created: 'created',
        started: 'started',
      };
      return {
        id: videoId,
        status: statusMap[scene.status] || 'error',
        resultUrl: scene.result_url,
      };
    } catch (error) {
      return {
        id: videoId,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  try {
    const response = await fetch(`${DID_API_URL}/talks/${videoId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${DID_API_KEY}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return { id: videoId, status: 'error', error: `Status check failed: ${response.status}` };
    }

    const data = await response.json();
    
    return {
      id: videoId,
      status: data.status,
      resultUrl: data.result_url,
      error: data.error?.message,
    };
  } catch (error) {
    return {
      id: videoId,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate video using HeyGen API
 */
export async function generateVideoWithHeyGen(
  request: VideoGenerationRequest
): Promise<VideoGenerationResult> {
  if (!HEYGEN_API_KEY) {
    return {
      success: false,
      status: 'failed',
      provider: 'heygen',
      error: 'HeyGen API key not configured',
    };
  }

  try {
    // Create video with HeyGen
    const response = await fetch(`${HEYGEN_API_URL}/v2/video/generate`, {
      method: 'POST',
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        video_inputs: [
          {
            character: {
              type: 'avatar',
              avatar_id: request.avatarId || 'Angela-inblackskirt-20220820', // Default avatar
              avatar_style: 'normal',
            },
            voice: {
              type: 'text',
              input_text: request.script,
              voice_id: request.voiceId || '1bd001e7e50f421d891986aad5c8xxxx', // Default voice
            },
            background: {
              type: 'color',
              value: '#ffffff',
            },
          },
        ],
        dimension: request.aspectRatio === '9:16' 
          ? { width: 1080, height: 1920 }
          : request.aspectRatio === '1:1'
          ? { width: 1080, height: 1080 }
          : { width: 1920, height: 1080 },
        aspect_ratio: null,
        test: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[HeyGen] API Error:', response.status, errorData);
      return {
        success: false,
        status: 'failed',
        provider: 'heygen',
        error: errorData.message || `HeyGen API error: ${response.status}`,
      };
    }

    const data = await response.json();
    console.log('[HeyGen] Video created:', data.data?.video_id);

    return {
      success: true,
      videoId: data.data?.video_id,
      status: 'processing',
      provider: 'heygen',
      estimatedDuration: Math.ceil(request.script.length / 12),
    };
  } catch (error) {
    console.error('[HeyGen] Generation error:', error);
    return {
      success: false,
      status: 'failed',
      provider: 'heygen',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check HeyGen video status
 */
export async function checkHeyGenVideoStatus(videoId: string): Promise<VideoStatus> {
  if (!HEYGEN_API_KEY) {
    return { id: videoId, status: 'error', error: 'HeyGen API key not configured' };
  }

  try {
    const response = await fetch(`${HEYGEN_API_URL}/v1/video_status.get?video_id=${videoId}`, {
      method: 'GET',
      headers: {
        'X-Api-Key': HEYGEN_API_KEY,
      },
    });

    if (!response.ok) {
      return { id: videoId, status: 'error', error: `Status check failed: ${response.status}` };
    }

    const data = await response.json();
    
    // Map HeyGen status to our status
    const statusMap: Record<string, VideoStatus['status']> = {
      'pending': 'created',
      'processing': 'started',
      'completed': 'done',
      'failed': 'error',
    };

    return {
      id: videoId,
      status: statusMap[data.data?.status] || 'started',
      resultUrl: data.data?.video_url,
      error: data.data?.error,
    };
  } catch (error) {
    return {
      id: videoId,
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Main function to generate video (auto-selects provider)
 */
export async function generateVideo(
  request: VideoGenerationRequest
): Promise<VideoGenerationResult> {
  // Determine which provider to use
  const provider = request.provider || (DID_API_KEY ? 'did' : 'heygen');

  if (provider === 'did') {
    return generateVideoWithDID(request);
  } else {
    return generateVideoWithHeyGen(request);
  }
}

/**
 * Check video status (auto-selects provider)
 */
export async function checkVideoStatus(
  videoId: string,
  provider: 'did' | 'heygen'
): Promise<VideoStatus> {
  if (provider === 'did') {
    return checkDIDVideoStatus(videoId);
  } else {
    return checkHeyGenVideoStatus(videoId);
  }
}

/**
 * Get available avatars for a provider
 */
export function getAvailableAvatars(provider: 'did' | 'heygen') {
  if (provider === 'did') {
    return [
      { id: 'amy-Aq6OmGZnMt', name: 'Amy', gender: 'female', style: 'professional' },
      { id: 'josh-lite-Kp7mLz5pKh', name: 'Josh', gender: 'male', style: 'professional' },
      { id: 'anna_costume1_20220422_001', name: 'Anna', gender: 'female', style: 'casual' },
    ];
  } else {
    return [
      { id: 'Angela-inblackskirt-20220820', name: 'Angela', gender: 'female', style: 'professional' },
      { id: 'josh_lite3_20230714', name: 'Josh', gender: 'male', style: 'casual' },
    ];
  }
}

/**
 * Get available voices for a provider
 */
export function getAvailableVoices(provider: 'did' | 'heygen') {
  if (provider === 'did') {
    return [
      { id: 'en-US-JennyNeural', name: 'Jenny', language: 'English (US)', gender: 'female' },
      { id: 'en-US-GuyNeural', name: 'Guy', language: 'English (US)', gender: 'male' },
      { id: 'en-GB-SoniaNeural', name: 'Sonia', language: 'English (UK)', gender: 'female' },
      { id: 'en-GB-RyanNeural', name: 'Ryan', language: 'English (UK)', gender: 'male' },
      { id: 'en-US-AriaNeural', name: 'Aria', language: 'English (US)', gender: 'female' },
      { id: 'en-US-DavisNeural', name: 'Davis', language: 'English (US)', gender: 'male' },
    ];
  } else {
    return [
      { id: '1bd001e7e50f421d891986aad5c8xxxx', name: 'Sarah', language: 'English (US)', gender: 'female' },
      { id: '001cc6d54eae4ca2b5fb16ca70e7xxxx', name: 'Michael', language: 'English (US)', gender: 'male' },
    ];
  }
}
