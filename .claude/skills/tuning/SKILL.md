---
name: tuning
description: "Turn a human's recorded playtest note into a specific, traceable edit to the existing Stack Kitchen doc(s) it's about, then a ticket. Never invents tuning beyond what was said. Use after /playtest when the note is about fixing or tuning something that already exists, not adding something new."
argument-hint: "[note reference]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion
model: sonnet
agent: game-designer
---

## Purpose

The bridge from "the tester said X" to a specific, cited edit in an existing
doc — a number retuned, a rule clarified, an edge case added — then a ticket.
It never invents a fix the note didn't support, and never touches a doc for a
mechanic the note didn't mention.

This is not `/mechanic`. It never creates a new `NN-<slug>.md` — it edits one
that exists. A note needing a genuinely new system belongs to `/mechanic`.

## Step 0 — Preconditions

Read `playtest.md`. The feedback must already be recorded there, verbatim, by
`/playtest`. If it isn't, stop and run `/playtest` first — a change traced to
"the user said so in chat" is a rule nobody can find again.

If several sessions exist, confirm which dated entry (or which line) you're
acting on. Don't tune against a stale note a later session already addressed.

## Step 1 — Map the note to doc(s)

For each piece of feedback, name the existing doc — `design/00-core.md`, a
`design/NN-<mechanic>.md`, a `design/ui/<screen>.md`, or `design/art.md` — and
the specific section (a Numbers row, a Rule, a Dynamics paragraph, an Edge
case). If it doesn't clearly map to one section, ask rather than spreading the
edit across several docs.

Online feedback ("lag", "timer too short", "didn't see who claimed") usually
maps to `06-online-room.md` or `ui/table.md` — check both before deciding.

## Step 2 — Propose the edit, cited

- **A Numbers-table row** — if the note confirms a value held, flip `GUESS` →
  `VALIDATED`. If the value was wrong, propose a replacement, keep it `GUESS`,
  and state what in the note justifies the new number.
- **A Rule or Dynamics change** — quote the exact playtest line next to the
  proposed doc text.
- Never fix more than the note supports.

Show the change, get approval, then edit the doc in place (in Vietnamese). If
its `Status:` was `BUILT`, drop it to `AGREED` — doc and code now disagree
until `/build` catches up.

## Step 3 — File the ticket

Add a line to `backlog.md`'s Open table pointing at the changed doc section,
quoting the playtest line as the reason. Then hand to `/build`.

## Rules

- Every change traces to a specific playtest line.
- Never touch a doc the note gave no evidence about.
- Never invent a number and back-fill a justification.
