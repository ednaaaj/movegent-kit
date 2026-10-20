---
name: mp-translate
description: i18n migration for move-pages — replace raw UI strings with t() calls that always carry an inline English fallback, reuse existing keys before creating new ones, update the locale JSON without dropping keys, and the dumb-component rule that strings arrive as props instead. Use whenever a component contains user-visible text.
---

# Translations (i18n)

Follow these instructions whenever a component contains raw text strings.

---

## Mandates

> [!IMPORTANT]
> **No raw English strings anywhere in user-visible UI.** Everything comes from the `t` function.
> **Always provide a safe inline English fallback** — `t('otaCheckIn.key', 'Default English')` or `t('otaCheckIn.key', 'Default {{param}}', { param })`. This ensures:
>
> 1. The component renders correctly even if the key is missing from the local JSON.
> 2. Jest tests can resolve and assert on the fallback cleanly without throwing.

**Dumb components** (anything under `src/components/`) must **not** call `useTranslation`. Strings arrive as props — derive prop names from purpose (`submitLabel`, `errorMessage`, `titleText`), type them as optional strings, and pass raw English in stories. Only smart components (`src/widgets/`, pages) translate.

---

## Setup (smart components only)

```tsx
import { useTranslation } from 'react-i18next';
```

```tsx
const { t } = useTranslation('flights'); // namespace matches the LOB
```

---

## Step 1 — Read the existing locale file first

Read the LOB's locale file (e.g. `flights/locales/en-gb.json`, `packages/snap/src/locales/en-gb.json`) and note every key already present. You will reuse them.

## Step 2 — Find all raw UI strings

Translate:

- String props on text components: `text="Submit"`, `label="Cancel"`
- Hardcoded strings inside JSX
- String variables only ever assigned a literal
- Placeholders

Do **not** translate:

- `testID` values
- Class/style names or object keys
- Logs or non-UI error messages
- Enum values or identifier constants
- Strings already using `t()`

## Step 3 — Match or create keys

**Reuse first.** If the exact string already exists as a value in the page object, reuse that key — do not add a duplicate.

**New keys** use descriptive camelCase named for meaning, not location: `noFlightsFound` ✅, `listEmptyText` ❌. One key per repeated string.

```json
{
  "flightsGuestPage": {
    "existingKey": "Existing value",
    "noFlightsFound": "No flights found",
    "submitButton": "Submit",
    "selectPassengers": "Select passengers"
  }
}
```

Preserve every existing key — never remove or rename what's already there.

## Step 4 — Replace in the component

```tsx
// ❌ Old
<TextView text="No flights found" />
<CustomInput placeholder="Enter your name" />

// ✅ New
<TextView text={t('flightsGuestPage.noFlightsFound', 'No flights found')} />
<CustomInput placeholder={t('flightsGuestPage.enterYourName', 'Enter your name')} />
```

## Step 5 — Verify

- [ ] `useTranslation` imported (smart components only)
- [ ] `const { t } = useTranslation('<namespace>')` present
- [ ] Every raw UI string replaced, each with an inline English fallback
- [ ] No existing keys removed or renamed
- [ ] No duplicate keys — existing strings reuse existing keys
- [ ] Locale JSON is valid (no trailing commas)

---

## Related

Locale itself comes from `useAppConfig().config.locale` — never pass a locale param into hooks, and never fall back to a default locale (disable the query instead). URLs must be built from the live language/country, never hardcoded. See Skill `mp-guardrails`.
