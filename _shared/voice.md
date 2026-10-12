---
voice_id: cjVigY5qzO86Huf0OWal
model: eleven_v4
stability: natural
format: mp3_44100_128
---
# Your voice setup

The starter is silent and needs no account or key. Record your own voice or import audio you have permission to use.

Optional ElevenLabs adapter: choose a voice available to your account and a supported model. Replace both placeholders above. Put your own key in a local .env as ELEVEN_API_KEY=... or use the ELEVENLABS_API_KEY environment variable. Never share that file.

The command 'python anim.py speak my-lesson --dry-run' only shows chunks. '--check' contacts the provider to inspect availability. 'speak my-lesson' sends your script and can use paid credits. No API calls were tested for this package.

The first fenced block in script.md is narration. Use natural paragraphs; the adapter chunks roughly 250–700 characters. Audio tags, stability and format depend on the selected provider/model. Adapter presets: creative=0, natural=0.5, robust=1; these are not universal voice settings.

Listen to the complete recording. Correct names and facts before transcription. Model agreement is a diagnostic clue; the audio and a person's review settle disagreements.
