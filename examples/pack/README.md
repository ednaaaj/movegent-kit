# Example pack

A minimal pack: one skill (`skills/hello-skill`) and one subagent (`agents/hello-agent.md`).

Try it from the repo root:

```bash
node bin/cli.mjs pack add ./examples/pack
node bin/cli.mjs install --agents=claude --skip-mcp --skip-tools --dry-run
```

Drop `--dry-run` to install for real. Then ask your agent to run `hello-skill`. Remove it with
`node bin/cli.mjs pack remove pack` (the pack name is the folder name), and delete the installed copies yourself.

To make your own pack, put `skills/` and/or `agents/` at the root of a git repo and run `pack add <git-url>`.
See [docs/packs.md](../../docs/packs.md).
