# Source: public-safe facts for Video 1

Taken from _private/PORTFOLIO_VIDEO_HANDOFF.md, Video 1 (prepared 2026-10-09 from a read-only repository audit). Client, parish, clergy, employer and internal project names are left out on purpose. Only "Tony Callender" may appear publicly. The private mapping stays in _private/.

These facts are the limit of what the video may say. A fact marked CONDITIONAL may only be said or shown if the matching recording proves it.

## Facts
1. Posting each Sunday's sermon was a 13-step manual process done by a volunteer. [source-verified]
2. Tony built a Python worker that takes a recorded church service from YouTube and produces a **draft** WordPress sermon post. [source-verified]
3. It finds the sermon inside the longer service using liturgical cues, prepares the MP3 audio, attaches scripture, can generate AI notes, and posts through the WordPress REST API. [source-verified]
   - Qualification: the existing demo uses a local audio file (`--audio-file`), because fetching audio from YouTube previously failed with HTTP 403.
4. Title, preacher and scripture come from approved inputs and are treated as authoritative. AI notes are checked for unsupported claims, and items are flagged for review. [source-verified] Never call it "hallucination-proof".
5. Duplicates are prevented in two places: a video-ID check in the worker and a server-side HTTP 409 guard in WordPress. [source-verified]
6. The worker is **operator-run, not scheduled**. It creates a **draft**, and a human editor reviews and publishes it. [source-verified]
7. The wider project also included a WordPress rebuild, an AI assistant and a demo cloud deployment, but not an adopted production domain. Mention only briefly, if at all; this video's outcome is the sermon workflow.
8. CONDITIONAL: 64 Python worker tests passed during the 2026-10-09 inspection. Show a test result only if the tests are rerun and pass on camera.

9. Tony stated on 2026-10-12 that the sermon page shown in his capture ("18th Sunday after Pentecost 2026", September 27, 2026) was created by his Python worker and is on the client's live website. [Tony's statement; not independently verified]
10. Real capture C1: Tony's screen recording of that site (original file named in _private/captures/README.md, 2026-10-12). Only 0-9.5 s is used, cropped so the header logo, the site assistant panel and the URL are removed. It shows the sermon archive, the sermon page (title, date, "Listen to the sermon" player, "Watch the full service on YouTube", "The Readings") and the readings scrolling. The homepage part (church name, location, a person's photo) is not used.
    - Permission gate: the handoff marks permission to show client material as UNKNOWN. Cropping lowers the identification risk but does not grant permission. Confirm before publishing.

## Do not claim
- That it posts sermons automatically every Sunday, or runs unattended. No scheduling exists.
- That the client's production website was replaced, adopted or approved.
- Measured time or hours saved. "13 steps to one command plus editorial review" is a change to the workflow, not a measured metric.
- That fetching audio from YouTube always works.
- That AI decides the preacher or scripture. The approved metadata is authoritative.
- That the safeguards are perfect or the notes hallucination-free.
- Any parish name, service recording, clergy identity, or client or employer branding.

## Public terms and pronunciation
WordPress (word-press) · Python · REST API (A-P-I) · MP3 (em-pee-three) · YouTube · sermon draft · human review · idempotency (eye-dem-POH-ten-see; optional, drop it if it sounds forced). Internal project names are not used publicly.
