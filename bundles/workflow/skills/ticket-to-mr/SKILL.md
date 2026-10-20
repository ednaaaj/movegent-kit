---
name: ticket-to-mr
description: Take a Jira ticket (or several) from pickup to an open GitLab MR — branch, implement, commit in the user's exact style, push, create the MR from the right template with package label and reviewers, then draft the reviewer follow-up. Use when the user gives a Jira key (e.g. PROJ-123) or says "pick up ticket", "create MR for", "work on PROJ-123".
---

> **Config:** read `~/.agent-kit/config.json` first. Placeholders below: `<workspace>`, `<gitlab_user>`, `<gitlab_project>` (and `<gitlab_project_encoded>` = URL-encoded), `<reviewers>` / `<reviewers_csv>`, `<jira_site>`, `<jira_cloud_id>`, `<repo_path>` (= `<workspace>/` + last path segment of `<gitlab_project>`), and `slack.*`. If the file is missing or a value is empty, ask the user once for it; if the file is missing tell them to run `agent-kit init`.

# ticket-to-mr

Repo: `<repo_path>`. Confirm checkout + branch with the user before any git/glab action, never trust the shell cwd. Use absolute paths.
CLI: `glab` (logged in as `<gitlab_user>`, SSH), Jira via the Atlassian MCP (`getJiraIssue`).
Before implementing, load the project's guardrails skill/agent if one is installed (e.g. from a private skill pack), otherwise follow the repo's own contributing docs. These rules add to it, never replace it.

## 0. Find the tickets (when the user says "my tickets", "what's in progress", "check Jira")

- Always scope to the current sprint: `assignee = currentUser() AND sprint in openSprints() AND status = "In Progress"` (cloudId `<jira_cloud_id>`, `responseContentFormat: "markdown"`). Never list by status alone, and ignore anything outside the open sprint (stale tickets).
- Story points: the Jira field is `"Story Points"` (`"Story Points" is not EMPTY` in JQL). A ticket with story points is a feature: it gets its own branch and MR, and nothing else goes in it.
- Decide the package/area for each ticket yourself, without asking: read the code the ticket touches (read-only analysis, via the project's analyst agent if one is installed) and pick the package. A ticket title tag does not guarantee the code lives in that package only.

## 1. Read the ticket(s)

- `getJiraIssue` for each key: summary, type (Bug/Story/Task), description, AC, parent, links.
- Find the design link (Figma or similar) in the ticket (description, remote links via `getJiraIssueRemoteIssueLinks`, comments).
  - UI change and no design link anywhere → stop and ask: "Please share the design spec/link, or confirm I should proceed without a design."
- Transition the ticket to In Progress (`getTransitionsForJiraIssue` → `transitionJiraIssue`). Nothing further; never move it to Done.

## 2. Group tickets (when more than one)

- Map each ticket to ONE package/area, reading the code (read-only analysis).
- **Bugs (no story points):** group by package/area. All bugs for one package go in one branch and one MR, bugs for another package in another, all keys in `Refs:`. Different packages → one branch + MR per package.
- **Feature (has story points, usually a Story):** one ticket, one branch, one MR, one package. Do not add bugs or other tickets to it.
- One task changes one package/area. A ticket that truly needs a second package → stop and ask the user (what files, in which packages). Do not proceed.
- Show the grouping plan to the user in 3-5 lines, then continue without waiting unless a gate fired.

## 3. Branch

- `git -C <repo_path> fetch origin`, then `git -C <repo_path> checkout -b <JIRA-KEY> origin/main`. The branch is named after the ticket key only, e.g. `PROJ-123`.
  - Multi-ticket MR (grouped bugs): use the first/primary key.
  - A feature with story points: its own key, nothing else in the branch.
- Never commit to `main`. If the tree is dirty, stop and tell the user.

## 4. Implement

- Delegate code to an implementer agent (one package). Pass the ticket text, AC, design link, and file hints.
- Review with a reviewer agent before committing. Fix findings first.

## 5. Commit (must read like the user's own)

First match the repo's recent history: run `git log --author=<gitlab_user> -n 10 --format=%s` and follow that style. If the history shows no clear pattern, use this default:

```
[TYPE][JIRA-KEY]: Sentence-case description, no trailing period
```

- `TYPE` is uppercase: `FIX`, `FEAT`, `CHORE`. Examples:
  - `[FIX][PROJ-123]: Fix image missing in error popup`
  - `[FEAT][PROJ-124]: Changes for reusing the detail view`
  - `[CHORE][PROJ-123]: Bump up package version for deploying search changes`
- Describe the symptom or the change, in the ticket's own words. Plain, short English, sentence case, no emoji.
- Bug-fix commits usually start with "Fix ..." or state the broken behaviour.
- No body unless the change is non-obvious. No Co-Authored-By trailer, no "Generated with" line, no AI attribution anywhere in commits, PRs or MRs.
- Follow-up commits on an open MR (review fixes, build fix, format, test update, bump) use the short lowercase form instead: `fix: resolved comments`, `fix: build failed`, `chore: ran format`, `chore: update tests`. Only the main commit carries `[TYPE][KEY]:`.
- If the repo uses per-package version bumps/changelogs, put them in a separate final commit `[CHORE][JIRA-KEY]: Bump up package versions`, following the repo's own bump process; if unsure how, ask. If the repo has no such process, skip this step.
- Before the first push: `git fetch origin && git rebase origin/main`. On conflict, run `git rebase --abort`, list the conflicted files, and stop for the user. Never guess a resolution.
- Auto-commit and auto-push are approved. If the repo's git hooks hang or are known to be slow, pass `--no-verify` on `git commit` and `git push`. Check `git status` after each commit: a post-commit hook may leave version-bump changes.
- Force-push is allowed on feature branches only, no confirmation: guard that the branch is not `main`/`master`/`release/*` and the tree is clean, then `git push --force-with-lease=<branch>:<expected-sha>` (plus `--no-verify` if used above). Never plain `--force`. Never push to `main`.

## 6. Create the MR

```bash
glab mr create --target-branch main --source-branch <branch> \
  --title "<title>" --description-file <file> \
  --label "<package/area label>[,Feature]" --assignee <gitlab_user> \
  --reviewer <reviewers_csv> --remove-source-branch --yes
```

- Title: same as the main commit, e.g. `[TYPE][JIRA-KEY]: Summary`.
- Label: the package/area name, capitalised. Add `Feature` for FEAT. Work spanning an approved multi-package bundle carries both labels.
- Reviewers: `<reviewers>`. If the user names others, use theirs.
- Description: fill the matching template from `.gitlab/merge_request_templates/` (if the repo has them) completely, in the user's voice, with the real root cause, steps, risk and tests.
  - Bug → bug template, UI feature → UI feature template, API feature → API feature template, chore → chore template.
  - Start with the template's title comment block like previous MRs.
  - Jira link: `[KEY](https://<jira_site>/browse/KEY)`.
  - Multi-ticket: list every key under Linked Ticket and add `Refs: KEY1, KEY2`.
  - Be honest in the checklist: tick only what was actually run. Leave `Tested on` and screenshots as `<!-- add ... -->` placeholders for the user. Never invent evidence.
- Print the MR URL when done.

## 7. Reviewer follow-up

- Write a short Slack message: MR link, Jira keys, one-line summary of what changed, @mentioning every id in `slack.mention` as `<@ID>`. Plain, friendly English.
- Slack rules, driven by `slack.*` in `~/.agent-kit/config.json`: if `slack.auto_send` is true, send ONLY to `slack.channel` and `slack.people` (nobody and nowhere else). Keep the text short and plain: the @mentions, the MR link, the ticket keys and a one-line summary. Do NOT add an "authored by AI agent" line, a CI/conflict/bot status, a "not tested" note, or a what-to-test list. If `auto_send` is false, or the recipient is not listed, or `slack` is missing, create a draft with `slack_send_message_draft` and tell the user, never send. Never message anyone not listed.

## Never

- Merge, approve or close an MR, or resolve review threads here (that is `mr-babysit`).
- Edit shared packages or a second package/area without explicit user approval.
- Skip pre-push checks the project's guardrails require when the user has not opted out.
