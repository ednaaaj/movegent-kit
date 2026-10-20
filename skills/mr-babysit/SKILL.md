---
name: mr-babysit
description: Babysit the user's open MRs on GitLab: fix failed CI, rebase conflicts, triage bot and human review threads, and report when an MR is ready to merge. Use when the user says "babysit MRs", "check my MR", "triage bot comments", or when started as the babysitter session of the MR team.
---

> **Config:** read `~/.agent-kit/config.json` first. Placeholders below: `<workspace>`, `<gitlab_user>`, `<gitlab_project>` (and `<gitlab_project_encoded>` = URL-encoded), `<reviewers>` / `<reviewers_csv>`, `<jira_site>`, `<jira_cloud_id>`, `<repo_path>` (= `<workspace>/` + last path segment of `<gitlab_project>`), and `slack.*`. If the file is missing or a value is empty, ask the user once for it; if the file is missing tell them to run `agent-kit init`.

# mr-babysit

Repo: `<repo_path>`. Project path for `glab api`: `projects/<gitlab_project_encoded>`.
Input: `glab mr list --author=<gitlab_user> --opened` (plus `~/.agent-kit/watch.py status` if it exists). Open MRs only, authored by `<gitlab_user>`. Load the project's guardrails skill/agent if one is installed (e.g. from a private skill pack), otherwise follow the repo's own contributing docs, before touching code.

## Loop (one pass per MR, skip anything already clean)

1. **Checkout guard.** Only touch the MR's source branch in the repo. Never `main`/`master`/`release/*`. Edits in the user's checkout need a clean tree; if dirty, do not edit there (the user may be mid-work). Reading, fetching, and rebasing in a separate worktree (step 3) are still allowed.
2. **CI failed** → read failed jobs (`glab api .../pipelines/<id>/jobs`, trace via `.../jobs/<id>/trace`). `allow_failure: true` jobs (e.g. an advisory security review) are ignored.
   - Format/lint → run the repo's formatter/linter on the flagged files, commit `chore: ran format` / `fix: lint errors`.
   - Test/type-check failure → fix the code, never weaken a test. Commit `fix: build failed` / `fix: test failures`.
3. **Rebase check — EVERY pass, for EVERY MR, before anything else is reported.** `git fetch origin main`, then compute `git rev-list --count origin/<branch>..origin/main` (commits behind) and read `has_conflicts` from GitLab. Report both numbers in the pass summary even when zero.
   - **Rebase ONLY when there is a real need:** `has_conflicts` is true, or CI fails because of main, or GitLab will not allow the merge because the branch is behind. Being behind main with no conflict is NOT a reason. Every push re-triggers the AI review bot, which posts new comments on the same code, so an unneeded rebase creates the very threads we then resolve. If there is no need, do not push. Resolve the bot threads only and say "behind main by N, no conflict, not rebased".
   - **Need → rebase** (`git rebase origin/main`, push with `--force-with-lease=<branch>:<expected-sha>`).
   - **Bundle pushes:** fix all valid bot comments, and any rebase, in one push. Never push once per comment.
   - **MR already has an approval** → a force-push resets approvals and costs a re-review round. Rebase only if `has_conflicts` or CI needs it; otherwise leave it and say "behind main by N, approved, not rebased" in the notification so the user decides. When you do rebase an approved MR, say so in the notification so the user can ping the reviewer.
   - **Dirty working tree (user mid-work)** → never skip the rebase check. Rebase in a throwaway worktree instead: `git worktree add <scratchpad>/rb-<iid> origin/<branch>`, rebase and push from there, then `git worktree remove`. Do not touch the user's checkout, stash, or reset anything. Tell the user their local branch is now behind the remote and may conflict with their uncommitted files (list the overlapping files).
   - Version-file conflicts (e.g. `package.json`, `CHANGELOG.md`, if the repo uses per-package version bumps/changelogs): drop the stale bump commit, re-bump one patch above what `main` has, update dependent pins and changelogs.
   - Several open MRs bump the same packages → the first to merge keeps its numbers. When one merges, re-bump each remaining MR on top of fresh `main` (one patch above `main`), never reuse versions another open MR already claims.
   - Any other conflict → `git rebase --abort`, notify the user with the file list. Never guess.
4. **Bot threads** (author username contains `_bot_`: AI review bot, Danger): validate each against the diff and current code.
   - Valid → fix it in code, commit `fix: resolved comments`, then resolve the thread.
   - Not valid / not applicable / already handled → resolve with no reply, and push nothing. Resolving a thread is an API call, not a push, so it does not trigger the bot again.
   - The bot often reviews a stale diff (it says code was removed that is still there). Check the branch head before deciding.
   - Danger summary tables are not resolvable; ignore.
5. **Human threads** (teammates, reviewers): reply, then resolve.
   - Reply in the user's plain, short English: what changed and where (`Fixed in <short sha>.`) or a concrete reason if declining. Never claim a fix that was not made.
   - If a comment asks for a design decision, a behaviour change you are unsure about, or something outside this MR's package/area → do NOT resolve; notify the user instead.
6. **Push** every fix: `git push` (add `--no-verify` if the repo's hooks hang; feature branch only). Rebases use `--force-with-lease=<branch>:<expected-sha>`. Check `git status` after each commit (a post-commit hook may leave bump changes).
7. **Ready to merge** (`detailed_merge_status == mergeable`, pipeline success, 0 open threads) → notify the user. **Never merge.**
8. **Ask for review, then follow up until it merges.** Runs on every pass, per MR, after steps 1-7 are done.
   - **Trigger:** no conflicts, every blocking pipeline job is green (`allow_failure: true`, `manual` and `skipped` jobs do not count), 0 approvals, and the MR is still open. Do not wait for the bot threads to be resolved by a human.
   - **First ping:** send ONE message to `slack.channel` that @mentions every id in `slack.mention` (as `<@ID>`): MR link, Jira keys and one line on what changed. Nothing else: no "authored by AI agent", no CI status, no "not tested" note, no what-to-test list. Send it only to the allowed Slack recipients listed in `## Never`.
   - **State** lives in `~/.agent-kit/slack-pings.json`, keyed by MR iid: `{sha, first_ts, thread_ts, last_sent_iso, count}`. Read it before sending. Never send twice for the same sha inside the follow-up window.
   - **Follow-up:** if the MR is still open with 0 approvals and the same sha, and at least 4 hours have passed since `last_sent_iso`, reply in the same thread (`thread_ts`) with a short reminder that @mentions every id in `slack.mention`. Only during working hours (09:00-18:00 in the user's timezone, Monday to Friday; ask the user once if unsure). Maximum 3 follow-ups per sha, then stop and tell the user.
   - **New push (new sha):** approvals reset, so wait for the new pipeline to go green, then send a fresh first ping and reset the state.
   - **Stop pinging** when the MR is approved by one reviewer (then only mention the missing second approval, once, if two approvals are required), merged, or closed.
   - **No auto-run:** these follow-ups happen on each `mr-babysit` pass. Nothing runs on its own unless the user starts a watcher.

## GitLab calls

- Threads: `glab api "projects/<gitlab_project_encoded>/merge_requests/<iid>/discussions?per_page=100"`
- Resolve: `glab api -X PUT "projects/<gitlab_project_encoded>/merge_requests/<iid>/discussions/<discussion_id>" -f resolved=true`
- Reply: `glab api -X POST "projects/<gitlab_project_encoded>/merge_requests/<iid>/discussions/<discussion_id>/notes" -f body="..."`

## Notify

`osascript -e 'display notification "<msg>" with title "mr-babysit"'` (macOS; use `notify-send` on Linux) and append the same line to `~/.agent-kit/log` prefixed `BABYSIT`. Keep a one-line summary per MR per pass in the log: what was found, what was done. Only message the orchestrator session when something changed (a fix pushed, a rebase, a thread handled, ready to merge, or a blocker). A pass with no change is log-only, no message.

## Never

- Merge, approve, or close an MR.
- Resolve a human thread you did not actually address.
- Edit a second package/area or shared packages (stop and notify).
- Push to `main`, or force-push anywhere except a feature branch with `--force-with-lease`.
- Add AI or co-author attribution to commits, replies or MRs.
- Message anyone on Slack outside the allowed list. Slack config lives in `~/.agent-kit/config.json` under `slack`. If `slack.auto_send` is true, send ONLY to `slack.channel` and `slack.people` (nobody and nowhere else). MR messages always @mention every id in `slack.mention` (format `<@ID>`). Keep the text short, plain English, with the MR link. Do NOT add an "authored by AI agent" line, a CI/conflict/bot status, a "not tested" note, or a what-to-test list: send only the @mentions, the MR link, the Jira keys and a one-line summary of what changed. If `auto_send` is false, or the recipient is not listed, or `slack` is missing, create a draft with `slack_send_message_draft` and tell the user, never send.
