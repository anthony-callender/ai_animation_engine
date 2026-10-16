# Source: public-safe facts for Video 3

Taken from _private/PORTFOLIO_VIDEO_HANDOFF.md, Video 3 (prepared 2026-10-09 from a read-only repository audit). The vendor, client, employer and platform names, regulation-specific labels, file names and endpoints are left out on purpose. Only "Tony Callender" may appear publicly.

These facts are the limit of what the video may say.

## Facts
1. Tony contributed backend integration work to a multi-tenant compliance and risk-management platform built with Ruby on Rails and serving religious organizations. The client is anonymous. [source + git]
2. His verified contributions include a large share of a background-screening vendor's integration service and webhook controller, plus work on the background-check model. [git/blame] Owning lines does not mean he wrote the whole feature alone.
3. The platform's work in this area includes a background-check and motor vehicle record (MVR) integration over SOAP and REST, and handling the vendor's webhooks. [source + git]
4. Other documented changes include an MVR launch for four customer groups, preventing duplicate background checks, preventing cross-group enrollment, and work on the screening consent flow. [git] Each is a separate change; do not merge them into one webhook story.
5. The original platform was built mostly by others, and an identity-scan feature is mainly another engineer's work. Tony claims specific integrations and changes only. [git]
6. Whether each feature is deployed is not independently confirmed, and production behaviour was not audited. [unknown]
7. API and webhook integration experience is directly supported. Speed, savings and event throughput are not measured.

## Do not claim
- That Tony built the whole platform, the vendor's backend, the identity-scan feature or coworkers' UI.
- That every step of a provider migration was his, or that it achieved zero downtime.
- Real-time delivery guarantees, latency, efficiency percentages, processing rates, error-free production, or any quantified business result.
- A live-looking webhook event animation presented as a real capture.
- That every part of a diagram is deployed, or that a diagram maps 1:1 onto a real execution trace. Label diagrams "Simplified architecture illustration".
- Vendor, client, platform or customer-group names, or private endpoints.
- Employer-owned source code. Showing it needs written permission (UNKNOWN), even redacted.
- Invented payload fields, status values, event names, ordering, retries or queues.

## Public terms and pronunciation
Ruby on Rails ("rails") · REST API (A-P-I) · SOAP ("soap") · webhook ("web-hook") · background screening · motor vehicle record (say it in full, then MVR) · status update · risk management.
