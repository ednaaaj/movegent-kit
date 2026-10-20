---
name: mp-types
description: Convert old PropTypes definitions to TypeScript interfaces in types.ts — the full PropTypes-to-TS conversion table, required vs optional, function prop signatures, shape props as named interfaces, and style prop typing. Use when migrating a JS component or authoring a types.ts in move-pages.
---

# Types

How to convert old PropTypes definitions to TypeScript interfaces.

## Where types live

All type definitions go in `types.ts`. No types inside component files, no inline interfaces in JSX. (Component-only prop types may stay in the component file for feature work in `packages/snap` / `packages/hotels`; shared types go in `types/`.)

---

## PropTypes → TypeScript conversion table

| PropTypes                     | TypeScript                                                  |
| ----------------------------- | ----------------------------------------------------------- |
| `PropTypes.string`            | `string`                                                    |
| `PropTypes.number`            | `number`                                                    |
| `PropTypes.bool`              | `boolean`                                                   |
| `PropTypes.func`              | `() => void` (or a specific signature if inferrable)        |
| `PropTypes.array`             | `unknown[]` (make specific if the type is inferrable)       |
| `PropTypes.object`            | `Record<string, unknown>` (make specific if shape is known) |
| `PropTypes.node`              | `React.ReactNode`                                           |
| `PropTypes.element`           | `React.ReactElement`                                        |
| `PropTypes.any`               | `unknown` (never use `any`)                                 |
| `PropTypes.oneOf(['a', 'b'])` | `'a' \| 'b'`                                                |
| `PropTypes.oneOfType([A, B])` | `A \| B`                                                    |
| `PropTypes.arrayOf(X)`        | `X[]`                                                       |
| `PropTypes.shape({})`         | named interface (not inline)                                |
| `PropTypes.instanceOf(X)`     | `InstanceType<typeof X>`                                    |

---

## Required vs optional

`.isRequired` → not optional. Everything else gets `?`.

```ts
// Old
MyComponent.propTypes = {
  text: PropTypes.string.isRequired,
  onPress: PropTypes.func,
  count: PropTypes.number,
};

// New
export interface MyComponentProps {
  text: string;
  onPress?: () => void;
  count?: number;
}
```

---

## Function prop signatures

Infer the signature from usage where possible:

```ts
// If used as onSelect(item, index):
onSelect?: (item: ListItem, index: number) => void;

// If usage is unclear:
onSelect?: () => void;
```

---

## Shape props

```ts
// Old
PropTypes.shape({ id: PropTypes.string.isRequired, label: PropTypes.string });

// New — named interface
export interface ItemShape {
  id: string;
  label?: string;
}

export interface MyComponentProps {
  item: ItemShape;
}
```

---

## Style props

```ts
import { StyleProp, ViewStyle, TextStyle } from 'react-native';

style?: StyleProp<ViewStyle>;
textStyle?: StyleProp<TextStyle>;
```

---

## Full example

```ts
// Old — Label.proptypes.js
import PropTypes from 'prop-types';

export default {
  PropTypes: {
    text: PropTypes.string.isRequired,
    textStyle: PropTypes.object,
    onPress: PropTypes.func,
    numberOfLines: PropTypes.number,
    variant: PropTypes.oneOf(['primary', 'secondary', 'danger']),
  },
};

// New — types.ts
import { StyleProp, TextStyle } from 'react-native';

export type LabelVariant = 'primary' | 'secondary' | 'danger';

export interface LabelProps {
  text: string;
  textStyle?: StyleProp<TextStyle>;
  onPress?: () => void;
  numberOfLines?: number;
  variant?: LabelVariant;
}
```

---

## Never do these

- ❌ Use `any` — use `unknown` if the type is truly unknown, plus a type guard or Zod schema
- ❌ Define types inside `MyComponentView.tsx`
- ❌ Leave PropTypes in the migrated file — remove them entirely
- ❌ Use `object` as a type — always be more specific
- ❌ Define the same type twice — define once, import it
