---
name: ui-spec
description: "Spec one Stack Kitchen screen or flow (Home, Lobby, Table, End, a HUD element, a drag flow) — layout, tap targets, reach, feedback, online and interruption states. Writes design/ui/<screen>.md for game-dev to implement."
argument-hint: "<screen or flow name>"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, AskUserQuestion
model: sonnet
agent: ui-designer
---

## Purpose

One screen, one spec, precise enough that `game-dev` implements it without a
follow-up question.

## Step 0 — Should this screen exist?

A setting that could be a sane default, a confirmation nobody reads, a menu
wrapping one button — cut it and say so. Only continue if the answer holds.

Read `design/00-core.md` (controls, viewport), the mechanic docs the screen
shows, `design/06-online-room.md` for anything online, and the current code
for that screen (`index.html`, `src/main.ts`, `src/ui/table.ts`) so the spec
starts from what exists.

## Step 1 — Sketch in chat first

ASCII box at 1280×800 (and note what changes at 1024×700), zones labelled.
Show it, get agreement.

## Step 2 — Write `design/ui/<screen>.md`

In Vietnamese; element ids and in-game labels stay English.

```markdown
# UI — <Screen Name>

**Status:** DRAFT
**Purpose:** what the player is here to do, one line.
**Reached from:** <screen> · **Leads to:** <screen>

## Layout — responsive, desktop-first
<ASCII box, zones labelled, element ids>

## Elements
| Element (id) | Position | Size | Tap target | States |

## Interactions
| Gesture | Response | Feedback | Timing (GUESS) |

## Online states
Whose turn, timer, offline seat (bot playing), host left, rejoin, reconnecting.

## Interruptions
Tab blur, resize mid-animation, back navigation.

## Empty / error states
First launch, no name entered, room not found, room full, action unavailable.
```

If the screen already has a spec (`ui/table.md`), extend it in place rather
than writing a second file for the same screen.

## Constraints

- Pointer Events, tap targets ≥ 44×44 px, 8px dead space — universal.
- Feedback inside 100ms of input, before the host answers.
- Desktop cursor reach: nothing frequent in a far corner.
- Nothing needed mid-drag under the drag point.
- Every animation number is concrete and tagged GUESS; reuse existing
  constants (`COOK_MS`, `AI_STEP_MS`, `T.*`) instead of inventing new ones.

## Hand off

Add a ticket to `backlog.md` pointing at this file, then `/build`.
