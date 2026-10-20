---
name: mp-token-usage
description: Replace old colours and text styles with pd design-system tokens using theme-map.json — how to look up a token, the exact/high/low/unmatched confidence rules, using tokens in a stylesheet, and the getTextStyle pattern for TextView. Use whenever a colour, fontSize, or typescale value appears in move-pages or Phoenix work.
---

> **Config:** `<repo_path>` is the repo you are working in: `repo_path` from `~/.agent-kit/config.json` if set, otherwise the git root of the current folder (`git rev-parse --show-toplevel`). Never assume a fixed parent folder. `<design_system_path>` is `design_system_path` from the same file (the design-system checkout); if it is empty, ask the user once. If the file is missing, run `agent-kit init`.

# Token Usage

How to replace old colours and text styles with pd design system tokens using `theme-map.json`.

Map file: `<repo_path>/.gemini/tools/theme-map.json`

---

## Setup

Always read the theme map before migrating any component. It has three sections:

- `colors` — maps old hex values or variable names to `pd.sys.colour.*` tokens
- `typescale` — maps old style names to `pd.sys.typescale.*` tokens
- `unmatched` — values that have no pd token equivalent

---

## Colours

### Finding the token

```json
"colors": {
  "primaryRed": {
    "oldValue": "#E53E3E",
    "token": "pd.sys.colour.error.default",
    "confidence": "exact"
  }
}
```

### Using the token in a stylesheet

```tsx
const stylesheet = createStyleSheet(() => ({
  container: {
    backgroundColor: pd.sys.colour.error.default.toString(),
  },
}));
```

In move-pages feature code, prefer the helper form:

```tsx
backgroundColor: getColor(pd.sys.colour.container_max),
```

> Use the exact token path string from `theme-map.json`. Do not shorten or guess.

### Confidence rules

| Confidence | What to do                                                             |
| ---------- | ---------------------------------------------------------------------- |
| `exact`    | Use the token directly, no comment needed                              |
| `high`     | Use the token, add `// high confidence match — verify visually`        |
| `low`      | Use the token, add `// low confidence — must verify visually`          |
| unmatched  | Keep the raw hex, add `// TODO: no pd token found for #hex`            |

---

## Typescale

```json
"typescale": {
  "Heading3": {
    "oldValue": { "fontSize": 20, "lineHeight": 28, "fontFamily": "DMSans-Regular" },
    "token": "pd.sys.typescale.headingMedium",
    "confidence": "high"
  }
}
```

Typescale tokens are consumed via `getTextStyle()`, which takes a typescale token and a colour token:

```tsx
<TextView
  text="Hello"
  style={getTextStyle(
    pd.sys.typescale.headingMedium,
    pd.sys.colour.content_primary,
  )}
/>
```

In a stylesheet context:

```tsx
const stylesheet = createStyleSheet(() => ({
  label: {
    ...getTextStyle(pd.sys.typescale.headingMedium, pd.sys.colour.content_primary),
  },
}));
```

Confidence rules are the same as colours.

`getTextStyle` returns `StyleProp<TextStyle>`. Where a strict `TextStyle` is required, use `textStyle(...)` instead.

---

## Unmatched values

```tsx
// TODO: no pd token found for this color — raw value kept: #3A86FF
backgroundColor: '#3A86FF',

// TODO: no pd token found for this text style — raw value kept
fontSize: 13,
lineHeight: 18,
```

This keeps every unresolved token findable with `grep "TODO: no pd token"`.

---

## Never do these

- ❌ Invent token names — only use tokens that exist in `theme-map.json`
- ❌ Use raw hex values unless they are in the `unmatched` list
- ❌ Use raw `fontSize` numbers unless they are unmatched
- ❌ Use old theme variable names in new code
