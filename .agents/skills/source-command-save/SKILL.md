---
name: "source-command-save"
description: "Save current session context for tomorrow"
---

# source-command-save

Use this skill when the user asks to run the migrated source command `save`.

## Command Template

Save the current working session to .Codex/session-context.md. Include:
- What was worked on this session (files changed, features built)
- Current state (what's working, what's broken)
- Next steps / unfinished work
- Any blockers or decisions pending
- Run: git diff --stat to capture changed files
Keep it concise. This file will be read at the start of the next session.
