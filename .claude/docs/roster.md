# Roster — 5 roles, 7 commands

Carried over from NGH-AI-GAME-STUDIO when slot 007 graduated (ADR-004 there).
The incubator-only commands `/brainstorm`, `/new-game` and `/prototype` stay in
the studio — this repo is one game that already exists.

## The five roles

| Agent | Owns | Writes |
|---|---|---|
| `game-designer` | what the game IS — rules, mechanics, numbers, online rules | `design/00-core.md`, `design/NN-*.md` |
| `game-dev` | all code — core, bots, network, UI, build, deploy | `src/**`, config |
| `producer` | status, backlog, playtest records, scope | `README.md` status card, `backlog.md`, `playtest.md` |
| `artist` | how it looks — palette tokens, card faces, asset briefs | `design/art.md` |
| `ui-designer` | what the player touches — screens, gestures, feedback, online states | `design/ui/*.md` |

There is no QA role. Humans playtest; that is the whole test department.

## The seven commands

| Command | Agent | Writes |
|---|---|---|
| `/mechanic <name>` | game-designer | `design/NN-<slug>.md` + backlog ticket |
| `/tuning [note]` | game-designer | edits the doc a playtest note is about + backlog ticket |
| `/build <ticket>` | game-dev | code under `src/`, closes the ticket, doc → `BUILT` |
| `/playtest` | producer | `playtest.md` from human feedback, README status |
| `/ui-spec <screen>` | ui-designer | `design/ui/<screen>.md` + backlog ticket |
| `/art-spec [asset]` | artist | `design/art.md` |
| `/status` | producer | nothing — read-only |

## Workflow

```text
human plays (bots / online)  →  /playtest
                                   ↓
     KEEP GOING → /mechanic (new) · /ui-spec (screen) · /tuning (tune) → /build
     ONE MORE PASS → /tuning (the one change) → /build
     PAUSE → README status PAUSED
```

## Who to call

| Question | Role |
|---|---|
| "how does this work?" / "is this fair online?" | game-designer |
| "make it run" / "why is it desynced?" | game-dev |
| "what next / where are we?" | producer |
| "what does it look like?" | artist |
| "where does the button go?" | ui-designer |

## Escalation

Two roles disagreeing is a decision for the user, not a vote between agents.
State both positions in one paragraph each and ask.
