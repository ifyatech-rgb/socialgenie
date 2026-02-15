import { generateContent, getDefaultModel } from './claude'

/**
 * Competitor Research System
 * 
 * Uses Claude to analyze viral content patterns and extract insights
 * before generating scripts. Uses model knowledge (web_search tool requires
 * newer models - claude-sonnet-4+, claude-3-7-sonnet, etc.).
 */

// Research insights interface
export interface CompetitorResearch {
  viralHooks: string[]
  winningPatterns: string[]
  trendingTopics: string[]
  topCreators: { name: string; performance: string }[]
  audienceInsights: {
    painPoints: string[]
    desires: string[]
  }
  whatWorks: string[]
  whatDoesntWork: string[]
  searchedAt: string
  niche: string
  platform: string
}

// Simple in-memory cache with 24-hour TTL
interface CacheEntry {
  data: CompetitorResearch
  expiresAt: number
}

const researchCache = new Map<string, CacheEntry>()
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Generate cache key from niche and platform
 */
function getCacheKey(niche: string, platform: string): string {
  return `${niche.toLowerCase().trim()}-${platform.toLowerCase().trim()}`
}

/**
 * Check if cache entry is still valid
 */
function isCacheValid(entry: CacheEntry | undefined): entry is CacheEntry {
  if (!entry) return false
  return Date.now() < entry.expiresAt
}

/**
 * Research viral content in a specific niche using Claude's web search
 * 
 * @param niche - The content niche (e.g., "fitness", "personal finance")
 * @param platform - Target platform (e.g., "TikTok", "Instagram")
 * @param timeout - Timeout in milliseconds (default 25 seconds)
 * @returns Research insights or null if failed
 */
export async function researchNiche(
  niche: string,
  platform: string,
  timeout: number = 25000
): Promise<CompetitorResearch | null> {
  // Check cache first
  const cacheKey = getCacheKey(niche, platform)
  const cached = researchCache.get(cacheKey)
  
  if (isCacheValid(cached)) {
    console.log(`[Research] Cache hit for ${cacheKey}`)
    return cached.data
  }

  console.log(`[Research] Cache miss for ${cacheKey}, performing web research...`)

  try {
    const result = await generateContent({
      userMessage: `You are an expert in viral social media content. Based on your knowledge of viral ${niche} content on ${platform}, provide insights about what's working in 2024-2025.

Analyze viral content patterns, trending formats, and what top creators in this niche are doing successfully. Provide insights in this EXACT JSON format:

{
  "viralHooks": ["list of 5-7 hook formulas that are currently going viral in this niche"],
  "winningPatterns": ["list of 5-7 content patterns/structures that work well"],
  "trendingTopics": ["list of 5-7 specific trending topics in this niche right now"],
  "topCreators": [{"name": "creator name", "performance": "what makes them successful"}],
  "audienceInsights": {
    "painPoints": ["list of 3-5 main audience pain points"],
    "desires": ["list of 3-5 main audience desires/goals"]
  },
  "whatWorks": ["list of 5-7 tactics that are working well"],
  "whatDoesntWork": ["list of 3-5 things to avoid"]
}

Be specific with trends and examples. Focus on actionable insights.
Output ONLY the JSON, no other text.`,
      model: getDefaultModel(),
      max_tokens: 1500,
      temperature: 0.3,
      context: 'researchNiche',
    })

    const researchText = result.text

    if (!researchText) {
      console.error('[Research] No text content in response')
      return null
    }

    // Parse JSON from response (handle markdown blocks and extra text)
    let jsonStr = researchText
    if (researchText.includes('```json')) {
      jsonStr = researchText.split('```json')[1].split('```')[0].trim()
    } else if (researchText.includes('```')) {
      jsonStr = researchText.split('```')[1].split('```')[0].trim()
    }
    // Extract JSON object if model added preamble/suffix
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (jsonMatch) jsonStr = jsonMatch[0]

    const parsed = JSON.parse(jsonStr) as Record<string, unknown>

    // Validate and build research object (tolerate slight key variations)
    const insights = (parsed.audienceInsights && typeof parsed.audienceInsights === 'object') ? parsed.audienceInsights as Record<string, unknown> : {}
    const research: CompetitorResearch = {
      viralHooks: Array.isArray(parsed.viralHooks) ? parsed.viralHooks : [],
      winningPatterns: Array.isArray(parsed.winningPatterns) ? parsed.winningPatterns : [],
      trendingTopics: Array.isArray(parsed.trendingTopics) ? parsed.trendingTopics : [],
      topCreators: Array.isArray(parsed.topCreators) ? parsed.topCreators : [],
      audienceInsights: {
        painPoints: Array.isArray(insights.painPoints) ? insights.painPoints : [],
        desires: Array.isArray(insights.desires) ? insights.desires : [],
      },
      whatWorks: Array.isArray(parsed.whatWorks) ? parsed.whatWorks : [],
      whatDoesntWork: Array.isArray(parsed.whatDoesntWork) ? parsed.whatDoesntWork : [],
      searchedAt: new Date().toISOString(),
      niche,
      platform,
    }

    // Cache the result
    researchCache.set(cacheKey, {
      data: research,
      expiresAt: Date.now() + CACHE_TTL_MS,
    })

    console.log(`[Research] Successfully researched and cached ${cacheKey}`)
    return research

  } catch (error: any) {
    // Handle timeout
    if (error.name === 'AbortError') {
      console.error(`[Research] Timeout after ${timeout}ms for ${cacheKey}`)
      return null
    }

    console.error(`[Research] Error researching ${cacheKey}:`, error.message)
    return null
  }
}

/**
 * Format research insights into a prompt section
 */
export function formatResearchForPrompt(research: CompetitorResearch): string {
  return `
**COMPETITOR RESEARCH INSIGHTS (Based on current viral content analysis):**

🔥 **Viral Hooks Working Right Now:**
${research.viralHooks.map(h => `- ${h}`).join('\n')}

📊 **Winning Content Patterns:**
${research.winningPatterns.map(p => `- ${p}`).join('\n')}

📈 **Trending Topics:**
${research.trendingTopics.map(t => `- ${t}`).join('\n')}

👥 **Audience Pain Points:**
${research.audienceInsights.painPoints.map(p => `- ${p}`).join('\n')}

🎯 **Audience Desires:**
${research.audienceInsights.desires.map(d => `- ${d}`).join('\n')}

✅ **What's Working:**
${research.whatWorks.map(w => `- ${w}`).join('\n')}

❌ **What to Avoid:**
${research.whatDoesntWork.map(w => `- ${w}`).join('\n')}

USE THIS RESEARCH to create a script that is BETTER than what's currently going viral.
Incorporate the hooks and patterns that are working, address the audience pain points,
and avoid the mistakes others are making.
`
}

/**
 * Clear expired cache entries (call periodically)
 */
export function clearExpiredCache(): void {
  const now = Date.now()
  for (const [key, entry] of researchCache.entries()) {
    if (now >= entry.expiresAt) {
      researchCache.delete(key)
    }
  }
}

/**
 * Get cache stats for debugging
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: researchCache.size,
    keys: Array.from(researchCache.keys()),
  }
}
