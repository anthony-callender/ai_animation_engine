# Brief
- Working title: Background Screening with Webhooks. Portfolio title: Background Screening API & Webhook Engineering.
- Audience: insurance carriers and brokers serving churches, church risk-management organizations, background-screening and safeguarding providers, regulated SaaS teams, and MSPs with client integrations (Upwork clients).
- One outcome: Tony can build backend connections between outside screening vendors and production Rails applications, using APIs, webhooks and careful handling of record state.
- Viewer takeaway: This is real engineering experience backed by the source history. It is not a recreated customer transaction or a live demo.
- Sources: 01_voice/source.md only (facts 1 to 7 and the do-not-claim list). The client and vendor are anonymous, and the only name shown is Tony Callender.
- What the viewer should understand:
  1. Problem: connecting an outside screening provider is more than sending one API request. Checks have states, the provider sends updates later, and records do not always line up.
  2. What Tony worked on: Rails integration services and webhook handling for background checks and motor vehicle records (SOAP and REST).
  3. The hard part: keeping the app's records in step with outside events, including duplicates and edge cases.
  4. Related fixes: preventing duplicate background checks and other consistency work.
- Captures: none by default. V3-R1 (a code excerpt) needs written permission to show employer code, which is UNKNOWN, so its 12 s become an animated "service / controller" illustration labelled "No client source code shown".
  - Optional: a real clip only if Tony supplies one that is safe to show, with no client names, no personal data and no source code he lacks permission for. Same treatment as Videos 1 and 2.
- Illustrations (labelled "SIMPLIFIED ARCHITECTURE ILLUSTRATION"):
  - The app and an outside "screening provider" separated by a dotted boundary.
  - Request lanes: app → API service → provider (REST / SOAP).
  - Webhook lane: provider → Rails webhook handler → validation and duplicate check → record status updated → admin view.
  - A duplicate update being caught.
  - A layer stack: integration service | webhook controller | model.
  - The closing card.
  - Generic status words only ("requested", "update received", "updated"). No invented payload fields, event names or ordering.
- Format: wide 16:9, 1920x1080, 30 fps. About 55 to 65 s, set by the narration. The same brand and engineer as Videos 1 and 2.
- Closing card: "Need a reliable AI automation or integration? Let's talk." with "Tony Callender | Upwork". UNKNOWN: Upwork URL or handle.
- Gates before publishing:
  - Replace the scratch voice.
  - Nothing may suggest a live client transaction or real screening data.
  - Code may only be shown with written permission.
- Voice: AI scratch track (ElevenLabs free, Eric) for drafting.
- Review decision: Pending.
