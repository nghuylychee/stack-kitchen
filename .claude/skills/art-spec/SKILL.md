---
name: art-spec
description: "Extend or correct Stack Kitchen's visual direction and brief assets — palette tokens, readability rules, asset list, per-asset specs and generation prompts. Edits design/art.md."
argument-hint: "[asset or screen name]"
user-invocable: true
allowed-tools: Read, Glob, Grep, Write, Edit, WebSearch, AskUserQuestion
model: sonnet
agent: artist
---

## Purpose

Decide how something looks, in enough detail that it can be made — by a
person, a generator, or `game-dev` in CSS.

## Step 0 — Read what exists

`design/art.md` already sets the direction (quán trà đá vỉa hè). Read it, the
tokens at the top of `src/ui/table.css`, and `design/ui/` before proposing
anything. You extend this direction; a full restyle is a separate decision the
user must ask for explicitly.

If the ask is for a screen or mechanic with no doc yet, say so — art follows
the doc.

## Step 1 — Direction, agreed in chat

For the thing being briefed, land:

1. **References** — named touchstones, each with the specific property taken.
2. **Palette** — which existing tokens it uses; any new token with hex, role,
   and what it must never be used for. `--gold` stays "actionable for points" only.
3. **Rendering budget** — CSS/SVG the dev can draw cheaply, or a generated image.

Use `AskUserQuestion` to capture the pick.

## Step 2 — Write into `design/art.md`

Edit the existing sections in place (Palette, Readability rules, Asset list,
Specs). Match the file's existing language and structure. For each new asset:
name, type, size in px, where it appears, status, and a generation prompt if
it will be generated. New art files go to `public/art/<Folder>/`.

## Readability reality

Responsive, desktop-first. Every mechanically meaningful distinction — course,
whose turn, offline seat, claimable card, timer running low — must survive
scale-down and greyscale. Course colour always paired with its letter.

## Coordination

Check against `design/ui/` so HUD and gameplay colour do not collide. Ask
`game-dev` what is expensive before speccing it.
