# Config

File: `~/.agent-kit/config.json`, written by `init` and `install`, read by skills at runtime. It stays on your
machine. Full example: [examples/config.example.json](../examples/config.example.json).

## Keys

| Key | Meaning | Used by |
| --- | --- | --- |
| `repo_path` | optional. Repo to work in. Blank = the git root of the folder your agent runs in | workflow and guardrails skills (`<repo_path>`) |
| `design_system_path` | optional. Path to your design-system checkout | guardrails bundle (`<design_system_path>`) |
| `gitlab_user` | your GitLab username | MR author / assignee (`ship`, `ticket-to-mr`, `mr-shipper`) |
| `gitlab_project` | main project path `group/subgroup/repo` | `glab` API calls, `mr-babysit`, `mr-review`, `mr-reviewer` |
| `reviewers` | usual MR reviewer usernames (array) | reviewers on new MRs |
| `jira_site` | Jira host, e.g. `yourco.atlassian.net` | Jira links; `jira-transition`, `mr-intake` |
| `jira_cloud_id` | Atlassian cloudId (UUID); `init` looks it up from `jira_site` | Jira MCP calls |
| `slack.channel` | `{ name, id }` of the channel to post in, or `null` | MR follow-up messages |
| `slack.people` | `[{ name, id }]` people allowed to be DM'd / @mentioned | Slack allowlist |
| `slack.mention` | member IDs always @mentioned on posts | MR follow-up messages |
| `slack.auto_send` | `true` lets the agent send without asking; default `false` (draft only) | Slack steps |
| `bundles` | bundles to install, e.g. `["workflow", "guardrails"]`; saved by `install`, or set with `--bundles` | `install` |
| `packs` | registered packs `[{ name, url, local }]`; managed by `pack add/remove` | `install` |

Skills reference these as placeholders (`<repo_path>`, `<gitlab_user>`, `<reviewers>`, `<jira_site>`, and so on).
If the file or a value is missing, skills ask once or tell you to run `agent-kit init`.

`<repo_path>` needs no setup. Skills use the git root of the folder your agent is running in, so the repo can live
anywhere. Set `repo_path` only if you start your agent from a parent folder and want a fixed repo.

## Editing by hand

Run `node bin/cli.mjs init` again; existing values are shown as defaults. Or edit the JSON directly. Keep
`slack.channel.id` shaped like `C...` or `G...` and member IDs like `U...`. Do not edit `packs` by hand; use
`pack add` and `pack remove`.

## Finding Slack IDs

- Channel ID: open the channel, open its details, and read the ID at the bottom.
- Member ID: open the person's profile, click the three-dot menu, choose Copy member ID.
