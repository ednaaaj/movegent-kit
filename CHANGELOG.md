# Changelog

All notable changes to this project are documented here. Format follows Keep a Changelog.

## [0.2.0] - 2026-10-20

### Changed
- Restructured the repo to a layout with `manifests/`, `schemas/`, `.claude-plugin/`, `docs/`, `examples/` and `tests/`.
- Agent targets and tools are now data tables in `manifests/agents.json` and `manifests/tools.json`.

### Added
- `scripts/validate.mjs` for checking skills, agents, manifests and version sync.
- Test suite in `tests/`, run with `npm test`.
- Continuous integration.
- Claude Code plugin and marketplace metadata in `.claude-plugin/`.
- Governance docs: AGENTS.md, CLAUDE.md, CONTRIBUTING.md, SECURITY.md, TROUBLESHOOTING.md, PR template, VERSION.

## [0.1.1]

### Changed
- README with diagrams.

## [0.1.0]

### Added
- Initial release: installer CLI and agent menu (Claude Code, Cursor, Gemini CLI, Antigravity, Codex).
- Jira MCP setup and Slack allowlist.
- Tool picker with rtk, headroom, context-mode, caveman, ponytail and graphify.
- Private skill packs.
- Workflow and frontend guardrail skills.
