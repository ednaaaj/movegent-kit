@AGENTS.md

## Claude Code notes

- Skills live in `skills/<name>/SKILL.md`; the frontmatter `name` must equal the folder name.
- Subagents live in `agents/<name>.md`.
- Test command: `npm test`. Run it before reporting work done.
- Try the installer safely: `HOME=$(mktemp -d) node bin/cli.mjs install --dry-run --agents=claude`.
