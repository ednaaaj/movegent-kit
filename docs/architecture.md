# Architecture

## How it fits together

```mermaid
flowchart LR
    A["agent-kit<br/>(this repo / npm)"] --> B["init<br/>your profile"]
    A --> C["install"]
    B --> D[("~/.agent-kit/<br/>config.json")]
    WF["bundle: workflow"] --> C
    GR["bundle: guardrails"] --> C
    SV["bundle: savers"] --> C
    P["your pack<br/>(private git repo)"] -->|"pack add"| C
    C --> F["Claude Code<br/>~/.claude"]
    C --> G["Cursor<br/>~/.cursor"]
    C --> H["Gemini / Antigravity<br/>~/.gemini"]
    C --> I["Codex<br/>~/.codex"]
    C --> J["Jira MCP"]
    D -. "read at runtime by skills" .-> F
    D -.-> G
    D -.-> H
    D -.-> I
```

`savers` holds tool recipes rather than skills, so it feeds the tools step instead of the per-agent skill folders.

## What `install` does

```mermaid
flowchart TD
    S(["install"]) --> Q1{"Which agents<br/>do you use?"}
    Q1 -->|"numbered menu<br/>(found ones pre-selected)"| QB{"Which bundles?"}
    QB -->|"workflow / guardrails<br/>(saved in config)"| W["Copy bundle skills to each agent's own folder"]
    W --> PK["Apply private packs<br/>(after bundles, can override)"]
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

**Bundles.** Content lives in `bundles/<name>/`. `workflow` and `guardrails` each hold `skills/` and `agents/`;
`savers` holds `tools.json`. `install` asks which bundles you want, saves the answer as `bundles` in the config, and
`--bundles=a,b` skips the question. Non-interactive repeat installs reuse the saved list.

**Targets and tools.** `targets.json` lists each supported agent (folders, MCP location).
`bundles/savers/tools.json` lists each token-saver tool (commands per agent). The CLI reads them, so adding an agent
or tool is a data edit. See [agents.md](agents.md) and [tools.md](tools.md).

**Per-agent folders.** `install` copies each chosen bundle's `skills/` into each chosen agent's skills folder. Claude
Code also gets the bundles' `agents/` (subagents are Claude-format only). Gemini, Antigravity and Codex additionally
share `~/.agents/skills`.

**Packs.** After the bundles, `install` applies each registered pack the same way. A pack can override a bundle
skill of the same name. See [packs.md](packs.md).

**Order of an install run.** skills and agents (chosen bundles, then each pack), then Jira MCP (unless `--skip-mcp`),
then tools (unless `--skip-tools`). Every step is best-effort and reported; a missing prerequisite is skipped, not fatal.
`--dry-run` prints what would happen without changing anything.
