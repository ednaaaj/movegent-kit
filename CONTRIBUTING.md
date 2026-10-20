# Contributing

Thanks for contributing.

## Add a skill

1. Create `bundles/<bundle>/skills/<name>/SKILL.md`.
2. Frontmatter `name` must equal the folder name.
3. Frontmatter `description` says WHEN to use the skill.
4. Use config placeholders (`<workspace>`, `<gitlab_project>`, `<jira_site>`, ...) instead of real values. See AGENTS.md for the list.
5. No company names or internal terms.

## Add an agent (subagent)

Create `bundles/<bundle>/agents/<name>.md` with frontmatter `name`, `description`, `model`, `tools`.

## Add a bundle

Create `bundles/<name>/` with a `skills/` and/or `agents/` folder. Document it in the README bundle table and in
`docs/architecture.md`.

## Add a tool

Add an entry to `bundles/savers/tools.json`.

## Add an agent target

Add an entry to `targets.json`, and document its paths in `docs/agents.md`.

## Test locally

Use a throwaway HOME so your real config is untouched:

```
HOME=$(mktemp -d) node bin/cli.mjs install --dry-run --agents=claude
npm test
npm run validate
```

## Pull requests

- Branch from `main`, keep one topic per PR.
- `npm test` and `npm run validate` pass.
- No private values anywhere in the diff.
- Docs updated for any user-visible change.

## Releases

Maintainer only.

1. Bump the version in `package.json` and `VERSION`.
2. Add the entry to `CHANGELOG.md`.
3. Run `npm test` and `npm run validate`.
4. `npm publish --access public`. npm may stage the publish for approval; see [docs/troubleshooting.md](docs/troubleshooting.md).
