const POLICIES={amazon:{days:30,name:'Amazon'},target:{days:90,name:'Target'},walmart:{days:90,name:'Walmart'},'best buy':{days:15,name:'Best Buy'},bestbuy:{days:15,name:'Best Buy'},costco:{days:365,name:'Costco',note:'Costco: generally no fixed limit (electronics 90d)'},apple:{days:14,name:'Apple'},home_depot:{days:90,name:'Home Depot'}};
const SUBS=['netflix','spotify','hulu','disney+','disney plus','hbo','max','youtube premium','youtube tv','apple music','icloud','amazon prime','prime video','audible','adobe','microsoft 365','dropbox','chatgpt','openai','paramount+','peacock','xbox game pass','playstation plus','nytimes','new york times','duolingo','gym','planet fitness','patreon','google one','linkedin premium'];
const MONTHS={jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
function parseDate(t){let m=t.match(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/);if(m)return new Date(Date.UTC(+m[1],m[2]-1,+m[3]));
m=t.match(/\b(\d{1,2})\/(\d{1,2})\/(\d{2,4})\b/);if(m){let y=+m[3];if(y<100)y+=2000;return new Date(Date.UTC(y,m[1]-1,+m[2]));}
m=t.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/i);if(m)return new Date(Date.UTC(+m[3],MONTHS[m[1].toLowerCase()],+m[2]));
m=t.match(/\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{4})/i);if(m)return new Date(Date.UTC(+m[3],MONTHS[m[2].toLowerCase()],+m[1]));return null;}
const KNOWN=['Amazon','Target','Walmart','Best Buy','Costco','Apple','Home Depot','Netflix','Spotify','Hulu','Disney+','Adobe','Audible','Dropbox','ChatGPT','OpenAI','Peacock','Duolingo','Planet Fitness','YouTube Premium','Microsoft 365','Google One'];
function parseMerchant(t,lines){const lo=t.toLowerCase();for(const k of KNOWN)if(lo.includes(k.toLowerCase()))return k;
const f=t.match(/^from:\s*(?:"?([^"<\n]+)"?)/im);if(f)return f[1].trim();return(lines.find(l=>/[a-z]{3}/i.test(l))||'Unknown').slice(0,40);}
function parseReceipt(text){const lines=text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);const merchant=parseMerchant(text,lines);const date=parseDate(text);
const items=[];let total=null;const price=/\$?\s?(-?\d{1,5}(?:,\d{3})*\.\d{2})\s*$/;
for(const l of lines){const m=l.match(price);if(!m)continue;const amt=parseFloat(m[1].replace(/,/g,''));const label=l.replace(price,'').replace(/[\s.:$-]+$/,'').trim();
if(/\b(grand\s*)?total\b|amount\s*(paid|charged|due)|order total/i.test(label)){if(!/sub/i.test(label))total=amt;continue;}
if(/subtotal|tax|change|cash|visa|mastercard|tender|balance|discount|savings|shipping/i.test(label)||!label)continue;items.push({name:label.slice(0,60),price:amt});}
if(total==null)total=+items.reduce((s,i)=>s+i.price,0).toFixed(2);
const lo=(merchant+' '+text).toLowerCase();const subName=SUBS.find(s=>lo.includes(s));const isSub=!!subName||/subscription|renew(s|al)|monthly plan|billed monthly|membership fee/i.test(text);
const key=merchant.toLowerCase().replace(/\s+/g,'');const pol=POLICIES[merchant.toLowerCase()]||POLICIES[key]||{days:30,name:merchant,default:true};
let deadline=null;if(date&&!isSub)deadline=new Date(date.getTime()+pol.days*864e5);
return{merchant,date:date?date.toISOString().slice(0,10):null,items,total,isSubscription:isSub,subscriptionName:subName||null,
policy:isSub?null:{days:pol.days,note:pol.note||(pol.default?'Default 30-day estimate':pol.name+' standard policy')},returnDeadline:deadline?deadline.toISOString().slice(0,10):null};}
if(typeof module!=='undefined')module.exports={parseReceipt};
