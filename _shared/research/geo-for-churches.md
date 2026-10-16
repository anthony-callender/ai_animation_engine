# GEO for churches: sourced fact sheet

Researched 2026-10-14 for the GEO reel and the "get your church found" checklist.

**Rule:** scripts may only say what is in **Usable claims**. Anything in **Contested** or **Avoid** stays out, or is stated with the uncertainty spelled out.

## Usable claims (primary sources)

### Google: GEO is still SEO
Source: Google Search Central, "Optimizing for generative AI search" (guide published 2026-05-15).
- Guide: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Announcement: https://developers.google.com/search/blog/2026/05/a-new-resource-for-optimizing

1. Google calls AEO and GEO SEO: "optimizing for generative AI search is optimizing for the search experience, and thus still SEO." Its AI features (AI Overviews, AI Mode) use its core ranking and quality systems.
2. Eligibility: a page must be "indexed and eligible to be shown in Google Search with a snippet." The site must also be included in generative AI features in Search Console. This setting is still in testing, so confirm it in the site's own account.
3. Content: provide "a unique point of view"; "Don't just recycle what others on the internet have already said." Add high-quality images and video where they fit.
4. Local: Google Business Profiles "can help your products and services to be visible in both AI responses and other Google Search results."
5. Structured data "isn't required for generative AI search". Google still recommends it as part of SEO, for rich results.
6. Not needed for Google Search:
   - llms.txt and special AI files: "Google Search itself doesn't use them". They neither help nor hurt.
   - Chunking content into tiny pieces: "There's no ideal page length."
   - Rewriting content in special "AI phrasing".
7. "Seeking inauthentic 'mentions' across the web isn't as helpful as it might seem."
8. Measurement: use the Generative AI performance report in Search Console. Be wary of tools that promise rankings or claim access to Google's internal metrics.
9. Google's spam policies also apply to AI answers (clarified August 2026, per coverage of Search Central updates).

### OpenAI: ChatGPT search
Source: https://developers.openai.com/docs/bots
10. "To help ensure your site appears in search results, we recommend allowing OAI-SearchBot in your site's robots.txt file." Sites that block OAI-SearchBot are not shown in ChatGPT search answers, though they can still appear as navigational links.
11. GPTBot (training) and OAI-SearchBot (search) are separate. A church can allow search and still block training.
12. ChatGPT-User fetches pages when a user asks. It is not what decides search inclusion.

### Schema
13. schema.org has a `Church` type, which is a kind of `PlaceOfWorship`. `Event` and `FAQPage` types also exist. Use them as normal SEO markup, not as a GEO "trick" (see 5).

## Contested (do not state as fact)
- **The Princeton GEO paper** (Aggarwal et al., arXiv 2311.09735, KDD 2024) reported visibility gains from adding quotations, statistics and citations, with keyword stuffing doing worst. Secondary sources quote conflicting percentages. Newer work, including a 2026 arXiv paper and the C-SEO Bench, found that such tactics often fail to improve citation visibility consistently, while relevance keeps working. Safe wording: "early research suggested…; newer studies disagree."
- **Where ChatGPT gets local business data:** vendor tests disagree. Bing, Yelp and Foursquare are all claimed, with contradictory numbers, and OpenAI has published nothing primary. Safe wording: "AI tools also read listings and reviews on other sites, not just your website."
- **Third-party share of AI citations** ("68%", "Reddit #1") and **"X% of people use AI to find a church or business"**: these are unverified vendor statistics. Don't quote numbers.

## Avoid
- Promising that a church "will show up" or "rank #1" in ChatGPT. No one controls that, and Google warns about tools that promise it.
- Telling churches to add llms.txt or special AI files for Google.
- Buying, faking or spamming "mentions" or reviews.
- Any statistic without a primary source.

## Church-specific translation (built only on the claims above)
| Step | What a church does | Basis |
|---|---|---|
| 1 | Make sure the site can be found at all: indexed, fast, not blocking OAI-SearchBot, included in AI features in Search Console | 2, 10 |
| 2 | Complete the Google Business Profile (service times, photos, website) and keep listings consistent elsewhere | 4; contested note on other listings |
| 3 | Answer real visitor questions in plain words on the site: service times, kids' ministry, what to expect, parking, beliefs | 3 (non-commodity, useful content) |
| 4 | Publish what only your church has: sermons, stories, events, photos and video | 3 |
| 5 | Earn genuine reviews and mentions (local news, community events). Never fake them | 7, 9 |
| (+) | Add Church / Event / FAQ structured data as normal SEO hygiene | 5, 13 |
| Check | Ask ChatGPT and Google's AI the questions families ask, and watch the Search Console Generative AI report | 8 |

## Secondary sources consulted (vendor and industry; context only)
- https://www.searchenginejournal.com/googles-new-ai-search-guide-calls-aeo-and-geo-still-seo/575026/
- https://searchengineland.com/google-publishes-guide-on-optimizing-for-generative-ai-features-477671
- https://arxiv.org/pdf/2604.19113 (citation-visibility study)
- https://www.localfalcon.com/blog/chatgpt-local-search-data-sources-where-does-business-info-come-from
- https://www.epiclifecreative.com/church-ai-visibility-check/
- https://missionalmarketing.com/church-seo-geo-ai-search-for-churches/ (note: a warm lead in Tony's pipeline also sells GEO)
- https://reachrightstudios.com/blog/ai-seo-for-churches/
