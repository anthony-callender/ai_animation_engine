# Reviews

Record date, reviewer and decision for voice, transcript, storyboard, preview and export.

## Project setup
- 2026-10-12: created as wide 16:9 with the pixel kit. Source of truth: _private/PORTFOLIO_VIDEO_HANDOFF.md, Video 2.
- Carried over from Video 1: only "Tony Callender" is shown publicly; about 55-65 s; Eric scratch voice for drafting; animate instead of recording; same brand and engineer.

## Brief
- 2026-10-12: 01_voice/source.md and brief.md drafted. Decision: pending.
- 2026-10-12, reviewer: Tony. Decision: brief and source approved as written. Fully animated; the optional real clip is not supplied.

## Script
- 2026-10-12, reviewer: Tony. Decision: the 01_voice/script.md narration (162 words) is approved as written.

## Voice: scratch track
- 2026-10-12: 01_voice/voice.mp3 generated (ElevenLabs free, Eric, eleven_v4, 128 kbps). It is 60.6 s in 3 chunks. Whisper small heard 162/162 words in order. Decision on the audio: pending. Draft only; not licensed for publishing.

## Transcript and storyboard
- 2026-10-12: Checked against the pauses in the audio: "a" (a single SELECT) is about 0.5 s early and "Need" is about 0.7 s early. words.json is unedited. The storyboard draft is in 03_cues/cues.md. Decision: pending.
- 2026-10-12, reviewer: Tony. Decision: the scratch audio, the transcript and the storyboard are approved.

## Scene / preview
- 2026-10-12: 04_scene/scene.js built. The brand, helpers and engineer are copied from Video 1, and everything is labelled as illustrated. There is no real code, SQL, data, numbers or names: code is abstract bars, SQL is "SELECT ..." or "DELETE ...", and the answer is "[value]" tagged ILLUSTRATIVE. 20 stills are in 05_render/stills. After the first pass, layout was fixed (caption band clear, no overlaps). Decision: pending.

## Real captures (2026-10-12, in progress)
- Tony supplied two recordings of the agent in a test environment. He confirmed the test environment holds a copy of real client data, so no figures or organization names may appear.
- Tony's choice: show the agent trace and one chart with its values blurred. The cropped trace is in _private/captures (c2). It is not yet imported into the scene, and the scene has not been changed. The blurred chart still has not been made. Showing the client's system requires permission (publication gate).
- 2026-10-12, update: both captures are now in the scene.
  - C2 (trace, 04_scene/assets/c2, 208 frames at 8 fps) plays sped up during "First, it searches the code...", labelled REAL CAPTURE / TEST ENVIRONMENT / SPED UP.
  - C3 (status chart, y-axis numbers and title blurred) is shown at "The answer comes back...", labelled REAL CHART / VALUES BLURRED, beside the illustrated evidence card.
  - The question card now uses Tony's real question, so it matches C2. Stills were re-checked: no names, URLs or readable figures.
  - Preview decision: pending.
- 2026-10-12, update: Tony asked to add the text report with its numbers blurred. C4 (04_scene/assets/c4-report.png) stacks three report sections (overview and status table, monthly completions, "How These Numbers Are Defined"). Every figure is gaussian-blurred, and the diocese tables and named notes are excluded. It scrolls in a window from "The answer comes back" to "the code it read", labelled REAL REPORT / NUMBERS BLURRED. Charts: only the status chart is used, because the others have overlapping axis labels (the diocese charts) or would need more blurring. Preview decision: pending.
- 2026-10-12, reviewer: Tony. Decision: the preview is approved ("Perfect!"). Export is deferred. Still open before publishing: replace the scratch voice, get permission to show the client's system, decide whether the blurred real data is acceptable, and the Upwork URL.
