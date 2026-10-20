#!/usr/bin/env node
// agent-kit: init | install | pack | doctor. Zero deps. Every step is best-effort and reported.
// Content lives in bundles/<name>/{skills,agents}; targets.json = agent table; bundles/savers/tools.json = tools table.
// install asks which bundles to copy (--bundles=a,b); packs are always installed.
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';

const HOME = homedir();
const KIT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = join(HOME, '.agent-kit');
const CFG = join(ROOT, 'config.json');
const PACKS = join(ROOT, 'packs');
const args = process.argv.slice(2);
const cmd = args[0];
const flag = (n) => args.includes(`--${n}`);
const opt = (n) => args.find((a) => a.startsWith(`--${n}=`))?.split('=')[1];
const DRY = flag('dry-run');

// Data tables: targets.json (agents) and bundles/savers/tools.json (tools); this file only holds the logic.
function loadManifest(rel) {
  const f = join(KIT, rel);
  try { return JSON.parse(readFileSync(f, 'utf8')); }
  catch (e) { console.error(`agent-kit: cannot load ${f}: ${e.message}`); process.exit(1); }
}

// ponytail: skill dirs / MCP files per agent are best-known paths (checked against a real machine
// for claude, cursor, codex, gemini); fix them in targets.json if an agent moves them.
// Subagents are Claude-format only.
const AGENTS_MANIFEST = loadManifest('targets.json');
const ATLASSIAN = AGENTS_MANIFEST.atlassianMcp;
const AGENTS = Object.fromEntries(Object.entries(AGENTS_MANIFEST.agents).map(([n, { mcp, ...a }]) => [n, {
  ...a,
  mcp: mcp.type === 'cli'
    ? () => sh(mcp.bin, [...mcp.args, ...(mcp.appendMcpCommand ? ATLASSIAN : [])])
    : () => jsonMcp(mcp.file),
}]));

// Third-party tools (token savers + helpers), see bundles/savers/tools.json. Per-agent steps run only for the agents you picked.
// all = run once; after = run once after `all`; <agent> = steps (or a manual note) for that agent; other = note for the rest;
// postTemplate = fallback command for agents with no entry, {agent} is replaced by the agent name.
const TOOLS = Object.fromEntries(Object.entries(loadManifest('bundles/savers/tools.json').tools).map(([n, { postTemplate, ...t }]) => [n,
  postTemplate ? { ...t, post: (a) => postTemplate.map((x) => x.replace('{agent}', a)) } : t]));

async function pickTools() {
  const names = Object.keys(TOOLS);
  const want = opt('tools');
  if (want) return want.split(',').map((s) => s.trim()).filter((s) => names.includes(s));
  if (!process.stdin.isTTY) return names;
  log('Extra tools (these change how your agent behaves; pick what you want):');
  names.forEach((n, i) => log(`  ${i + 1}) ${n.padEnd(13)} ${TOOLS[n].desc}`));
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const a = (await rl.question('Numbers or names, comma separated, "all", "none", or Enter for all: ')).trim();
  rl.close();
  if (!a || a === 'all') return names;
  if (a === 'none') return [];
  return a.split(',').map((s) => s.trim()).map((s) => names[Number(s) - 1] || s).filter((s) => names.includes(s));
}

const log = (m) => console.log(m);
const has = (bin) => spawnSync('sh', ['-c', `command -v ${bin}`]).status === 0;
const readCfg = () => { try { return JSON.parse(readFileSync(CFG, 'utf8')); } catch { return {}; } };
const writeCfg = (c) => { mkdirSync(ROOT, { recursive: true }); writeFileSync(CFG, JSON.stringify(c, null, 2) + '\n'); };

function sh(bin, a, opts = {}) {
  const line = [bin, ...a].join(' ');
  if (DRY) { log(`  [dry] ${line}`); return true; }
  if (!has(bin)) { log(`  skip (no \`${bin}\` on PATH): ${line}`); return false; }
  const r = spawnSync(bin, a, { stdio: 'inherit', ...opts });
  log(r.status === 0 ? `  ok: ${line}` : `  FAILED (${r.status}): ${line}`);
  return r.status === 0;
}

function jsonMcp(rel) {
  const f = join(HOME, rel);
  if (DRY) return log(`  [dry] merge atlassian MCP into ${f}`);
  let j = {};
  try { j = JSON.parse(readFileSync(f, 'utf8')); } catch { /* new file */ }
  j.mcpServers = { ...j.mcpServers, atlassian: { command: ATLASSIAN[0], args: ATLASSIAN.slice(1) } };
  mkdirSync(dirname(f), { recursive: true });
  writeFileSync(f, JSON.stringify(j, null, 2) + '\n');
  log(`  ok: atlassian MCP -> ${f}`);
}

function copyDir(src, dest) {
  if (!existsSync(src)) return;
  if (DRY) return log(`  [dry] copy ${src} -> ${dest}`);
  mkdirSync(dest, { recursive: true });
  cpSync(src, dest, { recursive: true, force: true });
}

// Public Atlassian endpoint: site host -> cloudId. No auth needed.
async function cloudId(host) {
  try {
    const r = await fetch(`https://${host}/_edge/tenant_info`);
    return (await r.json()).cloudId || '';
  } catch { return ''; }
}

async function init() {
  const old = readCfg();
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = async (q, d) => (await rl.question(`${q}${d ? ` [${d}]` : ''}: `)).trim() || d || '';
  log('Everything is optional: press Enter to skip. Skills read ~/.agent-kit/config.json at runtime.\n');
  const cfg = { ...old };
  delete cfg.workspace; // replaced by repo_path in 0.2.0
  cfg.repo_path = await ask('Repo folder to work in (optional; blank = the git root of the folder your agent runs in)', old.repo_path);
  cfg.design_system_path = await ask('Design-system checkout (optional; only the guardrails bundle uses it)', old.design_system_path);
  cfg.gitlab_user = await ask('GitLab username', old.gitlab_user);
  cfg.gitlab_project = await ask('Main GitLab project path (group/subgroup/repo)', old.gitlab_project);
  cfg.reviewers = (await ask('Usual MR reviewers, comma separated GitLab usernames', (old.reviewers || []).join(','))).split(',').map((s) => s.trim()).filter(Boolean);
  cfg.jira_site = (await ask('Jira site host, e.g. yourco.atlassian.net', old.jira_site)).replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  cfg.jira_cloud_id = cfg.jira_site ? (await cloudId(cfg.jira_site)) || (await ask('Could not look it up. Jira cloudId (UUID)', old.jira_cloud_id)) : '';

  // Slack: ids come from Slack -> profile/channel -> ⋮ -> "Copy member ID" / channel details footer.
  log('\nSlack notifications (leave channel blank to skip; skills will only draft, never send).');
  const o = old.slack || {};
  const channelName = await ask('Channel to post in, e.g. #team-reviews', o.channel?.name);
  const slack = { auto_send: false, channel: null, people: [], mention: [] };
  if (channelName) {
    let id = '';
    while (!/^[CG][A-Z0-9]{8,}$/.test(id)) id = await ask('  Channel ID (C... or G..., from channel details)', o.channel?.id);
    slack.channel = { name: channelName, id };
    log('People who may be DM\'d / @mentioned, one per line as `Name,U123ABC` (empty line to finish):');
    for (;;) {
      const [name, uid] = (await ask('  person')).split(',').map((s) => s.trim());
      if (!name) break;
      if (!/^U[A-Z0-9]+$/.test(uid || '')) { log('   need `Name,UXXXX` (member ID)'); continue; }
      slack.people.push({ name, id: uid });
    }
    if (!slack.people.length && o.people) slack.people = o.people;
    const all = slack.people.map((p) => p.name).join(', ');
    const who = (await ask(`Always @mention on posts (names from: ${all}; comma sep, blank = all)`, '')).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
    slack.mention = slack.people.filter((p) => !who.length || who.includes(p.name.toLowerCase())).map((p) => p.id);
    slack.auto_send = /^y/i.test(await ask('Let the agent SEND to them without asking each time? (y/N)', 'n'));
  }
  cfg.slack = slack;
  rl.close();
  writeCfg(cfg);
  log(`saved ${CFG}`);
}

// Bundles: a dir with skills/ and/or agents/. Built-ins live in KIT/bundles/<name>.
const isBundle = (d) => existsSync(join(d, 'skills')) || existsSync(join(d, 'agents'));
const subBundles = (root) => !existsSync(root) ? [] : readdirSync(root, { withFileTypes: true })
  .filter((e) => e.isDirectory() && isBundle(join(root, e.name))).map((e) => ({ name: e.name, dir: join(root, e.name) }))
  .sort((a, b) => a.name.localeCompare(b.name));
const builtinBundles = () => subBundles(join(KIT, 'bundles'));
const BUNDLE_DESC = {
  workflow: 'ticket -> MR -> babysit: Jira, GitLab, review',
  guardrails: 'React Native + design-system rules and migration agents',
};
// A pack is ONE bundle if skills/ or agents/ sit at its root, else each bundles/<x> is its own.
const packBundles = (p) => {
  const d = packDir(p);
  return isBundle(d) ? [{ name: p.name, dir: d }] : subBundles(join(d, 'bundles'));
};

async function pickBundles() {
  const all = builtinBundles().map((b) => b.name);
  const want = opt('bundles');
  if (want) {
    const w = want.split(',').map((s) => s.trim()).filter(Boolean);
    const bad = w.filter((x) => !all.includes(x));
    if (bad.length) log(`! unknown bundle(s) ignored: ${bad.join(', ')}`);
    return w.filter((x) => all.includes(x));
  }
  if (!process.stdin.isTTY) {
    const saved = readCfg().bundles;
    return Array.isArray(saved) ? saved.filter((x) => all.includes(x)) : all;
  }
  log('Which bundles do you want?');
  all.forEach((n, i) => log(`  ${i + 1}) ${n.padEnd(12)} ${BUNDLE_DESC[n] || ''}`));
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const a = (await rl.question('Numbers or names, comma separated, "all", or Enter for all: ')).trim();
  rl.close();
  if (!a || a === 'all') return all;
  return a.split(',').map((s) => s.trim()).map((s) => all[Number(s) - 1] || s).filter((s) => all.includes(s));
}

// Skill packs: any git repo (or local folder) with skills/ and/or agents/ at its root (or bundles/<x>/...).
function packDir(p) { return p.local ? p.url : join(PACKS, p.name); }

function packAdd(url) {
  if (!url) return log('usage: agent-kit pack add <git-url|local-path>');
  const local = existsSync(url);
  const name = basename(url.replace(/\/+$/, '')).replace(/\.git$/, '');
  const cfg = readCfg();
  const p = { name, url: local ? resolve(url) : url, local };
  if (!local) {
    if (existsSync(packDir(p))) { log(`pack ${name} already cloned, updating`); packPull(p); }
    else { mkdirSync(PACKS, { recursive: true }); if (!sh('git', ['clone', '--depth=1', url, packDir(p)])) return; }
  }
  cfg.packs = [...(cfg.packs || []).filter((x) => x.name !== name), p];
  if (!DRY) writeCfg(cfg);
  log(`pack ${name} registered`);
}

function packPull(p) { if (!p.local) sh('git', ['-C', packDir(p), 'pull', '--ff-only']); }

function pack() {
  const [sub, arg] = [args[1], args[2]];
  const cfg = readCfg();
  if (sub === 'add') return packAdd(arg);
  if (sub === 'list') return (cfg.packs || []).forEach((p) => log(`${p.name}\t${p.url}`)) || (!cfg.packs?.length && log('no packs'));
  if (sub === 'update') return (cfg.packs || []).forEach(packPull);
  if (sub === 'remove') {
    const p = (cfg.packs || []).find((x) => x.name === arg);
    if (!p) return log(`no pack named ${arg}`);
    if (!p.local) rmSync(packDir(p), { recursive: true, force: true });
    writeCfg({ ...cfg, packs: cfg.packs.filter((x) => x.name !== arg) });
    return log(`removed ${arg} (installed copies stay until you delete them)`);
  }
  log('usage: agent-kit pack add <git-url|path> | list | update | remove <name>');
}

async function pickAgents() {
  const names = Object.keys(AGENTS);
  const detected = names.filter((n) => existsSync(join(HOME, AGENTS[n].dir)));
  if (!process.stdin.isTTY) return detected;
  log('Which agents do you use? Each one reads skills from its own folder:');
  names.forEach((n, i) => {
    const a = AGENTS[n];
    log(`  ${i + 1}) ${n.padEnd(12)} ${detected.includes(n) ? '[found]    ' : '[not found]'} ~/${a.skills}${a.agents ? ` + ~/${a.agents}` : ''}`);
  });
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const a = (await rl.question(`Numbers or names, comma separated, "all", or Enter for [found] ones (${detected.join(',') || 'none'}): `)).trim();
  rl.close();
  if (!a) return detected;
  if (a === 'all') return names;
  return a.split(',').map((s) => s.trim()).map((s) => names[Number(s) - 1] || s).filter((s) => names.includes(s));
}

async function install() {
  if (!existsSync(CFG)) log('! no config yet: run `agent-kit init` first (skills read it at runtime)');
  if (opt('pack')) packAdd(opt('pack'));
  const want = opt('agents')?.split(',') ?? (await pickAgents());
  const found = Object.entries(AGENTS).filter(([n]) => want.includes(n));
  if (!found.length) return log('no agent selected or found. Use --agents=claude,cursor,gemini,antigravity,codex');
  log(`agents: ${found.map(([n]) => n).join(', ')}`);

  const chosen = await pickBundles();
  if (!DRY) writeCfg({ ...readCfg(), bundles: chosen });
  // Built-in bundles first, then each pack (a pack can override a built-in of the same name).
  const sources = [
    ...builtinBundles().filter((b) => chosen.includes(b.name)),
    ...(readCfg().packs || []).flatMap((p) => existsSync(packDir(p)) ? packBundles(p) : (log(`\n[bundle: ${p.name}]\n  missing ${packDir(p)} (run \`agent-kit pack update\`)`), [])),
  ];
  for (const s of sources) {
    log(`\n[bundle: ${s.name}]`);
    if (found.some(([, x]) => x.shared)) { log(' shared (~/.agents/skills, read by gemini/antigravity/codex):'); copyDir(join(s.dir, 'skills'), join(HOME, '.agents/skills')); }
    for (const [n, x] of found) {
      log(` ${n}:`);
      copyDir(join(s.dir, 'skills'), join(HOME, x.skills));
      if (x.agents) copyDir(join(s.dir, 'agents'), join(HOME, x.agents));
    }
  }

  if (!flag('skip-mcp')) {
    log('\n[mcp] Atlassian (Jira). First use opens a browser to log in with YOUR Atlassian account.');
    for (const [n, a] of found) { log(` ${n}:`); a.mcp(); }
    log('\n[slack] Claude Code: connect Slack via claude.ai > Settings > Connectors (then /mcp). Cursor/Gemini/Codex: add your Slack MCP yourself; without one, skills just print the message for you to paste.');
  }

  if (!flag('skip-tools')) {
    const picked = await pickTools();
    log('\n[tools]');
    for (const name of picked) {
      const spec = TOOLS[name];
      log(` ${name}:`);
      if (spec.all) {
        if (!DRY && !has(spec.all[0]) && spec.hint) log(`  hint: ${spec.hint}`);
        sh(spec.all[0], spec.all.slice(1));
      }
      if (spec.after) sh(spec.after[0], spec.after.slice(1));
      for (const [n] of found) {
        const todo = spec[n];
        if (typeof todo === 'string') log(`  ${n}: ${todo}`);
        else if (todo) todo.forEach((c) => sh(c[0], c.slice(1)));
        else if (spec.post) { const c = spec.post(n); sh(c[0], c.slice(1)); }
        else if (spec.other) log(`  ${n}: ${spec.other}`);
      }
    }
  }
  log('\nnext: `agent-kit doctor`. GitLab users: `glab auth login`.');
}

function doctor() {
  const cfg = readCfg();
  const ok = (c, m) => log(`${c ? 'ok  ' : 'FAIL'} ${m}`);
  ok(existsSync(CFG), `config ${CFG}`);
  ok(has('node'), 'node');
  ok(has('git'), 'git');
  log(`${has('glab') ? 'ok  ' : '--  '} glab (only needed for GitLab workflows)`);
  for (const [n, a] of Object.entries(AGENTS)) log(`${existsSync(join(HOME, a.dir)) ? 'ok  ' : '--  '} agent ${n}`);
  const names = (cfg.bundles || builtinBundles().map((b) => b.name));
  const skills = builtinBundles().filter((b) => names.includes(b.name)).flatMap((b) => existsSync(join(b.dir, 'skills')) ? readdirSync(join(b.dir, 'skills')) : []);
  const dirs = [join(HOME, '.agents/skills'), ...Object.values(AGENTS).map((a) => join(HOME, a.skills))];
  const where = (sk) => dirs.some((d) => existsSync(join(d, sk, 'SKILL.md')));
  ok(skills.some(where), `built-in skills installed (${skills.filter(where).length}/${skills.length})`);
  for (const p of cfg.packs || []) ok(existsSync(packDir(p)), `pack ${p.name}`);
  log('Jira MCP: ask your agent "list my in-progress Jira tickets" - first call prompts the Atlassian login.');
}

const help = `agent-kit
  init                          optional profile: GitLab, Jira site, Slack channel + people
  install [--agents=a,b] [--tools=a,b] [--pack=<git-url|path>] [--bundles=a,b] [--skip-mcp] [--skip-tools] [--dry-run]
  pack add <git-url|path>       add a private skill pack (repo with skills/ and agents/, or bundles/<x>/...)
  pack list | update | remove <name>
  doctor\n(bundles is not a command, only the --bundles flag)`;
({ init, install, pack, doctor }[cmd] || (() => log(help)))();
