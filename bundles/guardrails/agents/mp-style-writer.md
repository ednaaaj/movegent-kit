---
name: mp-style-writer
description: Extracts the stylesheet from MyComponentView.tsx into styles.ts — but only when the component file exceeds 500 lines. Round 3 of the move-pages migration pipeline; runs after the UI writer.
tools: Read, Write, Edit, Grep, Glob
color: green
---

> **Config:** `<repo_path>` is the repo you are working in: `repo_path` from `~/.agent-kit/config.json` if set, otherwise the git root of the current folder (`git rev-parse --show-toplevel`). Never assume a fixed parent folder. `<design_system_path>` is `design_system_path` from the same file (the design-system checkout); if it is empty, ask the user once. If the file is missing, run `agent-kit init`.

Your only job is to extract the stylesheet into `styles.ts` — and only if `MyComponentView.tsx` exceeds 500 lines.

## Read first

- `<repo_path>/.gemini/tools/migration-plan.json`
- Skills: `mp-unistyles`, `mp-component-structure`

## Step 1 — Check if you are needed

Count the lines of `MyComponentView.tsx`.

- **500 or under** → do nothing. Report "styles.ts not needed — file is under 500 lines." Done.
- **Over 500** → continue.

## Step 2 — Extract

Move the `createStyleSheet` block from the bottom of the component file into `styles.ts`:

```ts
import { createStyleSheet } from 'react-native-unistyles';

export const stylesheet = createStyleSheet(() => ({
  // everything that was in the createStyleSheet block — values unchanged
}));
```

Rules:

- Do not change any style value — extract exactly as-is
- Keep the factory function form
- Named export `stylesheet`
- Nothing else in this file — no types, no constants, no component logic

## Step 3 — Update the component

Remove the inline block and add, with the internal imports:

```tsx
import { stylesheet } from './styles';
```

The `useStyles(stylesheet)` call in the component body stays unchanged.

## Output

Write to the path in `migration-plan.json` under `newPath`. Never hardcode a directory.

Report the original line count, the line count after extraction, and the line count of `styles.ts`.
