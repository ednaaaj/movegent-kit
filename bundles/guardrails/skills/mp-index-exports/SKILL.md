---
name: mp-index-exports
description: Write the index.ts barrel for a component folder in move-pages — component as a named export, which types to export, when to export utils/constants, what never belongs in index.ts, and when to add a package-root export. Use when finishing a component folder or reviewing its export surface.
---

# Index Exports

How to write `index.ts` for a component folder.

## Core rule

Everything consumers import from outside the folder goes through `index.ts`. Nobody imports `MyComponentView.tsx` or `types.ts` directly — they import the folder.

---

## Required exports

### The component — always a named export, never default

```ts
export { default as MyComponent } from './MyComponentView';
```

The export name is `MyComponent` (no `View` suffix) — that is the public API name. The file stays `MyComponentView.tsx` internally.

### Types

```ts
export type { MyComponentProps } from './types';
```

Multiple public interfaces:

```ts
export type { MyComponentProps, ItemShape, LabelVariant } from './types';
```

Do not export types used only inside the component.

---

## Optional exports

```ts
// Only if this util is useful outside this component
export { formatLabel } from './utils';

// Only if consumers need this constant
export { MAX_LABEL_LENGTH } from './constants';
```

---

## Full example

```ts
// index.ts

// Component — always export
export { default as MyComponent } from './MyComponentView';

// Types — export all public ones
export type { MyComponentProps, LabelVariant } from './types';

// Utils — only if externally useful
export { formatLabel } from './utils';

// Constants — only if externally useful
export { MAX_LABEL_LENGTH } from './constants';
```

---

## What never goes in index.ts

- ❌ The stylesheet — always internal
- ❌ Internal helper functions
- ❌ The stories file
- ❌ Any logic, condition, or transformation — exports only
- ❌ Wildcard re-exports (`export *`) — explicit named exports only

---

## Package-level index

If the component is a public package export, also add it to the package root `index.ts`:

```ts
// packages/react-native-ui/src/index.ts
export { MyComponent } from './components/MyComponentView';
export type { MyComponentProps } from './components/MyComponentView';
```

Check first — not every component is a public package export. Adding to `packages/react-native-ui` from a Hotels/Snap task needs explicit approval (Skill `mp-guardrails`).
