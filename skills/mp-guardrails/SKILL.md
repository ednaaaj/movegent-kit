---
name: mp-guardrails
description: The mandatory rule checklist for any work in the move-pages monorepo or against the Phoenix React Native design system — Phoenix-first component lookup, pd design tokens, Unistyles breakpoints, file structure, services/TanStack Query patterns, i18n, web+native parity, tests, scope control, and the pre-integration red-flag list. Load this whenever a request touches move-pages, packages/hotels, packages/snap, phoenix-react-native, or any *-web / move-app host.
---

> **Config:** `<workspace>` below = the `workspace` value in `~/.agent-kit/config.json` (the folder that contains your repos). If missing, ask the user once, or tell them to run `agent-kit init`.

# move-pages Guardrails

Canonical sources, in precedence order:

1. `ASSISTANT_GUIDE.md` (airasia root) — the collaboration guide
2. `CLAUDE.md` (airasia root) — the essential guide + Phoenix API cheatsheet
3. This skill — the operational checklist distilled from both

If this skill and `ASSISTANT_GUIDE.md` ever disagree, `ASSISTANT_GUIDE.md` wins — read it and say so.

---

## 0. Hard gates (stop-the-line)

**Figma gate.** Any UI, layout, or style change — including "just make it smaller", spacing tweaks, and colour changes — requires an approved Figma spec. If none is in the conversation, reply exactly:

> Please share the Figma spec/link, or confirm I should proceed without Figma.

and do not edit code until the user answers.

**Phoenix gate.** Never build a custom component before checking Phoenix:

```bash
ls <workspace>/phoenix-react-native/app/src/v6/components/
ls <workspace>/phoenix-react-native/app/src/v6/widgets/
rg -n "ComponentName" <workspace>/phoenix-react-native/app/src/v6/components
```

Never create custom Button, Input, Dialog, Sheet, List, Icon, Text, Checkbox, Radio, Chip, Spinner, Skeleton, Avatar, Badge, Divider, Card, Header, DatePicker, Accordion, Timeline, or Timer. Never modify Phoenix source or `node_modules` from this repo — if Phoenix is missing a capability, say so explicitly and stop, do not patch it locally.

**Single-LOB gate.** **One task = one LOB package. Changing two LOB packages in the same task is not allowed.**

LOB packages under `move-pages/packages/`: `account`, `auth-widget`, `error-boundary`, `flights`, `home`, `hotels`, `movetix`, `nps`, `purchases`, `search`, `snap`, `social`, `travel-guide`.

Off-limits from an LOB task: shared/infra packages (`react-native-ui`, `react-native-web`, `web-ui`, `expo`, `core-logger`, `eslint-config`, `jest-config`, `typescript-config`), anything under `apps/`, `phoenix-react-native`, and `node_modules`. Reading another package (e.g. `packages/flights` for a mock pattern) is fine — writing to it is not.

Name the single LOB before your first edit. If a second LOB, a shared package, or an app is needed, stop before editing anything and output:

```
Multi-LOB change required — stopping for approval.

LOB asked:            <lob-a>
Also needs changes:   <lob-b / shared package> — <specific files>
Why a single-LOB fix is not possible: <reason>
Expected pipeline impact: <which package pipelines rebuild and retest>

Confirm before I continue.
```

Then wait for explicit approval. Never split a change across two LOBs silently, and never duplicate code into the second LOB to dodge the conversation — duplicated hooks/services/configs between packages is its own red flag.

**Scope gate.** Stay inside the asked scope within that LOB. Do not change unrelated code paths, and do not touch a working flow merely because it is convenient to reuse. If there is no viable scoped fix, stop and explain why the requested area is insufficient, which extra files must change, and what regression risk that addresses.

---

## 1. Tokens and styling

- `getColor(pd.sys.colour.*)` for every colour. Never a hex literal.
- `getTextStyle(...)` returns `StyleProp<TextStyle>`; use `textStyle(...)` where a strict `TextStyle` is required.
- `getShape(pd.sys.shape.corner.*)`, `pd.ref.space.spacing*.px`.
- No arithmetic on tokens (`spacing90.px * 2 + spacing40.px` is banned). Use one predefined token, or add one.
- Unistyles sheets that use dynamic helpers/tokens must use the factory form: `createStyleSheet(() => ({ ... }))`.
- Responsive differences go **inside** the style object as breakpoints (`xs`, `sm`, `md`, `lg`, `xl`), never as `isDesktop ? styles.a : styles.b`.
- Responsive show/hide uses `display: { xs: 'none', md: 'flex' }`. **Never** conditionally render a component for breakpoint visibility (`isWeb && isMobileWidth && <X />` is banned). Conditional rendering is for business logic only.
- Large-screen layouts: centred container with explicit `maxWidth` breakpoints (`{ lg: 896, xl: 1104 }`), not ad-hoc widths. Don't duplicate breakpoint keys with identical values.
- Style names are semantic, not platform-labelled: `noResultsDropdownContainer` ✅, `noResultsDropdownWeb` ❌.
- Keep styling simple. Complexity here is a review failure, not a feature.

## 2. File structure

```
widgets/MyWidget/          # keep under ~400 lines
  MyWidget.tsx
  styles.ts
configs/constants.ts       # shared non-style config only — no sizing/padding/colours
hooks/                     # reusable logic
utils/                     # pure helpers — must live under utils/, not beside components
types/                     # shared/common types (component-only props stay in the component file)
```

- Helper used by one component and simple → keep it in that component file. Reusable → `utils/`. Never an ad-hoc sibling helper file.
- No wildcard exports (`export *`). Explicit named exports only.

## 3. Services

- One service class per API host, in `services/`. `SnapStaticApiService` → `static.{env}airasia.com`, `SnapWebApiService` → `snapweb.{env}airasia.com`.
- Never add a different host's method to an existing service class.
- Endpoints and host URLs live **inside the service file**, not `constants.ts`.
- Components and hooks never call an API directly — always through a service method.
- Each service gets a `use{ServiceName}` factory hook in `hooks/[lob-name].ts`.

## 4. TanStack Query

- All `useQuery` hooks for a LOB live in one file: `hooks/[lob-name].ts` (e.g. `hooks/snap.ts`). No file-per-hook.
- Order in that file: query key factories → service factory hook → query hooks.
- No types/interfaces/constants in hooks — they go in `types/` and `configs/constants.ts`.
- No `useMemo` for data transformation — use the `select` option.
- Match the existing LOB caching strategy (flights uses `staleTime: 5 * 60 * 1000`).
- Never use `sessionStorage`/`localStorage` as handoff, source of truth, or shared state for anything that also runs on native. Use the Query cache, route params/deeplinks, package hooks, or an explicit cross-platform storage abstraction.
- Apply the `tanstack-query-best-practices` skill for data-fetching work.

## 5. Naming

`PascalCase.tsx` components · `useCamelCase.ts` hooks · `camelCase.ts` utils · descriptive folder names. For a scoped fix, do not rename established render-data variables with feature-specific suffixes — keep `visibleRooms`, not `visibleRoomsWithTripDetailsPress`; put the feature detail inside the memo body.

## 6. Web + mobile

- Web dropdowns via `SelectionFieldView` need `@gorhom/portal` — a `PortalProvider` and `PortalHost` must exist in the web layout.
- Bottom sheets need `BottomSheetModalProvider` in the tree.
- Mobile-web vs desktop-web: `useDeviceInfo()` and `isMobileWidth`.
- When fixing shared behaviour, check desktop web, mobile web, and native (iOS/Android) separately. Apply or explicitly rule out the fix for each before answering.
- Browser storage is allowed only for web-only behaviour (e.g. a one-shot web snackbar), guarded by `Platform.OS === 'web'` / `typeof window !== 'undefined'`. Never for navigation handoff, pre-checkout state, or selected room/rate data.

## 7. Tests and mocks

- `@testing-library/react-native`. Use `testID`, not `UNSAFE_getByType`. Snapshot the UI.
- Never weaken, relax, or rewrite an existing test to make an implementation pass. Fix the production code. Only update a test when the requirement genuinely changed — and say so explicitly.
- Before creating any mock, check `packages/flights` for an equivalent. Reuse it if it's exported; match its shape if it's inline, and prefer extracting a shared mock into `packages/snap/jestSetup.ts` over duplicating per file.
- Mock heavy Phoenix components rather than snapshotting them.
- Existing global mocks: `react-i18next`, `@airasia-rn/ui` (`useDeviceInfo`, `useAppConfig`), `SelectionFieldView`, `PortalProvider`, `PortalHost`. Remove local duplicates.

## 8. Analytics

Follow the Purchases pattern: `<workspace>/move-pages/packages/purchases/src/analytics/landingScreen/LandingScreen.analytics.ts`

- `*.meta.ts` — action keys, event names, constants, param types
- `*.analytics.ts` — native/web payload mapping
- `*.actions.ts` / `*.events.ts` — platform resolution helpers used by widgets
- Reuse `resolveAnalyticsParams` instead of branching per platform in UI. Never build GTM/native payloads inline in a widget for a reusable event. Add mapping tests in the Purchases style.

## 9. i18n and locale

- Every user-visible string goes through `t()`, always with an inline English fallback: `t('key', 'Default English')`.
- Snap hooks read locale from `useAppConfig().config.locale`. Don't pass locale into hooks like `useStations`. Never fall back to a default locale — if locale is missing, disable the query.
- No hardcoded locale in URLs: `https://airasia.com/${lang}/${country}/terms.html`.

## 10. Effects and performance

- Avoid complex `useEffect`. Prefer derived state, event handlers, and small focused hooks. Split an effect with several responsibilities before merging.
- Cleanup must be conditional — return early when the effect didn't subscribe.
- All dependencies in the array.
- Always assess re-renders, list performance, expensive calculations, and unnecessary subscriptions.
- Mandatory: apply `$react-useeffect` (`~/.agents/skills/react-useeffect/SKILL.md`) when writing or changing any code here.

## 11. Deeplinks

Deeplink params are the source of truth whenever present. Stored recent search is a fallback only when there is no deeplink criteria.

## 12. Validation

- Default: run only the focused test for the changed file or the closest affected test. Explain why before running anything broader.
- Full pre-PR: `yarn tsc && yarn lint && yarn format && yarn test`, coverage ≥ 80%.
- Package build: `yarn build` in the package dir.
- Never disable a lint rule or bypass a check to get a green pipeline.

## 13. Pre-integration red flags

Flag (and don't ship) any of these:

- Changing code outside the asked scope without explaining why it's necessary
- Reusing an existing working flow because it's convenient rather than required
- Swapping the requested source of truth for a different one without approval
- Duplicated hooks/services between packages
- TanStack Query used wrongly or not at all
- Browser-only storage in a web+native feature
- Business logic mixed with UI and config; duplicated configs
- Env variables read inside packages
- Hardcoded translations, colours, or locales
- Skipping Phoenix widgets/components
- Skipping snapshot testing
- Mixed or duplicated web/mobile implementations
- **Two LOB packages changed in one task — not allowed; stop and get approval (see gate above)**
- Lint rules disabled to force green
- UI implemented without approved Figma

## 14. Default target locations (snap)

- Constants: `move-pages/packages/snap/src/configs/constants.ts`
- Hooks: `move-pages/packages/snap/src/hooks/`
- Utils: `move-pages/packages/snap/src/utils/`
- Widgets: `move-pages/packages/snap/src/widgets/`

## 15. Repo inspection order

When mapping context in move-pages: `ctx_tree` (path `packages`, bounded depth) → `ctx_search` → `ctx_analyze` on the biggest matches (prefer `signatures (tdd)` mode for the first pass).

---

## Related skills and agents

| Task | Use |
| --- | --- |
| Preflight, "does Phoenix have X?" | Agent `airasia-phoenix-analyst` |
| Writing/editing code | Agent `airasia-phoenix-implementer` |
| Reviewing a diff before PR | Agent `airasia-phoenix-reviewer` |
| JS → TS component migration | Skill `mp-migrate` |
| GitLab MR review | Skill `mr-review`, Agent `mr-reviewer` |
| Colour/typescale tokens | Skill `mp-token-usage` |
| Padding/margin/gap tokens | Skill `mp-spacing` |
| Unistyles sheet authoring | Skill `mp-unistyles` |
| Folder/file layout | Skill `mp-component-structure` |
| PropTypes → TS | Skill `mp-types` |
| Storybook stories | Skill `mp-stories` |
| `index.ts` exports | Skill `mp-index-exports` |
| Raw strings → `t()` | Skill `mp-translate` |
| Old component → Phoenix component | Skill `mp-component-swap` |
