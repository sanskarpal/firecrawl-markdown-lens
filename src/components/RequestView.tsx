import { Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { toCurl, toJs, toPython } from '../lib/request'

const LANGS = [
  { id: 'curl', label: 'cURL', render: toCurl },
  { id: 'js', label: 'JavaScript', render: toJs },
  { id: 'python', label: 'Python', render: toPython },
] as const

export function RequestView({ body }: { body: Record<string, unknown> }) {
  const [lang, setLang] = useState<(typeof LANGS)[number]['id']>('curl')
  const [copied, setCopied] = useState(false)
  const code = LANGS.find((l) => l.id === lang)!.render(body)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-ink-muted">The request that asks Firecrawl for this result. It updates as you change options.</p>
      <div className="overflow-hidden rounded-lg border border-[#2b2b2b] bg-[#161616]">
        <div className="flex items-center justify-between border-b border-[#2b2b2b] px-2">
          <div className="flex" role="tablist">
            {LANGS.map((l) => (
              <button
                key={l.id}
                role="tab"
                aria-selected={lang === l.id}
                onClick={() => setLang(l.id)}
                className={`border-b-2 px-3 py-2 font-mono text-xs ${lang === l.id ? 'border-brand text-white' : 'border-transparent text-[#9a9a9a] hover:text-white'}`}
              >
                {l.label}
              </button>
            ))}
          </div>
          <button onClick={copy} className="flex items-center gap-1 px-2 py-1 text-xs text-[#9a9a9a] hover:text-white" aria-label="Copy code">
            {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed text-[#ededed]">{code}</pre>
      </div>
    </div>
  )
}
