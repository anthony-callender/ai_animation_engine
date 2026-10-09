# Reviews

Record date, reviewer and decision for voice, transcript, storyboard, preview and export.

## Voice: script
- 2026-10-09, reviewer: the workspace owner, through the Claude Code chat. Decision: 01_voice/script.md narration (78 words) approved as written.
- Voice plan: ElevenLabs free tier, voice Daniel (onwK4e9ZLuTAKqWW03F9, premade), model eleven_v4. Audio not generated or reviewed yet.
- The brief (01_voice/brief.md) has not been formally approved.

## Voice: audio
- 2026-10-09: 01_voice/voice.mp3 generated with `anim.py speak` (ElevenLabs free tier, eleven_v4, Daniel, mp3_44100_128). It is 33.7 s long, mono, 44.1 kHz. The 192 kbps format was refused on the free tier, so the format was changed to 128 kbps.
- Decision: pending. Nobody has listened to the full take yet.

## Transcript
- 2026-10-09: transcribed with Whisper `small` on CPU. It found 78 words, the same as the script (0 re-spelled). Pace was 141 wpm, which the tool flags as slow.
- Timing check: comparing with the audio's loudness, the second "Friday" (recap) starts about 24.9s, but words.json says 24.30. "Sam" before it is about 23.85 to 24.45. words.json has not been changed yet.
- Decision: pending. The audio itself has not been approved yet either.

## Storyboard
- 2026-10-09: draft in 03_cues/cues.md. It has not been compiled. Decision: pending.

## Cues (compiled)
- 2026-10-09: on the owner's instruction to build the scene, `anim.py cues` was run. All 19 phrases matched exactly; there were no fuzzy or missing matches.
- check.due was given a +0.6 s offset in cues.md (24.30 to 24.90) to fit the measured audio. words.json is unchanged.
- No explicit approval of the transcript or storyboard was recorded in chat. They were treated as reviewed because the owner asked for the scene to be built.

## Scene / preview
- 2026-10-09: 04_scene/scene.js built. Stills are in 05_render/stills and sheets. The preview is served by `anim.py studio`. Decision: pending. Nobody has watched the preview with the voice yet.
- 2026-10-09: the owner said "lets export it". This is recorded as the go-ahead to export. The chat did not say whether the preview was watched with sound.

## Export
- 2026-10-09: 05_render/meeting-note-explainer.mp4 rendered with `anim.py render --workers 1` and ANIM_OFFLINE=1. 1920x1080, 30 fps, H.264 + AAC mono 44.1 kHz, 33.66 s, 3.3 MB. FFmpeg decoded it with no errors, and the first, middle and last frames were inspected.
- Decision: pending. Nobody has watched the MP4 with sound yet. The thumbnail and DESCRIPTION.md have not been made.
