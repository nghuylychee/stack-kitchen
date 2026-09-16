---
name: build
description: "Turn one Stack Kitchen backlog ticket into working code under src/, prove it runs against its design doc's Done when (bots mode and, if relevant, a two-tab online room), then close the ticket and flip the doc to BUILT."
argument-hint: "<ticket>"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, Bash, mcp__Claude_Browser__preview_start, mcp__Claude_Browser__navigate, mcp__Claude_Browser__computer, mcp__Claude_Browser__read_console_messages, mcp__Claude_Browser__read_page, mcp__Claude_Browser__javascript_tool, mcp__Claude_Browser__tabs_create, mcp__Claude_Browser__tabs_close, mcp__Claude_Browser__resize_window
model: opus
agent: game-dev
---

## Purpose

From a design doc to something a human can play: implement one ticket, prove
it runs the way its doc says, then close the loop on paper (ticket + doc
status) in the same pass.

## Step 0 — Preconditions

Read `backlog.md`, find the ticket. It must point at a design doc —
`design/00-core.md`, a `design/NN-<mechanic>.md`, a `design/ui/<screen>.md`,
or `design/art.md`.

**Refuse a ticket that points at no doc.** Fix that gap with `/mechanic` or
`/ui-spec` first — never invent rules while coding.

Read every doc the ticket points at plus what they point at. Read
`.claude/rules/game-code.md`. If docs disagree with each other or with the
current code, stop and flag the conflict instead of picking one.

## Step 1 — Implement

Build inside `src/`, following `.claude/rules/game-code.md`:

- Rules and timing in `src/core/match.ts`; numbers in `src/core/data.ts`
  citing the doc; UI in `src/ui/`; networking in `src/net/`.
- New player action → a new `Intent`, validated by the host. New visible
  outcome → a new or extended `HostEvent`. Check nothing hidden leaks into `View`.
- Pointer Events only, tap targets ≥ 44×44 CSS px, in-game text English.

Build exactly what the doc specifies. If something is ambiguous, make the
smallest reasonable call and report what you assumed. Stay inside the
ticket's scope — no drive-by refactors.

## Step 2 — Prove it runs

1. `npm run build` — must pass.
2. `preview_start` (`stack-kitchen`), `resize_window` 1280×800, Play vs Bots,
   and actually exercise the change several times. `read_console_messages`.
3. If the ticket touches rules, timing, `View`, events or the lobby: create a
   room in one tab, `tabs_create` a second tab, join with `?room=CODE`, and
   exercise the change across both. Check what each tab can and cannot see.
4. Check 1024×700 if layout changed. Fix, repeat.

Then go through the doc's **Done when** line by line: **verified** (what you
watched), **fails** (what happened instead), or **unverified** (why you
couldn't check). Never quietly drop a line.

Scale verification to the ticket — a label change needs a screenshot, not a
two-tab session. Temporary debug hooks are fine but must be removed before
reporting.

You confirm it works and matches the doc. You never judge fun.

## Step 3 — Report

What you built, the verified / fails / unverified breakdown, and anything you
assumed. If it doesn't run, say so with the actual error.

## Step 4 — Close the ticket

Only if Step 2 shows the core behaviour works:

1. Move the ticket to `backlog.md`'s Done table with what was built, what was
   verified, and known gaps.
2. Flip the doc's `**Status:**` to `BUILT`. If only part of the doc is built,
   say so in the notes instead of flipping early.

## Rules

- No test framework, no CI test gate, no coverage target.
- Never mark a doc `BUILT` or close a ticket on unverified behaviour.
- Never expand scope mid-ticket — flag adjacent problems as new backlog lines.
- No commits unless asked.

## After

`/playtest` once a human has played it, or the next `/build <ticket>`.
