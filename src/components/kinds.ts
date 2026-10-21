import type { BlockKind } from '../lib/blocks'

/** Label and colors per block kind; noise kinds get a colored left bar. */
export const KIND_STYLE: Record<BlockKind, { label: string; bar: string; chip: string; fill: string }> = {
  content: { label: 'content', bar: 'border-transparent', chip: 'bg-bg text-ink-muted', fill: 'bg-line' },
  heading: { label: 'heading', bar: 'border-transparent', chip: 'bg-bg text-ink-muted', fill: 'bg-line' },
  code: { label: 'code', bar: 'border-transparent', chip: 'bg-bg text-ink-muted', fill: 'bg-line' },
  table: { label: 'table', bar: 'border-transparent', chip: 'bg-bg text-ink-muted', fill: 'bg-line' },
  nav: { label: 'navigation', bar: 'border-brand', chip: 'bg-brand/10 text-brand-hover', fill: 'bg-brand' },
  cookie: { label: 'cookie banner', bar: 'border-brand-3', chip: 'bg-brand-3/15 text-[#8a6500]', fill: 'bg-brand-3' },
  boilerplate: { label: 'boilerplate', bar: 'border-[#9061ff]', chip: 'bg-[#9061ff]/10 text-[#6b3fe0]', fill: 'bg-[#9061ff]' },
  media: { label: 'image only', bar: 'border-ink-muted', chip: 'bg-bg text-ink-muted', fill: 'bg-ink-muted' },
}
