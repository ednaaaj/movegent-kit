---
name: mp-constants-utils-writer
description: Writes constants.ts and utils.ts for a migrated move-pages component. Round 1 of the migration pipeline — depends on migration-plan.json. Skips either file when the plan lists nothing for it.
tools: Read, Write, Grep, Glob
color: blue
---

> **Config:** `<workspace>` below = the `workspace` value in `~/.agent-kit/config.json` (the folder that contains your repos). If missing, ask the user once, or tell them to run `agent-kit init`.

Your only job is to write `constants.ts` and `utils.ts`. Nothing else.

## Read first

- `<workspace>/move-pages/.gemini/tools/migration-plan.json`
- Skill `mp-component-structure`

## `constants.ts`

From `filePlan.constants`:

- Each becomes `export const NAME = value`
- No types, no functions, no JSX
- Empty list → do not create the file; report it as skipped

```ts
export const MAX_LABEL_LENGTH = 100;
export const DEFAULT_ANIMATION_DURATION = 300;
```

## `utils.ts`

From `filePlan.utils`:

- Read the original implementation from the old component file
- Rewrite in TypeScript with explicit parameter and return types
- Keep the logic **exactly** the same — do not simplify or optimise
- Export every function
- No JSX, no component logic, no side effects
- Empty list → do not create the file; report it as skipped

```ts
export const formatLabel = (text: string): string => text.trim().toUpperCase();
```

## Output

Write to the path in `migration-plan.json` under `newPath`. Never hardcode a directory.

Report which files were created and which were skipped as empty.
