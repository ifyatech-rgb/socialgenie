import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateContent, getDefaultModel, handleClaudeError } from '@/lib/claude'
import { researchNiche, formatResearchForPrompt, CompetitorResearch } from '@/lib/competitor-research'
import { getViralScriptSystemPrompt } from '@/lib/viral-script-prompt'
import { cleanScript } from '@/lib/scriptCleaner'
import { formatScript, validateScriptStructure, extractScriptFromResponse, dedupeScriptSections } from '@/lib/scriptFormatter'
import { sanitizeScriptNumbers, extractNumbersFromScript } from '@/lib/sanitizeScriptNumbers'
import { canAccessApp, canUseFeature } from '@/lib/payment'
import { trackCreditsUsage, trackFeatureUsage } from '@/lib/tracking'
import { syncScriptToSupabase, syncActivityToSupabase } from '@/lib/supabase-sync'
import { invalidateUser } from '@/lib/dashboard-cache'

// Types
interface GenerateScriptRequest {
  topic: string
  platform: 'TikTok' | 'Instagram' | 'YouTube'
  tone: 'Educational' | 'Entertaining' | 'Motivational' | 'Controversial'
  length?: 30 | 60 | 90 | null // Optional: if omitted, AI determines optimal length
  storyType?: 'personal' | 'expert' | 'contrarian' | 'casestudy' | 'auto'
  storyContext?: string
  targetAudience?: string
  specificPoints?: string
  hookStyle?: 'shocking' | 'contrarian' | 'warning' | 'secret' | 'question'
  niche?: string // User's content niche for research
  enableResearch?: boolean // When true, run research and charge 3 credits
  brandVoice?: string
  ctaPreference?: string
  /** Explicit CTA type: follow | comment | like | share | save | link (used for strict CTA wording) */
  cta?: string
}

// Dynamic length ranges: short (30-50s), medium (50-80s), long (80-120s)
const LENGTH_PRESETS: Record<string, { length: number; minWords: number; maxWords: number }> = {
  '30-50s': { length: 45, minWords: 60, maxWords: 100 },
  '50-80s': { length: 65, minWords: 100, maxWords: 160 },
  '80-120s': { length: 100, minWords: 160, maxWords: 240 },
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

// Word counts by length (fixed presets when user chooses)
const WORD_COUNTS: Record<number, { min: number; max: number }> = {
  30: { min: 60, max: 80 },
  45: { min: 60, max: 100 },
  60: { min: 130, max: 160 },
  65: { min: 100, max: 160 },
  90: { min: 200, max: 240 },
  100: { min: 160, max: 240 },
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

    // Get user from database with credits and payment status
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        credits: true,
        video_credits: true,
        plan: true,
        created_at: true,
        payment_status: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (!canAccessApp(user.payment_status)) {
      return NextResponse.json(
        { error: 'Complete your payment to use this feature.', code: 'payment_required' },
        { status: 403 }
      )
    }

    const featureCheck = canUseFeature({
      plan: user.plan,
      videoCredits: user.video_credits,
      credits: user.credits,
      createdAt: user.created_at ?? new Date(),
    })
    if (!featureCheck.allowed) {
      const creditsRemaining = user.video_credits ?? user.credits ?? 0
      return NextResponse.json(
        {
          error: featureCheck.error,
          code: featureCheck.code,
          creditsRemaining,
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
      brandVoice,
      ctaPreference,
      cta,
      enableResearch = false,
    } = body

    // Validate required fields (length is optional - AI determines if not provided)
    if (!topic || !platform || !tone) {
      return NextResponse.json(
        { error: 'Missing required fields: topic, platform, tone' },
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

    // Validate length if provided (30, 60, 90)
    if (length != null && length !== undefined && ![30, 60, 90].includes(length)) {
      return NextResponse.json(
        { error: 'Invalid length. Must be 30, 60, or 90 seconds, or omit to let AI decide' },
        { status: 400 }
      )
    }

    // Script generation is FREE (draft). Credits charged only when user finalizes.

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

    // 4. Perform competitor research (only when enableResearch is true)
    let research: CompetitorResearch | null = null
    let researchUsed = false
    const contentNiche = enableResearch ? (body.niche || extractNicheFromTopic(topic)) : null

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

    // ===== STEP 1: GENERATE VIRAL HOOK (50 frameworks → select best one) =====
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📍 STEP 1: GENERATING VIRAL HOOK')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

    const targetAudienceForHook = targetAudience || 'general social media users'
    const toneForHook = tone || 'engaging and conversational'

    const hookPrompt = `You're a proven copywriter who's written hooks that pulled millions of views. Study viral content in ${topic} and generate 50 customizable hook frameworks. Organize them by curiosity, controversy, storytelling, lists, and bold claims. Each hook should be designed to stop the scroll instantly. Attention first. Everything else follows.

Context for this script:
- Topic: ${topic}
- Platform: ${platform}
- Target Audience: ${targetAudienceForHook}
- Tone: ${toneForHook}

After generating the 50 frameworks, select THE BEST ONE for this specific ${platform} video about ${topic}.

Output ONLY the best hook (1-2 sentences, 3-5 seconds when spoken).

RULES:
- NO visual directions [like this]
- NO em dashes (—), use hyphens (-) or commas
- NO explanations, just the hook
- Must be spoken-word format
- Output only the final selected hook`

    let generatedHook: string
    try {
      console.log('🎣 Generating viral hook using proven frameworks...')
      const hookResult = await generateContent({
        system: `You are a world-class copywriter who has written hooks that pulled millions of views.
You understand viral content frameworks deeply.
You generate 50 hook options using proven frameworks (curiosity, controversy, storytelling, lists, bold claims), then select the absolute best one.
Output ONLY the final selected hook - no explanations, no labels, no framework list.`,
        userMessage: hookPrompt,
        model: getDefaultModel(),
        max_tokens: 300,
        temperature: 0.7,
        userId: user.id,
        context: 'scriptHook',
      })
      generatedHook = hookResult.text.trim()
      generatedHook = generatedHook.replace(/\[.*?\]/g, '')
      generatedHook = generatedHook.replace(/\(.*?\)/g, '')
      generatedHook = generatedHook.replace(/—/g, '-')
      generatedHook = generatedHook.replace(/^["']|["']$/g, '')
      generatedHook = generatedHook.trim()
      console.log('✅ Hook generated from 50 frameworks:')
      console.log('   "' + generatedHook + '"')
      console.log('   Length:', generatedHook.length, 'characters\n')
    } catch (hookError) {
      console.warn('[ScriptGen] Hook generation failed, main script will create its own hook:', hookError)
      generatedHook = ''
    }

    // 5. Determine optimal length (AI analysis if not provided)
    let effectiveLength: number
    let optimalLengthLabel: string
    let lengthReasoning = ''
    const useDynamicLength = length == null || length === undefined

    if (useDynamicLength) {
      // AI analyzes topic to determine optimal length
      console.log('[ScriptGen] Analyzing topic to determine optimal script length...')
      const analysisPrompt = `Analyze this topic and determine the optimal script length for a ${platform} video.

Topic: "${topic}"
${body.specificPoints ? `Key points to cover: ${body.specificPoints}` : ''}
Platform: ${platform}
Style: ${tone}

Based on the content scope, how long should this script be?

Consider:
- Topic complexity (simple tip vs detailed tutorial vs story)
- Number of points to cover
- Platform norms (${platform} typical length)
- Whether it needs storytelling, explanation, or just quick facts

Respond with ONLY a JSON object, no other text:
{
  "optimalLength": "30-50s" or "50-80s" or "80-120s",
  "wordCount": "60-100" or "100-160" or "160-240",
  "reasoning": "brief one-sentence explanation"
}`

      try {
        const analysisResult = await generateContent({
          userMessage: analysisPrompt,
          model: getDefaultModel(),
          max_tokens: 200,
          temperature: 0.3,
          userId: user.id,
          context: 'scriptLengthAnalysis',
        })
        const analysisText = analysisResult.text
        const cleaned = analysisText.replace(/```json/g, '').replace(/```/g, '').trim()
        const parsed = JSON.parse(cleaned) as {
          optimalLength?: string
          wordCount?: string
          reasoning?: string
        }
        const preset = LENGTH_PRESETS[parsed.optimalLength || '50-80s'] || LENGTH_PRESETS['50-80s']
        effectiveLength = preset.length
        optimalLengthLabel = parsed.optimalLength || '50-80s'
        lengthReasoning = parsed.reasoning || ''
        console.log(`[ScriptGen] Optimal length: ${optimalLengthLabel} (${effectiveLength}s) - ${lengthReasoning}`)
      } catch (e) {
        console.warn('[ScriptGen] Length analysis failed, using default 50-80s:', e)
        const preset = LENGTH_PRESETS['50-80s']
        effectiveLength = preset.length
        optimalLengthLabel = '50-80s'
      }
    } else {
      effectiveLength = length!
      optimalLengthLabel = `${length}s`
    }

    const wordCount = WORD_COUNTS[effectiveLength] || { min: 100, max: 160 }
    const platformStyle = PLATFORM_STYLES[platform]
    const toneModifier = TONE_MODIFIERS[tone]
    const hookInstruction = hookStyle ? HOOK_STYLES[hookStyle] : 'Choose the most effective hook style for this topic and audience.'
    const storyInstruction = storyType && storyType !== 'auto' ? STORY_TYPE_INSTRUCTIONS[storyType] : ''

    const ctaType = (cta ?? ctaPreference ?? '').toString().toLowerCase()
    const ctaInstructions: Record<string, string> = {
      follow: 'CTA MUST end with a follow ask: e.g. "Follow for more [topic-related] content!" or "Follow for Part 2."',
      comment: 'CTA MUST use Format A: Comment [SPECIFIC WORD] and I\'ll send you [SPECIFIC RESOURCE]. No generic "comment below".',
      like: 'CTA MUST include a like ask: e.g. "Like if you found this helpful!" or "Like and save for later."',
      share: 'CTA MUST ask to share: e.g. "Share this with someone who needs to see it!"',
      save: 'CTA MUST ask to save: e.g. "Save this for later!" with a specific reason.',
      link: 'CTA MUST say link in bio: e.g. "Link in bio for more!" or "Full [resource] in bio."',
    }
    const ctaInstruction = ctaType && ctaInstructions[ctaType]
      ? ctaInstructions[ctaType]
      : ctaPreference
        ? `**CTA preference:** ${ctaPreference} - Use Format A, B, or C from the system prompt.`
        : ''
    
    // Build research section for prompt
    const researchSection = research ? formatResearchForPrompt(research) : ''
    const systemPrompt = getViralScriptSystemPrompt(researchUsed, researchSection)

    // Personalized banned numbers: extract from user's last 10 scripts so we never repeat
    let userBannedNumbersSection = ''
    try {
      const recentScripts = await prisma.scripts.findMany({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' },
        take: 10,
        select: { script_text: true },
      })
      const allNumbers = new Set<string>()
      recentScripts.forEach((s) => {
        const text = s.script_text ?? ''
        extractNumbersFromScript(text).forEach((n) => allNumbers.add(n))
      })
      const bannedList = Array.from(allNumbers).slice(0, 80)
      if (bannedList.length > 0) {
        userBannedNumbersSection = `

**BANNED FOR THIS USER'S NEXT SCRIPT (do not use ANY of these — they appeared in their recent scripts):**
${bannedList.join(', ')}
`
      }
    } catch {
      // non-blocking
    }

    const userPrompt = `## SCRIPT REQUEST

**Topic:** ${topic}

**Platform:** ${platform}

**Tone:** ${tone}

**Duration:** ${effectiveLength} seconds

**Target word count:** ${wordCount.min}-${wordCount.max} words

**Platform style:** ${platformStyle}

**Tone modifier:** ${toneModifier}

${generatedHook ? `**MANDATORY HOOK (use this EXACT text for the 🎣 HOOK section):**
"""
${generatedHook}
"""
Then write 📝 CONTENT and 📢 CTA to flow naturally from this hook.` : `**Hook style:** ${hookInstruction}`}

${storyContext ? `
**CREATOR'S STORY/CONTEXT (USE PROMINENTLY):**
"""
${storyContext}
"""

${storyInstruction}
` : '**No story provided** - Create a compelling angle based on what typically goes viral for this topic.'}

${targetAudience ? `**Target audience:** ${targetAudience}` : ''}

${specificPoints ? `**Points to include:** ${specificPoints}` : ''}

${brandVoice ? `**Brand voice:** ${brandVoice}` : ''}

${ctaInstruction ? `**CTA (CRITICAL - follow exactly):** ${ctaInstruction}` : ''}
${userBannedNumbersSection}

---

Follow the complete system prompt. Create a ${effectiveLength}-second script that flows like one conversation from hook to CTA. Use specific numbers, pass the Competitor Test, and ensure the CTA scores 8/10+.

Output the script in the REQUIRED STRUCTURE:
- Start with "🎣 HOOK:" on its own line, then 1-2 sentences (attention grabber).
- Then "📝 CONTENT:" on its own line, then main content in SHORT PARAGRAPHS (2-4 sentences each, blank line between paragraphs).
- End with "📢 CTA:" on its own line, then 2-3 sentences (clear call-to-action).
Use only pure spoken words under each section. No [bracketed] directions, no em dashes (—), no (PAUSE) or parentheticals. Use regular hyphens (-) or commas.`

    // 6. Call Claude API (sequential: research already done, then hook, then length, now main script)
    console.log('Generating enhanced script with Claude...', { 
      topic, 
      platform, 
      tone, 
      effectiveLength,
      useDynamicLength,
      hasStoryContext: !!storyContext,
      storyType,
      researchUsed,
    })
    
    const scriptResult = await generateContent({
      system: systemPrompt,
      userMessage: userPrompt,
      model: getDefaultModel(),
      max_tokens: 1024,
      temperature: 0.9,
      userId: user.id,
      context: 'scriptMain',
    })

    let generatedScript = scriptResult.text

    if (!generatedScript) {
      throw new Error('No script generated from Claude')
    }

    // Strip research/thinking: only keep from first "🎣 HOOK:" onwards
    generatedScript = extractScriptFromResponse(generatedScript.trim())
    // One HOOK, one CONTENT, one CTA — remove duplicate sections
    generatedScript = dedupeScriptSections(generatedScript)
    // Clean visual directions, then ensure structured format
    generatedScript = cleanScript(generatedScript)
    generatedScript = formatScript(generatedScript)
    // Remove prompt-contamination numbers (847, 94%, $47K, etc.) — replace with fresh numbers
    generatedScript = sanitizeScriptNumbers(generatedScript)
    const validation = validateScriptStructure(generatedScript)
    if (!validation.isValid) {
      console.warn('[ScriptGen] Structure incomplete:', validation.missingParts, '- script saved as-is')
    } else {
      console.log('[ScriptGen] Structure validated: Hook, Content, CTA present')
    }
    console.log('Script generated, cleaned, and formatted; saving to database...')

    // 7. Save script as DRAFT (no credit charged - credits charged only on finalize)
    let script: Awaited<ReturnType<typeof prisma.scripts.create>>
    try {
      script = await prisma.scripts.create({
        data: {
          user_id: user.id,
          topic,
          platform,
          content_style: tone,
          script_text: generatedScript,
          status: 'draft',
          lifecycle_status: 'draft',
          credit_charged: false,
          chat_history: [],
          estimated_duration: effectiveLength ?? undefined,
          cta: ctaType || undefined,
        },
      })
    } catch (createErr: unknown) {
      const msg = String((createErr as { message?: string })?.message ?? '')
      if (msg.includes('lifecycle_status') || msg.includes('credit_charged') || msg.includes('chat_history') || msg.includes('status') || msg.includes('constraint')) {
        script = await prisma.scripts.create({
          data: {
            user_id: user.id,
            topic,
            platform,
            content_style: tone,
            script_text: generatedScript,
            status: 'draft',
            cta: ctaType || undefined,
          },
        })
        console.warn('[ScriptGen] Saved without refinement columns. Run: npx prisma db push')
      } else {
        throw createErr
      }
    }

    syncScriptToSupabase({
      id: script.id,
      user_id: user.id,
      topic: script.topic,
      platform: script.platform,
      content: script.script_text,
      tone: script.content_style ?? undefined,
      length: script.estimated_duration ?? undefined,
      status: script.status ?? 'generated',
      lifecycle_status: script.lifecycle_status ?? 'draft',
      created_at: script.created_at?.toISOString(),
      updated_at: script.updated_at?.toISOString(),
    }).catch(() => {})

    // Log activity (non-blocking)
    prisma.user_activity_log.create({
      data: {
        user_id: user.id,
        activity_type: 'script.generated',
        metadata: {
          scriptId: script.id,
          topic,
          platform,
          tone,
          length: effectiveLength,
          researchUsed,
        },
      },
    }).then((activity) => {
      syncActivityToSupabase({
        id: activity.id,
        user_id: activity.user_id ?? "",
        action: activity.activity_type,
        details: JSON.stringify(activity.metadata ?? {}),
        created_at: activity.created_at?.toISOString(),
      }).catch(() => {})
    }).catch(err => console.error('Failed to log activity:', err))

    trackFeatureUsage({
      user_id: user.id,
      feature_name: 'script_generated',
      metadata: { platform, tone, researchUsed },
    })

    const actualWordCount = generatedScript.split(/\s+/).filter(Boolean).length

    // Invalidate dashboard/scripts caches so next load shows this script everywhere
    invalidateUser(user.id)

    // 8. Return success response
    return NextResponse.json({
      success: true,
      script: {
        id: script.id,
        topic: script.topic,
        platform: script.platform,
        tone: script.content_style,
        length: script.estimated_duration,
        content: script.script_text,
        status: script.status,
        cta: script.cta ?? undefined,
        createdAt: script.created_at,
      },
      model: getDefaultModel(),
      creditsRemaining: user.credits,
      metadata: {
        optimalLength: useDynamicLength ? optimalLengthLabel : `${script.estimated_duration ?? effectiveLength}s`,
        targetWordCount: `${wordCount.min}-${wordCount.max}`,
        actualWordCount,
        lengthReasoning: useDynamicLength ? lengthReasoning : undefined,
        lengthOptimized: useDynamicLength,
      },
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

  } catch (error: unknown) {
    const err = error as { message?: string }
    const rawMsg = String(err?.message ?? '')
    console.error('[ScriptGen] Script generation failed:', rawMsg)

    // Database/constraint errors: never show raw message or "API credits" to users
    if (rawMsg.includes('23514') || rawMsg.includes('constraint') || rawMsg.includes('violates check') || rawMsg.includes('scripts.create')) {
      return NextResponse.json(
        { success: false, error: "We couldn't save your script. Please try again." },
        { status: 500 }
      )
    }

    const { message, status } = handleClaudeError(error, 'Script generation')
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
