import { ClipboardPaste, FileText } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ChunksView } from './components/ChunksView'
import { Disclaimer } from './components/Disclaimer'
import { MarkdownView } from './components/MarkdownView'
import { OptionsPanel } from './components/OptionsPanel'
import { RequestView } from './components/RequestView'
import { ScoreCard } from './components/ScoreCard'
import { Card } from './components/ui'
import { fullMarkdown, PAGES } from './data/pages'
import { analyze, readiness } from './lib/blocks'
import { chunkMarkdown } from './lib/chunk'
import { scrapeBody } from './lib/request'
import { applyOptions, suggestedSelectors, type ScrapeOptions } from './lib/simulate'

const DEFAULT_OPTIONS: ScrapeOptions = { onlyMainContent: false, excludeTags: [] }
const TABS = ['Markdown', 'RAG chunks', 'Request'] as const
const PASTE_HINT = '# Paste any markdown\n\nTry the output of a scrape you already have. Noise detection and chunking run on any markdown.\n\n- [Home](/)\n- [Pricing](/pricing)\n- [Docs](/docs)\n\n© 2026 Example Inc. All rights reserved.'

export default function App() {
  const [pageId, setPageId] = useState<string>(PAGES[0].id)
  const [options, setOptions] = useState<ScrapeOptions>(DEFAULT_OPTIONS)
  const [pasted, setPasted] = useState(PASTE_HINT)
  const [maxTokens, setMaxTokens] = useState(200)
  const [tab, setTab] = useState<(typeof TABS)[number]>('Markdown')
  const [showRemoved, setShowRemoved] = useState(false)

  const page = PAGES.find((p) => p.id === pageId) ?? null
  const original = page ? fullMarkdown(page) : pasted
  const { markdown, removed } = useMemo(
    () => (page ? applyOptions(page, options) : { markdown: pasted, removed: [] }),
    [page, options, pasted],
  )
  const before = useMemo(() => readiness(analyze(original)), [original])
  const blocks = useMemo(() => analyze(markdown), [markdown])
  const after = useMemo(() => readiness(blocks), [blocks])
  const chunks = useMemo(() => chunkMarkdown(markdown, maxTokens), [markdown, maxTokens])
  const body = scrapeBody(page?.url ?? 'https://example.com', options)

  const pick = (id: string) => {
    setPageId(id)
    setOptions(DEFAULT_OPTIONS)
    setShowRemoved(false)
  }

  return (
    <div className="min-h-screen bg-bg">
      <Disclaimer />
      <header className="mx-auto max-w-7xl px-4 pt-10 pb-6 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="grid size-7 place-items-center rounded-md bg-brand text-sm font-bold text-on-brand">M</span>
          <span className="font-mono text-xs uppercase tracking-wider text-ink-muted">Markdown Lens</span>
        </div>
        <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          How <span className="text-brand">LLM-ready</span> is this scrape?
        </h1>
        <p className="mt-2 max-w-2xl text-ink-muted">
          See which parts of a page's markdown are navigation, cookie banners and footers, what the scrape options strip, how many tokens you save, and how the result chunks for RAG.
        </p>

        <div className="mt-6 flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-5" role="radiogroup" aria-label="Sample page">
          {PAGES.map((p) => (
            <button
              key={p.id}
              role="radio"
              aria-checked={pageId === p.id}
              aria-label={`${p.kind}: ${p.title}`}
              onClick={() => pick(p.id)}
              className={`min-w-56 rounded-xl border p-3 text-left transition sm:min-w-0 ${pageId === p.id ? 'border-brand bg-surface shadow-sm' : 'border-line bg-surface/60 hover:border-brand/40'}`}
            >
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-ink-muted"><FileText size={12} aria-hidden /> {p.kind}</div>
              <div className="mt-1 line-clamp-1 text-sm font-semibold">{p.title}</div>
              <div className="truncate font-mono text-[11px] text-ink-muted">{new URL(p.url).host}</div>
            </button>
          ))}
          <button
            role="radio"
            aria-checked={pageId === 'paste'}
            aria-label="Paste your own markdown"
            onClick={() => pick('paste')}
            className={`min-w-56 rounded-xl border border-dashed p-3 text-left transition sm:min-w-0 ${pageId === 'paste' ? 'border-brand bg-surface' : 'border-line hover:border-brand/40'}`}
          >
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-ink-muted"><ClipboardPaste size={12} aria-hidden /> Your own</div>
            <div className="mt-1 text-sm font-semibold">Paste markdown</div>
            <div className="font-mono text-[11px] text-ink-muted">runs in your browser</div>
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)] gap-4 px-4 pb-16 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-4">
          <ScoreCard before={before} after={after} />
          <OptionsPanel
            options={options}
            onChange={setOptions}
            suggestions={page ? suggestedSelectors(page) : []}
            disabled={!page}
            maxTokens={maxTokens}
            onMaxTokens={setMaxTokens}
          />
        </aside>

        <Card className="min-w-0">
          <div className="flex gap-1 border-b border-line px-3" role="tablist">
            {TABS.map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`border-b-2 px-3 py-3 text-sm font-medium ${tab === t ? 'border-brand text-ink' : 'border-transparent text-ink-muted hover:text-ink'}`}
              >
                {t}{t === 'RAG chunks' && <span className="ml-1 font-mono text-xs text-ink-muted">{chunks.length}</span>}
              </button>
            ))}
          </div>
          <div className="p-4">
            {!page && tab === 'Markdown' && (
              <textarea
                value={pasted}
                onChange={(e) => setPasted(e.target.value)}
                aria-label="Markdown to analyze"
                className="mb-4 h-40 w-full rounded-lg border border-line bg-bg p-3 font-mono text-xs outline-none focus:border-brand"
              />
            )}
            {tab === 'Markdown' && <MarkdownView blocks={blocks} removed={removed} showRemoved={showRemoved} onShowRemoved={setShowRemoved} />}
            {tab === 'RAG chunks' && <ChunksView chunks={chunks} maxTokens={maxTokens} />}
            {tab === 'Request' && <RequestView body={body} />}
          </div>
        </Card>
      </main>
    </div>
  )
}
