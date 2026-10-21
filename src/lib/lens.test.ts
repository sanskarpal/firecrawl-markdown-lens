import { describe, expect, it } from 'vitest'
import { fullMarkdown, PAGES } from '../data/pages'
import { analyze, classify, estimateTokens, readiness, splitBlocks } from './blocks'
import { chunkMarkdown } from './chunk'
import { scrapeBody, toCurl, toPython } from './request'
import { applyOptions, matches, suggestedSelectors } from './simulate'

const page = (id: string) => PAGES.find((p) => p.id === id)!

describe('splitBlocks', () => {
  it('keeps fenced code together even with blank lines inside', () => {
    const md = 'Intro\n\n```js\nconst a = 1\n\nconst b = 2\n```\n\nAfter'
    expect(splitBlocks(md)).toEqual(['Intro', '```js\nconst a = 1\n\nconst b = 2\n```', 'After'])
  })
  it('puts headings in their own block', () => {
    expect(splitBlocks('# Title\nFirst line')).toEqual(['# Title', 'First line'])
  })
})

describe('classify', () => {
  it.each([
    ['- [Home](/)\n- [Pricing](/p)\n- [Docs](/d)', 'nav'],
    ['We use cookies to analyze traffic. [Accept all](#)', 'cookie'],
    ['© 2026 Acme, Inc. All rights reserved.', 'boilerplate'],
    ['Share on Facebook · Share on X', 'boilerplate'],
    ['Advertisement', 'boilerplate'],
    ['© 2026 Gazette. [Cookie settings](#)', 'boilerplate'],
    ['[Pinewood](https://pinewood.example/)', 'nav'],
    ['Free shipping on orders over $75 · [Shop the sale](/sale)', 'boilerplate'],
    ['![](https://x.test/hero.png)', 'media'],
    ['| a | b |\n| --- | --- |\n| 1 | 2 |', 'table'],
    ['Our API had a median latency of 41 ms. See [the dashboard](/d) for details.', 'content'],
  ])('%s → %s', (text, kind) => {
    expect(classify(text).kind).toBe(kind)
  })
})

describe('readiness', () => {
  it('scores the share of tokens that are content', () => {
    const blocks = analyze('Real paragraph about latency and partitions, long enough to count.\n\n- [A](/a)\n- [B](/b)\n- [C](/c)')
    const r = readiness(blocks)
    expect(r.noiseTokens).toBe(blocks[1].tokens)
    expect(r.score).toBe(Math.round((blocks[0].tokens / r.totalTokens) * 100))
  })
  it('estimates about four characters per token', () => {
    expect(estimateTokens('abcdefgh')).toBe(2)
    expect(estimateTokens('   ')).toBe(0)
  })
})

describe('applyOptions', () => {
  it('drops page chrome with onlyMainContent and named selectors with excludeTags', () => {
    const { removed } = applyOptions(page('blog'), { onlyMainContent: true, excludeTags: ['.cookie-banner', '.share-bar'] })
    expect(removed.map((r) => [r.section.el, r.by])).toEqual([
      ['div.cookie-banner', 'excludeTags: .cookie-banner'],
      ['nav', 'onlyMainContent'],
      ['div.share-bar', 'excludeTags: .share-bar'],
      ['aside.related', 'onlyMainContent'],
      ['footer', 'onlyMainContent'],
    ])
  })
  it('makes the blog post much more LLM-ready', () => {
    const before = readiness(analyze(fullMarkdown(page('blog')))).score
    const { markdown } = applyOptions(page('blog'), { onlyMainContent: true, excludeTags: ['.cookie-banner', '.share-bar', '.newsletter'] })
    const after = readiness(analyze(markdown))
    expect(after.score).toBeGreaterThan(before)
    expect(after.score).toBeGreaterThanOrEqual(95)
  })
  it('matches tag, class and combined selectors', () => {
    expect(matches('nav.breadcrumbs', 'nav')).toBe(true)
    expect(matches('nav.breadcrumbs', '.breadcrumbs')).toBe(true)
    expect(matches('nav.breadcrumbs', 'div.breadcrumbs')).toBe(false)
    expect(matches('main', '')).toBe(false)
  })
  it('suggests selectors for everything outside main', () => {
    expect(suggestedSelectors(page('docs'))).toEqual(['header', '.sidebar', '.breadcrumbs', '.feedback', 'footer'])
  })
})

describe('chunkMarkdown', () => {
  const md = applyOptions(page('blog'), { onlyMainContent: true, excludeTags: ['.cookie-banner', '.share-bar', '.newsletter'] }).markdown
  const chunks = chunkMarkdown(md, 120)
  it('never crosses a heading and records the heading path', () => {
    const fix1 = chunks.filter((c) => c.headingPath.at(-1) === 'Fix 1: split hot accounts')
    expect(fix1.length).toBeGreaterThan(0)
    expect(fix1.every((c) => c.headingPath[0] === 'How we cut p99 latency by 63%')).toBe(true)
  })
  it('keeps code blocks whole and respects the budget elsewhere', () => {
    const code = chunks.filter((c) => c.text.includes('func partitionFor'))
    expect(code).toHaveLength(1)
    expect(code[0].text).toContain('return hash(acct.ID) % numPartitions')
    expect(chunks.filter((c) => !c.oversize).every((c) => c.tokens <= 120)).toBe(true)
  })
  it('splits long prose at sentence boundaries', () => {
    const long = Array.from({ length: 30 }, (_, i) => `Sentence number ${i} is here.`).join(' ')
    const out = chunkMarkdown(long, 40)
    expect(out.length).toBeGreaterThan(1)
    expect(out.every((c) => c.text.endsWith('.'))).toBe(true)
  })
})

describe('request builders', () => {
  const body = scrapeBody('https://pinewood.example/blog/p99-latency', { onlyMainContent: false, excludeTags: ['.cookie-banner'] })
  it('produces the /v2/scrape body', () => {
    expect(body).toEqual({ url: 'https://pinewood.example/blog/p99-latency', formats: ['markdown'], onlyMainContent: false, excludeTags: ['.cookie-banner'] })
  })
  it('embeds valid JSON in curl and Python literals in Python', () => {
    const json = /-d '(.*)'/.exec(toCurl(body))![1]
    expect(JSON.parse(json)).toEqual(body)
    expect(toPython(body)).toContain('"onlyMainContent": False')
  })
})
