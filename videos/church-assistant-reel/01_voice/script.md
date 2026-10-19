# Narration (Reel: church website assistant)

Facts come from Tony's built plugin (allsaints, asc-digital-ministry: class-chat-api.php, class-kb.php, README). The church is anonymous. Headline: HOW MY AI CHURCH ASSISTANT ANSWERS VISITORS AT 9 PM.
```
At 9 PM, a visitor opens a church website and asks, what time is service, and is there anything for my kids? My church assistant answers in seconds.

But it doesn't make things up. The church writes its knowledge once: service times, kids ministry, parking, beliefs, and who to contact.

When a question comes in, the assistant pulls the approved knowledge that matches it.

Then it answers like a friendly person texting back, using only those facts. And it remembers the conversation, so follow-up questions just work.

If the answer isn't in the church's knowledge, it says it's not sure and points them to the church office, instead of guessing.

If someone shares a struggle or a prayer request, it responds with warmth and points them to a real person.

And when the church edits its knowledge, the assistant updates on its own.

It lives right inside the church's WordPress site, so the volunteer who runs it stays in control.

It's a front door that's open at 9 PM, without adding staff busywork. If you lead a church or a church agency, comment BUILD and I'll send you a free teardown of your church website.
```

## Claim check
| Line | Source |
|---|---|
| Answers in seconds; friendly; remembers the conversation | README "conversational AI chat (streamed replies, remembers the conversation)"; system prompt ("helpful person texting back"; follow-ups use the conversation) |
| Church writes knowledge once | Church Knowledge custom post type (class-kb.php) |
| Pulls the matching approved knowledge | class-chat-api.php knowledge(): all knowledge, or the 8 most relevant passages by embedding search |
| Only those facts; not sure, so the church office | System prompt: "must come only from the Church knowledge… If something isn't covered there, say plainly that you're not sure and suggest contacting the church office" |
| Struggle or prayer request, so warmth and a real person | System prompt: "respond with real warmth, and gently point them to the prayer request page or the church office" |
| Updates when the church edits | class-kb.php: save_post hooks sync_index (re-index on save) |
| Inside WordPress; volunteer in control | README core principle (volunteer site manager runs a normal WordPress site) |
| CTA "free teardown" | Grand Slam playbook: the free 3-point visitor teardown |

Review: approved by Tony on 2026-10-16.
