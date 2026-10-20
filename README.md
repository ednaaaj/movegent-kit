# agent-kit

One installer for AI coding agents (Claude Code, Cursor, Antigravity/Gemini CLI, Codex):
a ticket-to-MR workflow, frontend guardrail skills, Jira MCP, a Slack allowlist,
caveman/ponytail/graphify, plus **private skill packs** a team can add on top.
No company keys, IDs or handles are baked in: each person sets their own in `init`.

## Install
```bash
git clone git@github.com:ednaaaj/movegent-kit.git agent-kit && cd agent-kit
node bin/cli.mjs init       # optional profile: GitLab, Jira site, Slack channel + people
node bin/cli.mjs install    # pick agents, copy skills, add Jira MCP, install tools
node bin/cli.mjs doctor
```
Flags: `--agents=claude,cursor`, `--skip-mcp`, `--skip-tools`, `--dry-run`.
Update: `git pull && node bin/cli.mjs install --skip-tools`.

## Workflow skills
| Skill | Use it for |
| --- | --- |
| `ticket-to-mr` | Jira ticket -> branch -> implement -> commit -> push -> MR -> reviewer follow-up |
| `ship` | full pipeline for one or more tickets (intake, plan, implement, review, MR) |
| `mr-babysit` | fix CI, rebase, triage and reply to review threads, report when mergeable |
| `mr-review` | review someone's MR against a rule set, post draft inline comments |
| `jira-transition` | move / resolve / comment on tickets, review a ticket before work |

Subagents (Claude Code): `mr-intake`, `mr-shipper`, `mr-reviewer`.

## Frontend guardrail skills (React Native + design-system projects)
`mp-guardrails` (the rule checklist), `mp-token-usage`, `mp-spacing`, `mp-unistyles`,
`mp-component-structure`, `mp-component-swap`, `mp-types`, `mp-stories`, `mp-index-exports`,
`mp-translate`, `mp-migrate`. Subagents: `airasia-phoenix-analyst|implementer|reviewer`
and the `mp-*` migration writers.

## Private skill packs
A pack is any git repo (or local folder) with `skills/` and/or `agents/` at its root.
```bash
node bin/cli.mjs pack add git@host:team/our-skills.git   # uses YOUR git access
node bin/cli.mjs install                                  # re-applies every pack
node bin/cli.mjs pack update                              # git pull all packs
```
Packs install after the built-ins and can override a skill of the same name.

## Config (`~/.agent-kit/config.json`, written by `init`)
`workspace`, `gitlab_user`, `gitlab_project`, `reviewers`, `jira_site`, `jira_cloud_id`, `slack`.
Skills read it at runtime. Nothing in this repo contains real values.

## Accounts
- **Jira:** Atlassian MCP via `mcp-remote`, OAuth per person. No token on disk.
- **GitLab:** `glab` CLI, per-user login.
- **Slack:** the `slack` block is an allowlist (channel + people). With `auto_send` false, skills only draft.

## Maintainer notes
Per-agent paths and tool commands are tables at the top of `bin/cli.mjs`.
