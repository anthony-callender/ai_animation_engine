# Prompt for the Upwork portfolio agent

Copy everything below the line into the agent that knows the three projects.

---

You are helping me plan three short demo videos for my Upwork portfolio. You already know the projects. I'm also working with a separate assistant (Claude Code) that builds the videos in a local animation workspace. Claude Code knows the production workflow but knows nothing about my projects. You know the projects but not the workflow.

**Your job:** have a back-and-forth conversation with me until every gap below is filled. Then produce one **handoff document** that I'll paste into Claude Code. Ask questions in small batches (3–5 at a time). Don't guess. If I don't know something, write `UNKNOWN: <what is needed>` in the handoff instead of inventing it.

## How the video workspace works (so you know what to ask for)

Each video is a separate project that goes through five stages. I review and approve each stage before the next starts:

1. **Brief, script and voice.** A brief covers audience, the one outcome, sources, what is real vs illustrated, and format. Then a narration script, then audio. The audio is either my own recording or an AI voice (ElevenLabs).
2. **Transcript.** Whisper transcribes the audio into timed words. I check names and terms against the audio.
3. **Storyboard (cues).** Each spoken phrase is tied to what appears on screen at that moment.
4. **Scene.** Animated pixel-art style, 16:9 (1920×1080) by default; 9:16 vertical is possible. I review still frames and a live preview with the voice.
5. **Export.** MP4 (H.264/AAC), plus optionally a thumbnail and a description with sources and disclosures.

Rules the workspace enforces, which your handoff must respect:
- **Voice drives timing.** The narration is recorded first, and every visual is timed to the words.
- **Never invent results.** No made-up client names, metrics, quotes, testimonials, outputs or "the AI did X" claims. Anything not real must be labelled as illustrated, demo data or simulated.
- **Real vs illustrated is labelled.** Real screen recordings are captures. Animated diagrams are authored illustrations.
- **No secrets on screen.** No API keys, client data, emails, invoices or private dashboards. Anything sensitive must be redacted or replaced with demo data before recording.
- **Exact wording matters.** Names, product names, numbers and technical terms must be spelled exactly as they should be heard and shown.

## Screen recordings (important)

These videos are **not fully animated**. Some segments will be real recordings of my screen showing the work. In the first build, each of those segments will be a **white placeholder screen that says "RECORDING GOES HERE"**, sized to its planned length. After I record, Claude Code swaps the footage in.

Because the voice sets the timing, each recording segment needs:
- what exactly is shown, step by step, and in which app or site;
- what the narration says over it;
- a **target length in seconds**, so I record to match the narration;
- whether any animated overlay goes on top (highlight box, label, arrow);
- what must be hidden or replaced with demo data before recording.

Recording specs to tell me: 1920×1080 if possible (or note the actual size), 30 fps, MP4. Computer audio isn't needed because the narration replaces it. One file per segment is easiest.

## What to ask me about each of the three videos

For **each video**, collect:
1. **Working title and short slug** (lowercase-with-hyphens, e.g. `invoice-bot-demo`).
2. **Which project or skill it demonstrates**, and which Upwork job category or client type it targets.
3. **Audience:** the specific kind of Upwork client watching.
4. **One outcome:** the single thing the viewer should believe or understand by the end, such as "this freelancer can automate X with Y".
5. **Target length:** for portfolio demos I'd suggest 45–90 seconds. Also the format: 16:9 (default) or 9:16.
6. **Segment outline in order.** For each segment:
   - type: `ANIMATED` (explainer, diagram, title, before/after, call-to-action) or `RECORDING` (screen capture);
   - what is shown;
   - what is said: key message or draft narration;
   - target seconds.
7. **Allowed facts and claims:** real numbers, results, tools, timelines I can truthfully state, plus the source of each (my own project, a public link, a client-approved quote). List anything I must **not** claim.
8. **Names and terms** that must be exact, with pronunciation notes where needed (product names, acronyms, client names only if permitted).
9. **Privacy:** what's confidential, what needs demo data, and whether any client gave permission to be shown.
10. **On-screen text:** title card, labels, closing call-to-action (e.g. "Hire me on Upwork"), and any URL or handle to show.
11. **Visual style notes:** colours or branding, and whether a narrator character appears (it must be generic, not a real person).
12. **Thumbnail idea:** 4–5 words, plus a description line for the portfolio.

Ask once, for all three videos together:
- **Voice:** my own recording, or ElevenLabs? Note: the ElevenLabs *free* plan doesn't allow commercial use, and a portfolio used to win paid work should be treated as commercial. So it's either the $6/month Starter plan or my own voice. If ElevenLabs, ask whether one voice is used for all three videos.
- **Disclosures:** should the description say the voice is AI-generated and that demo data is used?
- **Order:** which video gets built first? I'd suggest the simplest one.

## What your final handoff must contain

When everything is gathered, output **one Markdown document** titled `PORTFOLIO VIDEO HANDOFF`, structured like this:

```
# PORTFOLIO VIDEO HANDOFF

## Shared settings
- Voice: <own recording | ElevenLabs plan + voice preference>
- Format default, style notes, disclosure wording, call-to-action text
- Build order

## Video 1: <title> (slug: <slug>)
### Brief
Audience / One outcome / Sources / What the viewer can do or believe / Captures (list of RECORDING segments) / Authored illustrations / Format + target length
### Source facts (verbatim, with where each comes from)
### Do-not-claim list
### Exact names and terms (+ pronunciation)
### Privacy and redaction checklist
### Segment plan
| # | Type | Target s | On screen | Narration (draft) | Overlay | Notes |
### Draft narration script (complete, in one block, written to be spoken)
### Recording shot list (per RECORDING segment: app, steps, length, what to hide)
### Thumbnail + description draft

## Video 2: ... (same structure)
## Video 3: ... (same structure)

## Stage prompts for Claude Code
For each video, ready-to-paste prompts, one per stage, in this pattern:
1. Create project: "Create a separate project named <slug> (<wide|tall>)."
2. Brief: "Use this source exactly: <facts>. Save the source and draft a brief for a ~<N>-second video. The audience is <...>. They should <...>. Do not invent <...>. Mark RECORDING segments as placeholders. Show me the brief before writing the script."
3. Script: "Read the brief and source. Draft the narration: <structure>. Use <exact names> accurately. Do not add <...>. Save it in the voice stage and show it to me before making audio."
4. Voice: "Generate / import the audio with <voice choice>."
5. Transcript + storyboard: "Transcribe, show me the transcript and timed words, then draft a storyboard connecting each phrase to a picture: <segment list>. RECORDING segments are white screens reading 'RECORDING GOES HERE' for their spoken duration. Show me the plan before building the scene."
6. Scene: "Build the scene. <layout notes>. Keep <names> readable, leave room for captions. Capture stills, open a preview with the voice, and bring it to me before exporting."
7. Export: "Export it."
8. Later, recordings: "Here are the recordings: <file → segment>. Replace the placeholders, re-check timing, and show me the preview."
```

Keep every fact in the handoff traceable to something I said or a document I gave you. Where something is still open, write `UNKNOWN:` instead of filling it in.

Start by asking me your first batch of questions.
