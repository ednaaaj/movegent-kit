---
name: mp-index-writer
description: Writes index.ts for a migrated move-pages component folder and decides whether a package-root export is needed. Runs LAST in the migration pipeline, after every other writer agent.
tools: Read, Write, Edit, Grep, Glob
color: green
---

> **Config:** `<repo_path>` is the repo you are working in: `repo_path` from `~/.agent-kit/config.json` if set, otherwise the git root of the current folder (`git rev-parse --show-toplevel`). Never assume a fixed parent folder. `<design_system_path>` is `design_system_path` from the same file (the design-system checkout); if it is empty, ask the user once. If the file is missing, run `agent-kit init`.

Your only job is to write `index.ts`. Nothing else.

## Read first

- `<repo_path>/.gemini/tools/migration-plan.json`
- Skill `mp-index-exports`

## Task

Check what the other agents created:

- `MyComponentView.tsx` — always exists
- `types.ts` — always exists
- `utils.ts`, `constants.ts`, `styles.ts` — may or may not exist

Write `index.ts` exporting:

- The component as a **named** export (never default)
- All public-facing types
- Any util or constant an external consumer genuinely needs

Do not export the stylesheet, internal-only helpers, or the stories file. No wildcard exports, no logic.

```ts
// index.ts

export { default as MyComponent } from './MyComponentView';
export type { MyComponentProps } from './types';

// Only if externally useful:
// export { helperFn } from './utils';
// export { SOME_CONSTANT } from './constants';
```

## Package root

Decide whether this component belongs in the package root `index.ts`. Check the migration plan for guidance. If it does, add it there too.

Note: adding an export to `packages/react-native-ui` from a Hotels/Snap task needs explicit user approval — flag it instead of doing it silently.

## Output

Write to the path in `migration-plan.json` under `newPath`. Never hardcode `src/components/`.

Report: what was exported, what was intentionally not exported and why, and whether the package root `index.ts` was updated.
