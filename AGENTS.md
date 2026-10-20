# AGENTS.md

Instructions for AI agents working in this repository. End-user docs are in README.md.

## Purpose

agent-kit is a zero-dependency Node CLI plus a content repo (skills, subagents, tool recipes). It installs
AI-agent skills, Jira MCP, a Slack allowlist and token-saver tools for Claude Code, Cursor, Gemini CLI,
Antigravity and Codex, and supports private skill packs. Content is grouped into bundles.

## Repository layout

- `bin/cli.mjs` - the CLI (init, install, doctor, packs).
- `targets.json` - data table of agent targets: skills, subagents and MCP locations.
- `bundles/<bundle>/skills/<name>/SKILL.md` - skills.
- `bundles/<bundle>/agents/<name>.md` - subagents.
- `bundles/savers/tools.json` - installable token-saver tools.
- `docs/` - user documentation (including the per-agent path table).
- `examples/` - sample config and a minimal pack.
- `scripts/validate.mjs` - validates skills, agents, targets, tools and version sync.
- `tests/` - test suite, run by `npm test`.

Bundles today: `workflow`, `guardrails`, `savers`.

## Config contract

`~/.agent-kit/config.json` keys: `repo_path`, `design_system_path`, `gitlab_user`, `gitlab_project`, `reviewers`, `jira_site`, `jira_cloud_id`, `slack` (`auto_send`, `channel {name, id}`, `people [{name, id}]`, `mention []`), `bundles`, `packs`.

Skills must never hold real values. They use placeholders, filled from the config at install time:

`<repo_path>`, `<design_system_path>`, `<gitlab_user>`, `<gitlab_project>`, `<gitlab_project_encoded>`, `<reviewers>`, `<reviewers_csv>`, `<jira_site>`, `<jira_cloud_id>`

## Hard rules

- Never commit private values: real Jira IDs, Slack IDs or channels, usernames, emails, tokens, local `/Users/...` paths, company ticket keys.
- Skills must be company-neutral.
- Never publish to npm or push to a remote without the maintainer.
- Keep zero dependencies. Use Node built-ins only.
- Run `npm test` and `npm run validate` before finishing.
- A version bump updates `package.json`, `VERSION` and `CHANGELOG.md` together.
