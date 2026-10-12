# Source: public-safe facts for Video 2

Taken from _private/PORTFOLIO_VIDEO_HANDOFF.md, Video 2 (prepared 2026-10-09 from a read-only repository audit). The client, employer, platform and hosting names, internal URLs and source file names are left out on purpose. Only "Tony Callender" may appear publicly.

These facts are the limit of what the video may say.

## Facts
1. Tony built an autonomous analytics agent for a multi-tenant compliance platform that serves religious organizations. The client is anonymous.
2. Before it queries anything, the agent reads a snapshot of the application's Rails codebase with Read, Grep and Glob tools, so it can find the application's own business definitions. [source-verified]
3. It runs queries through a guarded, read-only SQL tool and returns its source evidence, the SQL and the data. [source-verified] Showing a successful end-to-end answer on screen would need a verified safe run; none exists, so any answer shown is illustrated.
4. Stack: Python with the **Claude Agent SDK**, **FastAPI**, a React/Vite front end and **PostgreSQL**, deployed as a two-container cloud service. [source-verified]
5. The SQL guard has five layers: it allows only a single SELECT or WITH statement; it checks for write keywords; it inspects tables and columns with `sqlglot`; it runs in a read-only transaction; and it applies a timeout and a row limit. [source-verified]
6. Tool permissions disallow shell, file writes and web access, and block selected secret paths. [source-verified] This is not a categorical guarantee against all data exposure.
7. Error handling, heartbeats and session handling were improved after earlier operational issues. [source-verified]
8. The admin UI embedded in Rails is on a development branch and is not shipped production UI.
9. There is no quantitative accuracy figure and no measured business savings. Key failures were recorded as of 2026-09-09, and there is no reliable benchmark since the fixes.

## Do not claim
- An accuracy figure ("99% accurate"), production-proven accuracy, a successful benchmark, hours or salary saved, or adoption metrics.
- That the agent guarantees correct counts or is PII-proof. The column blocklist does not cover every type of PII.
- That the Rails embed or its tool cards are on the deployed production site.
- RAG, embeddings or a vector store. The agent uses none.
- Real data, user records, company code, organization names, environment variables, internal URLs or identifiable source snippets.
- That the security model is complete or formally audited.

## Public terms and pronunciation
- Claude Agent SDK ("clawd") · Rails ("rails") · PostgreSQL · FastAPI ("fast A-P-I") · SQL (written "SQL" on screen) · read-only · source code · business logic.
- UNKNOWN: whether Tony says "sequel" or "S-Q-L", and "Postgres-Q-L" or "Postgre-S-Q-L". The scratch voice's choice is accepted for drafting only.
