# Animation & Voice Workspace

## First outcome
Open and export an eight-second silent teaching scene. Then replace its idea with your own, one reviewed stage at a time. This is an authored example with no speech or real assistant execution.

## Included
Custom JavaScript player and pixel/line/modern/blueprint helpers; app views and mixed looks; wide/tall scene and thumbnail starters; five stage contracts; portable assistant instructions; placeholder voice config; local licensed fonts; a synthetic project and reviewed export.

The Python CLI creates projects, compiles cues, captures stills, previews locally and renders video. Transcription, TTS and capture commands are optional.

## Setup on Windows
Install Python 3.10+, FFmpeg including ffprobe on PATH, and Chromium or Chrome. Extract the entire ZIP to a normal writable folder; open a terminal there.

    python -m venv .venv
    .\.venv\Scripts\python.exe -m pip install -r requirements.txt
    .\.venv\Scripts\python.exe -m playwright install chromium
    .\.venv\Scripts\python.exe doctor.py
    .\.venv\Scripts\python.exe anim.py --help

The first setup line uses your installed Python to create the environment. Every later Windows command names its exact Python executable; activation is unnecessary. Initial dependency/browser installation requires internet; included scenes/fonts and local export need no external requests afterward. Binaries are not bundled.

## Try the included project
    .\.venv\Scripts\python.exe anim.py status
    .\.venv\Scripts\python.exe anim.py stills silent-first-scene
    .\.venv\Scripts\python.exe anim.py studio

Open http://127.0.0.1:8765 and choose preview. Scrub PLAN, BUILD and REVIEW. Stop the server with Ctrl+C. Export with:

    .\.venv\Scripts\python.exe anim.py render silent-first-scene --workers 1

MP4: videos/silent-first-scene/05_render/. Create another synthetic exercise using '.\.venv\Scripts\python.exe demo.py my-first-lesson', optionally --format tall or --style line. Existing slugs are never overwritten. Create an empty real project using '.\.venv\Scripts\python.exe anim.py new my-real-lesson'.

## Real voice and transcription
Import your permitted recording with '.\.venv\Scripts\python.exe anim.py new my-recorded-lesson recording.wav'. For optional ElevenLabs, read _shared/voice.md and configure your own voice/model/key. Speech calls can use paid credits. None were made in package testing.

For optional Whisper, install into the same environment:

    .\.venv\Scripts\python.exe -m pip install -r requirements-transcription.txt

First use downloads model weights; models can need substantial RAM/GPU resources. Start smaller when appropriate. Transcription is separate from the tested silent exercise.

## Work with an assistant
Ask it to read AGENTS.md and START-HERE.md, agree on audience/outcome/sources, then follow stages one at a time. Claude, Codex and a manual workflow use the same contracts.

## Before sharing
Read LIMITATIONS.md and THIRD-PARTY-NOTICES.md. Keep folder structure, inspect captures, label simulations and watch the exported video. Status reports file presence, not approval. No upload/scheduling integration is included.
