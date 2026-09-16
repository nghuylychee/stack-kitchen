# Rule — Game code

Applies to `src/**`, `index.html`, `vite.config.ts`, `.github/workflows/**`.

## Stack

Vite + TypeScript (strict), `peerjs` from npm, no UI framework. Static build
to `dist/`, deployed to GitHub Pages by `.github/workflows/deploy.yml`.
Asset paths go through `ART` (`import.meta.env.BASE_URL`) so the build works
under `/<repo>/`. New runtime dependencies need the user's OK.

## Layout

| Path | Owns | May import |
|---|---|---|
| `src/core/data.ts` | constants, cards, recipes — each number cites its doc | nothing |
| `src/core/rules.ts` | pure rule helpers | `data` |
| `src/core/types.ts` | `View`, `HostEvent`, `Intent` — the wire protocol | `data`, `rules` |
| `src/core/match.ts` | `Match`: rules, turn flow, claims, timers, bots, pacing | `core/*`, `ai/*` |
| `src/ai/bot.ts` | bot decisions (`05-ai-player.md`) | `core/data`, `core/rules` |
| `src/net/room.ts` | PeerJS `RoomHost` / `RoomClient`, lobby, heartbeat, rejoin | `core/*` |
| `src/ui/table.ts` | table screen: event queue, render, animation, drag → `Intent` | `core/*` |
| `src/main.ts` | Home / Lobby / Table wiring | everything |

`core/` and `ai/` never touch the DOM. `ui/` never decides a game outcome.

## Invariants

1. **Host-authoritative.** Every player action is an `Intent` the host
   validates. The client may act optimistically for feel, but a rejected
   intent is resynced from the host, never trusted.
2. **One `Match` for both modes.** Play vs Bots = host with one local seat.
   No `if (online)` around a rule except where the doc says the modes differ
   (timers).
3. **Redaction.** `View` and events are built per seat. Other hands and pool
   order never leave the host; hands are revealed only at game end.
4. **Pacing.** The host `wait()`s for each step as long as the client animates
   it, from the same constant in `data.ts`. The client queue speeds up when it
   falls behind; it never skips an event.
5. **Protocol changes are breaking.** When `HostEvent`/`Intent`/room messages
   change shape, bump `PREFIX` in `src/net/room.ts` so old tabs cannot join
   new rooms.

## UI contract

- **Pointer Events only** — `pointerdown` / `pointermove` / `pointerup`.
- **Tap targets ≥ 44×44 CSS px.**
- Responsive, desktop-first: check 1280×800 and 1024×700.
- In-game text English. Palette via CSS custom properties in `table.css`.
- Keep zone ids stable (see `design/ui/table.md`).

## Verification — no automated test suite

No unit tests, no CI test gate, no coverage target. Do not scaffold a test
framework. Verification is:

1. `npm run build` passes (type-check + bundle).
2. It runs in the browser and does what the doc's **Done when** says — bots
   mode, plus a two-tab online room for anything touching rules, events or
   networking.
3. A human plays it and says whether it is any good.

To prove a formula, print it to the console or the action log. Temporary
debug hooks are removed before a ticket is closed.

## Reporting

If it does not build or run, say so with the error. A criterion not verified
is reported as unverified, never quietly dropped.

## Commits

Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`),
referencing the design doc, e.g. `Design: 06-online-room`. No commits unless
the user asks.
