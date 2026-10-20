---
name: mp-unistyles
description: Author react-native-unistyles stylesheets correctly for move-pages — always createStyleSheet (never StyleSheet.create), always the factory function form, the getShape spread that crashes tsc, and responsive breakpoints instead of conditional style branching. Use when writing or reviewing any stylesheet in move-pages or Phoenix-based code.
---

# Unistyles Stylesheets

Follow these rules for every stylesheet in move-pages.

## 1. Always `createStyleSheet`

```tsx
import { createStyleSheet, useStyles } from 'react-native-unistyles';
```

> [!IMPORTANT]
> Never use React Native's `StyleSheet.create`.
> Always use the **factory function form** — `createStyleSheet(() => ({ ... }))` — not a plain object. This is what makes styles adapt to dynamic theme swaps and dark/light mode. Any sheet containing a colour value **requires** the factory form.
> **Avoid spreading helper objects** (e.g. `...getShape(...)`) inside `createStyleSheet` bodies — it can trigger a TypeScript overload-resolution recursion crash (`tsc` Debug Failure). Use an explicit static value (`borderRadius: 12`) there instead.

## 2. Component structure

```tsx
import React from 'react';
import { View, Text } from 'react-native';
import { createStyleSheet, useStyles } from 'react-native-unistyles';

interface CustomButtonProps {
  title: string;
}

export const CustomButton: React.FC<CustomButtonProps> = ({ title }) => {
  const { styles } = useStyles(stylesheet);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>{title}</Text>
    </View>
  );
};

const stylesheet = createStyleSheet(() => ({
  container: {
    borderRadius: 8,
  },
  text: {
    fontSize: 16,
  },
}));
```

## 3. Responsiveness lives in the sheet

Breakpoints: `xs` (0-575), `sm` (576-767), `md` (768-991), `lg` (992-1199), `xl` (1200+).

```tsx
// ❌ Conditional branching in JSX
style={[styles.listContent, isSmallScreen ? {} : { paddingHorizontal: pd.ref.space.spacing40.px }]}

// ✅ Breakpoints in the stylesheet
listContent: {
  paddingHorizontal: { xs: 0, md: pd.ref.space.spacing40.px },
},
```

Show/hide by breakpoint uses `display`, never conditional rendering:

```tsx
mobileOnly: { display: { xs: 'flex', md: 'none' } },
desktopOnly: { display: { xs: 'none', md: 'flex' } },
```

Large-screen containers use a centred max width, not ad-hoc widths:

```tsx
alignSelf: 'center',
maxWidth: { lg: 896, xl: 1104 },
```

Don't duplicate breakpoint keys with identical values.

## 4. Inline styles

An inline `style={{ ... }}` with more than one property belongs in the stylesheet.

## 5. Validate

If the component is exported from `react-native-ui`, add it to that package's `index.ts` export map — but note that adding to `packages/react-native-ui` from a Hotels/Snap task needs explicit approval (see Skill `mp-guardrails`).
