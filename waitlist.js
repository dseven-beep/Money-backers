const fs=require('fs'),path=require('path'),crypto=require('crypto'),{Pool}=require('pg');
const FILE=process.env.WAITLIST_FILE||path.join(__dirname,'data','waitlist.json');
const EMAIL=/^[^\s@]{1,64}@[^\s@]+\.[a-z]{2,}$/i;
let pool,schemaReady;

function databaseUrl(){
  let url=String(process.env.DATABASE_URL||'').trim();
  if((url.startsWith('"')&&url.endsWith('"'))||(url.startsWith("'")&&url.endsWith("'")))url=url.slice(1,-1).trim();
  return url;
}
function useDatabase(){return databaseUrl().length>0}
function getPool(){
  if(!pool){
    const connectionString=databaseUrl();
    const config={connectionString,max:5,idleTimeoutMillis:20000,connectionTimeoutMillis:20000};
    // Neon connection strings include channel_binding=require. pg honors that as SCRAM channel binding when offered.
    if(/channel_binding=require/i.test(connectionString))config.enableChannelBinding=true;
    pool=new Pool(config);
    pool.on('error',err=>console.error('waitlist database pool error',err));
  }
  return pool;
}
function ensure(){
  if(!useDatabase())return Promise.resolve();
  if(!schemaReady){
    schemaReady=(async()=>{
      const db=getPool();
      await db.query(`CREATE TABLE IF NOT EXISTS waitlist (
        email TEXT PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        ref TEXT,
        "at" TIMESTAMPTZ NOT NULL
      )`);
      await db.query('CREATE INDEX IF NOT EXISTS waitlist_ref_idx ON waitlist (ref)');
    })().catch(err=>{schemaReady=null;throw err});
  }
  return schemaReady;
}
function init(){return ensure()}

function loadJson(){try{return JSON.parse(fs.readFileSync(FILE,'utf8'))}catch{return []}}
function save(l){fs.mkdirSync(path.dirname(FILE),{recursive:true});const t=FILE+'.tmp';fs.writeFileSync(t,JSON.stringify(l,null,2));fs.renameSync(t,FILE);}
function code(){return crypto.randomBytes(4).toString('hex')}
function joinJson(email,ref){
  email=String(email||'').trim().toLowerCase();
  if(email.length>254||!EMAIL.test(email))return{status:400,body:{error:'Please enter a valid email address.'}};
  const l=loadJson();const ex=l.find(x=>x.email===email);
  if(ex)return{status:200,body:{ok:true,already:true}}; // never reveal code to someone who only knows the email
  ref=/^[a-f0-9]{8}$/.test(ref||'')&&l.some(x=>x.code===ref)?ref:null;
  let c;do c=code();while(l.some(x=>x.code===c));
  l.push({email,code:c,ref,at:new Date().toISOString()});save(l);
  return{status:201,body:{ok:true,already:false,code:c,referrals:0}};
}
function removeJson(email,c){
  email=String(email||'').trim().toLowerCase();c=String(c||'').trim().toLowerCase();
  if(!email||!/^[a-f0-9]{8}$/.test(c))return{status:400,body:{error:'Email and your 8-character code are required.'}};
  const l=loadJson();const i=l.findIndex(x=>x.email===email&&x.code===c);
  if(i<0)return{status:404,body:{error:'No signup matches that email and code.'}};
  l.splice(i,1);save(l);return{status:200,body:{ok:true,removed:true}};
}

function rowAt(v){return v instanceof Date?v.toISOString():v}
async function loadPg(){
  await ensure();
  const result=await getPool().query('SELECT email, code, ref, "at" FROM waitlist ORDER BY "at" ASC, email ASC');
  return result.rows.map(row=>({email:row.email,code:row.code,ref:row.ref,at:rowAt(row.at)}));
}
async function joinPg(email,ref){
  email=String(email||'').trim().toLowerCase();
  if(email.length>254||!EMAIL.test(email))return{status:400,body:{error:'Please enter a valid email address.'}};
  await ensure();
  const client=await getPool().connect();
  try{
    await client.query('BEGIN');
    const existing=await client.query('SELECT 1 FROM waitlist WHERE email=$1',[email]);
    if(existing.rowCount){await client.query('COMMIT');return{status:200,body:{ok:true,already:true}};}
    let referrer=null;
    if(/^[a-f0-9]{8}$/.test(ref||'')){
      const hit=await client.query('SELECT 1 FROM waitlist WHERE code=$1 FOR SHARE',[ref]);
      if(hit.rowCount)referrer=ref;
    }
    let assigned;
    for(let attempt=0;attempt<8;attempt++){
      const next=code();
      await client.query('SAVEPOINT signup');
      try{
        await client.query('INSERT INTO waitlist (email, code, ref, "at") VALUES ($1,$2,$3,$4)',[email,next,referrer,new Date().toISOString()]);
        await client.query('RELEASE SAVEPOINT signup');
        assigned=next;
        break;
      }catch(err){
        await client.query('ROLLBACK TO SAVEPOINT signup');
        if(err.code!=='23505')throw err;
        if(err.constraint==='waitlist_pkey'){await client.query('ROLLBACK');return{status:200,body:{ok:true,already:true}};}
      }
    }
    if(!assigned)throw new Error('Could not allocate a unique referral code');
    const counted=await client.query('SELECT COUNT(*)::int AS n FROM waitlist WHERE ref=$1',[assigned]);
    await client.query('COMMIT');
    return{status:201,body:{ok:true,already:false,code:assigned,referrals:Number(counted.rows[0].n)||0}};
  }catch(err){
    try{await client.query('ROLLBACK')}catch(_){}
    throw err;
  }finally{client.release()}
}
async function removePg(email,c){
  email=String(email||'').trim().toLowerCase();c=String(c||'').trim().toLowerCase();
  if(!email||!/^[a-f0-9]{8}$/.test(c))return{status:400,body:{error:'Email and your 8-character code are required.'}};
  await ensure();
  const result=await getPool().query('DELETE FROM waitlist WHERE email=$1 AND code=$2',[email,c]);
  if(!result.rowCount)return{status:404,body:{error:'No signup matches that email and code.'}};
  return{status:200,body:{ok:true,removed:true}};
}

function load(){return useDatabase()?loadPg():loadJson()}
function join(email,ref){return useDatabase()?joinPg(email,ref):joinJson(email,ref)}
function remove(email,c){return useDatabase()?removePg(email,c):removeJson(email,c)}
module.exports={join,remove,load,init,FILE};
