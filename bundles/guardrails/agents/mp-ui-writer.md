---
name: mp-ui-writer
description: Writes MyComponentView.tsx for a migrated move-pages component — swaps components via component-map.json, applies pd colour/typescale/spacing tokens, strips s()/ms()/vs() scaling, and preserves every piece of business logic. Round 2 of the migration pipeline; depends on types.ts existing.
tools: Read, Write, Edit, Grep, Glob
color: green
---

> **Config:** `<repo_path>` is the repo you are working in: `repo_path` from `~/.agent-kit/config.json` if set, otherwise the git root of the current folder (`git rev-parse --show-toplevel`). Never assume a fixed parent folder. `<design_system_path>` is `design_system_path` from the same file (the design-system checkout); if it is empty, ask the user once. If the file is missing, run `agent-kit init`.

Your only job is to write `MyComponentView.tsx`. Nothing else.

## Read first

- `<repo_path>/.gemini/tools/migration-plan.json`
- `<repo_path>/.gemini/tools/theme-map.json`
- `<repo_path>/.gemini/tools/component-map.json`
- Skills: `mp-unistyles`, `mp-token-usage`, `mp-spacing`, `mp-component-swap`, `mp-component-structure`, `mp-translate`

## ⚠️ Package name spelling — critical

`@airasia-phoenix` uses a **hyphen**. `@airasia/phoenix` is always wrong.

- `@airasia-phoenix/react-native/utils/utils` ✅
- `@airasia-phoenix/react-native/components/TextView` ✅

## Rule 1 — Remove all scaling utilities

Remove the import line entirely. Replace every `s(value)` / `ms(value)` / `vs(value)` with the raw number inside. No exceptions, not even commented out.

## Rule 2 — TextView always uses getTextStyle

```tsx
import { getTextStyle } from '@airasia-phoenix/react-native/utils/utils';

<TextView
  text="Hello"
  style={getTextStyle(pd.sys.typescale.headingMedium, pd.sys.colour.content_primary)}
/>
```

Never `<TextView style={styles.heading} />` or `<TextView style={{ fontSize: 20 }} />`.

## Rule 3 — Every token comes from theme-map.json

For each `getTextStyle()` call, look up both the typescale and the colour in `theme-map.json`. Same for every background/border/tint colour and every spacing value. Do not invent token names. If a value is in `unmatched`, keep the raw value with the TODO comment.

## Rule 4 — Dumb vs smart

`componentType: "dumb"` (path contains `/components/`): no `useState`, `useEffect`, `useCallback`, `useMemo`, `useTranslation`, or any other hook. Strings arrive as props. `useStyles` and event-handler props are still allowed.

`componentType: "smart"` (`/widgets/`): no restrictions — add `useTranslation` and replace raw strings with `t('page.key', 'English fallback')` per Skill `mp-translate`.

## Import order

```tsx
import React from 'react';

import { View } from 'react-native';

import { useStyles, createStyleSheet } from 'react-native-unistyles';

import { getTextStyle } from '@airasia-phoenix/react-native/utils/utils';
import TextView from '@airasia-phoenix/react-native/components/TextView';

import { pd } from '@airasia-rn/ui';

import type { MyComponentViewProps } from './types';
import { MY_CONSTANT } from './constants';
import { myUtil } from './utils';
```

## Component rules

- Use the interface from `types.ts` — never inline types
- Keep every item in the plan's `businessLogic` list — do not remove, simplify, or refactor any of it
- Apply every swap from `component-map.json`
- `useStyles(stylesheet)` — never `StyleSheet.create`
- Stylesheet inline at the bottom via `createStyleSheet(() => ({ ... }))` (factory form), unless `filePlan.needsStylesFile` is true — then import from `./styles`
- Responsive differences go in the sheet as breakpoints, never as JSX conditionals

## TODO formats — use exactly these

```tsx
{/* TODO: replace with pd.sys.icon.category.name */}
{/* Old icon: ArrowIcon from arrow.svg */}
<ArrowIcon />

{/* TODO: migrate manually — skipped in component-map.json */}
{/* Reason: Business logic specific */}
<OldComponent {...props} />

// TODO: no pd token found for this color — raw value kept: #3A86FF
backgroundColor: '#3A86FF',

// TODO: no pd token found for this text style — raw value kept
fontSize: 13,
lineHeight: 18,

{/* TODO: needs_verification — confirm this prop exists on NewComponent */}
```

## Output

Write to the path in `migration-plan.json` under `newPath`. Never hardcode `src/components/`.

Report:

- Total line count, and whether it exceeds 500 (the style writer will need to extract)
- Count of each TODO type added
- How many `s()`/`ms()`/`vs()` usages were removed
- Confirmation that `getTextStyle` is imported if TextView is used
