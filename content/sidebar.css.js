'use strict';
/* ============================================================
   Repodest Extension — sidebar styles (injected into Shadow DOM)
   Exposes: RP_CSS
   ============================================================ */
const RP_CSS = `
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

.rp-root {
  --bg: #0d1117; --bg2: #161b22; --bg3: #21262d;
  --card: rgba(22, 27, 34, .92); --solid: #161b22;
  --line: #30363d; --line2: #3d444d;
  --text: #e6edf3; --text2: #9198a1; --text3: #6e7681;
  --accent: #a855f7; --accent2: #22d3ee;
  --green: #22c55e; --yellow: #eab308; --orange: #f97316; --red: #ef4444;
  --shadow: 0 8px 32px rgba(0,0,0,.45);
  --radius: 12px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Vazirmatn', 'Tahoma', sans-serif;
  font-size: 13px; line-height: 1.45;
  color: var(--text);
  -webkit-font-smoothing: antialiased;
}
.rp-root[data-theme="light"] {
  --bg: #ffffff; --bg2: #f6f8fa; --bg3: #eff2f5;
  --card: rgba(255,255,255,.96); --solid: #ffffff;
  --line: #d0d7de; --line2: #afb8c1;
  --text: #1f2328; --text2: #59636e; --text3: #818b98;
  --shadow: 0 8px 32px rgba(140,149,159,.25);
}
.rp-root { position: static; }
.mono { font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace; }

/* ---------- floating action button ---------- */
.rp-fab {
  position: fixed; left: 0; top: 50%; transform: translateY(-50%);
  z-index: 2147483000;
  width: 30px; height: 64px;
  border: 1px solid var(--line); border-left: none;
  border-radius: 0 10px 10px 0;
  background: var(--card); backdrop-filter: blur(8px);
  color: var(--accent); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: var(--shadow);
  transition: width .15s ease;
}
.rp-fab:hover { width: 38px; background: var(--solid); }
.rp-fab svg { width: 16px; height: 16px; }
[dir="rtl"] .rp-fab { left: auto; right: 0; border-radius: 10px 0 0 10px; border-left: 1px solid var(--line); border-right: none; }

/* ---------- panel ---------- */
.rp-panel {
  position: fixed; top: 0; right: 0; bottom: 0;
  z-index: 2147483001;
  width: min(460px, 100vw);
  background: var(--bg);
  border-inline-start: 1px solid var(--line);
  box-shadow: var(--shadow);
  display: flex; flex-direction: column;
  transform: translateX(100%);
  transition: transform .22s ease;
}
.rp-panel.rp-open { transform: translateX(0); }
[dir="rtl"] .rp-panel { right: auto; left: 0; transform: translateX(-100%); border-inline-start: none; border-inline-end: 1px solid var(--line); }
[dir="rtl"] .rp-panel.rp-open { transform: translateX(0); }

/* ---------- header ---------- */
.rp-head {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--line);
  background: var(--bg2);
}
.rp-brand { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 14px; min-width: 0; flex: 1; }
.rp-brand .rp-logo { width: 22px; height: 22px; flex: none; color: var(--accent); }
.rp-brand .rp-reponame { font-weight: 500; font-size: 12px; color: var(--text2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; direction: ltr; }
.rp-iconbtn {
  width: 28px; height: 28px; flex: none;
  border: 1px solid var(--line); border-radius: 8px;
  background: var(--bg3); color: var(--text2);
  cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
}
.rp-iconbtn:hover { color: var(--text); border-color: var(--line2); }
.rp-iconbtn svg { width: 14px; height: 14px; }

/* ---------- score strip ---------- */
.rp-scorebar {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; border-bottom: 1px solid var(--line);
}
.rp-ring { width: 64px; height: 64px; flex: none; position: relative; }
.rp-ring svg { transform: rotate(-90deg); }
.rp-ring .rp-ringnum {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-size: 17px; font-weight: 800;
}
.rp-scoremeta { flex: 1; min-width: 0; }
.rp-verdict { font-weight: 700; font-size: 14px; }
.rp-scoresub { color: var(--text2); font-size: 11.5px; margin-top: 2px; display: flex; gap: 8px; flex-wrap: wrap; }
.rp-chip {
  display: inline-flex; align-items: center; gap: 4px;
  font-size: 10.5px; padding: 2px 7px; border-radius: 20px;
  border: 1px solid var(--line); color: var(--text2); background: var(--bg2);
}
.rp-chip .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); }

/* ---------- tabs ---------- */
.rp-tabs { display: flex; border-bottom: 1px solid var(--line); background: var(--bg2); }
.rp-tab {
  flex: 1; padding: 9px 4px; text-align: center;
  font-size: 12.5px; font-weight: 600; color: var(--text2);
  background: none; border: none; border-bottom: 2px solid transparent;
  cursor: pointer;
}
.rp-tab:hover { color: var(--text); }
.rp-tab.rp-active { color: var(--accent); border-bottom-color: var(--accent); }

/* ---------- body ---------- */
.rp-body { flex: 1; overflow-y: auto; padding: 14px; scrollbar-width: thin; }
.rp-body::-webkit-scrollbar { width: 8px; }
.rp-body::-webkit-scrollbar-thumb { background: var(--line); border-radius: 4px; }
.rp-empty { color: var(--text2); text-align: center; padding: 40px 20px; font-size: 13px; }
.rp-spin {
  width: 26px; height: 26px; margin: 40px auto 10px; display: block;
  border: 3px solid var(--line); border-top-color: var(--accent);
  border-radius: 50%; animation: rpspin .8s linear infinite;
}
@keyframes rpspin { to { transform: rotate(360deg); } }

.rp-err { border: 1px solid var(--red); background: rgba(239,68,68,.08); border-radius: var(--radius); padding: 12px; font-size: 12.5px; }
.rp-err b { display: block; margin-bottom: 4px; color: var(--red); }
.rp-err .rp-btn { margin-top: 8px; }

/* ---------- buttons & inputs ---------- */
.rp-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  padding: 7px 14px; border-radius: 9px; border: 1px solid var(--line2);
  background: var(--accent); color: #fff; font-weight: 700; font-size: 12.5px;
  cursor: pointer;
}
.rp-btn:hover { filter: brightness(1.1); }
.rp-btn:disabled { opacity: .5; cursor: default; }
.rp-btn.rp-ghost { background: var(--bg3); color: var(--text); border-color: var(--line); font-weight: 600; }
.rp-btn.rp-ghost:hover { border-color: var(--line2); filter: none; }
.rp-btn.rp-sm { padding: 4px 10px; font-size: 11.5px; border-radius: 7px; }

.rp-select, .rp-input, .rp-textarea {
  width: 100%; padding: 6px 9px;
  background: var(--bg2); color: var(--text);
  border: 1px solid var(--line); border-radius: 8px;
  font-size: 12.5px; font-family: inherit;
}
.rp-select:focus, .rp-input:focus, .rp-textarea:focus { outline: 2px solid var(--accent); outline-offset: -1px; }
.rp-textarea { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 11.5px; resize: vertical; }

.rp-label { display: block; font-size: 11px; font-weight: 700; color: var(--text2); text-transform: uppercase; letter-spacing: .4px; margin: 10px 0 5px; }

/* ---------- sections ---------- */
.rp-sec { margin-bottom: 16px; }
.rp-sec-title { font-size: 12px; font-weight: 700; color: var(--text2); margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
.rp-sec-title::before { content: ''; width: 3px; height: 12px; border-radius: 2px; background: var(--accent); }

.rp-checks { display: grid; grid-template-columns: 1fr 1fr; gap: 5px; }
.rp-check {
  display: flex; align-items: center; gap: 6px;
  font-size: 11.5px; padding: 5px 8px;
  background: var(--bg2); border: 1px solid var(--line); border-radius: 8px;
}
.rp-check .rp-ico { flex: none; font-weight: 800; }
.rp-check.ok .rp-ico { color: var(--green); }
.rp-check.bad .rp-ico { color: var(--red); }
.rp-check.bad { opacity: .75; }
.rp-check .rp-w { margin-inline-start: auto; color: var(--text3); font-size: 10px; }

.rp-facts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
.rp-fact { background: var(--bg2); border: 1px solid var(--line); border-radius: 9px; padding: 7px 9px; }
.rp-fact .v { font-weight: 800; font-size: 13.5px; }
.rp-fact .k { color: var(--text3); font-size: 10px; margin-top: 1px; }

.rp-langbar { display: flex; height: 10px; border-radius: 5px; overflow: hidden; border: 1px solid var(--line); margin-bottom: 8px; }
.rp-langbar i { height: 100%; }
.rp-langrow { display: flex; align-items: center; gap: 8px; padding: 3px 0; font-size: 12px; }
.rp-langrow .swatch { width: 9px; height: 9px; border-radius: 3px; flex: none; }
.rp-langrow .nm { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rp-langrow .pc { color: var(--text2); font-size: 11px; direction: ltr; }

.rp-topics { display: flex; flex-wrap: wrap; gap: 5px; }
.rp-topic { font-size: 10.5px; padding: 2px 9px; border-radius: 20px; background: rgba(168,85,247,.12); color: var(--accent); border: 1px solid rgba(168,85,247,.3); }

/* ---------- digest controls ---------- */
.rp-row { display: flex; gap: 7px; }
.rp-row > * { flex: 1; min-width: 0; }
.rp-goalrow { display: flex; flex-wrap: wrap; gap: 5px; }
.rp-goal {
  font-size: 11px; padding: 4px 10px; border-radius: 20px;
  border: 1px solid var(--line); background: var(--bg2); color: var(--text2);
  cursor: pointer; font-weight: 600;
}
.rp-goal:hover { border-color: var(--accent); color: var(--accent); }

.rp-opts { display: grid; gap: 5px; }
.rp-opt { display: flex; align-items: center; gap: 7px; font-size: 12px; color: var(--text2); cursor: pointer; }
.rp-opt input { accent-color: var(--accent); width: 14px; height: 14px; }

/* ---------- file tree ---------- */
.rp-treebox {
  border: 1px solid var(--line); border-radius: var(--radius);
  background: var(--bg2); overflow: hidden; display: flex; flex-direction: column;
}
.rp-treehead { display: flex; align-items: center; gap: 6px; padding: 8px; border-bottom: 1px solid var(--line); }
.rp-treehead .rp-input { padding: 4px 8px; font-size: 11.5px; }
.rp-treehead .rp-btn { flex: none; }
.rp-tree { max-height: 300px; overflow: auto; padding: 5px 4px; scrollbar-width: thin; }
.rp-tree::-webkit-scrollbar { width: 8px; }
.rp-tree::-webkit-scrollbar-thumb { background: var(--line); border-radius: 4px; }
.rp-node { display: flex; align-items: center; gap: 5px; padding: 2px 4px; border-radius: 6px; font-size: 12px; white-space: nowrap; }
.rp-node:hover { background: var(--bg3); }
.rp-node .rp-caret { width: 14px; flex: none; cursor: pointer; color: var(--text2); font-size: 9px; text-align: center; }
.rp-node .rp-ck { accent-color: var(--accent); width: 13px; height: 13px; flex: none; margin: 0; cursor: pointer; }
.rp-node .rp-name { overflow: hidden; text-overflow: ellipsis; direction: ltr; }
.rp-node .rp-sz { color: var(--text3); font-size: 10px; margin-inline-start: auto; padding-inline-start: 8px; }
.rp-node.rp-dir .rp-name { font-weight: 600; }
.rp-more { display: block; width: 100%; padding: 6px; font-size: 11px; color: var(--accent); background: none; border: none; cursor: pointer; }

.rp-selmeta {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
  padding: 7px 10px; margin-top: 8px;
  background: var(--bg2); border: 1px solid var(--line); border-radius: 9px;
  font-size: 11.5px; color: var(--text2);
}
.rp-selmeta b { color: var(--text); }
.rp-ctxbar { height: 4px; border-radius: 2px; background: var(--line); overflow: hidden; margin-top: 5px; }
.rp-ctxbar i { display: block; height: 100%; border-radius: 2px; background: var(--green); transition: width .3s; }

.rp-out { margin-top: 10px; }
.rp-partnav { display: flex; align-items: center; gap: 8px; margin-top: 7px; font-size: 11.5px; color: var(--text2); }
.rp-partnav .rp-btn { flex: none; }
.rp-outbtns { display: flex; gap: 7px; margin-top: 7px; }

/* ---------- activity ---------- */
.rp-heat { display: flex; gap: 2px; overflow-x: auto; padding: 4px 0; scrollbar-width: thin; }
.rp-heatcol { display: flex; flex-direction: column; gap: 2px; }
.rp-cell { width: 9px; height: 9px; border-radius: 2px; background: var(--bg3); }
.rp-heatlegend { display: flex; align-items: center; gap: 4px; font-size: 10.5px; color: var(--text3); margin-top: 6px; }

.rp-contrib { display: flex; align-items: center; gap: 9px; padding: 4px 0; }
.rp-contrib img { width: 22px; height: 22px; border-radius: 50%; }
.rp-contrib .nm { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; direction: ltr; font-size: 12px; }
.rp-contrib .n { color: var(--text2); font-size: 11px; }

.rp-commit { padding: 6px 0; border-bottom: 1px solid var(--line); }
.rp-commit:last-child { border-bottom: none; }
.rp-commit .m { font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; direction: ltr; text-align: start; }
.rp-commit .d { color: var(--text3); font-size: 10.5px; margin-top: 2px; }

/* ---------- footer ---------- */
.rp-foot {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 14px; border-top: 1px solid var(--line);
  background: var(--bg2); font-size: 11px; color: var(--text3);
}
.rp-rate { display: inline-flex; align-items: center; gap: 5px; }
.rp-rate .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); }
.rp-links { margin-inline-start: auto; display: flex; align-items: center; gap: 10px; }
.rp-links a { color: var(--text2); text-decoration: none; display: inline-flex; align-items: center; gap: 3px; }
.rp-links a:hover { color: var(--accent); }
.rp-links svg { width: 12px; height: 12px; }

/* ---------- toast ---------- */
.rp-toast {
  position: fixed; bottom: 18px; left: 50%; transform: translateX(-50%);
  z-index: 2147483002;
  background: var(--solid); color: var(--text);
  border: 1px solid var(--line2); border-radius: 10px;
  padding: 9px 16px; font-size: 12.5px; font-weight: 600;
  box-shadow: var(--shadow);
  opacity: 0; transition: opacity .25s; pointer-events: none;
}
.rp-toast.rp-show { opacity: 1; }
`;
