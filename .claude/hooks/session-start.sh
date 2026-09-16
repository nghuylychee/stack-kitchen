#!/bin/bash
# SessionStart hook: orient the session — branch, status card, tickets, last playtest, doc statuses.
set +e

echo "=== Stack Kitchen — Session Context ==="

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
if [ -n "$BRANCH" ]; then
  echo "Branch: $BRANCH"
  COMMITS=$(git log --oneline -5 2>/dev/null)
  if [ -n "$COMMITS" ]; then
    echo ""; echo "Recent commits:"
    echo "$COMMITS" | sed 's/^/  /'
  else
    echo "No commits yet."
  fi
  DIRTY=$(git status --short 2>/dev/null | wc -l | tr -d ' ')
  [ "$DIRTY" -gt 0 ] && echo "Uncommitted files: $DIRTY"
fi

echo ""
STATUS=$(grep -m1 '^| \*\*Status\*\*' README.md 2>/dev/null | sed 's/.*Status\*\* *| *//; s/ *|.*//' | tr -d '\r\n')
[ -n "$STATUS" ] && echo "Status: $STATUS"

if [ -f backlog.md ]; then
  OPEN=$(sed -n '/^## Open/,/^## Done/p' backlog.md 2>/dev/null | grep -cE '^\| *[0-9]+ *\|')
  echo "Open tickets: ${OPEN:-0}"
fi

if [ -s playtest.md ]; then
  LAST=$(grep -E '^## [0-9]{4}-' playtest.md | tail -1 | sed 's/^## //')
  CALL=$(grep -oE 'KEEP GOING|ONE MORE PASS|PAUSE|STOP' playtest.md | tail -1)
  echo "Last playtest: ${LAST:-?} — ${CALL:-no call recorded}"
fi

DRAFTS=""
for f in design/[0-9][0-9]-*.md design/ui/*.md; do
  [ -f "$f" ] || continue
  s=$(grep -m1 -oE '\*\*Status:\*\* *[A-Z]+' "$f" | sed 's/.*\*\* *//')
  [ "$s" = "DRAFT" ] && DRAFTS="$DRAFTS $(basename "$f")"
done
[ -n "$DRAFTS" ] && echo "DRAFT docs (not yet agreed):$DRAFTS"

echo "==================================="
exit 0
