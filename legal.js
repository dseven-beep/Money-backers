// Renders legal/*.md (simple markdown) into pages styled like the landing page. Owner note comments are stripped.
const fs=require('fs'),path=require('path');
const esc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const inline=s=>esc(s).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>').replace(/\[([^\]]+)\]\(([^)\s]+)\)/g,'<a href="$2">$1</a>');
function md(src){src=src.replace(/<!--[\s\S]*?-->/g,'');let h='',list=false;
 for(const l of src.split('\n')){const t=l.trim();
  if(/^- /.test(t)){if(!list){h+='<ul>';list=true}h+='<li>'+inline(t.slice(2))+'</li>';continue}
  if(list){h+='</ul>';list=false}
  if(!t)continue;const m=t.match(/^(#{1,3}) (.*)/);
  h+=m?`<h${m[1].length}>${inline(m[2])}</h${m[1].length}>`:'<p>'+inline(t)+'</p>';}
 return h+(list?'</ul>':'');}
function render(file,title){const body=md(fs.readFileSync(path.join(__dirname,'legal',file),'utf8'));
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title} · Money Backers</title><style>
:root{--g:#0e9f6e;--gd:#057a55;--ink:#0f172a;--mut:#64748b;--bg:#f6faf8}*{box-sizing:border-box}
body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:var(--ink);background:var(--bg);line-height:1.6}
.w{max-width:760px;margin:0 auto;padding:0 20px}nav{padding:16px 0}.logo{font-weight:800;font-size:20px;color:var(--ink);text-decoration:none}.logo span{color:var(--g)}
.doc{background:#fff;border-radius:16px;padding:24px;box-shadow:0 1px 3px #0001}h1{font-size:34px;margin:0 0 8px;letter-spacing:-.02em}h2{margin-top:32px;border-top:1px solid #eef2f7;padding-top:20px}
a{color:var(--gd)}footer{text-align:center;color:var(--mut);font-size:14px;padding:30px 0 40px}
</style></head><body><div class="w"><nav><a class="logo" href="/">Money<span>Backers</span></a></nav><div class="doc">${body}</div>
<footer>© 2026 Money Backers · <a href="/privacy">Privacy</a> · <a href="/terms">Terms</a> · <a href="/app">App</a></footer></div></body></html>`;}
module.exports={render,md};
