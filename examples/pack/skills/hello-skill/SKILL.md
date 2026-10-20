---
name: hello-skill
description: Greets the user and shows how a pack skill reads agent-kit config. Use when the user asks to say hello or to test that a pack installed.
---

> **Config:** read `~/.agent-kit/config.json` first. Placeholders below: `<repo_path>`, `<gitlab_user>`. `<repo_path>` is the repo you are working in: `repo_path` from `~/.agent-kit/config.json` if set, otherwise the git root of the current folder (`git rev-parse --show-toplevel`). Never assume a fixed parent folder.
> If the file is missing or a value is empty, ask the user once, or tell them to run `agent-kit init`.

1. Say hello to `<gitlab_user>` (if empty, say hello without a name).
2. Tell them which repo you are working in: `<repo_path>`.
3. Say this skill came from a pack, so the pack installed correctly.

Keep config values in placeholders like the ones above. Never hardcode real names, IDs or paths in a skill.
