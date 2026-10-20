@AGENTS.md

## Claude Code notes

- Skills live in `bundles/<bundle>/skills/<name>/SKILL.md`; the frontmatter `name` must equal the folder name.
- Subagents live in `bundles/<bundle>/agents/<name>.md`.
- Checks: `npm test` and `npm run validate`. Run both before reporting work done.
- Try the installer safely: `HOME=$(mktemp -d) node bin/cli.mjs install --dry-run --agents=claude`.
