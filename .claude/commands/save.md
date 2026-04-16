---
description: "Save current session context for tomorrow"
---
Save the current working session to .claude/session-context.md. Include:
- What was worked on this session (files changed, features built)
- Current state (what's working, what's broken)
- Next steps / unfinished work
- Any blockers or decisions pending
- Run: git diff --stat to capture changed files
Keep it concise. This file will be read at the start of the next session.
