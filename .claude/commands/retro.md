---
description: "Retrospective - suggest improvements after completing work"
---
You just finished a chunk of work. Now step back and think critically:

ARCHITECTURE:
- Are there any design decisions we made early that are now causing friction?
- Any files getting too large or doing too many things?
- Any patterns we're repeating that should be abstracted?
- Any technical debt accumulating that will bite us later?

CODE QUALITY:
- Any duplicated logic across files?
- Any error handling gaps?
- Any tests missing for critical paths?
- Any performance concerns with current approach?

FEATURES:
- Based on what you just built, are there adjacent features that would be easy wins?
- Anything the user will expect that we haven't thought of?
- Any edge cases we're not handling?

DEVELOPER EXPERIENCE:
- Is the codebase easy to navigate?
- Are the abstractions helping or hurting?
- Would any refactoring make future work significantly easier?

SECURITY:
- Any new attack surfaces from what we just built?
- Any secrets, keys, or permissions that need tightening?

Be specific. Name files, functions, patterns. Don't just say "consider improving X" - say exactly what to change and why.
