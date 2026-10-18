const fs=require('fs'),{parseReceipt}=require('./parser');for(const f of fs.readdirSync('samples')){const p=parseReceipt(fs.readFileSync('samples/'+f,'utf8'));console.log(f.padEnd(12),p.merchant.padEnd(10),p.date,'total',p.total,'items',p.items.length,'sub',p.isSubscription,'deadline',p.returnDeadline);}

// waitlist tests
const os=require('os'),path=require('path'),assert=require('assert');process.env.WAITLIST_FILE=path.join(os.tmpdir(),'wl-test-'+Date.now()+'.json');
const wl=require('./waitlist');
assert.equal(wl.join('bad').status,400);assert.equal(wl.join('').status,400);
const a=wl.join(' A@Example.com ');assert.equal(a.status,201);
const b=wl.join('a@example.com');assert.equal(b.body.already,true);assert.equal(b.body.code,undefined);
const c=wl.join('c@example.com',a.body.code);assert.equal(c.status,201);
assert.equal(wl.load().filter(x=>x.ref===a.body.code).length,1);
assert.equal(wl.join('d@example.com','zzz').status,201);assert.equal(wl.load().find(x=>x.email==='d@example.com').ref,null);
assert.equal(wl.load().length,3);
assert.equal(wl.remove('a@example.com','').status,400);assert.equal(wl.remove('a@example.com','00000000').status,404);
assert.equal(wl.remove('c@example.com',a.body.code).status,404);
assert.equal(wl.remove(' A@example.com ',a.body.code).status,200);assert.equal(wl.load().length,2);assert.equal(wl.remove('a@example.com',a.body.code).status,404);fs.unlinkSync(process.env.WAITLIST_FILE);console.log('waitlist tests passed');
