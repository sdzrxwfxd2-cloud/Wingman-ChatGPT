// Shared admin page shell: tokens copied from wm-shell.css (day/white + night/black).
export const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
export const page = (title, body) => `<!doctype html><meta name=viewport content="width=device-width,initial-scale=1"><meta name=robots content=noindex><title>${esc(title)}</title>
<style>:root{--bg:#F2F3F6;--card:rgba(255,255,255,.82);--tx:#14161B;--tx2:#5E6472;--ln:rgba(20,22,27,.08);--acc:#0019C9}
@media (prefers-color-scheme:dark){:root{--bg:#07090F;--card:rgba(255,255,255,.055);--tx:#F2F3F7;--tx2:#9096A6;--ln:rgba(255,255,255,.08);--acc:#E6EEFF}}
body{font:14px Inter,-apple-system,system-ui,sans-serif;-webkit-font-smoothing:antialiased;background:var(--bg);color:var(--tx);padding:20px;max-width:900px;margin:auto}
h1{font:700 22px/1.2 Satoshi,-apple-system,sans-serif;letter-spacing:-.02em;color:var(--acc)}h2{font:700 17px/1.2 Satoshi,-apple-system,sans-serif;margin:18px 0 8px}
.c{background:var(--card);border:.5px solid var(--ln);border-radius:16px;padding:12px 16px;margin:10px 0}table{border-collapse:collapse;width:100%}td,th{border-bottom:1px solid var(--ln);padding:6px;text-align:left}th{color:var(--tx2)}
.ok{color:#1a9e4b}.bad{color:#d33}.m{color:var(--tx2)}</style><h1>${esc(title)}</h1>${body}`;
