---
name: ship
description: Run the MR team pipeline on one or more Jira tickets: intake, plan, implement, review, then commit/push/create MR. Use when the user says "/ship PROJ-123", "work on PROJ-123 and PROJ-124", or "pull these tickets". Stops only at the listed gates.
---

> **Config:** read `~/.agent-kit/config.json` first. Placeholders below: `<workspace>`, `<gitlab_user>`, `<gitlab_project>` (and `<gitlab_project_encoded>` = URL-encoded), `<reviewers>` / `<reviewers_csv>`, `<jira_site>`, `<jira_cloud_id>`, `<repo_path>` (= `<workspace>/` + last path segment of `<gitlab_project>`), and `slack.*`. If the file is missing or a value is empty, ask the user once for it; if the file is missing tell them to run `agent-kit init`.

# ship

You are the ORCHESTRATOR. You coordinate agents and print a one-line status per stage. You do not write feature code yourself. Repo: `<repo_path>`. Handoff files live in `~/.agent-kit/work/<KEY>/`. The babysitter (`mr-babysit`) runs in its own session and takes over once the MR exists.

Input: Jira keys. Load the project's guardrails skill/agent if one is installed (e.g. from a private skill pack), otherwise follow the repo's own contributing docs.

## Pipeline

**0. Preflight** (stop and report if any fails)
- The repo tree is clean and no rebase/merge is in progress (`git status --porcelain`, `.git/rebase-*`). The babysitter session shares this checkout: if it is mid-operation or the tree is dirty, wait or report. Never stash or discard someone's changes.
- `glab auth status` OK.

**1. Intake** → intake agent (`mr-intake`) with the keys. Read each returned `ticket.md` status:
- `NEEDS_DESIGN` → reply exactly: "Please share the design spec/link, or confirm I should proceed without a design." Stop for that packet.
- `MULTI_PACKAGE` → name the packages and files involved, ask the user for approval, and stop for that packet.
- `UNCLEAR` → show the missing info, stop for that packet.
- `READY` → continue. Transition the ticket to In Progress (`getTransitionsForJiraIssue` → `transitionJiraIssue`); never Done.

**2. Plan** → a planner agent (read-only) with the contents of `ticket.md`, plus the instruction to do a preflight: existing components to reuse, design tokens, file layout, and the single-package rule. Write its output to `plan.md`. If the plan touches a second package or a shared package → stop and ask for approval.

**3. Branch + Execute**
- `git fetch origin main && git checkout -b <branch from ticket.md> origin/main`. Never commit on `main`.
- An implementer agent with `plan.md` + `ticket.md` text and the design URLs. Write a summary of what changed to `impl.md`. Independent work units may run as parallel implementers only within the same package.

**4. Review** → a reviewer agent on the diff vs `origin/main`, with `plan.md` as the spec. Write `review.md` with a `verdict: PASS|FAIL` line.
- FAIL → send the findings back to the implementer, re-review. Max 3 rounds, then stop and surface the blocker.

**5. Ship** → agent `mr-shipper` with the packet folder. It commits, bumps (if the repo does version bumps), rebases, pushes, creates the MR, drafts the Slack message into `mr.md`.

**6. Report** to the user: per packet, one line per stage (done / blocked + reason), the MR URL, what the user still has to add (screenshots, `Tested on`), and the Slack draft. Tell the user the babysitter takes it from here.

## Rules
- Several tickets: process packets one at a time unless the user asks otherwise (one shared checkout, no worktrees yet).
- Status lines look like `[2/5 plan] PROJ-123 done`. Print one as each stage finishes.
- Everything routine runs without asking (commit, push, force-with-lease on feature branches, `--no-verify` when the repo's hooks hang). Ask only at the gates above, or for merge, thread resolving, or sending messages.
- Never merge, approve, or message anyone not allowed by the Slack rules in `slack.*` (send only to `slack.channel` and `slack.people` when `slack.auto_send` is true; otherwise draft only).
