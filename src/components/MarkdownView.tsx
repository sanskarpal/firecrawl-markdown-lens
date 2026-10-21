import type { Block } from '../lib/blocks'
import type { Removed } from '../lib/simulate'
import { KIND_STYLE } from './kinds'

interface Props {
  blocks: Block[]
  removed: Removed[]
  showRemoved: boolean
  onShowRemoved: (v: boolean) => void
}

export function MarkdownView({ blocks, removed, showRemoved, onShowRemoved }: Props) {
  return (
    <div className="space-y-3">
      {removed.length > 0 && (
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input type="checkbox" checked={showRemoved} onChange={(e) => onShowRemoved(e.target.checked)} className="accent-[var(--color-brand)]" />
          Show the {removed.length} removed section{removed.length > 1 ? 's' : ''}
        </label>
      )}
      {showRemoved && removed.map((r, i) => (
        <div key={i} className="rounded-lg border border-dashed border-line bg-bg/60 px-3 py-2">
          <div className="mb-1 font-mono text-[11px] text-ink-muted">removed · &lt;{r.section.el}&gt; · {r.by}</div>
          <pre className="whitespace-pre-wrap break-words font-mono text-xs text-ink-muted line-through decoration-ink-muted/40">{r.section.md}</pre>
        </div>
      ))}
      <ol className="space-y-1.5">
        {blocks.map((b) => {
          const s = KIND_STYLE[b.kind]
          const noise = s.bar !== 'border-transparent'
          return (
            <li key={b.index} className={`rounded-r-lg border-l-4 py-1.5 pr-2 pl-3 ${s.bar} ${noise ? 'bg-bg' : ''}`}>
              {noise && (
                <div className="mb-1 flex items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-medium ${s.chip}`}>{s.label}</span>
                  <span className="text-[11px] text-ink-muted">{b.reason} · {b.tokens} tokens</span>
                </div>
              )}
              <pre className={`whitespace-pre-wrap break-words font-mono text-xs leading-relaxed ${noise ? 'text-ink-muted' : b.kind === 'heading' ? 'font-semibold text-ink' : 'text-ink'}`}>{b.text}</pre>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
