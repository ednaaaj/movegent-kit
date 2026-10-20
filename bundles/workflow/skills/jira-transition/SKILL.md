---
name: jira-transition
description: Move, resolve or comment on a Jira ticket via the Atlassian MCP at the right moment of a ticket-to-MR workflow (start work, MR opened, merged). Use when the user says "move PROJ-123", "resolve ticket", "mark in review", "set to done", or after an MR is created or merged.
---
> **Config:** read `~/.agent-kit/config.json`. Use `<jira_cloud_id>` as `cloudId` for every Atlassian MCP call. Never hardcode another site.

# jira-transition
Tools (Atlassian MCP): `getJiraIssue`, `getTransitionsForJiraIssue`, `transitionJiraIssue`, `addCommentToJiraIssue`, `searchJiraIssuesUsingJql`.

## Rules
- Status names differ per project and workflow. ALWAYS call `getTransitionsForJiraIssue` first and pick by name. Never guess a transition id.
- One ticket = one move. State the move before doing it: `PROJ-123: In Progress -> In Review`.
- Never reassign, change story points, sprint, or fix version unless the user asks.
- Scope searches to the current sprint: `assignee = currentUser() AND sprint in openSprints()`.

## When to move
| Moment | Target status (closest match) | Also |
| --- | --- | --- |
| User picks up ticket | In Progress | none |
| MR opened (`ticket-to-mr` step done) | In Review / Code Review | comment with MR link + one-line summary |
| MR merged | Resolved / Done / Ready for QA (per project) | comment with merged MR link |
| Blocked | Blocked, only if transition exists | comment with reason |

## Resolve
1. `getJiraIssue` -> confirm current status and that an MR exists and is merged (`glab mr view <iid>` or MR link in comments).
2. `getTransitionsForJiraIssue` -> choose Resolved/Done. If both exist or fields are required (resolution, fix version), ask the user once.
3. `transitionJiraIssue`, then `addCommentToJiraIssue`: `Merged in <MR url>.`

## Review a ticket (before work)
`getJiraIssue`, then report in 5 lines max: clear AC? Figma link? story points set? affected LOB? missing info. Do not edit the ticket. If info is missing, draft a comment for the user to approve, do not post.

## Never
- Close/resolve a ticket whose MR is not merged.
- Post comments the user did not see, except the MR-link comment above.
