---
name: browser-verification
description: Never self-write a CDP/headless-Chrome driver when browser MCP tools are missing — stop and ask the user to grant them; scale verification to the ticket
metadata:
  type: feedback
---

When `/build` calls for driving a browser (`mcp__Claude_Browser__preview_start` /
`navigate` / `computer` / `read_console_messages` / `javascript_tool` /
`tabs_create` / `resize_window`), actually attempt the call. If the tool comes
back "No such tool available", **stop and report that plainly** — do not
hand-write a CDP-over-Bash script to puppet headless Chrome instead.

**Why:** in the incubator (slot 004, tickets #27–#28) this agent silently fell
back to a self-written CDP driver. The user's words: "Lần sau không được tự ý
viết script điều khiển, nếu ko có tool thì tại sao không nói tôi cấp". Improvised
tooling hides a missing capability; the user would rather fix their end.

**How to apply:** try the real tool first, every time. If it is genuinely
missing, do what is legitimately possible without a browser (`npm run build`,
reading the code against the doc) and list every interaction criterion as
**unverified**.

**Scale verification to the ticket.** A label or colour change needs one
screenshot, not a two-tab online session. Rules, events, `View` or networking
changes need Play vs Bots *and* a two-tab room. Simulated pointer events via
`javascript_tool` (pointerdown → pointermove steps → pointerup at element
centres) are the sanctioned way to drive drags; remove any temporary debug hook
before closing the ticket.
