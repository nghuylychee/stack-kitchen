# Stack Kitchen — product repo

A 2–4 player mahjong-like card game about cooking Vietnamese dishes. Two modes:
**Play vs Bots** and **Online room** (PeerJS P2P). Graduated from
NGH-AI-GAME-STUDIO slot `007-kitchen-mahjong` (ADR-004 in that repo) — this is
one real game, not an incubator. Vite + TypeScript, deployed to GitHub Pages.

## The five roles

| Agent | Owns |
|---|---|
| `game-designer` | what the game IS — rules, mechanics, numbers, online rules |
| `game-dev` | all code — core, bots, network, UI, build, deploy |
| `producer` | README status card, backlog, playtest records, scope |
| `artist` | how it looks — palette tokens, card faces, asset briefs |
| `ui-designer` | what the player touches — screens, gestures, feedback, online states |

**There is no QA role and no automated test suite.** Humans playtest.

## The seven commands

| Command | Writes |
|---|---|
| `/mechanic <name>` | `design/NN-<slug>.md` + backlog ticket |
| `/tuning [note]` | edits the doc a playtest note is about + backlog ticket |
| `/build <ticket>` | code under `src/`, closes the ticket, doc → `BUILT` |
| `/playtest` | `playtest.md` from human feedback, README status |
| `/ui-spec <screen>` | `design/ui/<screen>.md` + backlog ticket |
| `/art-spec [asset]` | `design/art.md` |
| `/status` | nothing — read-only orientation |

```text
human plays (bots / online)  →  /playtest
     KEEP GOING    → /mechanic · /ui-spec · /tuning → /build
     ONE MORE PASS → /tuning (the one change) → /build
     PAUSE         → README status PAUSED
```

Details: `.claude/docs/roster.md`.

## Where things live

```text
design/            00-core.md, 01-…06-*.md, ui/table.md, art.md,
                   reference-prototype.html (frozen incubator build — never edited)
src/core/          data.ts (numbers cite docs) · rules.ts · types.ts (wire protocol) · match.ts (host)
src/ai/bot.ts      bots
src/net/room.ts    PeerJS RoomHost / RoomClient
src/ui/            table.ts + table.css
src/main.ts        Home · Lobby · Table
public/art/        Card/ (27 ingredients) · Food/ (20 dishes)
backlog.md         flat tickets (#1–#7 from the incubator)
playtest.md        append-only human notes (incubator sessions kept at the top)
```

## The MDA rule — non-negotiable

Every mechanic is specified as **Mechanics** (rules, inputs, numbers —
implementable as written) → **Dynamics** (what real players do, including the
degenerate play and what prevents it) → **Aesthetics** (named from the eight:
sensation, fantasy, narrative, challenge, fellowship, discovery, expression,
submission). No named aesthetic means the mechanic is not designed yet. Every
number is tagged VALIDATED or GUESS. One mechanic, one file. Full rules:
`.claude/rules/design-docs.md`.

## Code — non-negotiable

Full contract: `.claude/rules/game-code.md`.

- **Host-authoritative.** Rules, bots and timing run in `src/core/match.ts`.
  The UI sends `Intent`s and plays `HostEvent`s; it never decides an outcome.
- **One `Match` for both modes.** Never fork a rule per mode.
- **Never leak hidden info** through `View` or events.
- **Host pacing = client animation**, from the same constant.
- Doc first, then code. `/build` refuses a ticket with no doc.
- Pointer Events only, tap targets ≥ 44px, in-game text English.

## Document language

Every design doc, `README.md`, `backlog.md`, `playtest.md` and ADR is written
in **Vietnamese**. English stays for MDA labels, aesthetic names, `Status:`
values, code identifiers, and in-game text. `.claude/` files stay English.

## Verification is human

1. **The dev proves it runs:** `npm run build` passes, then it is played in the
   browser — Play vs Bots, plus a two-tab online room for anything touching
   rules, events or networking — and checked against the doc's *Done when*.
   Anything unverified is reported as unverified.
2. **A human plays it and says.** `/playtest` records their words verbatim.

No test framework, no CI test gate. Do not scaffold one.

## Collaboration protocol

**User-driven.** Question → Options → Decision → Draft → Approval.

- Design docs (`design/**`) are written directly, then the change is shown.
- Inside a `/build` ticket's scope, code is written directly — the ticket is
  the approval.
- Anything else (config, dependencies, deploy, `.claude/`): say what will
  change and ask first. Multi-file changes need approval for the whole set.
- No commits or pushes without instruction.

## Context

The file is the memory, not the conversation. After a compaction, read
`README.md`, `backlog.md`, the last `playtest.md` section, and the docs the
current ticket points at.
