import { Plus, X } from 'lucide-react'
import { useState } from 'react'
import type { ScrapeOptions } from '../lib/simulate'
import { Card, Label, Toggle } from './ui'

interface Props {
  options: ScrapeOptions
  onChange: (o: ScrapeOptions) => void
  suggestions: string[]
  disabled: boolean
  maxTokens: number
  onMaxTokens: (n: number) => void
}

export function OptionsPanel({ options, onChange, suggestions, disabled, maxTokens, onMaxTokens }: Props) {
  const [custom, setCustom] = useState('')
  const toggleTag = (sel: string) => onChange({
    ...options,
    excludeTags: options.excludeTags.includes(sel) ? options.excludeTags.filter((t) => t !== sel) : [...options.excludeTags, sel],
  })
  const all = [...new Set([...suggestions, ...options.excludeTags])]

  return (
    <Card className="space-y-4 p-4">
      <Label>Scrape options</Label>
      {disabled ? (
        <p className="text-sm text-ink-muted">Options act on the page's HTML, so they're simulated for the sample pages only. Pasted markdown still gets noise detection and chunking.</p>
      ) : (
        <>
          <Toggle
            checked={options.onlyMainContent}
            onChange={(v) => onChange({ ...options, onlyMainContent: v })}
            label={<code className="font-mono">onlyMainContent</code>}
            name="onlyMainContent"
            hint="Drop header, nav, footer and aside"
          />
          <div>
            <div className="text-sm font-medium"><code className="font-mono">excludeTags</code></div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {all.map((sel) => {
                const on = options.excludeTags.includes(sel)
                return (
                  <button
                    key={sel}
                    onClick={() => toggleTag(sel)}
                    aria-pressed={on}
                    className={`flex items-center gap-1 rounded-md border px-2 py-1 font-mono text-xs transition ${on ? 'border-brand bg-brand text-on-brand' : 'border-line bg-bg hover:border-brand/50'}`}
                  >
                    {on ? <X size={11} aria-hidden /> : <Plus size={11} aria-hidden />}{sel}
                  </button>
                )
              })}
            </div>
            <form
              className="mt-2 flex gap-1.5"
              onSubmit={(e) => {
                e.preventDefault()
                const sel = custom.trim()
                if (sel && !options.excludeTags.includes(sel)) onChange({ ...options, excludeTags: [...options.excludeTags, sel] })
                setCustom('')
              }}
            >
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="selector, e.g. .promo-bar"
                aria-label="Add a selector to excludeTags"
                className="min-w-0 flex-1 rounded-md border border-line bg-bg px-2 py-1 font-mono text-xs outline-none focus:border-brand"
              />
              <button className="rounded-md border border-line px-2 text-xs font-medium hover:border-brand">Add</button>
            </form>
          </div>
          <p className="text-xs text-ink-muted">Simulated locally from the sample's element annotations; a real scrape runs Firecrawl's extractor.</p>
        </>
      )}
      <div className="border-t border-line pt-4">
        <label className="flex items-center justify-between text-sm font-medium" htmlFor="budget">
          RAG chunk budget <span className="font-mono text-xs text-ink-muted">{maxTokens} tokens</span>
        </label>
        <input id="budget" type="range" min={80} max={600} step={20} value={maxTokens} onChange={(e) => onMaxTokens(Number(e.target.value))} className="mt-2 w-full accent-[var(--color-brand)]" />
      </div>
    </Card>
  )
}
