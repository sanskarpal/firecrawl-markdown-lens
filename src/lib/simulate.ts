// Approximates what scrape options remove, for sample pages whose markdown is
// annotated with the HTML element each section came from. This is a local
// stand-in to make the options tangible, not Firecrawl's actual extractor.

export interface Section {
  el: string // e.g. "nav", "main", "div.cookie-banner", "aside.related"
  md: string
}

export interface SamplePage {
  id: string
  title: string
  url: string
  kind: string
  sections: Section[]
}

export interface ScrapeOptions {
  onlyMainContent: boolean
  excludeTags: string[]
}

export interface Removed {
  section: Section
  by: string // "onlyMainContent" or the excludeTags selector that matched
}

/** Elements treated as page chrome when onlyMainContent is on. */
export const CHROME_TAGS = ['header', 'nav', 'footer', 'aside']

interface ParsedEl {
  tag: string
  classes: string[]
  id: string | null
}

export function parseEl(el: string): ParsedEl {
  const tag = /^[a-z][a-z0-9]*/i.exec(el)?.[0].toLowerCase() ?? ''
  const classes = [...el.matchAll(/\.([\w-]+)/g)].map((m) => m[1])
  const id = /#([\w-]+)/.exec(el)?.[1] ?? null
  return { tag, classes, id }
}

/** Supports the selector shapes people put in excludeTags: tag, .class, #id, tag.class. */
export function matches(el: string, selector: string): boolean {
  const e = parseEl(el)
  const s = parseEl(selector.trim())
  if (!s.tag && !s.classes.length && !s.id) return false
  return (!s.tag || s.tag === e.tag) && s.classes.every((c) => e.classes.includes(c)) && (!s.id || s.id === e.id)
}

export function applyOptions(page: SamplePage, options: ScrapeOptions): { markdown: string; removed: Removed[] } {
  const kept: string[] = []
  const removed: Removed[] = []
  for (const section of page.sections) {
    const tag = parseEl(section.el).tag
    if (options.onlyMainContent && CHROME_TAGS.includes(tag)) {
      removed.push({ section, by: 'onlyMainContent' })
      continue
    }
    const selector = options.excludeTags.find((sel) => matches(section.el, sel))
    if (selector) {
      removed.push({ section, by: `excludeTags: ${selector}` })
      continue
    }
    kept.push(section.md.trim())
  }
  return { markdown: kept.join('\n\n'), removed }
}

/** The selectors on this page worth offering as excludeTags suggestions. */
export function suggestedSelectors(page: SamplePage): string[] {
  const out = new Set<string>()
  for (const s of page.sections) {
    const { tag, classes } = parseEl(s.el)
    if (tag === 'main' || tag === 'article') continue
    if (classes.length) out.add(`.${classes[0]}`)
    else out.add(tag)
  }
  return [...out]
}
