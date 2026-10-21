import { analyze, estimateTokens } from './blocks'

export interface Chunk {
  index: number
  headingPath: string[]
  text: string
  tokens: number
  oversize: boolean // a single block bigger than the budget (code is never split)
}

/**
 * Heading-aware chunking for RAG: chunks never cross a heading boundary, each
 * remembers the heading path it sits under, paragraphs are packed up to the
 * token budget, long prose is split at sentence ends, code blocks stay whole.
 */
export function chunkMarkdown(markdown: string, maxTokens: number): Chunk[] {
  const chunks: Chunk[] = []
  const path: { level: number; title: string }[] = []
  let buf: string[] = []

  const push = (text: string, oversize = false) => {
    chunks.push({ index: chunks.length, headingPath: path.map((p) => p.title), text, tokens: estimateTokens(text), oversize })
  }
  const flush = () => {
    if (buf.length) push(buf.join('\n\n'))
    buf = []
  }

  for (const block of analyze(markdown)) {
    if (block.kind === 'heading') {
      flush()
      const level = /^#+/.exec(block.text)![0].length
      while (path.length && path[path.length - 1].level >= level) path.pop()
      path.push({ level, title: block.text.replace(/^#+\s*/, '') })
      continue
    }
    const current = estimateTokens(buf.join('\n\n'))
    if (block.tokens > maxTokens) {
      flush()
      if (block.kind === 'code' || block.kind === 'table') push(block.text, true)
      else for (const piece of splitSentences(block.text, maxTokens)) push(piece, estimateTokens(piece) > maxTokens)
      continue
    }
    if (current + block.tokens > maxTokens) flush()
    buf.push(block.text)
  }
  flush()
  return chunks
}

function splitSentences(text: string, maxTokens: number): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) ?? [text]
  const out: string[] = []
  let cur = ''
  for (const s of sentences) {
    if (cur && estimateTokens(cur + s) > maxTokens) {
      out.push(cur.trim())
      cur = ''
    }
    cur += s
  }
  if (cur.trim()) out.push(cur.trim())
  return out
}
