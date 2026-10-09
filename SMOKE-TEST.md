# Package validation — 2026-09-29

Passed on Windows with Python 3.10.11, Playwright 1.54.0, Pillow 12.1.1 and NumPy 2.2.6; FFmpeg/ffprobe and Chrome were already installed.

- Help, dependency check and status run.
- Synthetic project creation and cue compilation work. Existing project slugs refuse overwrite.
- Pixel/line × wide/tall template stills and thumbnails render.
- Two representative style gallery sheets render.
- Local Studio serves the relocated workspace; next-cue control works.
- Seeking 1.5s → 5s → 1.5s produces the identical first frame and a different middle frame.
- Eight-second export: 1920×1080, 30 fps, 240 frames, H.264 video + AAC silent audio. FFmpeg decoded the result without errors.
- No browser page errors or external requests in the preview test. Rendering ran with ANIM_OFFLINE=1.
- Placeholder voice config blocks speech generation before any provider request; dry-run works.
- No owner paths, key-shaped credentials, private folders or remote font links found in included text.

The first preview probe used a render-only readiness marker on the interactive page. The probe was corrected to inspect the actual preview bar and next-cue control; no runtime change was needed for that result.

TTS/API, voice cloning, Whisper/downloads, capture commands, clean-machine installation, every drawing primitive and Mac/Linux remain untested. See LIMITATIONS.md. This is technical validation by the packaging assistant; no human listening or course-content approval is claimed.
