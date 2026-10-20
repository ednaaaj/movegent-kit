# Architecture

## How it fits together

```mermaid
flowchart LR
    A["agent-kit<br/>(this repo / npm)"] --> B["init<br/>your profile"]
    A --> C["install"]
    B --> D[("~/.agent-kit/<br/>config.json")]
    C --> E["built-in skills<br/>+ agents"]
    P["private pack<br/>(your team's git repo)"] -->|"pack add"| C
    E --> F["Claude Code<br/>~/.claude"]
    E --> G["Cursor<br/>~/.cursor"]
    E --> H["Gemini / Antigravity<br/>~/.gemini"]
    E --> I["Codex<br/>~/.codex"]
    C --> J["Jira MCP"]
    C --> K["token savers"]
    D -. "read at runtime by skills" .-> F
    D -.-> G
    D -.-> H
    D -.-> I
```

## What `install` does

```mermaid
flowchart TD
    S(["install"]) --> Q1{"Which agents<br/>do you use?"}
    Q1 -->|"numbered menu<br/>(found ones pre-selected)"| W["Copy skills to each agent's own folder"]
    W --> PK["Apply private packs<br/>(after built-ins, can override)"]
    PK --> M{"--skip-mcp?"}
    M -->|no| J["Add Atlassian (Jira) MCP<br/>to each agent's config"]
    M -->|yes| T
    J --> T{"--skip-tools?"}
    T -->|no| Q2{"Which extra tools?"}
    Q2 --> X["rtk / headroom / context-mode /<br/>caveman / ponytail / graphify"]
    T -->|yes| Z
    X --> Z(["done: run doctor"])
```

## Pieces

**Config.** `~/.agent-kit/config.json` is written by `init` and read by skills at runtime. Skills refer to values
with placeholders such as `<workspace>` and `<gitlab_user>`. The repo holds no real values. See [config.md](config.md).

**Manifests.** `manifests/agents.json` lists each supported agent (folders, MCP location). `manifests/tools.json`
lists each token-saver tool (commands per agent). The CLI reads them, so adding an agent or tool is a data edit.
See [agents.md](agents.md) and [tools.md](tools.md).

**Per-agent folders.** `install` copies `skills/` into each chosen agent's skills folder. Claude Code also gets
`agents/` (subagents are Claude-format only). Gemini, Antigravity and Codex additionally share `~/.agents/skills`.

**Packs.** After the built-in content, `install` applies each registered pack the same way. A pack can override a
built-in skill of the same name. See [packs.md](packs.md).

**Order of an install run.** skills and agents (built-in, then each pack), then Jira MCP (unless `--skip-mcp`),
then tools (unless `--skip-tools`). Every step is best-effort and reported; a missing prerequisite is skipped, not fatal.
`--dry-run` prints what would happen without changing anything.
