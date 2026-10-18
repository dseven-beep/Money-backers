const fs=require('fs'),path=require('path'),crypto=require('crypto');
const FILE=process.env.WAITLIST_FILE||path.join(__dirname,'data','waitlist.json');
const EMAIL=/^[^\s@]{1,64}@[^\s@]+\.[a-z]{2,}$/i;
function load(){try{return JSON.parse(fs.readFileSync(FILE,'utf8'))}catch{return []}}
function save(l){fs.mkdirSync(path.dirname(FILE),{recursive:true});const t=FILE+'.tmp';fs.writeFileSync(t,JSON.stringify(l,null,2));fs.renameSync(t,FILE);}
function code(){return crypto.randomBytes(4).toString('hex')}
function join(email,ref){
  email=String(email||'').trim().toLowerCase();
  if(email.length>254||!EMAIL.test(email))return{status:400,body:{error:'Please enter a valid email address.'}};
  const l=load();const ex=l.find(x=>x.email===email);
  if(ex)return{status:200,body:{ok:true,already:true}}; // never reveal code to someone who only knows the email
  ref=/^[a-f0-9]{8}$/.test(ref||'')&&l.some(x=>x.code===ref)?ref:null;
  let c;do c=code();while(l.some(x=>x.code===c));
  l.push({email,code:c,ref,at:new Date().toISOString()});save(l);
  return{status:201,body:{ok:true,already:false,code:c,referrals:0}};
}
function remove(email,c){
  email=String(email||'').trim().toLowerCase();c=String(c||'').trim().toLowerCase();
  if(!email||!/^[a-f0-9]{8}$/.test(c))return{status:400,body:{error:'Email and your 8-character code are required.'}};
  const l=load();const i=l.findIndex(x=>x.email===email&&x.code===c);
  if(i<0)return{status:404,body:{error:'No signup matches that email and code.'}};
  l.splice(i,1);save(l);return{status:200,body:{ok:true,removed:true}};
}
module.exports={join,remove,load,FILE};
