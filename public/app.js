const KEY='r2r_receipts';let R=JSON.parse(localStorage.getItem(KEY)||'[]');const $=id=>document.getElementById(id);
const fmt=n=>'$'+(n||0).toFixed(2);const today=()=>new Date(new Date().toISOString().slice(0,10));
const daysLeft=d=>Math.round((new Date(d)-today())/864e5);
function save(){localStorage.setItem(KEY,JSON.stringify(R));render();}
function add(p){if(!p.items.length&&!p.total){status('Couldn’t find prices in that text.');return;}p.id=Date.now()+Math.random();p.watch=!p.isSubscription;R.unshift(p);save();status('Added '+p.merchant+' — '+fmt(p.total));}
function status(s){$('status').textContent=s;}
function render(){const ret=R.filter(r=>r.returnDeadline&&daysLeft(r.returnDeadline)>=0);const retAmt=ret.reduce((s,r)=>s+r.total,0);
const subMap={};R.forEach(r=>{const k=r.merchant.toLowerCase();if(r.isSubscription||R.filter(x=>x.merchant.toLowerCase()===k).length>2&&!['amazon','target','walmart','costco'].includes(k)){(subMap[k]=subMap[k]||{name:r.merchant,amt:r.total,n:0,last:r.date}).n++;}});
const subs=Object.values(subMap);const subYr=subs.reduce((s,x)=>s+x.amt*12,0);
const watch=R.filter(r=>r.watch&&r.returnDeadline&&daysLeft(r.returnDeadline)>=0).flatMap(r=>r.items.map(i=>({...i,m:r.merchant})));
$('total').textContent=fmt(retAmt+subYr);$('sRet').textContent=fmt(retAmt);$('sSub').textContent=fmt(subYr);$('sCnt').textContent=R.length;
$('returns').innerHTML=R.filter(r=>!r.isSubscription).map(r=>{if(!r.returnDeadline)return row(r,'<span class="pill warn">No date found</span>');const d=daysLeft(r.returnDeadline);
const cls=d<0?'bad':d<=7?'warn':'ok';const lab=d<0?'Expired':d+' days left';return row(r,`<span class="pill ${cls}">${lab}</span><div class="sub">by ${r.returnDeadline}</div>`);}).join('')||'<div class="sub">No purchases yet.</div>';
$('subs').innerHTML=subs.map(s=>`<div class="item"><div><b>${esc(s.name)}</b><div class="sub">Last charge ${s.last||'?'} · ${fmt(s.amt)}/mo</div></div><div style="text-align:right"><b>${fmt(s.amt*12)}</b>/yr<div class="sub">Cancel if unused</div></div></div>`).join('')||'<div class="sub">No subscriptions detected.</div>';
$('watch').innerHTML=watch.map(i=>`<div class="item"><div>${esc(i.name)}<div class="sub">${esc(i.m)} · paid ${fmt(i.price)}</div></div><div><span class="pill warn">Coming soon</span></div></div>`).join('')||'<div class="sub">Items within return windows appear here.</div>';
document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{R=R.filter(r=>String(r.id)!==b.dataset.del);save();});}
function row(r,right){return `<div class="item"><div><b>${esc(r.merchant)}</b> <button class="x" data-del="${r.id}" title="Remove">✕</button><div class="sub">${r.date||'date?'} · ${r.items.length} item(s) · ${fmt(r.total)} · ${esc(r.policy?.note||'')}</div></div><div style="text-align:right">${right}</div></div>`;}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
$('parseBtn').onclick=()=>{const t=$('txt').value.trim();if(t){add(parseReceipt(t));$('txt').value='';}};
$('demo').onclick=async()=>{const s=await (await fetch('/api/samples')).json();s.forEach(x=>add(parseReceipt(x.text)));status('Loaded '+s.length+' demo receipts');};
$('clear').onclick=()=>{if(confirm('Delete all your receipts and data stored in this browser? This can\'t be undone.')){R=[];try{Object.keys(localStorage).filter(k=>k.startsWith('r2r_')).forEach(k=>localStorage.removeItem(k))}catch(e){}render();status('All your data was deleted from this device.');}};
$('file').onchange=async e=>{const f=e.target.files[0];if(!f)return;
if(f.type==='application/pdf'){status('Reading PDF…');const fd=new FormData();fd.append('file',f);const j=await (await fetch('/api/parse-pdf',{method:'POST',body:fd})).json();if(j.error)return status(j.error);delete j.text;add(j);}
else{status('Running OCR (first time downloads ~10MB)…');if(!window.Tesseract)await new Promise((ok,no)=>{const s=document.createElement('script');s.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';s.onload=ok;s.onerror=no;document.head.appendChild(s);});
const {data}=await Tesseract.recognize(f,'eng');$('txt').value=data.text;status('OCR done — review the text, then tap Analyze.');}e.target.value='';};
render();
