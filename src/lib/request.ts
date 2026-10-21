import type { ScrapeOptions } from './simulate'

export const ENDPOINT = 'https://api.firecrawl.dev/v2/scrape'

/** The /v2/scrape body for these options. onlyMainContent is always explicit so the request reads unambiguously. */
export function scrapeBody(url: string, options: ScrapeOptions): Record<string, unknown> {
  const body: Record<string, unknown> = { url, formats: ['markdown'], onlyMainContent: options.onlyMainContent }
  if (options.excludeTags.length) body.excludeTags = options.excludeTags
  return body
}

export function toCurl(body: Record<string, unknown>): string {
  return [
    `curl -X POST ${ENDPOINT} \\`,
    `  -H "Authorization: Bearer $FIRECRAWL_API_KEY" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '${JSON.stringify(body)}'`,
  ].join('\n')
}

export function toJs(body: Record<string, unknown>): string {
  return [
    `const res = await fetch('${ENDPOINT}', {`,
    `  method: 'POST',`,
    `  headers: {`,
    `    Authorization: \`Bearer \${process.env.FIRECRAWL_API_KEY}\`,`,
    `    'Content-Type': 'application/json',`,
    `  },`,
    `  body: JSON.stringify(${JSON.stringify(body, null, 2).replace(/\n/g, '\n  ')}),`,
    `})`,
    `const { data } = await res.json()`,
    `console.log(data.markdown)`,
  ].join('\n')
}

export function toPython(body: Record<string, unknown>): string {
  const py = JSON.stringify(body, null, 4).replace(/\btrue\b/g, 'True').replace(/\bfalse\b/g, 'False').replace(/\bnull\b/g, 'None')
  return [
    'import os, requests',
    '',
    'res = requests.post(',
    `    "${ENDPOINT}",`,
    '    headers={"Authorization": f"Bearer {os.environ[\'FIRECRAWL_API_KEY\']}"},',
    `    json=${py.replace(/\n/g, '\n    ')},`,
    ')',
    'print(res.json()["data"]["markdown"])',
  ].join('\n')
}
