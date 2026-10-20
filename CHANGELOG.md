# Changelog

All notable changes to this project are documented here. Format follows Keep a Changelog.

## [0.2.0] - 2026-10-20

### Added
- Bundles: `workflow`, `guardrails` and `savers`, under `bundles/`.
- A bundle picker in `install` and a `--bundles` flag. The choice is saved as `bundles` in the config and reused by non-interactive installs.
- Private packs can ship one bundle (`skills/` and/or `agents/` at the root) or several (a `bundles/` folder).
- `scripts/validate.mjs` for checking skills, agents, targets, tools and version sync.
- Test suite in `tests/`, run with `npm test`.
- Continuous integration.
- Docs in `docs/`, example config and example pack in `examples/`, SECURITY.md and CONTRIBUTING.md.

### Changed
- Agent targets moved to `targets.json`; token-saver recipes moved to `bundles/savers/tools.json`.
- Skills and subagents moved from top-level `skills/` and `agents/` into their bundles.

## [0.1.1]

### Changed
- README diagrams.
- Package renamed to the scoped name `@ednaaaj/agent-kit`.

## [0.1.0]

### Added
- Installer CLI with an agent menu (Claude Code, Cursor, Gemini CLI, Antigravity, Codex).
- Jira MCP setup and Slack allowlist.
- Token-saver tool picker: rtk, headroom, context-mode, caveman, ponytail and graphify.
- Private skill packs.
- Workflow and frontend guardrail skills.
