# Narration draft

Source: 01_voice/source.md (approved brief, 2026-10-12). Scratch voice for drafting; one paragraph per beat (1-7).
```
A number in a database doesn't always mean what a dashboard says it means. Filters and the application's own rules can change the answer.

I built an AI analytics agent that reads a Rails application's source code before it queries PostgreSQL. It runs on Python and the Claude Agent SDK.

Here's how a question flows through it. First, it searches the code for the real business definition.

Then it writes a query, and a read-only guard checks it: a single SELECT, no write keywords, checked tables and columns, a read-only transaction, and a time and row limit.

The answer comes back with its evidence: the code it read and the SQL it ran.

If a query tries to change data, the guard rejects it. And the agent has no shell, no file writes and no web access.

It isn't a claim that AI is infallible. It's AI analytics you can inspect and control. Need a reliable AI automation or integration? Let's talk.
```

## Claim check
| Beat | Sentence | Source |
|---|---|---|
| 1 | a database number vs. what a dashboard means; rules change the answer | Framing from the handoff script; no metric is cited |
| 2 | reads Rails source code before it queries PostgreSQL | Fact 2 |
| 2 | Python, Claude Agent SDK | Fact 4 |
| 3 | "Here's how a question flows" | Introduces the ILLUSTRATED RUN (labelled, not a recording) |
| 3 | searches the code for the business definition | Fact 2 (Read/Grep/Glob) |
| 4 | the five guard layers | Fact 5, all five named |
| 5 | answer with evidence: code read, SQL run | Fact 3 |
| 6 | change data rejected | Fact 5 (write-keyword check, read-only transaction) |
| 6 | no shell, no file writes, no web access | Fact 6 |
| 7 | not infallible; inspectable and controlled | Do-not-claim list (no accuracy claim) |

## Changes from the handoff draft
- "autonomous" was dropped. It is accurate, but it is a heavy word next to "controlled".
- "In this synthetic demonstration, you can see…" became "Here's how a question flows through it, step by step." There is no recording; the handoff's own fallback says to do this.
- "allowlisted tables" became "checked tables and columns". The source says sqlglot inspects tables and columns, not that there is an allowlist.
- "access restrictions" is now spelled out as "no shell, no file writes and no web access" (Fact 6).
- All five guard layers are named, because the guard is the visual centrepiece.

Review: approved as written by Tony on 2026-10-12 (see REVIEW.md).
