# agent-kit

agent-kit sets up AI coding agents (Claude Code, Cursor, Gemini CLI, Antigravity, Codex) for a team that ships
through Jira and GitLab. One command copies the team's skills and subagents into each agent's folder, connects
the Jira MCP, sets a Slack allowlist, and installs optional token-saver tools. Private skill packs from your own
git repo are added the same way.

The content is split into bundles, so each person installs only what their work needs. No company keys, IDs or
handles are baked in. You enter your own in `init`. No passwords or API tokens are asked for or stored.

## Install

```bash
# from npm
npx @ednaaaj/agent-kit init
npx @ednaaaj/agent-kit install

# or from source
git clone git@github.com:ednaaaj/movegent-kit.git agent-kit && cd agent-kit
node bin/cli.mjs init
node bin/cli.mjs install
node bin/cli.mjs doctor
```

Flags: `--agents=claude,cursor`, `--bundles=workflow,guardrails`, `--tools=rtk,headroom`,
`--pack=<git-url|path>`, `--skip-mcp`, `--skip-tools`, `--dry-run`.

Your bundle choice is saved in `~/.agent-kit/config.json`, so repeat installs without a terminal reuse it.

```mermaid
flowchart LR
    W["workflow<br/>ticket, MR, babysit"] --> I["install"]
    G["guardrails<br/>React Native + design system"] --> I
    S["savers<br/>token-saver tools"] --> I
    P["your pack<br/>(private git repo)"] --> I
    I --> A1["Claude Code"]
    I --> A2["Cursor"]
    I --> A3["Gemini / Antigravity"]
    I --> A4["Codex"]
```

## What `init` asks

Nothing is required: press Enter to skip any question. Answers are saved to `~/.agent-kit/config.json`, on your machine only.

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

`install` asks which agents you use, which bundles you want, and which extra tools. Jira login happens in your
browser the first time an agent uses Jira. Details: [docs/config.md](docs/config.md).

## Bundles

| Bundle | Contents | Who needs it |
| --- | --- | --- |
| `workflow` | `ship`, `ticket-to-mr`, `mr-babysit`, `mr-review`, `jira-transition`, plus the `mr-intake`, `mr-shipper`, `mr-reviewer` subagents | everyone who works tickets into MRs |
| `guardrails` | 11 `mp-*` skills and 10 subagents for React Native and a design system | frontend / mobile devs; backend devs can skip it |
| `savers` | token-saver tool recipes (caveman, ponytail, rtk, headroom, context-mode, graphify) | anyone who wants smaller context use |

Your own pack counts as one more bundle and is always installed. See [docs/packs.md](docs/packs.md).

## Repository layout

```text
agent-kit/
  bin/cli.mjs            installer
  targets.json           where each agent reads skills, subagents and MCP
  bundles/
    workflow/            skills/ and agents/
    guardrails/          skills/ and agents/
    savers/tools.json    token-saver recipes
  docs/                  detailed docs
  examples/              example config and a minimal pack
  scripts/ tests/        validator and test suite
```

## Docs

- [docs/architecture.md](docs/architecture.md): how the pieces fit, what `install` does
- [docs/agents.md](docs/agents.md): which agent reads what, adding an agent
- [docs/tools.md](docs/tools.md): token-saver tools, adding a tool
- [docs/packs.md](docs/packs.md): private skill packs
- [docs/workflow.md](docs/workflow.md): ticket-to-MR pipeline and guardrail skills
- [docs/config.md](docs/config.md): every config key
- [docs/troubleshooting.md](docs/troubleshooting.md): common problems
- [AGENTS.md](AGENTS.md), [CONTRIBUTING.md](CONTRIBUTING.md), [SECURITY.md](SECURITY.md), [CHANGELOG.md](CHANGELOG.md)

## License

MIT. Third-party tools are installed from their own upstream repos under their own licences.
