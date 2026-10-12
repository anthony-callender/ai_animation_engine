# Transcript: code-grounded-analytics-agent

162 words, 01:00.6. Generated from words.json. Edit words.json, not this file.

`00:00.0` A number in a database doesn't always mean what a dashboard says it means.

`00:04.9` Filters and the application's own rules can change the answer.

`00:08.9` I built an AI analytics agent that reads a Rails application's source code before it queries PostgreSQL.

`00:15.5` It runs on Python and the Claude Agent SDK.

`00:18.8` Here's how a question flows through it.

`00:21.3` First, it searches the code for the real business definition.

`00:25.0` Then it writes a query, and a read-only guard checks it: a single SELECT, no write keywords, checked tables and columns, a

`00:33.2` read-only transaction, and a time and row limit.

`00:36.9` The answer comes back with its evidence: the code it read and the SQL it ran.

`00:42.2` If a query tries to change data, the guard rejects it.

`00:45.9` And the agent has no shell, no file writes and no web access.

`00:50.3` It isn't a claim that AI is infallible.

`00:53.0` It's AI analytics you can inspect and control.

`00:55.8` Need a reliable AI automation or integration?

`00:59.5` Let's talk.
