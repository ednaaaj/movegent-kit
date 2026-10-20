---
name: mr-review
description: Automated GitLab MR review — the 13 review rules (structure, styling, i18n, logging, service/hook/query architecture, secrets, imports, derived-vs-synced state, strict typing), the diff-line validation procedure, comment formatting, and how to post draft inline notes. Use when reviewing a merge request or a diff.
---

> **Config:** read `~/.agent-kit/config.json` first. Placeholders below: `<workspace>`, `<gitlab_user>`, `<gitlab_project>` (and `<gitlab_project_encoded>` = URL-encoded), `<reviewers>` / `<reviewers_csv>`, `<jira_site>`, `<jira_cloud_id>`, `<repo_path>` (= `<workspace>/` + last path segment of `<gitlab_project>`), and `slack.*`. If the file is missing or a value is empty, ask the user once for it; if the file is missing tell them to run `agent-kit init`.

# MR Review

Review a merge request as a senior React Native / TypeScript engineer. The rules below are a default set; if the repo has its own contributing or review docs (or a project guardrails skill is installed), those override or extend them.

## Config

- Project path: `<gitlab_project>`
- Numeric `project_id`: look it up once with `glab api projects/<gitlab_project_encoded>` (field `id`) and reuse it for all calls.
- Posting tool: the `gitlab-mr-mcp` MCP server (`mcp_gitlab-mr-mcp_*`). **Never** use `mcp_GitLab_*` tools.

**If `gitlab-mr-mcp` is not connected in this session**, do not fake it. Say so, then fall back to reviewing the local diff (`git diff`, `git diff --stat`, or a diff the user pastes) and output the findings as a list instead of posting them.

---

## Phase 1 — Read the MR

1. `mcp_gitlab-mr-mcp_get_merge_request_details` with the `project_id` and the MR iid. Store `diff_refs.base_sha`, `diff_refs.start_sha`, `diff_refs.head_sha`.
2. `mcp_gitlab-mr-mcp_get_merge_request_diff` with the same ids — this gives every changed file and its diff.

## Phase 2 — Review (no tool calls in this phase)

Go through every changed/added file and apply the rules below.

**Only review lines that are added or modified — the `+` lines.**

### Procedure: Validate-Line-In-Diff

1. Locate the `+` lines in the diff hunk for the file.
2. Verify the line number matches the `new_line` index of a `+` line.
3. If the line is a `-` line or unchanged context, do not comment. If the issue is critical but the line is untouched, comment on a nearby changed line or skip.

### Procedure: Verify-File-Context

1. If critiquing a function/variable/class, verify the file path is where the symbol is *defined*, not where it is imported or called.
2. Never anchor a "move this function" comment to a call site.
3. Re-read the hunk for that file before finalising the finding.

Build a findings list. Each finding needs `file_path`, `line_number` (new-side, as a **string**), `category` (Structure, Licence, Styles, i18n, Logging, API, Suspicious, Security, Imports, State, Query, Typing), `issue`, `suggestion`.

## Phase 3 — Post draft inline comments

For each finding call `mcp_gitlab-mr-mcp_add_merge_request_diff_draft_note` with `project_id`, `merge_request_iid`, `base_sha`, `start_sha`, `head_sha`, `file_path`, `line_number` (number), `comment`.

**Comments are plain English.** No category tags like `[Structure]`. Never post a summary comment to GitLab.

## Phase 4 — Print a concise summary in the terminal.

---

## Review rules

### 1 — New component/widget/utility structure

Follow the repo's documented layout. A typical layout:

```
MyComponentView/
  MyComponentView.tsx     ← all UI logic here, NOT in index.ts
  MyComponent.stories.tsx ← required for NEW components/widgets
  MyComponent.test.tsx    ← required for NEW components/widgets/utils
  index.ts                ← re-exports only, no logic
  types.ts                ← type/interface declarations only
```

Violations: folder name not following the repo's convention; UI logic in `index.ts`; missing stories for a new component/widget (if the repo uses them); missing test file for a new component/widget/utility; logic in `types.ts`; new file missing the repo's required licence header (if it has one).

### 2 — Styling: the project's styling system only

Use the project's chosen styling system consistently (e.g. a themed stylesheet API) rather than a raw alternative.

- **2a.** No raw `StyleSheet` from `react-native` if the project mandates its own stylesheet API.
- **2b.** Any stylesheet containing a colour must use the factory/theme-aware form the project requires, with design tokens rather than hardcoded values.
- **2c.** Responsiveness via breakpoints, not conditionals. Suggest the sheet form, for example:
  ```
  paddingHorizontal: { xs: 0, md: spacingToken }
  ```
- **2d.** Inline styles with more than one property belong in the stylesheet.

### 3 — No hardcoded strings

Every user-visible string goes through the project's translation function (e.g. `t()`).

### 4 — No `console.log`

Use the project's logger instead.

### 5 — API architecture: service → hook → component

- No API calls in components/widgets/utils/pages
- Services use the project's networking layer, not raw `fetch`/`axios`
- Hooks wrap services with the query library's `useQuery`/`useMutation`
- Components use hooks, never services directly

### 6 — Suspicious code

Commented-out dead code; `TODO`/`FIXME`/`HACK` with no issue number; unreachable logic; empty catch blocks.

### 7 — No secrets or keys in code

### 8 — No raw package paths in apps

```tsx
import { Button } from '../../libs/ui/Button'; // ❌
import { Button } from '@myorg/ui';                // ✅
```

### 9 — Global state via the query library only

No new Redux slices, Zustand stores, or high-level Context for server data.

### 10 — Replace redundant useEffect with query-library options

| Pattern | Replacement |
| --- | --- |
| refetch on network restore | `refetchOnReconnect: true` (default) |
| refetch on window focus | `refetchOnWindowFocus: true` (default) |
| polling via `setInterval` | `refetchInterval: ms` |
| derive/transform data | `select` |
| manual `isLoading` + fetch | replace with `useQuery` |
| watching `isError` for a toast | `onError` in mutation / query meta |
| dependent queries | `enabled: !!dependency` |

Comment format:

```
This useEffect can be replaced with a native query-library option.

❌ Current:
<snippet>

✅ Suggested:
<replacement>

Reason: <one sentence>
```

### 11 — Platform-specific window checks

Pair every `window` check with `Platform.OS`:

```tsx
if (typeof window !== 'undefined' && Platform.OS === 'web') { ... }
```

### 12 — Derived vs synced state

- Flag any `useEffect` that calls `setState`/`setQueryData` just to sync props or external data into local/cache state.
- If data can be computed during render (`useMemo`, query `select`), it must be.
- Ask: is there a redundant render cycle that `select`, `enabled`, `placeholderData`, or memoisation would eliminate?
- Flag duplicate state maintained across layers.

### 13 — Strict type safety

No `any` casts, declarations, or bypasses in production code. Everything explicitly typed. Dynamic data uses `unknown` plus type guards or a schema validator. Exception: `.test.tsx` / `.stories.tsx` may use broad types for mocks, though typed doubles are preferred.

---

## Ignore

Formatting/indentation, comment spelling, test implementation details (as long as the test exists), files not in the diff, and **existing unchanged code**.

## Critical rules

- `project_id` is always the numeric id of `<gitlab_project>`; `merge_request_iid` is always a number; `line_number` in findings is always a string
- Never pass `verbose` to `get_merge_request_diff` or `add_merge_request_diff_comment`
- Only flag actual violations — if unsure, skip it
- Stories are required only for NEW components/widgets; tests only for NEW components/widgets/utilities
- Never approve, merge or close the MR; never resolve threads you did not author
