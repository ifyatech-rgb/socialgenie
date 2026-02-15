/**
 * Anthropic Claude client - thin wrapper for backwards compatibility.
 * Production code should use @/lib/claude (callClaudeWithRetry, generateContent, handleClaudeError).
 */

import Anthropic from '@anthropic-ai/sdk'

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn(
    'Warning: ANTHROPIC_API_KEY is not set. Claude API calls will fail. ' +
    'Please add ANTHROPIC_API_KEY to your .env file.'
  )
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export type { Anthropic }

type Message = { content: Array<{ type: string; text?: string }>; model: string }
type TextBlock = { type: 'text'; text: string }

/**
 * Extract text from Claude response (for backwards compatibility).
 */
export function extractTextFromResponse(response: Message): string {
  const textBlock = response.content.find((b): b is TextBlock => b.type === 'text')
  return textBlock?.text ?? ''
}

/**
 * Extract ALL text from response (multiple text blocks).
 */
export function extractAllTextFromResponse(response: Message): string {
  return response.content
    .filter((b): b is TextBlock => b.type === 'text' && 'text' in b)
    .map((b) => b.text)
    .join('\n\n')
}

import { getDefaultModel } from '@/lib/claude'

/** Default model - use env ANTHROPIC_MODEL or CLAUDE_MODEL, else claude-3-5-sonnet. */
export const DEFAULT_MODEL = getDefaultModel()
