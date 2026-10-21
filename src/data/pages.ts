// Fictional pages, written the way a full-page scrape of each would come back
// as markdown: page chrome included. Each section records the element it came
// from so the option simulator knows what onlyMainContent / excludeTags hit.
import type { SamplePage } from '../lib/simulate'

const NAV_BLOG = `[Pinewood](https://pinewood.example/)

- [Product](https://pinewood.example/product)
- [Pricing](https://pinewood.example/pricing)
- [Customers](https://pinewood.example/customers)
- [Blog](https://pinewood.example/blog)
- [Docs](https://pinewood.example/docs)
- [Careers](https://pinewood.example/careers)
- [Sign in](https://pinewood.example/login)
- [Start free trial](https://pinewood.example/signup)`

const COOKIES = `We use cookies to improve your experience, analyze traffic and personalize content. By clicking "Accept all", you consent to our use of cookies. [Privacy settings](https://example.com/privacy) [Accept all](#) [Reject all](#)`

export const PAGES: SamplePage[] = [
  {
    id: 'blog', kind: 'Engineering blog post', title: 'How we cut p99 latency by 63%',
    url: 'https://pinewood.example/blog/p99-latency',
    sections: [
      { el: 'div.cookie-banner', md: COOKIES },
      { el: 'nav', md: NAV_BLOG },
      { el: 'main', md: `# How we cut p99 latency by 63%

*By Dana Whitfield · 9 min read · Posted in Engineering*` },
      { el: 'div.share-bar', md: `Share this post: [X](https://x.com/share) [LinkedIn](https://linkedin.com/share) [Hacker News](https://news.ycombinator.com/submit) [Copy link](#)` },
      { el: 'main', md: `![](https://pinewood.example/img/latency-hero.png)

Our ingestion API had a median latency of 41 ms, which looked great on dashboards. The p99 told a different story: 1.8 seconds, and climbing every time a large customer ran a backfill.

## Finding the tail

We started by sampling the slowest 1% of requests with full traces. Two patterns explained almost all of them: lock contention on a single hot partition, and garbage-collection pauses during large batch deserialization.

The partition problem came from our sharding key. We hashed on account ID, so one enormous account always landed on the same shard. During backfills, every write for that account queued behind a single lock.

## Fix 1: split hot accounts

We added a second-level key for accounts above a size threshold, spreading their writes across 16 sub-partitions. Reads fan out and merge, which costs a little at the median but removes the queue entirely.

\`\`\`go
func partitionFor(acct Account, eventID string) int {
    if acct.Hot {
        return hash(acct.ID+":"+strconv.Itoa(hash(eventID)%16)) % numPartitions
    }
    return hash(acct.ID) % numPartitions
}
\`\`\`

## Fix 2: stream instead of buffer

Batch requests used to be fully deserialized into memory before validation. We switched to a streaming decoder that validates and forwards events in fixed-size windows, so peak heap per request dropped from 300 MB to under 20 MB and GC pauses fell with it.

## Results

| Metric | Before | After |
| --- | --- | --- |
| p50 latency | 41 ms | 44 ms |
| p99 latency | 1,810 ms | 670 ms |
| Peak heap per batch | 300 MB | 18 MB |

The median got slightly worse and we decided that was fine. Nobody files a ticket about 3 ms; everyone notices two seconds.` },
      { el: 'aside.related', md: `## Related posts

- [Designing idempotent webhooks](https://pinewood.example/blog/idempotent-webhooks)
- [Our on-call handbook, open-sourced](https://pinewood.example/blog/oncall)
- [Postgres partitioning at 40 TB](https://pinewood.example/blog/partitioning)
- [Why we moved off Kafka (and back)](https://pinewood.example/blog/kafka)` },
      { el: 'div.newsletter', md: `**Get engineering posts in your inbox.** Subscribe to our newsletter: one email a month, no spam. [Subscribe](https://pinewood.example/newsletter)` },
      { el: 'footer', md: `[Product](https://pinewood.example/product) · [Security](https://pinewood.example/security) · [Status](https://status.pinewood.example) · [Privacy policy](https://pinewood.example/privacy) · [Terms of service](https://pinewood.example/terms) · [Contact](https://pinewood.example/contact)

© 2026 Pinewood Labs, Inc. All rights reserved.` },
    ],
  },
  {
    id: 'docs', kind: 'API reference', title: 'Create an invoice',
    url: 'https://docs.ledgerly.example/api/invoices/create',
    sections: [
      { el: 'header', md: `[Ledgerly Docs](https://docs.ledgerly.example) [API reference](https://docs.ledgerly.example/api) [Guides](https://docs.ledgerly.example/guides) [Changelog](https://docs.ledgerly.example/changelog) [Dashboard](https://app.ledgerly.example)` },
      { el: 'aside.sidebar', md: `- [Introduction](https://docs.ledgerly.example/api)
- [Authentication](https://docs.ledgerly.example/api/auth)
- [Errors](https://docs.ledgerly.example/api/errors)
- [Pagination](https://docs.ledgerly.example/api/pagination)
- [Customers](https://docs.ledgerly.example/api/customers)
- [Invoices](https://docs.ledgerly.example/api/invoices)
- [Create an invoice](https://docs.ledgerly.example/api/invoices/create)
- [Retrieve an invoice](https://docs.ledgerly.example/api/invoices/retrieve)
- [List invoices](https://docs.ledgerly.example/api/invoices/list)
- [Void an invoice](https://docs.ledgerly.example/api/invoices/void)
- [Payments](https://docs.ledgerly.example/api/payments)
- [Webhooks](https://docs.ledgerly.example/api/webhooks)` },
      { el: 'nav.breadcrumbs', md: `[API reference](https://docs.ledgerly.example/api) › [Invoices](https://docs.ledgerly.example/api/invoices) › [Create an invoice](https://docs.ledgerly.example/api/invoices/create)` },
      { el: 'main', md: `# Create an invoice

\`POST /v1/invoices\`

Creates a draft invoice for a customer. Line items can be added now or later; the invoice is not sent until you finalize it.

## Body parameters

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| customer | string | yes | ID of the customer to bill |
| currency | string | yes | Three-letter ISO code, lowercase |
| due_date | string | no | ISO 8601 date. Defaults to 30 days from creation |
| line_items | array | no | Up to 250 items, each with description, quantity and unit_amount |
| metadata | object | no | Up to 50 key-value pairs for your own use |

## Example request

\`\`\`bash
curl https://api.ledgerly.example/v1/invoices \\
  -H "Authorization: Bearer sk_test_..." \\
  -d customer=cus_8Hq2 \\
  -d currency=usd \\
  -d "line_items[0][description]=Consulting, March" \\
  -d "line_items[0][quantity]=12" \\
  -d "line_items[0][unit_amount]=15000"
\`\`\`

## Response

Returns the invoice object with \`status: "draft"\`. Amounts are integers in the currency's smallest unit.

## Errors

A \`400\` is returned when \`currency\` doesn't match the customer's default currency, or when a line item's \`unit_amount\` is negative. Use a credit note to reduce an amount instead.` },
      { el: 'div.feedback', md: `Was this page helpful? [Yes](#) [No](#)

[Edit this page on GitHub](https://github.com/ledgerly/docs)` },
      { el: 'footer', md: `© 2026 Ledgerly · [Status](https://status.ledgerly.example) · [Privacy policy](https://ledgerly.example/privacy) · [Terms](https://ledgerly.example/terms)` },
    ],
  },
  {
    id: 'product', kind: 'E-commerce product page', title: 'Ridgeline Trail Runner 2',
    url: 'https://ridgeline.example/products/trail-runner-2',
    sections: [
      { el: 'div.promo-bar', md: `Free shipping on orders over $75 · [Shop the sale](https://ridgeline.example/sale)` },
      { el: 'header', md: `[Ridgeline](https://ridgeline.example)

[Men](https://ridgeline.example/men) [Women](https://ridgeline.example/women) [Kids](https://ridgeline.example/kids) [Trail](https://ridgeline.example/trail) [Road](https://ridgeline.example/road) [Sale](https://ridgeline.example/sale) [Search](https://ridgeline.example/search) [Cart (0)](https://ridgeline.example/cart)` },
      { el: 'nav.breadcrumbs', md: `[Home](https://ridgeline.example) / [Trail](https://ridgeline.example/trail) / [Trail Runner 2](https://ridgeline.example/products/trail-runner-2)` },
      { el: 'main', md: `![Ridgeline Trail Runner 2, side view](https://ridgeline.example/img/tr2-side.jpg)

# Ridgeline Trail Runner 2

**$139.00** · ★★★★☆ 4.4 (212 reviews)

A lighter, grippier update to our best-selling trail shoe. The new lug pattern sheds mud faster, and the rock plate now runs the full length of the forefoot.

## Specs

| | |
| --- | --- |
| Weight | 9.6 oz (men's 9) |
| Drop | 6 mm |
| Stack height | 31 mm heel / 25 mm forefoot |
| Lugs | 5 mm, multidirectional |
| Waterproof | No (see Trail Runner 2 GTX) |

## Fit

Runs about a half size small. If you're between sizes, go up. The toe box is wider than version 1.

## What reviewers say

"Finally a trail shoe that doesn't feel like a brick on the road sections." Most complaints are about the laces coming untied.` },
      { el: 'section.recommendations', md: `## You may also like

- [Trail Runner 2 GTX](https://ridgeline.example/products/trail-runner-2-gtx)
- [Summit Pro](https://ridgeline.example/products/summit-pro)
- [Ridgeline Socks, 3-pack](https://ridgeline.example/products/socks)
- [Road Glide 4](https://ridgeline.example/products/road-glide-4)` },
      { el: 'footer', md: `[Help](https://ridgeline.example/help) · [Returns](https://ridgeline.example/returns) · [Store locator](https://ridgeline.example/stores) · [Privacy policy](https://ridgeline.example/privacy) · [Terms of use](https://ridgeline.example/terms)

© 2026 Ridgeline Outdoor Co.` },
    ],
  },
  {
    id: 'news', kind: 'News article', title: 'City council approves 24-hour bus lanes',
    url: 'https://harborgazette.example/2026/10/bus-lanes',
    sections: [
      { el: 'div.cookie-banner', md: COOKIES },
      { el: 'header', md: `[The Harbor Gazette](https://harborgazette.example) [News](https://harborgazette.example/news) [Politics](https://harborgazette.example/politics) [Business](https://harborgazette.example/business) [Sports](https://harborgazette.example/sports) [Opinion](https://harborgazette.example/opinion) [Subscribe](https://harborgazette.example/subscribe)` },
      { el: 'main', md: `# City council approves 24-hour bus lanes on three corridors

*By Marisol Vega · October 19, 2026*

![](https://harborgazette.example/img/bus-lane.jpg)

The city council voted 7–2 on Tuesday to make bus lanes on Fremont Avenue, Dock Street and the Eastside Parkway enforceable around the clock, ending the current weekday-only rule.

Transit officials said buses on the three corridors lose an average of 11 minutes per round trip to traffic outside peak hours, when cars are allowed in the lanes.` },
      { el: 'div.ad', md: `Advertisement` },
      { el: 'main', md: `Council member Ray Odum, who voted against the measure, said small businesses on Dock Street depend on evening curbside parking. The ordinance allows deliveries in marked zones between 6 a.m. and 10 a.m.

Enforcement cameras will begin issuing warnings in January and fines of $75 in March.` },
      { el: 'div.share-bar', md: `Share on Facebook · Share on X · Email this article` },
      { el: 'div.paywall', md: `**You've read 3 of 5 free articles this month.** Subscribe for unlimited access. [Subscribe now](https://harborgazette.example/subscribe)` },
      { el: 'footer', md: `© 2026 The Harbor Gazette. All rights reserved. [Privacy policy](https://harborgazette.example/privacy) · [Terms of use](https://harborgazette.example/terms) · [Cookie settings](#)` },
    ],
  },
]

export function fullMarkdown(page: SamplePage): string {
  return page.sections.map((s) => s.md.trim()).join('\n\n')
}
