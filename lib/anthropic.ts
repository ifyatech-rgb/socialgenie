import Anthropic from '@anthropic-ai/sdk'

/**
 * Anthropic Claude Client
 * 
 * Initialized with ANTHROPIC_API_KEY from environment variables.
 * Used for AI script generation with Claude models.
 * 
 * @example
 * ```ts
 * import { anthropic } from '@/lib/anthropic'
 * 
 * const response = await anthropic.messages.create({
 *   model: 'claude-3-5-sonnet-20241022',
 *   max_tokens: 1024,
 *   messages: [{ role: 'user', content: 'Hello!' }]
 * })
 * ```
 */

// Validate API key exists
if (!process.env.ANTHROPIC_API_KEY) {
  console.warn(
    'Warning: ANTHROPIC_API_KEY is not set. Claude API calls will fail. ' +
    'Please add ANTHROPIC_API_KEY to your .env file.'
  )
}

// Initialize Anthropic client
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

// Export types for convenience
export type { Anthropic }
export type MessageCreateParams = Anthropic.MessageCreateParams
export type Message = Anthropic.Message
export type ContentBlock = Anthropic.ContentBlock
export type TextBlock = Anthropic.TextBlock

/**
 * Helper function to extract text from Claude response.
 * For simple responses, returns the first text block.
 */
export function extractTextFromResponse(response: Message): string {
  const textBlock = response.content.find(
    (block): block is TextBlock => block.type === 'text'
  )
  return textBlock?.text || ''
}

/**
 * Extract ALL text from Claude response (for tool-use responses with multiple text blocks).
 * Use when the response may contain: text → tool_use → tool_result → more text.
 */
export function extractAllTextFromResponse(response: Message): string {
  return (response.content as Array<{ type: string; text?: string }>)
    .filter((block) => block.type === 'text' && block.text)
    .map((block) => block.text)
    .join('\n\n')
}

/**
 * Default model for script generation
 */
export const DEFAULT_MODEL = 'claude-sonnet-4-20250514'

/**
 * Generate a completion with Claude
 */
export async function generateCompletion(
  systemPrompt: string,
  userPrompt: string,
  options: {
    model?: string
    maxTokens?: number
    temperature?: number
  } = {}
): Promise<string> {
  const {
    model = DEFAULT_MODEL,
    maxTokens = 1024,
    temperature = 0.9,
  } = options

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userPrompt,
      },
    ],
  })

  return extractTextFromResponse(response)
}
