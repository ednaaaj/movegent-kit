# AGENTS.md

Instructions for AI agents working in this repository. End-user docs are in README.md.

## Purpose

agent-kit is a zero-dependency Node CLI plus a content repo (skills, subagents). It installs AI-agent skills, Jira MCP, a Slack allowlist and token-saver tools for Claude Code, Cursor, Gemini CLI, Antigravity and Codex, and supports private skill packs. Layout inspired by affaan-m/ECC (MIT).

## Repository layout

- `bin/cli.mjs` - the CLI (install, doctor, packs).
- `manifests/agents.json`, `manifests/tools.json` - data tables: agent targets and installable tools.
- `schemas/config.schema.json` - schema for `~/.agent-kit/config.json`.
- `skills/<name>/SKILL.md` - skills.
- `agents/<name>.md` - subagents.
- `docs/` - user documentation (including the per-agent path table).
- `examples/` - sample configs.
- `scripts/validate.mjs` - validates skills, agents, manifests and version sync.
- `tests/` - test suite, run by `npm test`.
- `.claude-plugin/` - Claude Code plugin and marketplace metadata.

## Config contract

`~/.agent-kit/config.json` keys: `workspace`, `gitlab_user`, `gitlab_project`, `reviewers`, `jira_site`, `jira_cloud_id`, `slack` (`auto_send`, `channel {name, id}`, `people [{name, id}]`, `mention []`), `packs`.

Skills must never hold real values. They use placeholders, filled from the config at install time:

`<workspace>`, `<gitlab_user>`, `<gitlab_project>`, `<gitlab_project_encoded>`, `<reviewers>`, `<reviewers_csv>`, `<jira_site>`, `<jira_cloud_id>`, `<repo_path>`

## Hard rules

- Never commit private values: real Jira IDs, Slack IDs or channels, usernames, emails, tokens, local `/Users/...` paths, company ticket keys.
- Skills must be company-neutral.
- Never publish to npm or push to a remote without the maintainer.
- Keep zero dependencies. Use Node built-ins only.
- Run `npm test` before finishing.
- A version bump updates `package.json`, `VERSION`, `.claude-plugin/plugin.json` and `CHANGELOG.md` together.
