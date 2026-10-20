---
name: mp-stories
description: Write .stories.tsx files following the AirAsia Storybook pattern — copyright header, @storybook/react-native-web-vite import, meta title format with satisfies, the Wrapper component, base args, section comments, mandatory render functions, and named Render functions for interactive stories. Use when adding or migrating stories in move-pages.
---

# Stories

How to write `.stories.tsx` files following the AirAsia Storybook conventions.

## Core rule

Mirror the old stories exactly — same scenarios, same names, same edge cases. Do not invent new stories. Do not remove old ones. Translate, do not redesign.

---

## Required file structure

```tsx
/*
 * Copyright (c) 2025 AirAsia Berhad (Malaysia). All rights reserved.
 *
 * This software is proprietary and confidential. Unauthorized copying of this file,
 * via any medium, is strictly prohibited. Do not distribute, copy, modify, or reuse
 * any part of this code without explicit written permission from AirAsia Move.
 *
 * For internal use only.
 */

import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import React, { useState } from 'react';
import { View } from 'react-native';

import MyComponentView from './MyComponentView';
import type { MyComponentViewProps } from './types';

const meta: Meta<MyComponentViewProps> = {
  title: 'Flights/Components/My Component View',
  component: MyComponentView,
  tags: ['autodocs'],
} satisfies Meta<typeof MyComponentView>;

export default meta;
type Story = StoryObj<typeof meta>;

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <View style={{ padding: 16 }}>{children}</View>
);
```

---

## Key conventions

### Import source

Always `@storybook/react-native-web-vite` — never `@storybook/react-native`.

### Props type

Always from `./types`, never inline from the component file.

### Meta title

`'<LOB>/Components/Component Name With Spaces'`:

```tsx
title: 'Flights/Components/Big Points View',  // ✅
title: 'BigPointsView',                        // ❌
```

### `satisfies` on meta

```tsx
} satisfies Meta<typeof MyComponentView>;
```

### Wrapper

Every story renders inside `<Wrapper>`. Never render the component bare.

### Base args

Extract shared props into `base*Args`. Stories spread and override only what differs:

```tsx
const baseEarnArgs: Partial<MyComponentViewProps> = {
  labelPrefix: "You'll earn ",
  labelSuffix: ' after your trip',
};

export const EarnStateDefault: Story = {
  args: { ...baseEarnArgs, pointsAmount: 537 },
  render: (args) => (
    <Wrapper>
      <MyComponentView {...args} />
    </Wrapper>
  ),
};
```

### Section comments

```tsx
// --- Earn state (points amount set) ---
// --- Search state (no points / search by email) ---
// --- Interactive ---
```

### Always provide a render function

```tsx
render: (args) => (
  <Wrapper>
    <MyComponentView {...args} />
  </Wrapper>
),
```

### Interactive stories

Named function with a `Render` suffix matching the export name, `useState` inside:

```tsx
export const SearchStateInteractive: Story = {
  args: baseSearchArgs,
  render: function SearchStateInteractiveRender(args) {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    return (
      <Wrapper>
        <MyComponentView
          {...args}
          emailValue={email}
          onEmailChange={(value) => {
            setEmail(value);
            setError('');
          }}
          isError={!!error}
          errorMessage={error}
        />
      </Wrapper>
    );
  },
};
```

Only import `useState` if at least one story uses it.

### Dumb components

Stories for components under `src/components/` pass translation strings as hardcoded English args. Never call `t()` in a story.

---

## If no old stories file exists

Cover:

- A default/happy-path story with all required props
- One story per major variant prop
- One interactive story if the component accepts input or a press handler

---

## Never do these

- ❌ Import from `@storybook/react-native`
- ❌ Import the props type from the component file
- ❌ Render a story without `<Wrapper>`
- ❌ Skip the `render` function
- ❌ Use an arrow function for an interactive story
- ❌ Import `useState` when unused
- ❌ Hardcoded hex colours or raw style objects in args — use pd tokens
- ❌ Invent stories that didn't exist, or drop stories that did
