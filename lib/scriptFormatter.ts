/**
 * Format script with clear structure: Hook, Content, CTA.
 * Used for display and for ensuring consistent output from AI.
 */

const SECTION_HEADERS = {
  hook: /^(?:🎣\s*)?HOOK:\s*/im,
  content: /^(?:📝\s*)?CONTENT:\s*/im,
  cta: /^(?:📢\s*)?CTA:\s*/im,
  ctaAlt: /^(?:📢\s*)?CALL TO ACTION:\s*/im,
}

/**
 * Normalize section headers to emoji format.
 */
function normalizeHeaders(script: string): string {
  let out = script
    .replace(/^HOOK:\s*/gim, '🎣 HOOK:\n')
    .replace(/^CONTENT:\s*/gim, '\n📝 CONTENT:\n')
    .replace(/^CALL TO ACTION:\s*/gim, '\n📢 CTA:\n')
    .replace(/^CTA:\s*/gim, '\n📢 CTA:\n')
  return out
}

/**
 * Format script with proper structure (Hook, Content, CTA).
 */
export function formatScript(script: string): string {
  if (!script || typeof script !== 'string') return ''

  let formatted = script.trim()

  const hasHook = SECTION_HEADERS.hook.test(formatted) || /^HOOK:/im.test(formatted)
  const hasContent = SECTION_HEADERS.content.test(formatted) || /^CONTENT:/im.test(formatted)
  const hasCTA = SECTION_HEADERS.cta.test(formatted) || SECTION_HEADERS.ctaAlt.test(formatted) || /^CTA:/im.test(formatted)

  if (!hasHook && !hasContent && !hasCTA) {
    formatted = autoStructureScript(formatted)
  }

  formatted = normalizeHeaders(formatted)

  formatted = formatted
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')

  return formatted.trim()
}

/**
 * Auto-structure a script without sections (guess Hook, Content, CTA).
 */
function autoStructureScript(script: string): string {
  const sentences = script
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  if (sentences.length === 0) return script

  const hookSentences = sentences.slice(0, 2)
  const hook = hookSentences.join('. ') + (hookSentences.length ? '.' : '')

  const ctaKeywords = ['comment', 'click', 'follow', 'subscribe', 'dm', 'link', 'sign up', 'get', 'download', 'send', 'first']
  let ctaStart = Math.max(0, sentences.length - 3)
  for (let i = sentences.length - 1; i >= 0; i--) {
    const lower = sentences[i].toLowerCase()
    if (ctaKeywords.some((k) => lower.includes(k))) {
      ctaStart = i
      break
    }
  }

  const ctaSentences = sentences.slice(Math.max(ctaStart, sentences.length - 3))
  const cta = ctaSentences.join('. ') + (ctaSentences.length ? '.' : '')

  const contentSentences = sentences.slice(2, ctaStart)
  const content = contentSentences.join('. ') + (contentSentences.length ? '.' : '')

  return `🎣 HOOK:\n${hook}\n\n📝 CONTENT:\n${content}\n\n📢 CTA:\n${cta}`
}

/**
 * Break content into paragraphs (2-4 sentences each).
 */
export function breakIntoParagraphs(text: string, maxSentencesPerParagraph = 4): string {
  const sentences = text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  const paragraphs: string[] = []
  let current: string[] = []

  sentences.forEach((sentence, index) => {
    current.push(sentence)
    if (
      current.length >= maxSentencesPerParagraph ||
      sentence.length > 150 ||
      index === sentences.length - 1
    ) {
      paragraphs.push(current.join('. ') + '.')
      current = []
    }
  })

  return paragraphs.join('\n\n')
}

/**
 * Validate script structure (has Hook, Content, CTA).
 */
export function validateScriptStructure(script: string): {
  isValid: boolean
  hasHook: boolean
  hasContent: boolean
  hasCTA: boolean
  missingParts: string[]
} {
  const hasHook = SECTION_HEADERS.hook.test(script) || /^HOOK:/im.test(script)
  const hasContent = SECTION_HEADERS.content.test(script) || /^CONTENT:/im.test(script)
  const hasCTA = SECTION_HEADERS.cta.test(script) || SECTION_HEADERS.ctaAlt.test(script) || /^CTA:/im.test(script)

  const missingParts: string[] = []
  if (!hasHook) missingParts.push('Hook')
  if (!hasContent) missingParts.push('Content')
  if (!hasCTA) missingParts.push('CTA')

  return {
    isValid: hasHook && hasContent && hasCTA,
    hasHook,
    hasContent,
    hasCTA,
    missingParts,
  }
}

/**
 * Extract sections from a formatted script (for display).
 */
export function extractSections(script: string): { hook: string; content: string; cta: string } {
  if (!script || typeof script !== 'string') {
    return { hook: '', content: '', cta: '' }
  }

  const hookMatch = script.match(/(?:🎣\s*)?HOOK:\s*([\s\S]*?)(?=(?:📝\s*)?CONTENT:|(?:📢\s*)?CTA:|$)/i)
  const contentMatch = script.match(/(?:📝\s*)?CONTENT:\s*([\s\S]*?)(?=(?:📢\s*)?CTA:|$)/i)
  const ctaMatch = script.match(/(?:📢\s*)?CTA:\s*([\s\S]*?)$/im)

  const hook = hookMatch ? hookMatch[1].trim() : ''
  const content = contentMatch ? contentMatch[1].trim() : ''
  const cta = ctaMatch ? ctaMatch[1].trim() : ''

  return { hook, content, cta }
}

/**
 * Strip section headers and return only the spoken text (for TTS / video generation).
 * Prevents the avatar from reading "Hook:", "Body:", "CTA:", etc. out loud.
 */
export function stripSectionHeadersForTTS(script: string): string {
  if (!script || typeof script !== 'string') return ''

  let out = script
    // Emoji-prefixed headers
    .replace(/🎣\s*HOOK:\s*/gi, '')
    .replace(/📝\s*CONTENT:\s*/gi, '')
    .replace(/📢\s*CTA:\s*/gi, '')
    .replace(/^HOOK:\s*/gim, '')
    .replace(/^Hook:\s*/gim, '')
    .replace(/^CONTENT:\s*/gim, '')
    .replace(/^Content:\s*/gim, '')
    .replace(/^BODY:\s*/gim, '')
    .replace(/^Body:\s*/gim, '')
    .replace(/^CALL TO ACTION:\s*/gim, '')
    .replace(/^CTA:\s*/gim, '')
    .replace(/^Cta:\s*/gim, '')
    .replace(/^INTRODUCTION:\s*/gim, '')
    .replace(/^Introduction:\s*/gim, '')
    .replace(/^INTRO:\s*/gim, '')
    .replace(/^Intro:\s*/gim, '')
    .replace(/^CONCLUSION:\s*/gim, '')
    .replace(/^Conclusion:\s*/gim, '')
    .replace(/^OPENING:\s*/gim, '')
    .replace(/^CLOSING:\s*/gim, '')
    // Markdown-style headers
    .replace(/^\*\*Hook:\*\*\s*/gim, '')
    .replace(/^\*\*Body:\*\*\s*/gim, '')
    .replace(/^\*\*CTA:\*\*\s*/gim, '')
    .replace(/^###\s*Hook:?\s*/gim, '')
    .replace(/^###\s*Body:?\s*/gim, '')
    .replace(/^###\s*CTA:?\s*/gim, '')
    .replace(/^##\s*Hook:?\s*/gim, '')
    .replace(/^##\s*Body:?\s*/gim, '')
    .replace(/^##\s*CTA:?\s*/gim, '')

  out = out
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n\n')

  return out.trim()
}
