# Cues

<!-- DRAFT storyboard, 2026-10-12. Not yet reviewed.
     Source: 01_voice/source.md (facts 1-9). Voice: AI scratch track (Eric), 60.6 s, to be re-timed when the final voice arrives.
     Look and engineer: the same as Video 1 (navy/teal/gold; the afro engineer bottom-left, no lip-sync). The caption band stays clear.
     Nothing here is a recording. No real code, SQL, data, numbers, organization names or UI is shown: code lines are
     abstract bars, SQL is shown only as keywords with "...", and the answer value is a labelled placeholder.
     Offsets: Whisper timed "a" (a single SELECT) 0.5 s early, so that cue uses "single SELECT"; "Need" is 0.7 s early. -->

## problem "A number in a database"
Chip: ILLUSTRATED. A dashboard tile reads "Active accounts: ?" (no number). Below it, a database cylinder.

## problem.rules "Filters and the application's"
A code file labelled "app rules" slides in beside the database. A filter funnel sits between them, with the gold plate "The rules decide what counts".

## arch "I built an AI" 
Chip: ILLUSTRATED ARCHITECTURE. Left to right: Source code snapshot → AI agent → read-only SQL guard → PostgreSQL → Answer + evidence.

## arch.stack "It runs on Python"
Stack chips under the agent: Python · Claude Agent SDK · FastAPI · PostgreSQL.

## run "Here's how a question"
Chip: ILLUSTRATED RUN / NOT A RECORDING. A question card: "Example question: how many accounts count as active?" (labelled example).

## run.search "First, it searches the"
Tool cards tick in one by one: Read, Grep, Glob, over a code snapshot drawn as abstract bars. One bar highlights, then the stamp "Business definition found".

## run.query "Then it writes a"
A query card appears: "SELECT ..." (keyword only). It moves into the guard panel, which shows 5 empty check rows.

## guard.select "single SELECT"
Row 1 checks: "Single SELECT / WITH statement".

## guard.write "no write keywords"
Row 2 checks: "No write keywords".

## guard.tables "checked tables and columns"
Row 3 checks: "Tables and columns inspected (sqlglot)".

## guard.tx "read-only transaction"
Row 4 checks: "Read-only transaction".

## guard.limit "time and row limit"
Row 5 checks: "Timeout + row limit". The query passes through to PostgreSQL.

## answer "The answer comes back"
An answer card: "Answer: [value]" (with an "illustrative" tag) and two evidence tabs.

## answer.code "the code it read"
The "Code it read" tab lights and shows the definition bar.

## answer.sql "the SQL it ran"
The "SQL it ran" tab lights and shows "SELECT ...".

## reject "If a query tries"
A second query card, "DELETE ...", hits the guard. The "No write keywords" row turns red: "Rejected: write operation".

## reject.tools "And the agent has"
A permissions panel: Shell ✗ · File writes ✗ · Web access ✗.

## close "It isn't a claim"
Chip: ILLUSTRATED. The engineer returns. A card: "Not a claim of perfect AI".

## close.control "It's AI analytics you"
Two more cards: "Evidence you can check" and "Hard limits in code".

## cta "Need a reliable AI" +0.7
"Need a reliable AI automation or integration? Let's talk." with gold "Tony Callender | Upwork". Hold to the end.
