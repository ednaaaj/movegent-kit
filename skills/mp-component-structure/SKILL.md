---
name: mp-component-structure
description: Required folder and file layout for a React Native component or widget in move-pages — dumb vs smart component rules by location, which code goes in MyComponentView.tsx / types.ts / constants.ts / utils.ts / styles.ts / index.ts, the 500-line styles split threshold, and naming. Use when creating, migrating, or restructuring a component.
---

# Component Structure

Follow this structure every time you migrate or create a React Native component.

---

## Component type — check location first

Before writing anything, check where the component lives:

| Location          | Type  | Rules                                                                   |
| ----------------- | ----- | ----------------------------------------------------------------------- |
| `src/components/` | Dumb  | No hooks, no internal state, no useTranslation. Strings come from props. |
| `src/widgets/`    | Smart | No restrictions. useTranslation, hooks, state all allowed.               |

`useStyles` is allowed everywhere — it is styling infrastructure, not logic.

## Required folder structure

```
MyComponentView/
├── MyComponentView.tsx          ← all UI and JSX
├── utils.ts                     ← pure helper functions, calculations
├── styles.ts                    ← only if MyComponentView.tsx exceeds 500 lines
├── MyComponentView.stories.tsx  ← all stories
├── types.ts                     ← all interfaces and type definitions
├── constants.ts                 ← only constants, no types or functions
└── index.ts                     ← all exports
```

The component folder must be created in the same directory as the old component.
If the old path was `src/widgets/Label/`, the new path is `src/widgets/LabelView/`.
If the old path was `src/components/Label/`, the new path is `src/components/LabelView/`.
Never default to `src/components/` unless the old component was already there.

---

## Rules for each file

### `MyComponentView.tsx`

- All JSX and UI rendering lives here
- Imports types from `./types`, constants from `./constants`, utils from `./utils`
- Imports the stylesheet from `./styles` if it exists, otherwise defines it inline with `createStyleSheet`
- No type definitions in this file — all go in `types.ts`
- No magic numbers or string literals — all go in `constants.ts`
- No pure functions — all go in `utils.ts`
- If this file would exceed 500 lines including styles, move the stylesheet to `styles.ts`

### `types.ts`

- All TypeScript interfaces and type aliases
- Export every type — nothing stays private
- No constants, no functions, no JSX

### `constants.ts`

- Only `export const` declarations
- Values that never change and have no logic
- No type definitions, no functions
- If there are no constants, do not create this file

### `utils.ts`

- Only pure functions — no side effects, no JSX, no component logic
- Each function must be exported
- If there are no utils, do not create this file

### `styles.ts`

- Only created when `MyComponentView.tsx` would exceed 500 lines
- Contains only the `createStyleSheet` call — nothing else
- Named export: `export const stylesheet = createStyleSheet(...)`
- Imported as `import { stylesheet } from './styles'`

### `MyComponentView.stories.tsx`

- Mirror the same scenarios as the old stories — do not invent new ones
- Update prop names to match the new TypeScript interface
- Replace any hardcoded colours or styles with pd tokens

### `index.ts`

- All exports go through here — consumers never import internal files directly
- Component: `export { default as MyComponent } from './MyComponentView'`
- Types: `export type { MyComponentProps } from './types'`
- Only export what external consumers need

---

## Naming convention

- Folder name: `MyComponentView`
- Main file: `MyComponentView.tsx` — matches the folder name exactly
- Component function name: `MyComponentView`
- Stories file: `MyComponentView.stories.tsx`

---

## What goes where — quick reference

| Code type                          | File                                           |
| ---------------------------------- | ---------------------------------------------- |
| JSX, rendering                     | `MyComponentView.tsx`                          |
| TypeScript interface               | `types.ts`                                     |
| `export const MAX = 5`             | `constants.ts`                                 |
| `export const format = (x) => ...` | `utils.ts`                                     |
| `createStyleSheet(...)`            | `styles.ts` or inline in `MyComponentView.tsx` |
| Story definitions                  | `MyComponentView.stories.tsx`                  |
| All exports                        | `index.ts`                                     |

---

Note: for feature work inside `packages/snap` / `packages/hotels` (as opposed to component migration), the guide's own layout applies too — widgets under ~400 lines, `configs/constants.ts` for shared non-style config, `utils/` for reusable helpers, `types/` for shared types. See Skill `mp-guardrails`.
