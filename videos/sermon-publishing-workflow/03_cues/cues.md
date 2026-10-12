# Cues

<!-- Storyboard revision 2, 2026-10-12. Not yet reviewed.
     Source: 01_voice/source.md (facts 1-10). Voice: AI scratch track (Eric), 61.2 s, to be re-timed when the final voice arrives.
     Look: navy #17263F background, teal #2B8980 and gold #D9B877 accents, readable cream text. The small generic engineer
     sits at a desk in the bottom-left corner of the illustrated scenes. He does not lip-sync and is hidden while the
     capture plays. The bottom caption band (y 146-180) stays clear.
     The three recording slots are replaced by an n8n-style ILLUSTRATED RUN (always labelled "not a recording") and one
     real capture, C1, cropped with no names. Offsets: Whisper timed "I" (I built) 0.15 s early and "remove" 0.7 s early.
     It also timed "Where" 0.9 s early, so that cue starts on "AI notes". -->

## problem "Publishing a Sunday sermon"
Chip: ILLUSTRATED WORKFLOW. A checklist card titled "Sermon posting (before)" fills with 13 unlabelled step boxes.

## problem.count "thirteen manual steps"
A large gold "13", with "manual steps / by a volunteer".

## flow "I built a Python" +0.15
Chip: ILLUSTRATED ARCHITECTURE. Recorded service → Python worker → WordPress draft → Editor review draws in node by node.

## flow.draft "into a WordPress draft"
The draft node turns teal and is tagged DRAFT.

## flow.operator "It runs when an"
An "operator starts it" button above the worker; a pulse runs to the draft (not to the editor).

## flow.nolive "nothing goes live on"
Gold plate: "Draft, not published".

## run "The worker finds the sermon"
Chip: ILLUSTRATED RUN · NOT A RECORDING. An n8n-style canvas on a dotted grid with 8 nodes in two rows, wired with curved connectors:
row 1: YouTube service → Find sermon (liturgical cues) → Prepare audio → Attach approved details
row 2: AI notes + claim check → Duplicate check → WordPress draft → Editor review
The YouTube node runs at once (spinner, then a green check and a "1 item" badge). The Find sermon node starts running.

## run.audio "prepares the audio"
Find sermon gets its check. Data dots travel to Prepare audio, which runs, then gets its check.

## run.attach "attaches the approved title"
Attach approved details runs, then gets its check. It shows small tags: title · preacher · scripture (no real values).

## run.flow "Here's how a run flows"
Data dots travel along the wire into row 2. AI notes, Duplicate check ("new → continue") and WordPress draft run one after another. Each gets its check in time for:

## run.draft "The result is a draft"
The WordPress draft node is highlighted with the tag DRAFT.

## run.notes "AI notes are turned on"
A focus ring moves to AI notes + claim check.

## run.flag "flagged for review"
A gold "⚑ flagged for review" badge appears on the AI notes node.

## run.editor "An editor checks the draft"
Editor review runs, then gets its check: "reviewed → published".

## capture "sermon page like this"
Engineer and canvas fade out. A pixel browser window (no URL bar) plays capture C1: the sermon archive, then the sermon page, then the readings scrolling.
Chip: REAL CAPTURE · NAMES HIDDEN.

## capture.listen "listen to the sermon"
A gold box sits around the "Listen to the sermon" player area when it is on screen in C1. If the clip shows something else at that moment, there is no box; it is never drawn over unrelated footage.

## rerun "Running the same video"
Back to the canvas. Chip: ILLUSTRATED RUN · NOT A RECORDING. A "Run 2" tag appears. Row 1 runs again quickly.

## rerun.dup "added duplicate checks"
The Duplicate check node turns amber: "already exists → skipped". WordPress draft is greyed with "no new post". A small note shows both guards: "worker check + WordPress 409 guard".

## close "That's how I approach"
Chip: ILLUSTRATED. The engineer returns. Three cards appear as they are spoken:

## close.steps "remove the repetitive steps" +0.7
"Fewer repetitive steps"

## close.safe "keep the safeguards"
"Safeguards kept"

## close.people "leave people in control"
"People in control"

## cta "Need a reliable AI"
"Need a reliable AI automation or integration? Let's talk." with gold "Tony Callender | Upwork". Hold to the end.
