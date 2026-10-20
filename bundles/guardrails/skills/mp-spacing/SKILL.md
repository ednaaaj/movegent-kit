---
name: mp-spacing
description: Replace raw padding/margin/gap pixel numbers with pd.ref.space spacing tokens — the full value-to-token map, which properties count as spacing, how to handle non-standard values, and stripping s()/ms()/vs() scaling wrappers first. Use whenever a stylesheet in move-pages or a migrated component contains raw spacing numbers.
---

> **Config:** `<repo_path>` is the repo you are working in: `repo_path` from `~/.agent-kit/config.json` if set, otherwise the git root of the current folder (`git rev-parse --show-toplevel`). Never assume a fixed parent folder. `<design_system_path>` is `design_system_path` from the same file (the design-system checkout); if it is empty, ask the user once. If the file is missing, run `agent-kit init`.

# Spacing Tokens

How to replace raw pixel values used in padding, margin, gap, and similar spacing properties with `pd.ref.space.*` tokens.

---

## The spacing token map

| Raw value | Token                        |
| --------- | ---------------------------- |
| `0`       | `pd.ref.space.zero.px`       |
| `4`       | `pd.ref.space.spacing10.px`  |
| `8`       | `pd.ref.space.spacing20.px`  |
| `12`      | `pd.ref.space.spacing30.px`  |
| `16`      | `pd.ref.space.spacing40.px`  |
| `24`      | `pd.ref.space.spacing50.px`  |
| `32`      | `pd.ref.space.spacing60.px`  |
| `40`      | `pd.ref.space.spacing70.px`  |
| `48`      | `pd.ref.space.spacing80.px`  |
| `64`      | `pd.ref.space.spacing90.px`  |
| `80`      | `pd.ref.space.spacing100.px` |

Also check `<repo_path>/.gemini/tools/theme-map.json` under `spacing` — always prefer the file over memory.

---

## What counts as a spacing property

Replace raw numbers for:

- `padding`, `paddingTop`, `paddingBottom`, `paddingLeft`, `paddingRight`
- `paddingHorizontal`, `paddingVertical`
- `margin`, `marginTop`, `marginBottom`, `marginLeft`, `marginRight`
- `marginHorizontal`, `marginVertical`
- `gap`, `rowGap`, `columnGap`
- `top`, `bottom`, `left`, `right` — **only** when used as a spacing offset, not for layout anchoring
- `borderRadius` — **only** if the value matches a spacing token exactly; leave design-specific radii alone (prefer `getShape(pd.sys.shape.corner.*)`)

Do **not** replace:

- `width`, `height` — dimensions, not spacing
- `fontSize`, `lineHeight` — typography
- `flex`, `flexGrow`, `zIndex`
- `borderWidth`

---

## How to use in a stylesheet

```tsx
// ❌ Wrong — raw numbers
const stylesheet = createStyleSheet(() => ({
  container: { padding: 16, marginTop: 8, gap: 12 },
}));

// ✅ Correct — spacing tokens
const stylesheet = createStyleSheet(() => ({
  container: {
    padding: pd.ref.space.spacing40.px,
    marginTop: pd.ref.space.spacing20.px,
    gap: pd.ref.space.spacing30.px,
  },
}));
```

Never compose tokens arithmetically (`spacing90.px * 2 + spacing40.px`). Use one predefined token, or add a new one.

---

## Non-standard values

1. Check `theme-map.json` under `unmatched.spacing` — it may already suggest a nearest token
2. If a nearest token is suggested, use it with a comment:

```tsx
// low confidence — original value was 6px, nearest token is spacing10 (4px). Verify visually.
padding: pd.ref.space.spacing10.px,
```

3. If no suggestion exists, keep the raw value with a TODO:

```tsx
// TODO: no pd spacing token for 6px — raw value kept. Nearest options: spacing10 (4px) or spacing20 (8px)
padding: 6,
```

---

## Scaling utilities

Strip the scaling wrapper first, then apply the token:

```tsx
padding: s(16),                        // old
padding: 16,                           // step 1 — strip scaling
padding: pd.ref.space.spacing40.px,    // step 2 — apply token
```

---

## Required import

`pd` is already imported for colour and typescale tokens — spacing comes from the same object:

```tsx
import { pd } from '@airasia-rn/ui';
```

---

## Never do these

- ❌ Leave raw spacing numbers when a token exists
- ❌ Use `theme.spacing.md` or Unistyles theme spacing — use `pd.ref.space.*`
- ❌ Replace `width` or `height` with spacing tokens
- ❌ Invent token names
