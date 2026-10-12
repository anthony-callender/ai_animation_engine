# Reviews

Record date, reviewer and decision for voice, transcript, storyboard, preview and export.

## Project setup
- 2026-10-10: created as wide 16:9 (1920x1080) with the pixel kit. The source of truth is _private/PORTFOLIO_VIDEO_HANDOFF.md, Video 1 (git-ignored, never exported).
- Owner decisions (2026-10-10): the target length is flexible, about 55-65 s, set by Tony's own narration. In public text and visuals, the only name shown is "Tony Callender". All client, employer, parish, vendor and clergy names are left out.

## Brief
- 2026-10-10, reviewer: Tony. Decision: 01_voice/brief.md and 01_voice/source.md approved as written. Fact 7 stays an optional brief mention. The Upwork URL is still UNKNOWN.

## Script
- 2026-10-12, reviewer: Tony. Decision: the 01_voice/script.md narration (141 words) is approved as written.
- Tony said he won't record his own voice for now, so the voice source is being decided again. The brief's "Tony's own recording" line is on hold until he chooses.

## Voice: scratch track
- 2026-10-12: Tony chose an AI scratch track for now. 01_voice/voice.mp3 was generated with ElevenLabs free, voice Eric (cjVigY5qzO86Huf0OWal), eleven_v4, mp3_44100_128. It is 52.1 s in 2 chunks.
- Free-plan audio is a draft only. Before publishing, replace it with Tony's own voice or a paid-plan render, then redo the transcript and timing.
- Whisper small check: it heard all 141 script words in order (1 spelling taken from the script), and there are no pauses longer than 0.9 s. words.json and transcript.md exist, but the transcript stage has not been reviewed.
- Decision on the audio: pending. Nobody has listened to it yet.
- 2026-10-12, reviewer: Tony. Decision: the scratch-track audio is approved for drafting.

## Transcript
- 2026-10-12: Whisper small heard 141/141 words matching the script. Checked against the pauses in the audio: "I" (I built) is about 0.24 s early and "Where" (Where AI notes) is about 0.85 s early. All segment boundaries are within 0.1 s. words.json is unedited. Decision: pending.

## Storyboard
- 2026-10-12: draft in 03_cues/cues.md. All 14 cues matched exactly. flow has a +0.2 offset. The placeholders are V1-R1 at 9.3 s, V1-R2 at 11.9 s and V1-R3 at 6.1 s. Decision: pending.
- 2026-10-12, reviewer: Tony. Decision: the transcript and the storyboard (03_cues/cues.md) are approved as drafted.

## Scene / preview
- 2026-10-12: 04_scene/scene.js built (brand colours set only in this project; the shared runtime is unchanged). 14 stills are in 05_render/stills. After the first stills, labels were wrapped and the cards enlarged. The preview is served by `anim.py studio`. Decision: pending. Nobody has watched it with sound yet.

## Revision 2: illustrated run and real capture (2026-10-12)
- Tony asked to drop the worker, WordPress and rerun recordings and animate the workflow in an n8n style instead. He also supplied his recording of the client site (original file named in _private/captures/README.md).
- Tony stated that the sermon page in the capture was created by his worker and is on the client's live site (source fact 9). Permission to show the client site is still UNKNOWN; this is a publication gate.
- C1 = clip 0-9.5 s, cropped to 990x750 at x372, y106. That removes the header logo, the site assistant panel and the URL bar; the homepage part (name, location, a person's photo) is excluded. The cropped copy is in _private/captures/; its frames are in 04_scene/assets/c1 (neutral file names).
- Script edits: "Here is a processing run." became "Here's how a run flows, step by step.", and the editor sentence now introduces the sermon page. The new Eric scratch take is 61.2 s, and Whisper heard 166/166 words matching. Offsets: flow +0.15 and close.steps +0.7; run.notes starts on "AI notes" because "Where" was timed 0.9 s early.
- The storyboard was rewritten (24 cues, all exact matches). The canvas is labelled "ILLUSTRATED RUN / NOT A RECORDING" and "Simplified: step order is illustrative". The rerun lights only the source-supported steps (start, then duplicate check skipped, then no new post).
- Decision on the script wording, storyboard and preview: pending.
- 2026-10-12, reviewer: Tony. Decision: the preview is approved ("perfect"), including the new engineer design (medium-brown skin, afro, sand sweater). Export is deferred by Tony's choice. Still open before publishing: replace the scratch voice, get permission to show the client site (C1), and the Upwork URL.
