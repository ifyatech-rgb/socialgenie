import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { anthropic, extractTextFromResponse, DEFAULT_MODEL } from '@/lib/anthropic'

// Types
interface GenerateScriptRequest {
  topic: string
  platform: 'TikTok' | 'Instagram' | 'YouTube'
  tone: 'Educational' | 'Entertaining' | 'Motivational' | 'Controversial'
  length: 30 | 60 | 90
}

interface GenerateScriptResponse {
  success: boolean
  scriptId: string
  script: string
  creditsRemaining: number
  model: string
}

// Platform-specific styles
const PLATFORM_STYLES: Record<string, string> = {
  TikTok: `Fast-paced, Gen-Z friendly language. Use trending phrases, quick cuts in script format.
    Energy: High and punchy. Sentences should be SHORT. Use slang appropriately.
    Format: Quick hooks, rapid-fire value, strong CTA.`,
  
  Instagram: `Visually descriptive, aesthetic-focused. Think lifestyle and aspiration.
    Energy: Confident but approachable. Mix of educational and entertaining.
    Format: Story-driven with clear visual cues in brackets.`,
  
  YouTube: `More educational depth, longer attention span expected.
    Energy: Authoritative but relatable. Can go deeper on topics.
    Format: Clear structure with timestamps-worthy sections.`,
}

// Tone modifiers
const TONE_MODIFIERS: Record<string, string> = {
  Educational: 'Focus on teaching and providing actionable value. Use "Here\'s how" and "The reason is" structures.',
  Entertaining: 'Make it fun and engaging. Use humor, stories, and unexpected twists. Keep energy high.',
  Motivational: 'Inspire action. Use powerful language, personal stories, and emotional triggers.',
  Controversial: 'Challenge conventional wisdom. Use "hot takes" and contrarian viewpoints. Be bold but not offensive.',
}

// Word counts by length
const WORD_COUNTS: Record<number, { min: number; max: number }> = {
  30: { min: 60, max: 80 },
  60: { min: 130, max: 160 },
  90: { min: 200, max: 240 },
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in.' },
        { status: 401 }
      )
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { subscriptions: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // 2. Parse request body
    const body: GenerateScriptRequest = await request.json()
    const { topic, platform, tone, length } = body

    // Validate required fields
    if (!topic || !platform || !tone || !length) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, platform, tone, length' },
        { status: 400 }
      )
    }

    // Validate platform
    if (!['TikTok', 'Instagram', 'YouTube'].includes(platform)) {
      return NextResponse.json(
        { error: 'Invalid platform. Must be TikTok, Instagram, or YouTube' },
        { status: 400 }
      )
    }

    // Validate tone
    if (!['Educational', 'Entertaining', 'Motivational', 'Controversial'].includes(tone)) {
      return NextResponse.json(
        { error: 'Invalid tone. Must be Educational, Entertaining, Motivational, or Controversial' },
        { status: 400 }
      )
    }

    // Validate length
    if (![30, 60, 90].includes(length)) {
      return NextResponse.json(
        { error: 'Invalid length. Must be 30, 60, or 90 seconds' },
        { status: 400 }
      )
    }

    // 3. Check if Anthropic API key is configured
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { 
          error: 'Anthropic API key not configured. Please add ANTHROPIC_API_KEY to your .env file.',
          helpUrl: 'https://console.anthropic.com/settings/keys'
        },
        { status: 500 }
      )
    }

    // 4. Build the prompts
    const wordCount = WORD_COUNTS[length]
    const platformStyle = PLATFORM_STYLES[platform]
    const toneModifier = TONE_MODIFIERS[tone]

    const systemPrompt = `You are a viral content strategist who has generated over 1 billion views on social media. You specialize in creating scroll-stopping content that hooks viewers in the first 2 seconds and keeps them watching until the end.

Your scripts consistently go viral because you understand:
- Pattern interrupts that stop the scroll
- Psychological triggers that create engagement
- Platform-specific algorithms and viewer behavior
- The exact pacing and structure that maximizes watch time

You write scripts that feel authentic, never salesy, and always provide real value.`

    const userPrompt = `Create a ${length}-second ${platform} video script about: "${topic}"

**PLATFORM STYLE (${platform}):**
${platformStyle}

**TONE (${tone}):**
${toneModifier}

**SCRIPT STRUCTURE:**
[0-3 seconds] HOOK - Use one of these formulas:
- Shocking number: "I made $X in Y days doing this..."
- Contrarian: "Stop doing X, here's why..."
- Warning: "If you're doing X, watch this..."
- Secret: "The thing nobody tells you about X..."
- Question: "Why does everyone get X wrong?"

[4-10 seconds] PATTERN INTERRUPT
- Say something unexpected
- Challenge a common belief
- Create curiosity gap

[11-${length - 20} seconds] THE METHOD/VALUE
- Deliver on the hook's promise
- Use specific numbers and examples
- Keep sentences short and punchy
- Include "the reason this works is..." type explanations

[${length - 19}-${length - 10} seconds] PROOF/CREDIBILITY
- Personal result or client result
- Specific numbers
- Before/after reference

[${length - 9}-${length} seconds] CALL TO ACTION
- Clear next step
- Create urgency without being pushy
- "Follow for more" or "Save this for later"

**REQUIREMENTS:**
- Word count: ${wordCount.min}-${wordCount.max} words (this is for a ${length}-second video)
- Write in first person, conversational tone
- Use specific numbers (not "a lot" or "many")
- Include [VISUAL CUE] brackets for B-roll or text overlay suggestions
- No generic phrases

**FORBIDDEN PHRASES (never use these):**
- "In this video"
- "Hey guys"
- "Don't forget to like and subscribe"
- "So basically"
- "Let me explain"
- "Without further ado"

Now write the script. Start directly with the hook - no preamble.`

    // 5. Call Claude API
    console.log('Generating script with Claude...', { topic, platform, tone, length })
    
    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 1024,
      temperature: 0.9,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    })

    const generatedScript = extractTextFromResponse(response)

    if (!generatedScript) {
      throw new Error('No script generated from Claude')
    }

    console.log('Script generated successfully, saving to database...')

    // 6. Save to database
    const script = await prisma.script.create({
      data: {
        userId: user.id,
        topic,
        platform,
        tone,
        length,
        content: generatedScript,
        status: 'generated',
      },
    })

    // 7. Return success response
    const successResponse: GenerateScriptResponse = {
      success: true,
      scriptId: script.id,
      script: generatedScript,
      creditsRemaining: -1, // -1 indicates unlimited in demo mode
      model: DEFAULT_MODEL,
    }

    return NextResponse.json(successResponse)

  } catch (error: any) {
    console.error('Script generation error:', error)

    // Handle specific Anthropic errors
    if (error?.status === 401) {
      return NextResponse.json(
        { error: 'Invalid Anthropic API key. Please check your ANTHROPIC_API_KEY in .env file.' },
        { status: 401 }
      )
    }

    if (error?.status === 429) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again in a moment.' },
        { status: 429 }
      )
    }

    if (error?.status === 402 || error?.message?.includes('credit')) {
      return NextResponse.json(
        { error: 'Anthropic API credits exhausted. Please add billing to your Anthropic account.' },
        { status: 402 }
      )
    }

    return NextResponse.json(
      { error: error.message || 'Failed to generate script' },
      { status: 500 }
    )
  }
}
