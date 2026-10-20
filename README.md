# agent-kit

One installer for AI coding agents (Claude Code, Cursor, Antigravity/Gemini CLI, Codex):
skills, Jira MCP, a Slack allowlist, caveman/ponytail/graphify, plus **private skill packs** your team adds on top.

## Install
```bash
git clone <this-repo> agent-kit && cd agent-kit
node bin/cli.mjs init       # optional profile: GitLab, Jira site, Slack channel + people
node bin/cli.mjs install    # pick agents, copy skills, add Jira MCP, install tools
node bin/cli.mjs doctor
```
Flags: `--agents=claude,cursor`, `--skip-mcp`, `--skip-tools`, `--dry-run`.

## Add your team's skills (private pack)
A pack is any git repo (or local folder) with `skills/` and/or `agents/` at its root.
```bash
node bin/cli.mjs pack add git@host:team/our-skills.git   # uses YOUR git access
node bin/cli.mjs install                                  # re-applies every pack
node bin/cli.mjs pack update                              # git pull all packs
```
Packs install after the built-ins and can override a skill of the same name. Packs can read
your answers from `~/.agent-kit/config.json` (keys: `workspace`, `gitlab_user`, `gitlab_project`,
`reviewers`, `jira_site`, `jira_cloud_id`, `slack`).

## What is built in
| Skill | Use |
| --- | --- |
| `jira-transition` | move / resolve / comment on tickets, review a ticket before work |

Third-party tools installed per agent: caveman, ponytail, graphify.

## Accounts
- **Jira:** Atlassian MCP via `mcp-remote`, OAuth per person. No token on disk.
- **GitLab:** `glab` CLI, per-user login.
- **Slack:** the `slack` block in config is an allowlist (channel + people). With `auto_send` false, skills draft only.

## Maintainer notes
Per-agent paths and tool commands are tables at the top of `bin/cli.mjs`.
