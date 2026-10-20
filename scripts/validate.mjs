#!/usr/bin/env node
// Repo validator. Zero deps. Exit 1 on any problem.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const p = (...a) => join(ROOT, ...a);
const problems = [];
const fail = (m) => problems.push(m);
const warn = (m) => console.log(`warn: ${m}`);

// --- Allowlists (keep small and explicit) ---
const SKIP_DIRS = new Set(['.git', 'node_modules']);
const SKIP_FILES = new Set(['LICENSE', 'scripts/validate.mjs']);
const FAKE_IDS = new Set(['U0123456789', 'U0987654321', 'C0123456789', 'U0123ABCD', 'C0123ABCD']);
// Files where the word "airasia" is fully allowed.
const AIRASIA_FILES = [/^agents\/airasia-phoenix-[^/]+\.md$/, /^skills\/mp-[^/]+\/SKILL\.md$/, /^agents\/mp-[^/]+\.md$/];
// Files where only the literal token "airasia-phoenix" is allowed.
const AIRASIA_TOKEN_FILES = [/^docs\//, /^README\.md$/, /^AGENTS\.md$/, /^CONTRIBUTING\.md$/, /^CHANGELOG\.md$/, /^\.claude-plugin\//];
const TEXT_EXT = /\.(md|mjs|js|json|ya?ml|txt|sh|toml)$|^[^.]+$/;

const readJson = (rel, required = false) => {
  if (!existsSync(p(rel))) { if (required) fail(`${rel}: missing`); else warn(`${rel}: not present`); return null; }
  try { return JSON.parse(readFileSync(p(rel), 'utf8')); } catch (e) { fail(`${rel}: invalid JSON (${e.message})`); return null; }
};

// --- frontmatter ---
function frontmatter(rel) {
  const m = readFileSync(p(rel), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) { fail(`${rel}: missing YAML frontmatter`); return null; }
  const out = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([\w-]+):\s*(.*)$/);
    if (kv) out[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim();
  }
  return out;
}
function checkFm(rel, expectedName) {
  const fm = frontmatter(rel);
  if (!fm) return;
  if (fm.name !== expectedName) fail(`${rel}: name "${fm.name ?? ''}" must equal "${expectedName}"`);
  if (!fm.description && !/^description:\s*[>|]/m.test(readFileSync(p(rel), 'utf8'))) fail(`${rel}: empty description`);
}
if (existsSync(p('skills'))) {
  for (const d of readdirSync(p('skills'))) {
    if (!statSync(p('skills', d)).isDirectory()) continue;
    const rel = `skills/${d}/SKILL.md`;
    existsSync(p(rel)) ? checkFm(rel, d) : fail(`${rel}: missing`);
  }
}
if (existsSync(p('agents'))) {
  for (const f of readdirSync(p('agents')).filter((x) => x.endsWith('.md'))) checkFm(`agents/${f}`, f.slice(0, -3));
}

// --- private values ---
const walk = (dir, out = []) => {
  for (const e of readdirSync(dir)) {
    if (SKIP_DIRS.has(e)) continue;
    const full = join(dir, e);
    statSync(full).isDirectory() ? walk(full, out) : out.push(full);
  }
  return out;
};
const RULES = [
  ['/Users/ path', /\/Users\/(?!\.\.\.)[A-Za-z0-9_.-]+/g],
  ['token', /\b(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|glpat-[A-Za-z0-9_-]{15,}|xox[bp]-[A-Za-z0-9-]{10,}|npm_[A-Za-z0-9]{30,}|AKIA[0-9A-Z]{12,}|sk-ant-[A-Za-z0-9_-]{10,})/g],
  ['cloudId uuid', /\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi],
];
for (const full of walk(ROOT)) {
  const rel = relative(ROOT, full).split('\\').join('/');
  if (SKIP_FILES.has(rel) || !TEXT_EXT.test(rel.split('/').pop())) continue;
  const text = readFileSync(full, 'utf8');
  const bad = (what, v) => fail(`${rel}: private value (${what}): ${v}`);
  for (const [what, re] of RULES) {
    for (const [v] of text.matchAll(re)) {
      if (what === 'cloudId uuid' && /^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(v)) continue;
      bad(what, v);
    }
  }
  for (const [v] of text.matchAll(/\b[UC]0[A-Z0-9]{8,}\b/g)) if (!FAKE_IDS.has(v)) bad('slack id', v);
  for (const [v] of text.matchAll(/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g)) {
    if (/noreply/i.test(v) || /^git@/.test(v) || /@example\.(com|org)$/.test(v)) continue;
    bad('email', v);
  }
  if (!AIRASIA_FILES.some((r) => r.test(rel))) {
    const t = AIRASIA_TOKEN_FILES.some((r) => r.test(rel)) ? text.replaceAll('airasia-phoenix', '') : text;
    if (/airasia/i.test(t)) bad('airasia', 'word "airasia" outside allowlist');
  }
}

// --- manifests / schema / plugin ---
const agents = readJson('manifests/agents.json');
if (agents) for (const [k, v] of Object.entries(agents.agents ?? agents)) {
  if (!v?.dir) fail(`manifests/agents.json: "${k}" missing dir`);
  if (!v?.skills) fail(`manifests/agents.json: "${k}" missing skills`);
}
const tools = readJson('manifests/tools.json');
if (tools) for (const [k, v] of Object.entries(tools.tools ?? tools)) if (!v?.desc) fail(`manifests/tools.json: "${k}" missing desc`);
const schema = readJson('schemas/config.schema.json');
const example = readJson('examples/config.example.json');
if (schema && example) {
  const allowed = Object.keys(schema.properties || {});
  for (const k of Object.keys(example)) if (!allowed.includes(k)) fail(`examples/config.example.json: key "${k}" not in schema properties`);
}
const plugin = readJson('.claude-plugin/plugin.json');
readJson('.claude-plugin/marketplace.json');

// --- version sync ---
const pkgV = readJson('package.json', true)?.version;
const versions = { 'package.json': pkgV };
if (existsSync(p('VERSION'))) versions.VERSION = readFileSync(p('VERSION'), 'utf8').trim(); else warn('VERSION: not present');
if (plugin) versions['.claude-plugin/plugin.json'] = plugin.version;
for (const [f, v] of Object.entries(versions)) if (v !== pkgV) fail(`version mismatch: ${f} is "${v}", package.json is "${pkgV}"`);

for (const m of problems) console.log(`FAIL ${m}`);
console.log(problems.length ? `${problems.length} problem(s)` : 'validate: ok');
process.exit(problems.length ? 1 : 0);
