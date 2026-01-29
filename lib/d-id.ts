/**
 * D-ID API Client
 * 
 * D-ID creates AI-powered talking avatar videos from images and text.
 * Documentation: https://docs.d-id.com/
 */

const D_ID_API_URL = 'https://api.d-id.com'

// Types
export interface DIDTalkRequest {
  source_url: string
  script: {
    type: 'text' | 'audio'
    input: string
    provider?: {
      type: 'microsoft' | 'amazon' | 'google'
      voice_id: string
    }
  }
  config?: {
    stitch?: boolean
    result_format?: 'mp4' | 'gif' | 'mov'
  }
}

export interface DIDTalkResponse {
  id: string
  created_at: string
  status: 'created' | 'started' | 'done' | 'error'
  result_url?: string
}

export interface DIDTalkStatusResponse {
  id: string
  status: 'created' | 'started' | 'done' | 'error'
  result_url?: string
  error?: {
    kind: string
    description: string
  }
}

// Voice options
export const DID_VOICES = {
  // Microsoft voices (recommended)
  'en-US-JennyNeural': { name: 'Jenny', gender: 'female', accent: 'US' },
  'en-US-GuyNeural': { name: 'Guy', gender: 'male', accent: 'US' },
  'en-US-AriaNeural': { name: 'Aria', gender: 'female', accent: 'US' },
  'en-GB-SoniaNeural': { name: 'Sonia', gender: 'female', accent: 'UK' },
  'en-GB-RyanNeural': { name: 'Ryan', gender: 'male', accent: 'UK' },
  'en-AU-NatashaNeural': { name: 'Natasha', gender: 'female', accent: 'AU' },
  'en-IN-NeerjaNeural': { name: 'Neerja', gender: 'female', accent: 'IN' },
}

// Default presenter images from D-ID
// Note: Use your own uploaded images or D-ID's image library
export const DID_PRESENTERS = {
  // Using a publicly accessible image that works with D-ID
  default: 'https://d-id-public-bucket.s3.us-west-2.amazonaws.com/alice.jpg',
  // Alternative: Use any public HTTPS image URL
  // Or upload to D-ID and use: https://create-images-results.d-id.com/your-image-id.jpg
}

/**
 * Get D-ID API authorization header
 */
function getAuthHeader(): string {
  const apiKey = process.env.DID_API_KEY
  if (!apiKey) {
    throw new Error('D-ID API key not configured. Please add DID_API_KEY to your .env file.')
  }
  return `Basic ${apiKey}`
}

/**
 * Create a talking avatar video
 */
export async function createTalk(
  script: string,
  options: {
    sourceUrl?: string
    voiceId?: string
    voiceProvider?: 'microsoft' | 'amazon' | 'google'
  } = {}
): Promise<DIDTalkResponse> {
  const {
    sourceUrl = DID_PRESENTERS.default,
    voiceId = 'en-US-JennyNeural',
    voiceProvider = 'microsoft',
  } = options

  const response = await fetch(`${D_ID_API_URL}/talks`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      source_url: sourceUrl,
      script: {
        type: 'text',
        input: script,
        provider: {
          type: voiceProvider,
          voice_id: voiceId,
        },
      },
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('D-ID API error:', response.status, errorText)
    
    if (response.status === 401) {
      throw new Error('Invalid D-ID API key. Please check your DID_API_KEY.')
    }
    if (response.status === 402) {
      throw new Error('D-ID credits exhausted. Please add more credits to your account.')
    }
    if (response.status === 429) {
      throw new Error('D-ID rate limit exceeded. Please try again later.')
    }
    
    throw new Error(`D-ID API error: ${response.status} - ${errorText}`)
  }

  return response.json()
}

/**
 * Get the status of a talk video
 */
export async function getTalkStatus(talkId: string): Promise<DIDTalkStatusResponse> {
  const response = await fetch(`${D_ID_API_URL}/talks/${talkId}`, {
    method: 'GET',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`D-ID API error: ${response.status} - ${errorText}`)
  }

  return response.json()
}

/**
 * Wait for a talk video to complete
 * Polls the API until the video is ready or fails
 */
export async function waitForTalk(
  talkId: string,
  options: {
    maxAttempts?: number
    intervalMs?: number
  } = {}
): Promise<DIDTalkStatusResponse> {
  const { maxAttempts = 60, intervalMs = 5000 } = options
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await getTalkStatus(talkId)
    
    if (status.status === 'done') {
      return status
    }
    
    if (status.status === 'error') {
      throw new Error(`D-ID video generation failed: ${status.error?.description || 'Unknown error'}`)
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }
  
  throw new Error('D-ID video generation timed out')
}

/**
 * Create a talk video and wait for completion
 * Returns the result URL of the generated video
 */
export async function generateVideo(
  script: string,
  options: {
    sourceUrl?: string
    voiceId?: string
    voiceProvider?: 'microsoft' | 'amazon' | 'google'
    waitForCompletion?: boolean
  } = {}
): Promise<{ videoId: string; videoUrl?: string; status: string }> {
  const { waitForCompletion = true, ...createOptions } = options
  
  // Create the talk
  const talk = await createTalk(script, createOptions)
  console.log('D-ID talk created:', talk.id)
  
  if (!waitForCompletion) {
    return {
      videoId: talk.id,
      status: talk.status,
    }
  }
  
  // Wait for completion
  const result = await waitForTalk(talk.id)
  
  return {
    videoId: talk.id,
    videoUrl: result.result_url,
    status: result.status,
  }
}
