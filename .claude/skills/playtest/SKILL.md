---
name: playtest
description: "Record what a human tester actually said after playing Stack Kitchen (vs bots or online), appended verbatim into playtest.md, and update the README status to their call. Never generates a verdict, never interviews."
argument-hint: "[--notes <path>]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion
model: sonnet
agent: producer
---

## Purpose

A build is only worth what a human felt playing it. This skill writes that down
accurately, with as little friction as possible. **You do not play, score, or
judge, and you do not interview.**

## Step 1 — Get the note

Either the user pastes notes, `--notes <path>` points at a file, or you ask one
open question: "What did you notice playing it?" Nothing more. Take whatever
comes back, in whatever order. If the note is short, it stays short.

## Step 2 — Append to `playtest.md`, verbatim

Append-only, one dated section per session. Earlier sessions (including the
incubator history at the top) are never edited.

```markdown
## <YYYY-MM-DD>

<the note, exactly as given>

**Next status:** KEEP GOING | ONE MORE PASS | PAUSE
```

If the same date already has a section, suffix it: `## 2026-09-17 (2)`.

## Step 3 — Ask their call

> Where does this leave the game — **KEEP GOING**, **ONE MORE PASS** (one named
> change), or **PAUSE**?

| Their call | What you do |
|---|---|
| **KEEP GOING** | README status → `BUILDING`. Next: `/mechanic` (new) or `/tuning` (tune existing). |
| **ONE MORE PASS** | Note the **one** change. `/tuning` turns it into a doc edit before `/build`. |
| **PAUSE** | README status → `PAUSED`, one line on why in the README. Nothing is deleted. |

Update the README status card's **Last playtest** field.

## Rules

- Never write a verdict the tester did not give.
- Never soften a complaint into a design opportunity.
- Never add an observation the tester did not make.
- Never reshape the note into a template.
