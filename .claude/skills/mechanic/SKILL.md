---
name: mechanic
description: "Add one new mechanic to Stack Kitchen as its own design doc, specified as MDA. One mechanic, one file. Use whenever a new system, rule, or feature is being added."
argument-hint: "<mechanic name>"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion
model: sonnet
agent: game-designer
---

## Purpose

Every mechanic added to the game gets its own one-page doc. Not a section in a
growing mega-doc — its own file, so it can be read, changed, or cut on its own.

## Step 0 — Preconditions

Read `design/00-core.md` and every doc the new mechanic would touch. Then ask
one question before designing anything: **what is this mechanic fixing or
adding, and how would we know it worked?** If the answer is "more content",
say so and offer to cut it. If a playtest note asked for it, quote the line
from `playtest.md`.

## Step 1 — Number and name the file

`design/NN-<slug>.md` where `NN` is the highest existing number + 1 (`00` is
the core). Numbers are permanent; a cut mechanic keeps its file with
`Status: CUT` and its number is never reused.

## Step 2 — Write it

Written in Vietnamese (MDA labels, aesthetic names, `Status:` values and
identifiers stay English). Write directly, section by section, and show each
section after it lands.

```markdown
# NN — <Mechanic Name>

**Status:** DRAFT
**Attaches to:** <which part of the loop this hooks into>

## Overview
One paragraph, in the words you would use to explain it to a player.

## MDA

**Mechanics** — rules, inputs, states, transitions, numbers. A programmer
implements from this section alone.

**Dynamics** — what a real player does with these rules, including at least one
degenerate behaviour and what stops it. Consider solo-vs-bots and online separately.

**Aesthetics** — Primary: <one of the eight>. Secondary: <or none>.
How it serves the core loop's aesthetic rather than competing with it.

## Rules
Numbered, unambiguous. Every branch stated. For each rule: what happens offline,
what happens online (who sees it, who decides, what the host sends).

## Numbers
| Value | Default | Range | VALIDATED / GUESS | Why |

## Edge cases
At zero, at maximum, on disconnect, on timeout, when two of these collide.

## Depends on
Other docs this reads from or writes to. "Everything" means split it.

## Done when
What a human must be able to do on screen — in Play vs Bots and in an online
room — for this to count as built.
```

## Rules of the format

- **One page.** Two only when the rules genuinely need it.
- Every mechanic has an MDA block. No aesthetic named → not designed yet.
- Never restate a rule that lives in another doc. Link it.
- Every number tagged VALIDATED or GUESS.
- Hidden information is a rule: say explicitly what each seat can and cannot see.

## After writing

Add a ticket to `backlog.md`'s Open table pointing at this file, then hand to
`/build`.
