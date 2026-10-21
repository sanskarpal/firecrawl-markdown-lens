import { NOISE_KINDS, type Readiness } from '../lib/blocks'
import { KIND_STYLE } from './kinds'
import { Card, Label } from './ui'

export function ScoreCard({ before, after }: { before: Readiness; after: Readiness }) {
  const saved = before.totalTokens - after.totalTokens
  const tone = after.score >= 90 ? 'text-good' : after.score >= 70 ? 'text-brand-3' : 'text-brand'
  return (
    <Card className="p-4">
      <Label>LLM readiness</Label>
      <div className="mt-2 flex items-end gap-3">
        <span className={`text-5xl font-semibold tabular-nums tracking-tight ${tone}`}>{after.score}</span>
        <span className="pb-1.5 text-sm text-ink-muted">/ 100{after.score !== before.score && <> · was {before.score}</>}</span>
      </div>
      <p className="mt-1 text-xs text-ink-muted">Share of tokens that are page content rather than chrome.</p>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-xs text-ink-muted">Tokens</dt>
          <dd className="font-mono tabular-nums">{after.totalTokens.toLocaleString()}{saved > 0 && <span className="text-xs text-good"> −{saved.toLocaleString()}</span>}</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Noise tokens</dt>
          <dd className="font-mono tabular-nums">{after.noiseTokens.toLocaleString()}</dd>
        </div>
      </dl>

      <div className="mt-4 space-y-1.5">
        {NOISE_KINDS.map((k) => {
          const n = after.byKind[k] ?? 0
          const was = before.byKind[k] ?? 0
          if (!was) return null
          return (
            <div key={k} className="text-xs">
              <div className="flex justify-between"><span>{KIND_STYLE[k].label}</span><span className="font-mono tabular-nums text-ink-muted">{n} / {was}</span></div>
              <div className="mt-0.5 h-1.5 rounded-full bg-bg" title={`${n} of ${was} tokens left`}>
                <div className={`h-full rounded-full ${KIND_STYLE[k].fill}`} style={{ width: `${(n / was) * 100}%` }} />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
