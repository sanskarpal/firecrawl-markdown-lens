// Splits scraped markdown into blocks and labels the ones that are noise for
// an LLM: navigation link lists, cookie banners, footers, share bars, ads.
// Pure text heuristics, so it works on any markdown, not just the samples.

export type BlockKind = 'content' | 'heading' | 'code' | 'table' | 'nav' | 'cookie' | 'boilerplate' | 'media'

export interface Block {
  index: number
  text: string
  kind: BlockKind
  reason: string // why it got this label, shown in the UI
  tokens: number
}

export const NOISE_KINDS: BlockKind[] = ['nav', 'cookie', 'boilerplate', 'media']

/** Rough GPT-style estimate: ~4 characters per token, never zero for non-empty text. */
export function estimateTokens(text: string): number {
  const t = text.trim()
  return t ? Math.max(1, Math.ceil(t.length / 4)) : 0
}

/** Blank-line separated blocks, keeping fenced code blocks and tables whole. */
export function splitBlocks(markdown: string): string[] {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const blocks: string[] = []
  let buf: string[] = []
  let inFence = false
  const flush = () => {
    const text = buf.join('\n').trim()
    if (text) blocks.push(text)
    buf = []
  }
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) {
      if (!inFence) flush()
      buf.push(line)
      inFence = !inFence
      if (!inFence) flush()
      continue
    }
    if (inFence) { buf.push(line); continue }
    if (/^#{1,6}\s/.test(line)) { flush(); buf.push(line); flush(); continue }
    if (line.trim() === '') { flush(); continue }
    buf.push(line)
  }
  flush()
  return blocks
}

const LINK = /!?\[([^\]]*)\]\(([^)]*)\)/g
const COOKIE = /\b(cookies?|consent|accept all|reject all|privacy (settings|preferences)|we use (cookies|tracking))\b/i
const BOILER = [
  { re: /©|\(c\)\s*\d{4}|all rights reserved/i, why: 'copyright footer' },
  { re: /\b(subscribe|newsletter|sign up for (our|the))\b/i, why: 'newsletter prompt' },
  { re: /\bshare (on|this)\b|^\s*(share|tweet)\b/i, why: 'share buttons' },
  { re: /^\s*(advertisement|sponsored|ad)\s*$/im, why: 'ad slot' },
  { re: /was this (page|article) helpful|edit this page|skip to (main )?content/i, why: 'page chrome' },
  { re: /\b(privacy policy|terms of (service|use))\b.*\b(privacy policy|terms|cookies|contact)\b/i, why: 'legal links' },
  { re: /\bfree shipping\b|\bshop the sale\b|\b\d+% off\b/i, why: 'promo banner' },
]

export function classify(text: string): { kind: BlockKind; reason: string } {
  if (/^(```|~~~)/.test(text)) return { kind: 'code', reason: 'code block' }
  if (/^#{1,6}\s/.test(text)) return { kind: 'heading', reason: 'heading' }
  if (/^\|.*\|\s*\n\|[\s:|-]+\|/m.test(text)) return { kind: 'table', reason: 'table' }

  const links = [...text.matchAll(LINK)]
  const withoutImages = text.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/[\s|*_-]/g, '')
  if (links.length > 0 && links.every((l) => l[0].startsWith('!')) && withoutImages.length < 5) {
    return { kind: 'media', reason: 'image with no text' }
  }
  // a footer that mentions "cookie settings" is still a footer, so copyright wins
  if (BOILER[0].re.test(text) && text.length < 500) return { kind: 'boilerplate', reason: BOILER[0].why }
  if (COOKIE.test(text) && text.length < 600) return { kind: 'cookie', reason: 'cookie or consent banner' }
  for (const b of BOILER.slice(1)) if (b.re.test(text) && text.length < 500) return { kind: 'boilerplate', reason: b.why }
  if (/^\[[^\]]{1,40}\]\([^)]*\)$/.test(text.trim())) return { kind: 'nav', reason: 'lone link (logo or home)' }

  // link density: share of visible characters that sit inside link text
  const visible = text.replace(LINK, '$1').replace(/[*_`>#-]/g, '').replace(/\s+/g, ' ').trim()
  const linkChars = links.filter((l) => !l[0].startsWith('!')).reduce((s, l) => s + l[1].length, 0)
  const lines = text.split('\n').filter((l) => l.trim())
  const shortLinkLines = lines.filter((l) => /^\s*([-*+]|\d+\.)?\s*\[[^\]]+\]\([^)]*\)\s*$/.test(l)).length
  if (links.length >= 3 && visible.length > 0 && linkChars / visible.length > 0.6) {
    return { kind: 'nav', reason: `${links.length} links, ${Math.round((linkChars / visible.length) * 100)}% link text` }
  }
  if (lines.length >= 3 && shortLinkLines / lines.length >= 0.8) return { kind: 'nav', reason: 'list of bare links' }
  return { kind: 'content', reason: 'prose' }
}

export function analyze(markdown: string): Block[] {
  return splitBlocks(markdown).map((text, index) => ({ index, text, tokens: estimateTokens(text), ...classify(text) }))
}

export interface Readiness {
  totalTokens: number
  noiseTokens: number
  score: number // 0–100: share of tokens that are content
  byKind: Partial<Record<BlockKind, number>>
}

export function readiness(blocks: Block[]): Readiness {
  const totalTokens = blocks.reduce((s, b) => s + b.tokens, 0)
  const byKind: Partial<Record<BlockKind, number>> = {}
  for (const b of blocks) byKind[b.kind] = (byKind[b.kind] ?? 0) + b.tokens
  const noiseTokens = NOISE_KINDS.reduce((s, k) => s + (byKind[k] ?? 0), 0)
  return { totalTokens, noiseTokens, score: totalTokens ? Math.round(((totalTokens - noiseTokens) / totalTokens) * 100) : 100, byKind }
}
