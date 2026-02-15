/**
 * Production-ready Claude API client with retry, timeout, and structured error handling.
 * All Claude calls should go through this module.
 */

import Anthropic from '@anthropic-ai/sdk'

const MAX_RETRIES = 5
const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 16000]
const REQUEST_TIMEOUT_MS = 30_000

const DEFAULT_MODEL_GENERATION = process.env.ANTHROPIC_MODEL ?? process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-20250514'
const DEFAULT_MODEL_RESEARCH = process.env.ANTHROPIC_RESEARCH_MODEL ?? process.env.ANTHROPIC_MODEL ?? process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-20250514'

function getClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    throw new Error('ANTHROPIC_API_KEY is not set')
  }
  return new Anthropic({ apiKey: key })
}

export function getDefaultModel(): string {
  return DEFAULT_MODEL_GENERATION
}

export function getResearchModel(): string {
  return DEFAULT_MODEL_RESEARCH
}

export interface ClaudeCallOptions {
  model?: string
  max_tokens?: number
  temperature?: number
  system?: string
  tools?: Array<{ type: string; name?: string }>
  userId?: string
}

export interface ClaudeCallResult {
  text: string
  requestId: string
  model: string
  usage?: { input_tokens: number; output_tokens: number }
}

/**
 * Check if an error is retryable (529, overloaded_error, or 5xx).
 */
function isRetryableError(error: unknown): boolean {
  const err = error as { status?: number; error?: { type?: string }; message?: string }
  if (err?.status === 529) return true
  if (err?.status && err.status >= 500 && err.status < 600) return true
  if (err?.error?.type === 'overloaded_error') return true
  if (typeof err?.message === 'string' && err.message.toLowerCase().includes('overloaded')) return true
  return false
}

/**
 * Map Claude API errors to clean, user-safe messages. Log raw error server-side only.
 */
export function handleClaudeError(error: unknown, context?: string): { message: string; status: number } {
  const err = error as { status?: number; error?: { type?: string; message?: string }; message?: string; name?: string }
  const raw = JSON.stringify({ status: err?.status, error: err?.error, message: err?.message })

  console.error(`[Claude] ${context ?? 'Request'} failed:`, raw)

  if (err?.status === 401) {
    return { message: 'Invalid API key. Please check your configuration.', status: 401 }
  }
  if (err?.status === 429) {
    return { message: 'Rate limit exceeded. Please try again in a moment.', status: 429 }
  }
  if (err?.status === 529 || err?.error?.type === 'overloaded_error') {
    return { message: 'AI service is currently experiencing high demand. Please try again in a few seconds.', status: 503 }
  }
  if (err?.status === 402 || err?.message?.toLowerCase().includes('credit')) {
    return { message: 'API credits exhausted. Please add billing to your Anthropic account.', status: 402 }
  }
  if (err?.status && err.status >= 500) {
    return { message: 'AI service is temporarily unavailable. Please try again shortly.', status: 503 }
  }
  if (err?.name === 'AbortError' || err?.message?.includes('timeout')) {
    return { message: 'Request timed out. Please try again.', status: 504 }
  }
  if (err?.message?.toLowerCase().includes('tool') || err?.message?.toLowerCase().includes('unsupported')) {
    return { message: 'AI configuration needs updating. Please try again without enabling AI Research.', status: 400 }
  }
  const msg = (err?.message ?? '').toLowerCase()
  if (err?.status === 404 || (msg.includes('model') && msg.includes('not found'))) {
    return { message: 'AI model not available. Add ANTHROPIC_MODEL=claude-sonnet-4-20250514 to .env to use a newer model.', status: 400 }
  }
  if (err?.message?.toLowerCase().includes('api_key') || err?.message?.toLowerCase().includes('authentication')) {
    return { message: 'Invalid API key. Check ANTHROPIC_API_KEY in .env.', status: 401 }
  }

  return { message: 'Something went wrong while generating content. Please try again.', status: 500 }
}

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Extract text from Claude message response.
 */
function extractTextFromMessage(response: { content: Array<{ type: string; text?: string }> }): string {
  const textBlock = response.content.find((b) => b.type === 'text')
  return textBlock?.text ?? ''
}

/** Params for a single non-streaming Claude message create call. */
interface ClaudeCreateParams {
  model?: string
  max_tokens?: number
  temperature?: number
  system?: string
  messages: Array<{ role: 'user'; content: string }>
  tools?: Array<{ type: string; name?: string }>
}

/**
 * Call Claude API with automatic retry (exponential backoff), timeout, and logging.
 * No parallel calls for the same logical request - call this sequentially from your route.
 */
export async function callClaudeWithRetry(
  params: ClaudeCreateParams,
  options: {
    userId?: string
    context?: string
    timeoutMs?: number
  } = {}
): Promise<{ response: { content: Array<{ type: string; text?: string }>; model: string; usage?: { input_tokens?: number; output_tokens?: number } }; requestId: string }> {
  const requestId = `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`
  const model = params.model ?? DEFAULT_MODEL_GENERATION
  const timeoutMs = options.timeoutMs ?? REQUEST_TIMEOUT_MS

  const logPayload = {
    request_id: requestId,
    timestamp: new Date().toISOString(),
    user_id: options.userId ?? null,
    model,
    context: options.context ?? 'generate',
  }

  let lastError: unknown
  const client = getClient()

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const body = {
        ...params,
        model,
        max_tokens: params.max_tokens ?? 1024,
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await client.messages.create(body as any, { signal: controller.signal }) as {
        content: Array<{ type: string; text?: string }>
        model: string
        usage?: { input_tokens?: number; output_tokens?: number }
      }

      clearTimeout(timeoutId)

      const usage = response.usage
      console.log('[Claude]', {
        ...logPayload,
        attempt: attempt + 1,
        input_tokens: usage?.input_tokens ?? null,
        output_tokens: usage?.output_tokens ?? null,
      })

      return { response, requestId }
    } catch (error) {
      clearTimeout(timeoutId)
      lastError = error

      if (attempt < MAX_RETRIES && isRetryableError(error)) {
        const delay = RETRY_DELAYS_MS[attempt]
        console.warn(`[Claude] Attempt ${attempt + 1}/${MAX_RETRIES + 1} failed (${requestId}), retrying in ${delay}ms:`, (error as Error).message)
        await sleep(delay)
        continue
      }

      throw error
    }
  }

  throw lastError
}

/**
 * Generate content with Claude: retry, timeout, clean errors, and structured result.
 * Use this as the single entry point for script generation and research.
 */
export async function generateContent(
  args: {
    system?: string
    userMessage: string
    model?: string
    max_tokens?: number
    temperature?: number
    tools?: Array<{ type: string; name?: string }>
    userId?: string
    context?: string
  }
): Promise<ClaudeCallResult> {
  const { response, requestId } = await callClaudeWithRetry(
    {
      model: args.model ?? DEFAULT_MODEL_GENERATION,
      max_tokens: Math.min(args.max_tokens ?? 1024, 1500),
      temperature: args.temperature ?? 0.7,
      system: args.system,
      messages: [{ role: 'user', content: args.userMessage }],
      tools: args.tools,
    },
    {
      userId: args.userId,
      context: args.context ?? 'generateContent',
      timeoutMs: REQUEST_TIMEOUT_MS,
    }
  )

  const text = extractTextFromMessage(response)
  const usage = response.usage

  return {
    text,
    requestId,
    model: response.model,
    usage: usage?.input_tokens != null && usage?.output_tokens != null
      ? { input_tokens: usage.input_tokens, output_tokens: usage.output_tokens }
      : undefined,
  }
}
