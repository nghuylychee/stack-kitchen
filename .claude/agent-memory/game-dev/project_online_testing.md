---
name: online-testing
description: How Stack Kitchen's online mode was verified on 2026-09-16 and the traps found — two tabs share localStorage, hidden panes slow WAAPI, host close must ignore late traffic
metadata:
  type: project
---

Online mode (PeerJS, `src/net/room.ts`) was first verified 2026-09-16 with two
tabs of the built-in browser: host creates a room, second tab opens
`?room=CODE`, an autopilot script (installed via `javascript_tool`) drew,
cooked, claimed and played in both tabs for a full 52-turn game.

**Traps found, and fixed — don't reintroduce them:**

- Two tabs of one browser share `localStorage`, so they share the rejoin token.
  The host treats a token whose seat is still live as a *new* player; a client
  refused with "Game already started" retries a few times while the host
  notices its old connection died.
- A hidden Browser pane throttles rendering, so `anim.finished` (WAAPI) can
  stall. Any awaited Web Animation must race a `wait()` timeout.
- After the host closes a room, peer `close` events still fire and used to push
  events that reopened the table screen. `RoomHost` ignores everything once
  `closed`.

**Not yet verified at that point:** 30s turn timeout, 8s claim-window timeout,
two humans claiming the same card, disconnect mid-cook, different networks
(NAT/4G), phone viewport.
