import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CLI = join(REPO, 'bin/cli.mjs');
const PACK = join(REPO, 'examples/pack');

function withHome(fn) {
  return () => {
    const home = mkdtempSync(join(tmpdir(), 'agent-kit-'));
    try {
      const run = (...a) => {
        const r = spawnSync(process.execPath, [CLI, ...a], { env: { ...process.env, HOME: home }, encoding: 'utf8' });
        return { ...r, out: `${r.stdout}${r.stderr}` };
      };
      return fn(home, run);
    } finally { rmSync(home, { recursive: true, force: true }); }
  };
}
const has = (home, rel) => existsSync(join(home, rel));

async function waitFor(path) {
  for (let i = 0; i < 60 && !existsSync(path); i++) await new Promise((r) => setTimeout(r, 1000));
  assert.ok(existsSync(path), `required fixture missing after 60s: ${path} (owned by another work unit)`);
}

test('no-arg prints help', withHome((_h, run) => {
  const r = run();
  assert.match(r.out, /agent-kit/);
  assert.match(r.out, /install/);
}));

test('claude install: skills + subagents, no shared dir', withHome((h, run) => {
  run('install', '--agents=claude', '--skip-mcp', '--skip-tools');
  assert.ok(has(h, '.claude/skills/jira-transition/SKILL.md'));
  assert.ok(has(h, '.claude/agents/mr-intake.md'));
  assert.ok(!has(h, '.agents/skills'));
}));

test('other agents: skills only, shared dir', withHome((h, run) => {
  run('install', '--agents=gemini,antigravity,cursor,codex', '--skip-mcp', '--skip-tools');
  for (const d of ['.gemini/skills', '.gemini/antigravity/skills', '.cursor/skills', '.codex/skills', '.agents/skills']) {
    assert.ok(has(h, `${d}/jira-transition/SKILL.md`), d);
  }
  assert.ok(!has(h, '.cursor/agents'));
  assert.ok(!has(h, '.gemini/agents'));
}));

test('--dry-run writes nothing', withHome((h, run) => {
  run('install', '--dry-run', '--agents=claude,cursor,codex', '--skip-tools');
  assert.deepEqual(readdirSync(h), []);
}));

test('pack add then install', withHome(async (h, run) => {
  await waitFor(join(PACK, 'skills/hello-skill/SKILL.md'));
  run('pack', 'add', PACK);
  run('install', '--agents=claude', '--skip-mcp', '--skip-tools');
  assert.ok(has(h, '.claude/skills/hello-skill/SKILL.md'));
  assert.ok(has(h, '.claude/agents/hello-agent.md'));
  assert.match(run('pack', 'list').out, /examples\/pack|pack/);
}));

test('cursor MCP merge is idempotent and preserves other servers', withHome((h, run) => {
  mkdirSync(join(h, '.cursor'));
  const f = join(h, '.cursor/mcp.json');
  writeFileSync(f, JSON.stringify({ mcpServers: { other: { command: 'x' } } }));
  run('install', '--agents=cursor', '--skip-tools');
  run('install', '--agents=cursor', '--skip-tools');
  const j = JSON.parse(readFileSync(f, 'utf8'));
  assert.ok(j.mcpServers.atlassian);
  assert.deepEqual(j.mcpServers.other, { command: 'x' });
  assert.equal(Object.keys(j.mcpServers).filter((k) => k === 'atlassian').length, 1);
  assert.equal(Object.keys(j.mcpServers).length, 2);
}));

test('doctor exits 0', withHome((_h, run) => {
  run('install', '--agents=claude', '--skip-mcp', '--skip-tools');
  const r = run('doctor');
  assert.equal(r.status, 0);
  assert.match(r.out, /built-in skills installed/);
}));

test('--tools selection', withHome((_h, run) => {
  const r = run('install', '--dry-run', '--agents=claude', '--skip-mcp', '--tools=rtk');
  assert.match(r.out, /brew install rtk/);
  assert.match(r.out, /rtk init -g/);
  assert.doesNotMatch(r.out, /headroom/);
}));
