---
name: mp-migrate
description: Run the full old-JavaScript-to-TypeScript React Native component migration pipeline for move-pages — analyse the old component into a migration plan, then coordinate the type / constants-utils / UI / style / story / index writer sub-agents, and run the final self-review checklist. Use when asked to migrate, port, or modernise a legacy component to Phoenix + Unistyles + TypeScript.
---

> **Config:** `<repo_path>` is the repo you are working in: `repo_path` from `~/.agent-kit/config.json` if set, otherwise the git root of the current folder (`git rev-parse --show-toplevel`). Never assume a fixed parent folder. `<design_system_path>` is `design_system_path` from the same file (the design-system checkout); if it is empty, ask the user once. If the file is missing, run `agent-kit init`.

# Component Migration Pipeline

You are the orchestrator. Coordinate specialist sub-agents to migrate one old JavaScript component to TypeScript with the Phoenix design system.

## ⚠️ You coordinate, you don't code

- Do NOT write component code yourself — spawn the right sub-agent.
- Do NOT rename, move, or delete existing files or folders.
- Do NOT start a step until the previous sub-agent has reported back.

---

## Reference files

Tools (read-only data):

- `<repo_path>/.gemini/tools/theme-map.json`
- `<repo_path>/.gemini/tools/component-map.json`

The plan is written to `<repo_path>/.gemini/tools/migration-plan.json`.

Skills: `mp-component-structure`, `mp-token-usage`, `mp-spacing`, `mp-component-swap`, `mp-types`, `mp-stories`, `mp-index-exports`, `mp-unistyles`, `mp-translate`.

---

## Step 1 — Analyse

Spawn Agent `mp-migration-analyst` with the old component path. It reads every file in the old folder and writes `migration-plan.json`.

Then review the plan yourself:

- Any `skipped` component that looks wrong?
- Any `unmatched` token that should have matched?
- Any red flags in the business-logic summary?

Correct the plan before continuing. **Show the plan to the user and wait for approval before any code is written.**

## Step 2 — Write

### Round 1 — Foundation (parallel)

- Agent `mp-type-writer` → `types.ts`
- Agent `mp-constants-utils-writer` → `constants.ts`, `utils.ts`

Wait for both.

### Round 2 — UI

- Agent `mp-ui-writer` → `MyComponentView.tsx`

Wait — the style writer needs the resulting line count.

### Round 3 — Styles

- Agent `mp-style-writer` → extracts `styles.ts` **only if** the component file exceeds 500 lines.

### Round 4 — Stories and index (parallel)

- Agent `mp-story-writer` → `MyComponentView.stories.tsx`
- Agent `mp-index-writer` → `index.ts` (+ package root export if needed)

---

## Step 3 — Self-review checklist

Run this across every generated file:

- [ ] No `StyleSheet.create` anywhere — only `createStyleSheet`, factory form
- [ ] No `s()`, `ms()`, `vs()` calls — all replaced with raw numbers
- [ ] No scaling utility imports remaining
- [ ] No raw hex colours — every colour is a pd token or has `// TODO: no pd token found`
- [ ] No raw fontSize/lineHeight passed to TextView — always `getTextStyle()`
- [ ] `getTextStyle` imported from `@airasia-phoenix/react-native/utils/utils` wherever TextView is used
- [ ] Every `getTextStyle()` uses tokens from `theme-map.json` — no invented names
- [ ] No raw spacing numbers — all `pd.ref.space` tokens or a TODO
- [ ] No TypeScript errors — all props typed, no implicit `any`
- [ ] All business logic from the old component is present — nothing removed
- [ ] `index.ts` exports are correct
- [ ] Every skipped component has `// TODO: migrate manually`
- [ ] Every icon has `// TODO: replace with pd.sys.icon.category.name`
- [ ] Smart components: `useTranslation` present, no raw UI strings, locale JSON updated with no keys removed
- [ ] Dumb components (`src/components/`): no hooks, no `useTranslation` — strings arrive as props
- [ ] File count matches `mp-component-structure`

Report the checklist. Fix failures yourself or re-spawn the relevant sub-agent.

## Step 4 — Summary

```
✅ Migration complete: {ComponentName}

Files created:
- MyComponentView.tsx ({line count} lines)
- types.ts
- styles.ts (if created)
- utils.ts (if created)
- constants.ts (if created)
- MyComponentView.stories.tsx
- index.ts

Scaling utilities removed: {count} usages of s()/ms()/vs()

TODOs requiring manual attention:
- Icons: {count} — search: // TODO: replace with pd.sys.icon
- Unmatched tokens: {count} — search: // TODO: no pd token found
- Manual migrations: {count} — search: // TODO: migrate manually
- Needs verification: {count} — search: // TODO: needs_verification
```

---

## Rules every writer must follow

**Package name spelling.** `@airasia-phoenix` uses a **hyphen**, never `@airasia/phoenix`.

**Target path.** New folder goes in the same parent directory as the old component. `src/widgets/Label/` → `src/widgets/LabelView/`. Never default to `src/components/`.

**Dumb vs smart.** `oldPath` containing `/components/` → dumb: no hooks, no state, no `useTranslation`; strings come in as props. `/widgets/` → smart: no restrictions. `useStyles` is allowed in both.

**Scaling utilities.** Remove every `s()`, `ms()`, `vs()` and its import — replace with the raw number. Not even commented out.

**Import order.**

```tsx
import React from 'react';

import { View } from 'react-native';

import { useStyles } from 'react-native-unistyles';

import { getTextStyle } from '@airasia-phoenix/react-native/utils/utils';
import TextView from '@airasia-phoenix/react-native/components/TextView';

import { pd } from '@airasia-rn/ui';

import type { MyComponentViewProps } from './types';
import { MY_CONSTANT } from './constants';
import { myUtil } from './utils';
```

**TODO formats.**

```tsx
// TODO: replace with pd.sys.icon.category.name — old icon: ArrowIcon
// TODO: migrate manually — skipped in component-map.json
// TODO: no pd token found for this color — raw value kept: #3A86FF
// TODO: no pd token found for this text style — raw value kept
// TODO: needs_verification — confirm this prop exists on NewComponent
```
