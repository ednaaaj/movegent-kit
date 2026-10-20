# Agents

## Which agent reads what

| Agent | Skills | Subagents | Jira MCP |
| --- | --- | --- | --- |
| Claude Code | `~/.claude/skills` | `~/.claude/agents` | `claude mcp add` |
| Cursor | `~/.cursor/skills` | not installed | `~/.cursor/mcp.json` |
| Gemini CLI | `~/.gemini/skills` | not installed | `~/.gemini/settings.json` |
| Antigravity | `~/.gemini/antigravity/skills` | not installed | `~/.gemini/antigravity/mcp_config.json` |
| Codex | `~/.codex/skills` | not installed | `codex mcp add` |

Select agents with the numbered menu, or `--agents=claude,cursor,gemini,antigravity,codex`. Without a terminal,
`install` uses the agents whose home folder already exists.

## Shared skills folder

Gemini, Antigravity and Codex also get a copy in `~/.agents/skills`, a folder several agents read.

## Subagents

Subagents (`bundles/*/agents/*.md`) are Claude-format only. Other agents get the skills but not the `mr-*`,
`airasia-phoenix-*` or `mp-*-writer` subagents.

## Slack

Claude Code: connect Slack in claude.ai, Settings, Connectors, then `/mcp`. Other agents need their own Slack MCP;
without one, skills print the message for you to paste.

## Adding an agent target

Edit `targets.json` and add an entry with the agent's folder, skills folder, optional subagents folder,
whether it uses the shared `~/.agents/skills`, and how its Jira MCP is registered (a CLI command or a JSON file
to merge). Paths are best-known values; if an agent moves its folders, fix them there.
