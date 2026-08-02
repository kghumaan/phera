---
name: "source-command-ship"
description: "Git add, commit, and push all changes"
---

# source-command-ship

Use this skill when the user asks to run the migrated source command `ship`.

## Command Template

Run git status to see all changes. Write a concise conventional commit message (feat:/fix:/chore:/docs:) that summarizes the work. Run:
git add -A
git commit -m "<your message>"
git push
Show the commit hash and summary when done.
