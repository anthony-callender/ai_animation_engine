# Brief
- Working title: An AI Agent That Reads the Rules. Portfolio title: Code-Grounded AI Analytics Agent | Claude, Python, SQL.
- Audience: B2B SaaS founders, insurance and risk-management operators, compliance software teams, and data-heavy agencies buying trustworthy AI integrations (Upwork clients).
- One outcome: Tony can build an AI analytics agent that reads the real application logic before it runs constrained, read-only database queries.
- Viewer takeaway: The design is about traceability and hard limits on what the tools can do. It is not a claim about accuracy, which has not been measured.
- Sources: 01_voice/source.md only (facts 1 to 9 and the do-not-claim list). The client is anonymous, and the only name shown is Tony Callender.
- What the viewer should understand:
  1. Problem: a number in a database does not always mean what a dashboard says; the application's rules define it.
  2. Approach: the agent reads the application's source code to find the business definition, then queries.
  3. Guardrails: a five-layer read-only SQL guard, and tool permissions with no shell, no writes and no web access.
  4. Output: the answer comes with its evidence (the source it read and the SQL it ran), so a person can check it.
- Captures: none. The handoff's recordings (V2-R1 agent chat, V2-R2 write rejection) are replaced by animation. They were blocked anyway, because no verified synthetic-only data environment exists, and this follows Tony's Video 1 preference for an animated run.
  - Optional later: a short real clip only if Tony supplies one that shows synthetic data, no source code and no names. It would be labelled "REAL CAPTURE / SYNTHETIC DATA".
- Illustrated agent run (labelled "ILLUSTRATED RUN / NOT A RECORDING"): a question card, then the agent reading a code snapshot (Read, Grep, Glob, with no real code shown), then a definition found, then the read-only SQL guard with its 5 checks lighting up, then a query, then an answer card with "evidence: source + SQL". The answer card has no real numbers; its values are generic placeholders marked "illustrative". A second beat shows a DELETE being rejected by the write check.
- Authored illustrations: the database-count-versus-rulebook opener, the architecture (source snapshot → Claude Agent SDK → SQL guard → answer), the five-layer guard, and the closing card.
- Format: wide 16:9, 1920x1080, 30 fps. About 55 to 65 s, set by the narration. The same navy, teal and gold pixel art and the same engineer as Video 1.
- Closing card: "Need a reliable AI automation or integration? Let's talk." with "Tony Callender | Upwork". UNKNOWN: Upwork URL or handle.
- Gates before publishing:
  - The voice must be Tony's own or a paid-plan render.
  - Nothing may suggest a live client system.
  - Any real clip must be verified as synthetic-only.
- Voice: AI scratch track (ElevenLabs free, Eric) for drafting, as in Video 1.
- Review decision: Approved by Tony on 2026-10-12 (see REVIEW.md).
