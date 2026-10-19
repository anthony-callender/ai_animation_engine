# Narration (Reel: sermon flywheel)

Facts come from Tony's built system (the allsaints repo README and the Video 1 source facts). The church is anonymous. Headline: HOW MY AI TURNS SUNDAY'S SERMON INTO A WEBSITE POST.
```
Every Sunday, a church records its service. Then someone has to turn the sermon into a website post by hand. Here's how my AI does it.

My sermon worker spots the new service video and pulls the transcript.

Then it finds where the sermon starts and ends inside the full service, using the liturgy as markers.

It cuts the sermon audio into an MP3, so people can listen on the website.

Next, my notes agent writes a summary and study notes, and flags anything the preacher didn't actually say.

The title, preacher and scripture come from the church's approved details, not from AI.

Then it creates a draft post in WordPress, with the audio, the notes and the readings. If it runs twice, duplicate checks stop a second post.

An editor reviews the draft and hits publish. Nothing goes live without a person.

Thirteen manual steps became one review. If you run a church or a church agency, comment BUILD and I'll send you a free teardown of your church website.
```

## Claim check
| Line | Source |
|---|---|
| Spots the new video, pulls the transcript | allsaints README: YouTube Data API / RSS, then captions or Whisper |
| Finds the sermon using liturgical markers | Video 1 fact 3 ("liturgical cues"); README "sermon boundaries" |
| MP3 | README: AllSaints_Agent sermon bounds + ffmpeg; MP3 attached to the draft |
| Notes agent; flags what wasn't said | README "structured notes + fidelity guards"; Video 1 fact 4 (checks AI notes for unsupported claims, flags items for review) |
| Title, preacher and scripture from approved details | Video 1 fact 4 |
| WordPress draft with audio, notes, readings | README (draft sermon + MP3 via REST); Video 1 fact 3 (attaches scriptures) |
| Duplicate checks | Video 1 fact 5 (video-ID check and HTTP 409 guard) |
| Editor publishes; nothing goes live alone | Video 1 fact 6 (operator-run, draft only) |
| Thirteen manual steps | Video 1 fact 1 |
| CTA "free teardown" | Grand Slam playbook: the free 3-point visitor teardown |

Review: approved by Tony on 2026-10-16.
