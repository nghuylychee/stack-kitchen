#!/usr/bin/env bash
# Notification hook — fires when Claude Code sends a notification.
# Cross-platform: macOS (osascript), Linux (notify-send), Windows (PowerShell).

INPUT=$(cat)

# Extract message — try jq first, fall back to grep
if command -v jq &>/dev/null; then
  MESSAGE=$(echo "$INPUT" | jq -r '.message // empty' 2>/dev/null)
fi
if [ -z "$MESSAGE" ]; then
  MESSAGE=$(echo "$INPUT" | grep -oE '"message":"[^"]*"' | sed 's/"message":"//;s/"//')
fi
if [ -z "$MESSAGE" ]; then
  MESSAGE="Claude Code needs your attention"
fi

MESSAGE_SAFE=$(echo "$MESSAGE" | head -c 200)

case "$(uname -s)" in
  Darwin)
    # Escape double quotes and backslashes for AppleScript
    AS_SAFE=$(printf '%s' "$MESSAGE_SAFE" | sed 's/\\/\\\\/g; s/"/\\"/g')
    osascript -e "display notification \"$AS_SAFE\" with title \"Stack Kitchen\"" 2>/dev/null &
    ;;
  Linux)
    if command -v notify-send &>/dev/null; then
      notify-send "Stack Kitchen" "$MESSAGE_SAFE" 2>/dev/null &
    fi
    ;;
  MINGW*|MSYS*|CYGWIN*)
    PS_SAFE=$(printf '%s' "$MESSAGE_SAFE" | sed "s/'/''/g")
    powershell.exe -NonInteractive -WindowStyle Hidden -Command "
      Add-Type -AssemblyName System.Windows.Forms
      \$notify = New-Object System.Windows.Forms.NotifyIcon
      \$notify.Icon = [System.Drawing.SystemIcons]::Information
      \$notify.BalloonTipTitle = 'Stack Kitchen'
      \$notify.BalloonTipText = '$PS_SAFE'
      \$notify.Visible = \$true
      \$notify.ShowBalloonTip(5000)
      Start-Sleep -Seconds 6
      \$notify.Dispose()
    " 2>/dev/null &
    ;;
esac

echo "Notification: $MESSAGE_SAFE"
