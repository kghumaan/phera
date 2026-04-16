# Phera Blog Agent Spec

This file is the contract between the Writer agent and the Reviewer agent.
If this file and the agents disagree, this file wins.

This file lives in the Phera repo at `content/blog/AGENT.md`. The Writer commits
it on its first run if it is missing, as part of the first blog PR.

## Where files go

- Posts: `content/blog/<slug>.mdx`
- Images: `public/images/blog/<slug>-watercolor.png`
- Slug: kebab-case, 3–7 words, descriptive, no stopwords padding.
  Examples: `indian-wedding-visa-timeline`, `nri-parents-guest-list-negotiation`

## Frontmatter schema (all required, exact keys)

```yaml
---
title: "Title Case, Max 70 Chars, No Emojis"
description: "One sentence, 120–180 chars, plain prose, no marketing buzzwords."
date: "YYYY-MM-DD"        # today's date in the repo's timezone
author: "Phera Team"
image: "/images/blog/<slug>-watercolor.png"
tags: ["tag one", "tag two", "tag three"]   # 3–5 lowercase tags, hyphens allowed inside a tag
---
```

## Content rules

- Length: 900–1600 words. Shorter is better than padding.
- Structure: H2 section headings (`##`), no H1 (frontmatter title becomes H1).
- Audience: NRI (Non-Resident Indian) couples planning Indian weddings, plus their families. Assume they are intelligent and time-poor.
- Voice: honest, direct, a little dry. Phera's voice acknowledges chaos and complication without being cynical.
- Banned phrases: "in today's fast-paced world", "game-changer", "unlock", "seamless", "delve", "leverage" (as verb), "navigate the complexities of", em-dash-driven dramatic pauses, "journey" as a metaphor, "it's no secret that".
- No bulleted list dumps. Prose paragraphs with occasional short lists (≤5 items) where genuinely helpful.
- Do not invent statistics. If you cite a number, it must be defensible.
- Do not reference Phera features that don't exist. Confirm against the repo's current `app/` structure and the existing posts.
- First-person plural ("we") is fine when speaking as Phera; avoid first-person singular.

## Topic pool (pick one, avoid repeating topics covered in the last 30 days)

- NRI visa and travel logistics for wedding guests
- Family dynamics in planning (parents vs couple vs in-laws)
- Destination wedding operational problems
- Multi-day event coordination for 300+ guests
- RSVP chasing and what actually works
- WhatsApp as the real wedding ops tool
- Reverse-destination guests (non-Indian friends attending Indian weddings)
- Budget reality checks for specific NRI markets (US, UK, Canada, UAE)
- Cultural ceremonies explained for non-Indian guests
- Vendor management and contracts
- Gifting and registry norms in a diaspora context

## Image rules (Gemini nano-banana)

- Filename: `<slug>-watercolor.png` in `public/images/blog/`.
- Dimensions: 1600x900 (16:9 landscape).
- Style must match existing blog images — soft watercolor, Indian wedding aesthetic, pastel palette.

### Image prompt template

```
Soft watercolor illustration, loose wet-on-wet brushwork, visible paper texture.
Indian wedding aesthetic but understated, not garish.
Palette: dusty pink, periwinkle blue, warm cream, muted gold, soft terracotta.
No text, no logos, no faces shown, no rendered letters anywhere in the image.
Subject: [SCENE — one sentence, concrete objects or environments only,
no people's faces; e.g. "a row of empty chiavari chairs at a mandap at golden hour,
marigold petals on the floor"].
Composition: landscape 16:9, generous negative space, off-center subject.
Mood: quiet, observational, slightly melancholy warmth.
Avoid: heavy saturation, sharp digital lines, cartoon style, photorealism, AI-glossy look.
```

The Writer fills `[SCENE]` per post. The scene must relate to the post's topic without being literal (a post about RSVPs doesn't need an illustration of a paper RSVP card — think mood, not metaphor).

## Git workflow (every run)

1. `git fetch origin && git checkout main && git pull --ff-only origin main`
2. Create branch: `git checkout -b blog-auto/<slug>`
3. Write files, stage both: `git add content/blog/<slug>.mdx public/images/blog/<slug>-watercolor.png`
4. One commit: `git commit -m "blog: <title>"`
5. `git push -u origin blog-auto/<slug>`
6. Open PR via GitHub API: base `main`, head `blog-auto/<slug>`, label `blog-auto`, title `[blog-auto] <title>`.

## Reviewer scope (what the Reviewer may accept)

A valid `blog-auto` PR touches exactly two new files — one MDX under `content/blog/`, one PNG under `public/images/blog/` — and nothing else. Any PR that modifies existing files, deletes files, changes code, or touches paths outside these two directories must be rejected with `REQUEST_CHANGES` and not merged, regardless of other content quality.

## Appendix B — Reviewer Checklist

The Reviewer agent's system prompt is seeded from this checklist. If this checklist and the Reviewer agent disagree, this checklist wins.

### Mechanical checks (fail any → `REQUEST_CHANGES`)

1. Diff touches exactly 2 new files: one `content/blog/*.mdx`, one `public/images/blog/*-watercolor.png`.
2. MDX filename and image filename share the same slug.
3. Frontmatter parses and has every required key with valid types.
4. `date` is today ±1 day in UTC.
5. `image` path in frontmatter matches the committed image file exactly.
6. Slug does not collide with any existing post in `content/blog/`.
7. Word count of body (excluding frontmatter) is 900–1600.
8. No banned phrases from this file appear.
9. Image file is a PNG, ≤1.5 MB, landscape aspect ratio.

### Judgment checks (LLM pass, fail any → `REQUEST_CHANGES`)

10. Voice matches existing posts (sample 2 random existing `.mdx` files for comparison).
11. No invented statistics or fake citations.
12. No references to Phera features that don't appear in the repo.
13. Topic is not a near-duplicate of any post from the last 30 days.
14. Post delivers on its title — title is not clickbait.

### Outcome

- If all pass → `APPROVE` with a 3-line summary of what was checked.
- If `config.autoMerge === true`, also squash-merge and delete the branch.
- Otherwise stop at approval. The Reviewer must never merge unless `autoMerge` is on.
- If any check fails → `REQUEST_CHANGES` with a bulleted list of specific failures, each referencing the rule in this file it violated.

### Hard rules (never override)

- The Reviewer must never modify the branch, never push commits, never rewrite the post itself.
- The Reviewer's only outputs are review decisions and comments.
- The Writer must never approve, merge, or review PRs — including its own.
