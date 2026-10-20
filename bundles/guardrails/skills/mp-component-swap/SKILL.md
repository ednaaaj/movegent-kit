---
name: mp-component-swap
description: Replace old components with Phoenix design-system components using component-map.json — reading status (mapped/partial/skipped), applying propMap transforms, handling needs_verification props, and the exact TODO comment formats for skipped components. Use when migrating a component or swapping a legacy widget for its Phoenix equivalent.
---

> **Config:** `<repo_path>` is the repo you are working in: `repo_path` from `~/.agent-kit/config.json` if set, otherwise the git root of the current folder (`git rev-parse --show-toplevel`). Never assume a fixed parent folder. `<design_system_path>` is `design_system_path` from the same file (the design-system checkout); if it is empty, ask the user once. If the file is missing, run `agent-kit init`.

# Component Swap

How to replace old components with new design system components using the component map.

Map file: `<repo_path>/.gemini/tools/component-map.json`

---

## Setup

Read the map before migrating anything. It defines:

- `status` — `mapped`, `partial`, or `skipped`
- `propMap` — how each old prop translates
- `example` — a real before/after usage
- `notes` — edge cases and caveats

---

## Step 1 — Find the old component

```json
"Label": {
  "status": "mapped",
  "newComponent": "TextView",
  "propMap": {
    "text": { "newProp": "text", "transform": "none" },
    "textStyle": { "newProp": "style", "transform": "getTextStyle(typescale, color)" }
  },
  "example": {
    "old": "<Label text={'Hello'} textStyle={styles.Heading3} />",
    "new": "<TextView text={'Hello'} style={getTextStyle(pd.sys.typescale.headingMedium, pd.sys.colour.content_primary)} />"
  }
}
```

## Step 2 — Apply the status rule

| Status    | What to do                                                                                      |
| --------- | ----------------------------------------------------------------------------------------------- |
| `mapped`  | Replace fully using `propMap` and `example`                                                     |
| `partial` | Replace what you can; add `// TODO: migrate manually` on props marked `needs_verification: true` |
| `skipped` | Keep the old component import exactly as-is, with a comment above it                             |

## Step 3 — Write the replacement

Use the map's `example` as the template, with real values from the component being migrated.

---

## Mapped — full replacement

```tsx
// OLD
import Label from '../Label';
<Label text={'Hello'} textStyle={styles.Heading3} />;

// NEW
import TextView from '@airasia-phoenix/react-native/components/TextView';
<TextView
  text={'Hello'}
  style={getTextStyle(
    pd.sys.typescale.headingMedium,
    pd.sys.colour.content_primary,
  )}
/>;
```

## Partial — replace what you can

```tsx
<ChipView
  items={opts}
  onPress={fn}
  // TODO: migrate manually — customRenderer has no equivalent in ChipView
/>
```

## Skipped — keep as-is

```tsx
// TODO: migrate manually — this component was skipped in component-map.json
// Reason: contains domain-specific rendering logic tied to API response shape
import CustomBusinessWidget from '../CustomBusinessWidget';
<CustomBusinessWidget {...props} />;
```

## Props marked `needs_verification`

Do not guess:

```tsx
<NewComponent
  knownProp={value}
  // TODO: needs_verification — check if NewComponent supports this prop before using it
  // uncertainProp={value}
/>
```

---

## ⚠️ Package name spelling

`@airasia-phoenix` uses a **hyphen**. `@airasia/phoenix` is always wrong.

- `@airasia-phoenix/react-native/utils/utils` ✅
- `@airasia-phoenix/react-native/components/TextView` ✅

---

## Never do these

- ❌ Partially apply a `mapped` component — replace it fully
- ❌ Invent prop names that aren't in `propMap`
- ❌ Remove a `skipped` component — keep it with the TODO
- ❌ Rename imported components — use the exact `newComponent` name
- ❌ Guess a Phoenix prop — verify against the real component, or mark it `needs_verification`
