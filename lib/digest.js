'use strict';
/* ============================================================
   Repodest Extension — LLM Digest engine (ported from Repodest)
   Presets, output formats (md/xml/json/llmstxt/repomix),
   token shrinker, signature extraction, context-aware packing.
   Depends on: lib/core.js (RepodestCore spread onto globalThis)
   Exposes: RPDigest
   ============================================================ */
const RPDigest = {};

/* ---------- task presets ---------- */
RPDigest.PRESETS = {
  general: { label: 'General', task: 'You are given the source of a software repository. Use this context to answer questions about the codebase accurately and concisely.' },
  review: { label: 'Code review', task: 'You are a senior code reviewer. Analyze the repository below: flag bugs, security issues, performance problems, and style violations. Suggest concrete improvements with file references. Structure the review by severity (critical / major / minor).' },
  learn: { label: 'Learn codebase', task: 'You are a senior engineer mentoring a new team member. Explain the repository below: architecture, main modules and how they interact, entry points, data flow, and key design patterns. Suggest a reading order for the files.' },
  migrate: { label: 'Migration', task: 'You are a migration expert. Analyze the repository below and produce a migration plan: inventory of frameworks and versions, dependency risks, suggested target stack, step-by-step migration phases, and a risk assessment.' },
  docs: { label: 'Docs writing', task: 'You are a technical writer. Using the repository below, draft up-to-date documentation: a README outline, API reference from exported functions/routes, and a getting-started guide. Match the tone to the existing docs.' }
};
RPDigest.FORMATS = ['md', 'xml', 'json', 'llmstxt', 'repomix'];
RPDigest.taskFor = function (preset, customTask) {
  if (preset === 'custom') return (customTask || '').trim() || RPDigest.PRESETS.general.task;
  return (RPDigest.PRESETS[preset] || RPDigest.PRESETS.general).task;
};

/* ---------- model context tables ---------- */
RPDigest.MODELS = [
  { id: 'gpt5', label: 'GPT-5', ctx: 128000, cpt: 4 },
  { id: 'claude', label: 'Claude', ctx: 200000, cpt: 3.6 },
  { id: 'gemini', label: 'Gemini', ctx: 1000000, cpt: 3.8 },
  { id: 'llama', label: 'Llama', ctx: 8000, cpt: 4.2 }
];
RPDigest.modelById = function (id) {
  return RPDigest.MODELS.find(function (m) { return m.id === id; }) || RPDigest.MODELS[0];
};
RPDigest.estimateTokens = function (bytes, modelId) {
  const m = RPDigest.modelById(modelId);
  return Math.round(Number(bytes || 0) / m.cpt);
};
RPDigest.tokenBudget = function (modelId) {
  const m = RPDigest.modelById(modelId);
  return Math.floor(m.ctx * 0.9 * m.cpt);
};

/* ---------- selection helpers ---------- */
RPDigest.isSelectable = function (f) {
  return isText(f) && !isLock(f) && (f.size || 0) <= 200 * 1024;
};
RPDigest.selectAllText = function (tree) {
  const out = [];
  const files = (tree && tree.tree) || [];
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    if (f.type !== 'blob') continue;
    if (RPDigest.isSelectable(f) && out.length < 500) out.push(f.path);
  }
  return out;
};
RPDigest.selectByGoal = function (tree, goal) {
  const paths = ((tree && tree.tree) || []).filter(function (f) { return f.type === 'blob' && RPDigest.isSelectable(f); }).map(function (f) { return f.path; });
  return filterPathsByGoal(paths, goal);
};

/* ---------- signature extraction (strip bodies, keep decls) ---------- */
RPDigest.extractSignatures = function (src, ext) {
  const keepExt = ['js', 'ts', 'jsx', 'tsx', 'mjs', 'cjs', 'py', 'java', 'cs', 'go', 'rs', 'rb', 'php', 'c', 'h', 'cpp', 'hpp', 'kt', 'swift', 'dart', 'lua', 'scala'];
  if (!keepExt.includes(ext)) return src;
  const lines = src.split('\n');
  const out = []; let skipDepth = 0, blockComment = false;
  const isPy = ext === 'py';
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i], trimmed = line.trim();
    if (blockComment) {
      out.push(line);
      if (trimmed.includes('*/')) blockComment = false;
      continue;
    }
    if (trimmed.startsWith('/*')) {
      out.push(line);
      if (!trimmed.includes('*/')) blockComment = true;
      continue;
    }
    if (trimmed.startsWith('#') || trimmed.startsWith('//')) { out.push(line); continue }
    if (isPy) {
      if (/(async\s+)?def\s|@/.test(line)) {
        out.push(line);
        const indent = line.match(/^\s*/)[0];
        let j = i + 1;
        while (j < lines.length && !lines[j].trim()) j++;
        if (j < lines.length && (lines[j].startsWith(indent + '  ') || lines[j].startsWith(indent + '\t') || (indent === '' && /^\s/.test(lines[j])))) {
          i = j - 1; out.push(indent + '    …');
        }
        continue;
      }
      out.push(line); continue;
    }
    if (skipDepth > 0) {
      for (const ch of line) {
        if (ch === '{') skipDepth++;
        else if (ch === '}') skipDepth--;
      }
      if (skipDepth <= 0) { skipDepth = 0; out.push((line.match(/^\s*/) || [''])[0] + '}') }
      continue;
    }
    const open = (line.match(/\{/g) || []).length, close = (line.match(/\}/g) || []).length;
    const isDecl = /\b(class|function|fn|func|interface|struct|impl|enum|extension)\b/.test(line) || /^\s*(export\s+)?(default\s+)?(async\s+)?[A-Za-z_$][\w$]*\s*\([^;{}]*\)\s*\{?\s*$/.test(line);
    if (isDecl) {
      out.push(line);
      if (open > close) { skipDepth = open - close; out.push((line.match(/^\s*/) || [''])[0] + '  …') }
      continue;
    }
    if (/^(import|export\s+default|package|using|namespace|mod|use|from|@)/.test(trimmed) || trimmed === '') {
      out.push(line); continue;
    }
    if (/^\s*(public|private|protected|static|final|abstract|override|async|const|let|var|type)/.test(line) && /[(;=]/.test(line) && trimmed.length < 200) { out.push(line); continue }
  }
  const dedup = [];
  for (const l of out) {
    if (dedup.length > 1 && dedup[dedup.length - 1] === '  …' && l === '  …') continue;
    dedup.push(l);
  }
  return dedup.join('\n').replace(/\n{3,}/g, '\n\n');
};

/* ---------- format builders ---------- */
RPDigest.buildHeader = function (m, branch, partLabel, task, format, treeStr) {
  if (format === 'xml') {
    return ['# Repository Context', '<repository name="' + esc(m && m.full_name) + '" branch="' + esc(branch) + '">',
      '  <meta>',
      '    <description>' + esc(m && m.description) + '</description>',
      '    <language>' + esc(m && m.language) + '</language>',
      '    <stars>' + fmt(m && m.stargazers_count) + '</stars>', '    <forks>' + fmt(m && m.forks_count) + '</forks>',
      '    <license>' + (m && m.license ? esc(m.license.spdx_id) : 'none') + '</license>',
      '    <generated>' + new Date().toISOString().slice(0, 10) + '</generated>',
      '  </meta>',
      '  <task>' + esc(task) + '</task>',
      partLabel ? '  <part>' + esc(partLabel) + '</part>' : ''].filter(Boolean).join('\n');
  }
  if (format === 'repomix') {
    return ['This file is a merged representation of the entire codebase, combined into a single document by Repodest / Repomix format.',
      '<file_summary>',
      'This section contains a summary of this file.',
      '<purpose>',
      'This file contains a packed representation of the entire repository\'s contents.',
      'It is designed to be easily consumable by AI systems for analysis, code review, or other automated processes.',
      '</purpose>',
      '<file_format>',
      'The content is organized as follows:',
      '1. Repository overview and instruction',
      '2. Directory structure',
      '3. Repository files (enclosed in <file> tags)',
      '</file_format>',
      '</file_summary>',
      '<repository_instruction>',
      task,
      '</repository_instruction>',
      '<repository_files>'].join('\n');
  }
  if (format === 'llmstxt') {
    return ['# ' + (m && m.full_name || 'Repository'),
      '',
      '> ' + (m && m.description || 'Repository overview and documentation context for LLMs'),
      '',
      '## Overview',
      '- Source: ' + (m && m.html_url || ''),
      '- Language: ' + (m && m.language || 'N/A'),
      '- Stars: ' + fmt(m && m.stargazers_count) + ' · Forks: ' + fmt(m && m.forks_count) + ' · License: ' + (m && m.license ? m.license.spdx_id : 'none'),
      partLabel ? '- ' + partLabel : '',
      '',
      '## Prompt Instructions',
      task,
      '',
      '## Files'].join('\n');
  }
  if (format === 'json') {
    const head = ['{', '  "repository": ' + JSON.stringify(m && m.full_name) + ',', '  "branch": ' + JSON.stringify(branch) + ',',
      '  "meta": ' + JSON.stringify({ description: m && m.description, primary_language: m && m.language, stars: m && m.stargazers_count, forks: m && m.forks_count, license: m && m.license ? m.license.spdx_id : null, generated: new Date().toISOString().slice(0, 10), part: partLabel || null }) + ',',
      '  "task": ' + JSON.stringify(task) + ','];
    if (treeStr != null) head.push('  "file_tree": ' + JSON.stringify(treeStr) + ',');
    head.push('  "files": [');
    return head.join('\n');
  }
  return ['# Repository Context: ' + (m && m.full_name),
    'Source: ' + (m && m.html_url), 'Branch: ' + branch,
    'Description: ' + (m && m.description || 'N/A'), 'Primary language: ' + (m && m.language || 'N/A'),
    'Stars: ' + fmt(m && m.stargazers_count) + ' · Forks: ' + fmt(m && m.forks_count) + ' · License: ' + (m && m.license ? m.license.spdx_id : 'none'),
    'Generated by Repodest on ' + new Date().toISOString().slice(0, 10),
    partLabel ? 'Part: ' + partLabel : '',
    '', '## Task', '' + task].filter(function (l) { return l !== ''; }).join('\n');
};

RPDigest.wrapFile = function (p, ext, content, format) {
  if (format === 'xml') return '  <file path="' + esc(p) + '">\n<![CDATA[\n' + String(content).replace(/\]\]>/g, ']]]]><![CDATA[>') + '\n]]>\n  </file>';
  if (format === 'repomix') return '<file path="' + esc(p) + '">\n' + content + '\n</file>';
  if (format === 'llmstxt') return '\n### ' + p + '\n\n```' + ext + '\n' + content + '\n```';
  if (format === 'json') return '    ' + JSON.stringify({ path: p, content: content }) + ',';
  return '\n# File: ' + p + '\n\n````' + ext + '\n' + content + '\n````';
};

RPDigest.finalizeFooter = function (parts, format) {
  if (format === 'xml') parts.push('</repository>');
  else if (format === 'repomix') parts.push('</repository_files>');
  else if (format === 'llmstxt') parts.push('\n---\nEnd of llms.txt repository documentation.');
  else if (format === 'json') {
    let s = parts.join('\n');
    if (s.endsWith(',')) s = s.slice(0, -1);
    parts.length = 0;
    parts.push(s, '\n  ]\n}');
    return;
  }
  parts.push('\n---\nEnd of repository digest. Use this context to answer questions about the codebase.');
};

/* ---------- pack sections into context-sized parts ---------- */
RPDigest.pack = function (opts) {
  const m = opts.meta, branch = opts.branch, paths = opts.paths || [];
  const readmeSection = opts.readmeSection || null;
  const sections = opts.sections || [];
  const format = opts.format || 'md';
  const includeTree = opts.includeTree !== false;
  const budget = RPDigest.tokenBudget(opts.model);

  const groups = [];
  let cur = [], curBytes = 0;
  const estBytes = function (sec) { return sec.content.length + sec.path.length + 40; };
  if (readmeSection) { cur.push(readmeSection); curBytes += estBytes(readmeSection); }
  for (const sec of sections) {
    if (cur.length && curBytes + estBytes(sec) > budget * 0.6) { groups.push(cur); cur = []; curBytes = 0; }
    cur.push(sec); curBytes += estBytes(sec);
  }
  if (cur.length) groups.push(cur);
  if (!groups.length) groups.push([]);

  const out = [];
  groups.forEach(function (group, gi) {
    const parts = [];
    const label = group.length + ' of ' + paths.length + ' files (part ' + (gi + 1) + '/' + groups.length + ')';
    const treeStr = includeTree ? asciiTree(group.map(function (s) { return s.path; })) : null;
    parts.push(RPDigest.buildHeader(m, branch, label, opts.task, format, treeStr));
    if (includeTree) {
      if (format === 'xml') parts.push('  <file_tree>\n' + treeStr.split('&').join('&amp;').split('<').join('&lt;') + '\n  </file_tree>');
      else if (format === 'repomix') parts.push('<directory_structure>\n' + treeStr + '\n</directory_structure>');
      else if (format === 'llmstxt') parts.push('\n## File Tree\n\n```text\n' + treeStr + '\n```');
      else if (format !== 'json') parts.push('\n# File Tree\n\n```text\n' + treeStr + '\n```');
    }
    group.forEach(function (sec) { parts.push(RPDigest.wrapFile(sec.path, sec.ext, sec.content, format)); });
    if (gi === groups.length - 1 && opts.skipped && format !== 'json') {
      parts.push((format === 'xml' || format === 'repomix')
        ? '  <!-- ' + opts.skipped + ' files skipped: ' + opts.binSkipped + ' binary, ' + (opts.skipped - opts.binSkipped) + ' too large -->'
        : '\n(' + opts.skipped + ' files skipped: ' + opts.binSkipped + ' binary, ' + (opts.skipped - opts.binSkipped) + ' too large or unfetchable' + (opts.sigShrunk ? ', ' + opts.sigShrunk + ' shrunk to signatures' : '') + ')');
    }
    RPDigest.finalizeFooter(parts, format);
    out.push(parts.join('\n'));
  });
  return out;
};

/* ---------- main digest flow (chunked-parallel fetch) ---------- */
RPDigest.generate = async function (state, opts, onProgress, fetchRaw) {
  const m = state.meta, branch = state.branch || (m && m.default_branch) || 'main';
  const sel = Array.from(state.sel || []).sort();
  if (!sel.length) return { error: 'NO_SELECTION' };
  fetchRaw = fetchRaw || RPApi.raw;

  const fileMap = {};
  (((state.tree && state.tree.tree) || [])).forEach(function (f) { fileMap[f.path] = f; });
  let bytes = 0;
  sel.forEach(function (p) { const f = fileMap[p]; if (f) bytes += f.size || 0; });
  if (bytes > 3 * 1024 * 1024) return { error: 'TOO_BIG' };

  const task = RPDigest.taskFor(opts.preset, opts.customTask);
  const sections = [];
  const smells = RPDigest.smellNew();
  let skipped = 0, binSkipped = 0, sigShrunk = 0, fetched = 0;

  /* README section */
  let readmeSection = null;
  if (opts.readme) {
    const paths = Object.keys(fileMap);
    const readme = paths.find(function (p) { return /(^|\/)readme\.md$/i.test(p); }) ||
      paths.find(function (p) { return /(^|\/)readme/i.test(p); });
    if (readme) {
      const t = await fetchRaw(m.full_name, branch, readme);
      if (t) readmeSection = { path: readme, ext: extOf(readme), content: t.slice(0, 20000) };
    }
  }

  /* chunked-parallel fetch of selected files */
  const CHUNK = 8;
  for (let i = 0; i < sel.length; i += CHUNK) {
    const chunk = sel.slice(i, i + CHUNK);
    const results = await Promise.all(chunk.map(async function (p) {
      const f = fileMap[p];
      if (!f) return { p: p, skip: 'nofile' };
      const ext = extOf(p);
      if (BINARY_EXT.has(ext)) return { p: p, skip: 'binary' };
      if ((f.size || 0) > 200 * 1024) return { p: p, skip: 'large' };
      if (!isText(f)) return { p: p, skip: 'binary' };
      const t = await fetchRaw(m.full_name, branch, p);
      if (t == null) return { p: p, skip: 'fetch' };
      if (t.includes('\0') || /[\u0000-\b\u000e-\u001f]{5,}/.test(t)) return { p: p, skip: 'binary' };
      RPDigest.smellAdd(smells, p, t); /* scan raw text: the shrinker removes TODO comments */
      let content = t;
      if (opts.shrink) content = stripCommentsAndWhitespace(content, ext);
      if (opts.sigonly && (f.size || 0) > 10 * 1024) {
        const shrunk = RPDigest.extractSignatures(content, ext);
        if (shrunk.length < content.length) { content = shrunk; sigShrunk++; }
      }
      return { p: p, section: { path: p, ext: ext, content: content } };
    }));
    results.forEach(function (r) {
      if (r.section) sections.push(r.section);
      else { skipped++; if (r.skip === 'binary') binSkipped++; }
    });
    fetched = Math.min(i + CHUNK, sel.length);
    if (onProgress) onProgress(fetched, sel.length);
  }

  const parts = RPDigest.pack({
    meta: m, branch: branch, paths: sel, readmeSection: readmeSection,
    sections: sections, skipped: skipped, binSkipped: binSkipped, sigShrunk: sigShrunk,
    format: opts.format, model: opts.model, task: task, includeTree: opts.tree !== false
  });
  return { parts: parts, stats: { fetched: sections.length, skipped: skipped, binSkipped: binSkipped, sigShrunk: sigShrunk }, sections: sections, smells: RPDigest.smellFinalize(smells) };
};

/* ---------- code smell scan (runs on the fetched digest sections) ---------- */
RPDigest.SMELL_JS = ['js', 'ts', 'jsx', 'tsx', 'mjs', 'cjs', 'vue', 'svelte', 'astro'];
RPDigest.SMELL_RULES = [
  { id: 'todo', re: /\b(TODO|FIXME|HACK|XXX)\b/g, label: 'TODO / FIXME / HACK' },
  { id: 'console', re: /\bconsole\.(log|debug|info|warn)\s*\(/g, label: 'console logging', exts: RPDigest.SMELL_JS },
  { id: 'debugger', re: /^\s*debugger\s*;?\s*$/gm, label: 'debugger statement' },
  { id: 'var', re: /\bvar\s+[A-Za-z_$]/g, label: 'var usage', exts: RPDigest.SMELL_JS },
  { id: 'looseeq', re: /[^=!<>]==[^=]/g, label: 'loose equality (==)', exts: RPDigest.SMELL_JS },
  { id: 'eval', re: /\beval\s*\(/g, label: 'eval()', exts: RPDigest.SMELL_JS },
  { id: 'bareexcept', re: /\bexcept\s*:/g, label: 'bare except', exts: ['py'] },
  { id: 'wildcard', re: /\bfrom\s+[\w.]+\s+import\s+\*/g, label: 'wildcard import', exts: ['py'] },
  { id: 'hardcodedip', re: /['"]\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}['"]/g, label: 'hardcoded IP' }
];
RPDigest.smellNew = function () { return { total: 0, lines: 0, byRule: {}, files: [] }; };
/* Accumulate smells from raw file text (before the token shrinker runs). */
RPDigest.smellAdd = function (acc, path, content, extHint) {
  const ext = (extHint || extOf(path || '') || '').toLowerCase();
  let count = 0;
  RPDigest.SMELL_RULES.forEach(function (rule) {
    if (rule.exts && rule.exts.indexOf(ext) === -1) return;
    rule.re.lastIndex = 0;
    const n = (String(content || '').match(rule.re) || []).length;
    if (n) { acc.byRule[rule.label] = (acc.byRule[rule.label] || 0) + n; count += n; }
  });
  const fileLines = String(content || '').split('\n').length;
  acc.lines += fileLines;
  acc.total += count;
  if (count) acc.files.push({ path: path, count: count, lines: fileLines });
  return acc;
};
RPDigest.smellFinalize = function (acc) {
  const files = acc.files.slice().sort(function (a, b) { return b.count - a.count; });
  return { total: acc.total, perKloc: acc.lines ? Math.round(acc.total / (acc.lines / 1000) * 10) / 10 : 0, byRule: acc.byRule, files: files, lines: acc.lines, clean: acc.total === 0 };
};
RPDigest.smellScan = function (sections) {
  const acc = RPDigest.smellNew();
  (sections || []).forEach(function (sec) { RPDigest.smellAdd(acc, sec.path || '', sec.content || '', sec.ext); });
  return RPDigest.smellFinalize(acc);
};
