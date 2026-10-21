import type { Chunk } from '../lib/chunk'

export function ChunksView({ chunks, maxTokens }: { chunks: Chunk[]; maxTokens: number }) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-ink-muted">
        {chunks.length} chunks at ≤ {maxTokens} tokens. Chunks never cross a heading, carry their heading path for retrieval context, and keep code blocks whole.
      </p>
      <ol className="space-y-2">
        {chunks.map((c) => (
          <li key={c.index} className="rounded-lg border border-line bg-bg p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="truncate font-mono text-[11px] text-ink-muted">
                #{c.index + 1} · {c.headingPath.length ? c.headingPath.join(' › ') : '(no heading)'}
              </span>
              <span className={`font-mono text-[11px] tabular-nums ${c.oversize ? 'text-brand' : 'text-ink-muted'}`}>
                {c.tokens} tok{c.oversize ? ' · over budget (kept whole)' : ''}
              </span>
            </div>
            <div className="mt-1.5 h-1 rounded-full bg-surface">
              <div className={`h-full rounded-full ${c.oversize ? 'bg-brand' : 'bg-brand/50'}`} style={{ width: `${Math.min(100, (c.tokens / maxTokens) * 100)}%` }} />
            </div>
            <pre className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed">{c.text}</pre>
          </li>
        ))}
      </ol>
    </div>
  )
}
