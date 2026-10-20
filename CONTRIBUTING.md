# Contributing

Thanks for contributing. Layout inspired by affaan-m/ECC (MIT).

## Add a skill

1. Create `skills/<name>/SKILL.md`.
2. Frontmatter `name` must equal the folder name.
3. Frontmatter `description` says WHEN to use the skill.
4. Use config placeholders (`<workspace>`, `<gitlab_project>`, `<jira_site>`, ...) instead of real values. See AGENTS.md for the list.
5. No company names or internal terms.

## Add an agent

Create `agents/<name>.md` with frontmatter `name`, `description`, `model`, `tools`.

## Add a tool

Add an entry to `manifests/tools.json`.

## Add an agent target

Add an entry to `manifests/agents.json`, and document its paths in `docs/agents.md`.

## Test locally

Use a throwaway HOME so your real config is untouched:

```
HOME=$(mktemp -d) node bin/cli.mjs install --dry-run --agents=claude
npm test
```

## Pull requests

- Branch from `main`, keep one topic per PR.
- `npm test` passes.
- No private values anywhere in the diff.
- Docs updated for any user-visible change.
- Fill in the PR template.

## Releases

Maintainer only.

1. Bump the version in `package.json`, `VERSION` and `.claude-plugin/plugin.json`.
2. Add the entry to `CHANGELOG.md`.
3. Run `npm test`.
4. `npm publish --access public`. npm may stage the publish for approval; see TROUBLESHOOTING.md.
