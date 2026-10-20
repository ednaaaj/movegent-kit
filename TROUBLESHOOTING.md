# Troubleshooting

**Skills do not show in my agent.**
Restart the agent. Check the install path for your agent in `docs/agents.md`. Run `agent-kit doctor`.

**Jira login.**
The first Jira MCP call opens a browser to log in. The Atlassian MCP runs through `mcp-remote`, so `npx` and Node must be available.

**`brew` or `uv` is missing.**
Tools that need them are skipped, with a hint on how to install the missing program. Install it and re-run `install`.

**How do I get Slack IDs?**
In Slack, open the member profile, choose the three-dot menu, then Copy member ID. For a channel, open channel details and copy the Channel ID at the bottom.

**A pack fails to clone.**
Packs are cloned with your own git access. Check that you can `git clone` the pack URL yourself.

**Duplicate skills.**
If you use both the Claude plugin and `install`, skills appear twice. Choose one.

**npm shows a 0.0.0-stage placeholder.**
npm staged publishing holds the release until approved. Approve it in the Staged Packages tab on npmjs.com.
