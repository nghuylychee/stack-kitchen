---
name: status
description: "Where Stack Kitchen stands and what to do next — reads the README status card, backlog, playtest log and design doc statuses, and returns one short table plus a single recommended next command."
user-invocable: true
allowed-tools: Read, Glob, Grep, Bash
model: haiku
agent: producer
---

## Purpose

The only orientation command. Read-only — it never writes a file.

## What to read

1. `README.md` — status card
2. `backlog.md` — Open tickets
3. `playtest.md` — last dated section and its call
4. `design/*.md`, `design/ui/*.md` — each doc's `**Status:**`
5. `git status --short` and `git log --oneline -5`

## Output — keep it to a screen

```markdown
**Stack Kitchen:** <status> · last playtest <date> — <call>

| Doc | Status |
|---|---|

**Open tickets:** N — top: #<n> <ticket>
**Uncommitted:** <count> files

**Next:** `<one command>` — <why, one line>
```

## Picking the next command

| What you see | Recommend |
|---|---|
| Code changed since the last playtest | play it (bots and/or online), then `/playtest` |
| Last playtest says ONE MORE PASS | `/tuning` the one named change |
| Open ticket pointing at a doc | `/build <ticket>` |
| Playtest note asks for something with no doc | `/mechanic <name>` or `/ui-spec <screen>` |
| A doc `DRAFT` with code behind it | flag it — doc and code disagree |
| Nothing open, KEEP GOING | play online with real people, then `/playtest` |

**One** recommendation. If genuinely ambiguous, name the two options and why.

## Rules

- Never write, fix, or tidy anything. Report only.
- A build nobody has played is the top priority.
