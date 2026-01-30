import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { anthropic, extractTextFromResponse, DEFAULT_MODEL } from '@/lib/anthropic'
import { researchNiche, formatResearchForPrompt, CompetitorResearch } from '@/lib/competitor-research'

// Types
interface GenerateScriptRequest {
  topic: string
  platform: 'TikTok' | 'Instagram' | 'YouTube'
  tone: 'Educational' | 'Entertaining' | 'Motivational' | 'Controversial'
  length: 30 | 60 | 90
  storyType?: 'personal' | 'expert' | 'contrarian' | 'casestudy' | 'auto'
  storyContext?: string
  targetAudience?: string
  specificPoints?: string
  hookStyle?: 'shocking' | 'contrarian' | 'warning' | 'secret' | 'question'
  niche?: string // User's content niche for research
}

// Platform-specific styles
const PLATFORM_STYLES: Record<string, string> = {
  TikTok: `Fast-paced, Gen-Z friendly language. Use trending phrases, quick cuts in script format.
    Energy: High and punchy. Sentences should be SHORT. Use slang appropriately.
    Format: Quick hooks, rapid-fire value, strong CTA.
    Visual style: Fast cuts, text overlays, engaging visuals every 2-3 seconds.`,
  
  Instagram: `Visually descriptive, aesthetic-focused. Think lifestyle and aspiration.
    Energy: Confident but approachable. Mix of educational and entertaining.
    Format: Story-driven with clear visual cues in brackets.
    Visual style: Beautiful shots, carousel-worthy moments, save-worthy tips.`,
  
  YouTube: `More educational depth, longer attention span expected.
    Energy: Authoritative but relatable. Can go deeper on topics.
    Format: Clear structure with timestamps-worthy sections.
    Visual style: B-roll suggestions, demonstration moments, recap points.`,
}

// Tone modifiers
const TONE_MODIFIERS: Record<string, string> = {
  Educational: `Focus on teaching and providing actionable value. 
    Use "Here's how" and "The reason is" structures.
    Include specific steps or frameworks.
    Make complex ideas simple and memorable.`,
  
  Entertaining: `Make it fun and engaging. Use humor, stories, and unexpected twists.
    Keep energy high. Use relatable scenarios.
    Include personality and quirks.
    Surprise the viewer with unexpected angles.`,
  
  Motivational: `Inspire action. Use powerful language, personal stories, and emotional triggers.
    Paint a picture of transformation.
    Use "You can" and "Imagine if" language.
    End with a call to action that feels empowering.`,
  
  Controversial: `Challenge conventional wisdom. Use "hot takes" and contrarian viewpoints.
    Be bold but not offensive. Back up claims with logic.
    Create "wait, what?" moments.
    Make people want to comment and debate.`,
}

// Hook style templates
const HOOK_STYLES: Record<string, string> = {
  shocking: 'Start with a shocking number or statistic: "I made $X in Y days doing this..." or "X% of people get this wrong..."',
  contrarian: 'Challenge a common belief: "Stop doing X, here\'s why..." or "Everything you know about X is wrong..."',
  warning: 'Create urgency with a warning: "If you\'re doing X, watch this..." or "This mistake is costing you..."',
  secret: 'Reveal insider knowledge: "The thing nobody tells you about X..." or "Here\'s what experts won\'t admit..."',
  question: 'Ask a provocative question: "Why does everyone get X wrong?" or "Have you ever wondered why X?"',
}

// Story type instructions
const STORY_TYPE_INSTRUCTIONS: Record<string, string> = {
  personal: `The creator shared a PERSONAL STORY. This is their unique experience and transformation.
    BUILD THE SCRIPT AROUND THIS STORY. Use their journey as the foundation.
    Make it feel authentic by using their specific details and emotions.
    Structure: Hook with the result → Setup the struggle → The discovery → The transformation → CTA`,
  
  expert: `The creator shared their EXPERT KNOWLEDGE. They have unique insights from experience.
    POSITION THEM AS AN AUTHORITY sharing insider knowledge.
    Use phrases like "In my X years of..." or "Having worked with Y clients..."
    Structure: Hook with credibility → Common mistake → Expert insight → Actionable advice → CTA`,
  
  contrarian: `The creator has a CONTRARIAN TAKE that challenges common beliefs.
    LEAD WITH THE CONTROVERSIAL STATEMENT to grab attention.
    Back it up with logic and evidence from their insight.
    Structure: Controversial claim → Why everyone believes the opposite → The real truth → Proof → CTA`,
  
  casestudy: `The creator has CASE STUDY DATA with real results.
    PRESENT THE DATA AS SOCIAL PROOF to build credibility.
    Use specific numbers and percentages.
    Structure: Hook with results → The experiment setup → The findings → What this means for you → CTA`,
}

// Word counts by length
const WORD_COUNTS: Record<number, { min: number; max: number }> = {
  30: { min: 60, max: 80 },
  60: { min: 130, max: 160 },
  90: { min: 200, max: 240 },
}

// Common niches to detect from topic
const NICHE_KEYWORDS: Record<string, string[]> = {
  'fitness': ['fitness', 'workout', 'gym', 'exercise', 'weight loss', 'muscle', 'training', 'health'],
  'personal finance': ['money', 'finance', 'investing', 'budget', 'wealth', 'income', 'savings', 'crypto', 'stocks'],
  'business': ['business', 'entrepreneur', 'startup', 'marketing', 'sales', 'revenue', 'client', 'agency'],
  'productivity': ['productivity', 'time management', 'habits', 'routine', 'morning', 'efficiency', 'focus'],
  'technology': ['tech', 'AI', 'software', 'app', 'coding', 'developer', 'programming'],
  'lifestyle': ['lifestyle', 'minimalism', 'travel', 'fashion', 'beauty', 'skincare'],
  'food': ['food', 'cooking', 'recipe', 'meal', 'restaurant', 'diet', 'nutrition'],
  'relationships': ['relationship', 'dating', 'marriage', 'love', 'communication'],
  'career': ['career', 'job', 'interview', 'resume', 'promotion', 'salary', 'work'],
  'education': ['learn', 'study', 'course', 'skill', 'education', 'teaching'],
}

/**
 * Extract likely niche from topic text
 */
function extractNicheFromTopic(topic: string): string | null {
  const lowerTopic = topic.toLowerCase()
  
  for (const [niche, keywords] of Object.entries(NICHE_KEYWORDS)) {
    if (keywords.some(keyword => lowerTopic.includes(keyword))) {
      return niche
    }
  }
  
  // Return the first significant word as a fallback niche
  const words = topic.split(/\s+/).filter(w => w.length > 4)
  return words[0] || null
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

    // Get user from database with credits
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        credits: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has enough credits
    if (user.credits <= 0) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits. Please upgrade your plan to continue generating scripts.',
          creditsRemaining: 0
        },
        { status: 402 }
      )
    }

    // 2. Parse request body
    const body: GenerateScriptRequest = await request.json()
    const { 
      topic, 
      platform, 
      tone, 
      length,
      storyType,
      storyContext,
      targetAudience,
      specificPoints,
      hookStyle,
    } = body

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

    // 4. Perform competitor research (non-blocking)
    let research: CompetitorResearch | null = null
    let researchUsed = false
    
    // Extract niche from topic or use provided niche
    const contentNiche = body.niche || extractNicheFromTopic(topic)
    
    if (contentNiche) {
      console.log(`[ScriptGen] Starting competitor research for niche: ${contentNiche}, platform: ${platform}`)
      try {
        research = await researchNiche(contentNiche, platform, 25000)
        if (research) {
          researchUsed = true
          console.log(`[ScriptGen] Research completed successfully`)
        } else {
          console.log(`[ScriptGen] Research returned null, continuing without research`)
        }
      } catch (error) {
        console.error(`[ScriptGen] Research failed, continuing without:`, error)
      }
    }

    // 5. Build the enhanced prompts
    const wordCount = WORD_COUNTS[length]
    const platformStyle = PLATFORM_STYLES[platform]
    const toneModifier = TONE_MODIFIERS[tone]
    const hookInstruction = hookStyle ? HOOK_STYLES[hookStyle] : 'Choose the most effective hook style for this topic and audience.'
    const storyInstruction = storyType && storyType !== 'auto' ? STORY_TYPE_INSTRUCTIONS[storyType] : ''
    
    // Build research section for prompt
    const researchSection = research ? formatResearchForPrompt(research) : ''

    const systemPrompt = `You are a viral content strategist who has generated over 1 billion views on social media. You specialize in creating scroll-stopping content that hooks viewers in the first 2 seconds and keeps them watching until the end.

Your scripts consistently go viral because you understand:
- Pattern interrupts that stop the scroll
- Psychological triggers that create engagement
- Platform-specific algorithms and viewer behavior
- The exact pacing and structure that maximizes watch time
- How to make generic topics feel personal and unique

You write scripts that feel authentic, never salesy, and always provide real value.

CRITICAL: If the creator provides a personal story or unique angle, USE IT PROMINENTLY. This is what makes content go viral - authentic, personal, unique perspectives that generic AI can't replicate.

${researchUsed ? 'You have access to REAL-TIME competitor research below. Use these insights to create a script that OUTPERFORMS current viral content.' : ''}`

    const userPrompt = `Create a ${length}-second ${platform} video script about: "${topic}"

${researchSection}

**PLATFORM STYLE (${platform}):**
${platformStyle}

**TONE (${tone}):**
${toneModifier}

${storyContext ? `
**CREATOR'S STORY/CONTEXT:**
The creator shared this unique angle:
"""
${storyContext}
"""

${storyInstruction}

IMPORTANT: This story is GOLD. Use it prominently throughout the script.
Don't write a generic script - make this personal and unique using their specific details!
` : `
**NO STORY PROVIDED:**
Create a compelling angle based on what typically goes viral for this topic.
Add specific details and scenarios to make it feel authentic.
`}

${targetAudience ? `
**TARGET AUDIENCE:**
${targetAudience}
Tailor the language, examples, and references to resonate with this specific audience.
` : ''}

${specificPoints ? `
**MUST INCLUDE:**
${specificPoints}
Weave these points naturally into the script.
` : ''}

**HOOK STYLE:**
${hookInstruction}

**SCRIPT STRUCTURE:**
[0-3 seconds] HOOK
- Stop the scroll immediately
- Create instant curiosity or emotional reaction
- Use the hook style specified above

[4-10 seconds] PATTERN INTERRUPT
- Say something unexpected
- Challenge a common belief OR
- Create a curiosity gap
- Make them think "wait, what?"

[11-${length - 20} seconds] THE VALUE
${storyContext ? '- Use their personal story/angle as the foundation' : '- Deliver compelling insights'}
- Specific, actionable content
- Keep sentences short and punchy
- Include "the reason this works is..." explanations
- Use specific numbers, not vague terms

[${length - 19}-${length - 10} seconds] PROOF/CREDIBILITY
${storyContext ? '- Reference their results or experience' : '- Add credibility with results or logic'}
- Specific numbers or outcomes
- Before/after or transformation reference

[${length - 9}-${length} seconds] CALL TO ACTION
- Clear next step
- Create urgency without being pushy
- Platform-appropriate CTA

**REQUIREMENTS:**
- Word count: ${wordCount.min}-${wordCount.max} words exactly
- Write in first person, conversational tone
- Use specific numbers (not "a lot" or "many")
- Include [VISUAL CUE] brackets for B-roll or text overlay suggestions
- Make it feel like a real person talking, not AI
- No generic, cookie-cutter phrases

**FORBIDDEN PHRASES (never use):**
- "In this video"
- "Hey guys" / "What's up guys"
- "Don't forget to like and subscribe"
- "So basically"
- "Let me explain"
- "Without further ado"
- "In today's video"
- "Quick tip"
- "Game changer" (unless used ironically)

${storyContext ? `
**FINAL REMINDER:**
The creator's story is what makes this unique. A generic script without their personal angle would be worth HALF as much. USE THEIR STORY PROMINENTLY.
` : ''}

Now write the script. Start directly with the hook - no preamble or labels.
Output ONLY the script text, ready to read.`

    // 6. Call Claude API
    console.log('Generating enhanced script with Claude...', { 
      topic, 
      platform, 
      tone, 
      length,
      hasStoryContext: !!storyContext,
      storyType,
      researchUsed,
    })
    
    const response = await anthropic.messages.create({
      model: DEFAULT_MODEL,
      max_tokens: 1024,
      temperature: 0.9, // Higher for more creative, unique scripts
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

    // 7. Save script, deduct credit, and log activity in a transaction
    const [script, updatedUser] = await prisma.$transaction([
      // Create the script
      prisma.script.create({
        data: {
          userId: user.id,
          topic,
          platform,
          tone,
          length,
          content: generatedScript,
          status: 'generated',
        },
      }),
      // Deduct 1 credit from user
      prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: 1 } },
        select: { credits: true },
      }),
    ])

    // Log activity (non-blocking)
    prisma.activity.create({
      data: {
        userId: user.id,
        action: 'script.generated',
        details: JSON.stringify({
          scriptId: script.id,
          topic,
          platform,
          tone,
          length,
          researchUsed,
        }),
      },
    }).catch(err => console.error('Failed to log activity:', err))

    // 8. Return success response
    return NextResponse.json({
      success: true,
      script: {
        id: script.id,
        topic: script.topic,
        platform: script.platform,
        tone: script.tone,
        length: script.length,
        content: script.content,
        status: script.status,
        createdAt: script.createdAt,
      },
      model: DEFAULT_MODEL,
      creditsRemaining: updatedUser.credits,
      research: researchUsed ? {
        used: true,
        niche: contentNiche,
        insights: {
          viralHooks: research?.viralHooks?.slice(0, 3) || [],
          trendingTopics: research?.trendingTopics?.slice(0, 3) || [],
          audiencePainPoints: research?.audienceInsights?.painPoints?.slice(0, 2) || [],
        }
      } : { used: false },
    })

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
