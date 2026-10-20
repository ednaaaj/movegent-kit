# Tools (token savers)

The recipes live in the `savers` bundle, `bundles/savers/tools.json`. Pick numbers, `all` or `none` at the prompt,
or pass `--tools=rtk,headroom`. `--skip-tools` skips the step. Without a terminal and without `--tools`, all tools
are selected.

| Tool | What it does | Needs | Per-agent behavior |
| --- | --- | --- | --- |
| `caveman` | terse replies, ~75% fewer output tokens | npx | one run; its installer detects every agent |
| `ponytail` | lazy-senior-dev mode: shortest working code | agent CLI | Claude: plugin install from its marketplace; Gemini: extensions install; Antigravity: `agy plugin install`; Cursor, Codex: manual steps printed |
| `rtk` | compresses shell command output 60-90% | Homebrew | `brew install rtk` once, then `rtk init` per agent; other agents: manual note |
| `headroom` | context compression + retrieve MCP | uv | `uv tool install headroom-ai`, then `headroom mcp install` |
| `context-mode` | keeps big tool output out of your context | Claude Code | Claude: plugin install; other agents: manual note |
| `graphify` | turns a codebase into a queryable knowledge graph | uv | `uv tool install graphifyy`, then `graphify install --platform <agent>` per agent |

## Warning

These tools change how your agent behaves. `rtk` and `context-mode` add hooks to the agent's settings. Pick only
what you want. A missing prerequisite is reported and skipped, never fatal. Tools are installed from their own
upstream repos; see each project for its licence.

## Adding a tool

Edit `bundles/savers/tools.json`. An entry has a description and any of:

- `all`: a command run once
- `after`: a command run once after `all`
- one entry per agent name: a list of commands, or a string that is printed as a manual note
- `other`: a note for agents without their own entry
- `hint`: shown when the first command's binary is missing

Run `node bin/cli.mjs install --dry-run --tools=<name>` to check the commands before running them.
