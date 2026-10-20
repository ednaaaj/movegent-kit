#!/usr/bin/env node
// agent-kit: init | install | pack | doctor. Zero deps. Every step is best-effort and reported.
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
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

const ATLASSIAN = ['npx', '-y', 'mcp-remote', 'https://mcp.atlassian.com/v1/sse'];

// ponytail: skill dirs / MCP files per agent are best-known paths; fix here if an agent moves them.
const AGENTS = {
  claude: { dir: '.claude', skills: ['.claude/skills'], agents: '.claude/agents',
    mcp: () => sh('claude', ['mcp', 'add', '-s', 'user', 'atlassian', '--', ...ATLASSIAN]) },
  cursor: { dir: '.cursor', skills: ['.cursor/skills'], mcp: () => jsonMcp('.cursor/mcp.json') },
  gemini: { dir: '.gemini', skills: ['.gemini/skills', '.gemini/antigravity/skills'],
    mcp: () => { jsonMcp('.gemini/settings.json'); if (existsSync(join(HOME, '.gemini/antigravity'))) jsonMcp('.gemini/antigravity/mcp_config.json'); } },
  codex: { dir: '.codex', skills: ['.codex/skills'],
    mcp: () => sh('codex', ['mcp', 'add', 'atlassian', '--', ...ATLASSIAN]) },
};

// Third-party tools. Each command list runs only for agents that are installed.
const TOOLS = {
  caveman: { all: ['npx', '-y', 'github:JuliusBrussee/caveman'] }, // its installer auto-detects every agent
  ponytail: {
    claude: [['claude', 'plugin', 'marketplace', 'add', 'https://github.com/DietrichGebert/ponytail.git'], ['claude', 'plugin', 'install', 'ponytail@ponytail']],
    gemini: [['gemini', 'extensions', 'install', 'https://github.com/DietrichGebert/ponytail']],
    cursor: 'manual: copy .cursor/rules from https://github.com/DietrichGebert/ponytail',
    codex: 'manual: see Codex section in https://github.com/DietrichGebert/ponytail',
  },
  graphify: { all: ['uv', 'tool', 'install', 'graphifyy'], post: (a) => ['graphify', 'install', '--platform', a] },
};

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
  cfg.workspace = await ask('Workspace folder (where your repos live)', old.workspace);
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

// Skill packs: any git repo (or local folder) with skills/ and/or agents/ at its root.
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
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const a = (await rl.question(`Install for which agents? (${names.join(', ')}, or "all") [${detected.join(',') || 'none detected'}]: `)).trim();
  rl.close();
  return !a ? detected : a === 'all' ? names : a.split(',').map((s) => s.trim());
}

async function install() {
  if (!existsSync(CFG)) log('! no config yet: run `agent-kit init` first (skills read it at runtime)');
  if (opt('pack')) packAdd(opt('pack'));
  const want = opt('agents')?.split(',') ?? (await pickAgents());
  const found = Object.entries(AGENTS).filter(([n]) => want.includes(n));
  if (!found.length) return log('no supported agent found (~/.claude ~/.cursor ~/.gemini ~/.codex). Use --agents=claude,cursor,...');
  log(`agents: ${found.map(([n]) => n).join(', ')}`);

  // Built-in skills first, then each pack (a pack can override a built-in of the same name).
  const sources = [{ name: 'built-in', dir: KIT }, ...(readCfg().packs || []).map((p) => ({ name: p.name, dir: packDir(p) }))];
  for (const s of sources) {
    log(`\n[skills: ${s.name}]`);
    if (!existsSync(s.dir)) { log(`  missing ${s.dir} (run \`agent-kit pack update\`)`); continue; }
    copyDir(join(s.dir, 'skills'), join(HOME, '.agents/skills')); // shared standard dir, read by several agents
    for (const [n, a] of found) for (const rel of a.skills) {
      if (rel.includes('antigravity') && !existsSync(join(HOME, '.gemini/antigravity'))) continue;
      log(` ${n}:`); copyDir(join(s.dir, 'skills'), join(HOME, rel));
    }
    if (found.some(([n]) => n === 'claude')) { log(' claude subagents:'); copyDir(join(s.dir, 'agents'), join(HOME, '.claude/agents')); }
  }

  if (!flag('skip-mcp')) {
    log('\n[mcp] Atlassian (Jira). First use opens a browser to log in with YOUR Atlassian account.');
    for (const [n, a] of found) { log(` ${n}:`); a.mcp(); }
    log('\n[slack] Claude Code: connect Slack via claude.ai > Settings > Connectors (then /mcp). Cursor/Gemini/Codex: add your Slack MCP yourself; without one, skills just print the message for you to paste.');
  }

  if (!flag('skip-tools')) {
    log('\n[tools]');
    for (const [t, spec] of Object.entries(TOOLS)) {
      log(` ${t}:`);
      if (spec.all) sh(spec.all[0], spec.all.slice(1));
      for (const [n] of found) {
        const todo = spec[n];
        if (typeof todo === 'string') log(`  ${n}: ${todo}`);
        else if (todo) todo.forEach((c) => sh(c[0], c.slice(1)));
        else if (spec.post) { const c = spec.post(n); sh(c[0], c.slice(1)); }
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
  ok(existsSync(join(HOME, '.agents/skills/jira-transition/SKILL.md')), 'built-in skills installed');
  for (const p of cfg.packs || []) ok(existsSync(packDir(p)), `pack ${p.name}`);
  log('Jira MCP: ask your agent "list my in-progress Jira tickets" - first call prompts the Atlassian login.');
}

const help = `agent-kit
  init                          optional profile: GitLab, Jira site, Slack channel + people
  install [--agents=a,b] [--pack=<git-url|path>] [--skip-mcp] [--skip-tools] [--dry-run]
  pack add <git-url|path>       add a private skill pack (repo with skills/ and agents/)
  pack list | update | remove <name>
  doctor`;
({ init, install, pack, doctor }[cmd] || (() => log(help)))();
