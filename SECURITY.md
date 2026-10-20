# Security Policy

## Supported versions

Only the latest release is supported.

## Reporting a vulnerability

Use GitHub private security advisories: https://github.com/ednaaaj/movegent-kit/security/advisories/new

Do not open a public issue for a vulnerability. Include the affected version, steps to reproduce, and impact. Redact tokens and personal data.

## What agent-kit does

- Copies skills and subagents from the bundles you choose into your agent's config folders.
- Writes MCP and allowlist entries you choose (Jira MCP, Slack allowlist).
- Installs optional third-party tools from their upstream sources.
- Keeps your config in `~/.agent-kit/config.json`, local only.

## What it does not do

- It does not ask for or store tokens or passwords. Jira login happens in your browser through the MCP server.
- It does not send your config anywhere.

## Things to know

- Third-party tools are installed from upstream and are not audited by this project.
- `rtk` and `context-mode` add hooks to your agent. Review them before enabling.
- Private packs are cloned with your own git access.

## No private values in the repo

Real Jira IDs, Slack IDs or channels, usernames, emails, tokens and local paths must never be committed. Skills use placeholders only. If you find a private value in the repo, report it as above.
