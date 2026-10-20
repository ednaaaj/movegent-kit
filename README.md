# agent-kit

One installer for AI coding agents (Claude Code, Cursor, Antigravity/Gemini CLI, Codex):
a ticket-to-MR workflow, frontend guardrail skills, Jira MCP, a Slack allowlist,
token savers (caveman, ponytail, rtk, headroom, context-mode, graphify), plus **private skill packs** a team can add on top.
No company keys, IDs or handles are baked in: each person sets their own in `init`.

## Install
```bash
npx @ednaaaj/agent-kit init && npx @ednaaaj/agent-kit install      # from npm
# or from source:
git clone git@github.com:ednaaaj/movegent-kit.git agent-kit && cd agent-kit
node bin/cli.mjs init       # optional profile: GitLab, Jira site, Slack channel + people
node bin/cli.mjs install    # pick agents, copy skills, add Jira MCP, install tools
node bin/cli.mjs doctor
```
Flags: `--agents=claude,cursor`, `--skip-mcp`, `--skip-tools`, `--dry-run`.
Update: `git pull && node bin/cli.mjs install --skip-tools`.

## What it asks you
Nothing is required: press Enter to skip any question. **No passwords or API tokens are ever asked for or stored.**

**`init`** (saves your answers to `~/.agent-kit/config.json`, on your machine only):

| # | Question | Example | Used for |
| --- | --- | --- | --- |
| 1 | Workspace folder | `~/work` | where skills find your repos |
| 2 | GitLab username | `jdoe` | MR author / assignee |
| 3 | Main GitLab project path | `group/sub/repo` | `glab` API calls |
| 4 | MR reviewers | `alice,bob` | reviewers on new MRs |
| 5 | Jira site host | `yourco.atlassian.net` | Jira links; the cloudId is looked up for you |
| 6 | Slack channel name | `#team-reviews` | where MR posts go (blank skips Slack) |
| 7 | Slack channel ID | `C0123ABCD` | from the channel's details; re-asks if invalid |
| 8 | People to DM / @mention | `Alice,U0123ABCD` | one per line, blank line to finish |
| 9 | Who is always @mentioned | `Alice` | blank = everyone listed |
| 10 | Let the agent send without asking? | `n` | default `n`: it only drafts |

**`install`** asks one thing: which agents you use (the numbered menu above). Then it copies skills, adds the
Jira MCP, and runs the caveman / ponytail / graphify installers (those may ask their own questions).
Jira login happens in your browser the first time an agent uses Jira: you sign in as yourself.

## Extra tools (token savers)
After the agent menu, `install` offers these (pick numbers, `all`, `none`, or `--tools=rtk,headroom`; `--skip-tools` skips the step):

| Tool | What it does | Needs |
| --- | --- | --- |
| `caveman` | terse replies, ~75% fewer output tokens | npx |
| `ponytail` | "lazy senior dev" mode: shortest working code | agent CLI (Cursor/Codex: manual) |
| `rtk` | compresses shell command output 60-90% | Homebrew |
| `headroom` | context compression + retrieve MCP | uv |
| `context-mode` | keeps big tool output out of your context | Claude Code (others: manual) |
| `graphify` | turns a codebase into a queryable graph | uv |

These tools **change agent behaviour** (RTK and context-mode add hooks to your agent's settings), so only pick
what you want. A missing prerequisite is reported and skipped, never fatal. Third-party tools are installed from
their own upstream repos; see each project for its licence.

## Which agent reads what
`install` asks which agents you use (numbered menu, found ones pre-selected) and writes to each one's own folder:

| Agent | Skills | Subagents | Jira MCP |
| --- | --- | --- | --- |
| Claude Code | `~/.claude/skills` | `~/.claude/agents` | `claude mcp add` |
| Cursor | `~/.cursor/skills` | not installed | `~/.cursor/mcp.json` |
| Gemini CLI | `~/.gemini/skills` | not installed | `~/.gemini/settings.json` |
| Antigravity | `~/.gemini/antigravity/skills` | not installed | `~/.gemini/antigravity/mcp_config.json` |
| Codex | `~/.codex/skills` | not installed | `codex mcp add` |

Gemini, Antigravity and Codex also get a shared copy in `~/.agents/skills`. Subagents are Claude-format
only, so other agents get skills but not the `mr-*` / `*-writer` subagents. Pick agents non-interactively
with `--agents=claude,cursor,gemini,antigravity,codex`.

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
