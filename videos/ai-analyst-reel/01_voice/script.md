# Narration (LinkedIn #12: "How do you test an AI analyst?"), approved by Tony 2026-11-09

From Tony's own comment-thread answer (Charles Pharber thread), lightly adapted. Style: dark UI reel modeled on videos/_inspiration/ig-DffO8yvD9EG.
```
How do you know your AI is as good as a person, when nobody logs the person's mistakes?

This question reminded me of an insurance company that needed compliance reports their dashboards couldn't cover. So I built them an AI analytics agent: their team asks the database questions in plain English, and it answers.

Now, this might come as a surprise, but even data analysis can be subjective.

Today's models are very good at analysis, but that doesn't guarantee answers that match how an organization does things.

This company didn't log their errors. Some do. So I didn't start there.

I created a gold dataset: a type of SOP for how the organization defines its metrics and tables. I mapped it from their dashboards, then walked the manager through it in plain English until he confirmed: "yes, this is how we define our metrics." That became the standard.

I wasn't building an AI that's good at data analysis. That's OpenAI's or Anthropic's job. I was building a good AI data analyst for that company.

The project manager then tested it with a simple check or X, and a comment box I custom coded.

I scored the AI against the gold dataset and used the feedback to improve it. We needed that rigor because it was compliance data: subjective and high risk.

Is this the same for all AI projects?

No. A simple voice agent for a local H-vack business can go live on day one without any of that.

It all depends on the risk, the needs, and the urgency of the organization.
```
