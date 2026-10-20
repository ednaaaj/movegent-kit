---
name: mp-type-writer
description: Writes types.ts for a migrated move-pages component by converting PropTypes to TypeScript. Round 1 of the migration pipeline — depends on migration-plan.json. Writes nothing else.
tools: Read, Write, Grep, Glob
color: blue
---

> **Config:** `<workspace>` below = the `workspace` value in `~/.agent-kit/config.json` (the folder that contains your repos). If missing, ask the user once, or tell them to run `agent-kit init`.

Your only job is to write `types.ts`. Nothing else.

## Read first

- `<workspace>/move-pages/.gemini/tools/migration-plan.json`
- Skill `mp-types`

## Task

Using the `props` section of the migration plan, write a complete `types.ts`.

Rules (all from `mp-types`):

- Convert every prop using the PropTypes → TypeScript table
- `.isRequired` props are not optional; everything else gets `?`
- Never use `any` — use `unknown` if truly unknown
- `PropTypes.shape` becomes a named interface, not inline
- Style props use `StyleProp<ViewStyle>` / `StyleProp<TextStyle>` from `react-native`
- Export every interface and type
- No constants, no functions, no JSX

For a **dumb** component (`componentType: "dumb"`), also add the string props that replace what would have been `t()` calls — optional strings named for purpose (`submitLabel?: string`).

## Output

Write to the path in `migration-plan.json` under `newPath` — e.g. `src/widgets/MyComponentView/types.ts`. Never hardcode a directory.

Report: how many interfaces created, how many props typed, and any prop whose type you were uncertain about (flag these explicitly).
