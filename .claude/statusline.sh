#!/usr/bin/env bash
# Stack Kitchen — status line: ctx% | model | status | open tickets
input=$(cat)
if command -v jq &>/dev/null; then
  model=$(echo "$input" | jq -r '.model.display_name // "Unknown"')
  used_pct=$(echo "$input" | jq -r '.context_window.used_percentage // empty')
  cwd=$(echo "$input" | jq -r '.workspace.current_dir // .cwd // ""')
else
  model=$(echo "$input" | grep -oE '"display_name"\s*:\s*"[^"]*"' | head -1 | sed 's/.*: *"//;s/"//')
  used_pct=$(echo "$input" | grep -oE '"used_percentage"\s*:\s*[0-9]+' | head -1 | sed 's/.*: *//')
  cwd=$(echo "$input" | grep -oE '"current_dir"\s*:\s*"[^"]*"' | head -1 | sed 's/.*: *"//;s/"//')
  [ -z "$model" ] && model="Unknown"
fi
[ -z "$cwd" ] && cwd="."
ctx="ctx: ${used_pct:---}%"
[ -z "$used_pct" ] && ctx="ctx: --"
status=$(grep -m1 '^| \*\*Status\*\*' "$cwd/README.md" 2>/dev/null | sed 's/.*Status\*\* *| *//; s/ *|.*//' | tr -d '\r\n')
open=$(sed -n '/^## Open/,/^## Done/p' "$cwd/backlog.md" 2>/dev/null | grep -cE '^\| *[0-9]+ *\|')
printf "%s" "${ctx} | ${model} | Stack Kitchen ${status:-?} | ${open:-0} open"
