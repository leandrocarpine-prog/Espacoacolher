const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const context=vm.createContext({window:{}});vm.runInContext(fs.readFileSync('form-safety.js','utf8'),context);
const safety=context.window.acolherSafety;
assert.equal(safety.escape('<img src=x onerror=alert(1)>'),'&lt;img src=x onerror=alert(1)&gt;');
assert.equal(safety.destination('https://evil.example/'),'usuario.html');
assert.equal(safety.destination('//evil.example/'),'usuario.html');
assert.equal(safety.destination('triagem.html'),'triagem.html');
assert.equal(safety.storyValid('   '),false);assert.equal(safety.storyValid('Muito curto'),false);
assert.equal(safety.storyValid('Relato fictício apenas para teste do fluxo.'),true);
assert.equal(safety.storyValid('x'.repeat(2001)),false);
async function route(user,role='usuario',application=null){
 let signedOut=false;
 const db={auth:{getUser:async()=>({data:{user},error:null}),signOut:async()=>{signedOut=true}},from(table){const q={select(){return q},eq(){return q},maybeSingle:async()=>({data:table==='profiles'?{role}:application,error:null})};return q}};
 const c=vm.createContext({window:{sb:db}});vm.runInContext(fs.readFileSync('access-routing.js','utf8'),c);
 return {value:await c.window.acolherDestination('triagem.html'),signedOut};
}
(async()=>{
 assert.equal((await route(null)).value,'login.html');
 const pending=await route({id:'test'});assert.equal(pending.value,'login.html?confirmacao=1');assert.equal(pending.signedOut,true);
 assert.equal((await route({id:'test',email_confirmed_at:'2026-10-04'})).value,'triagem.html');
 assert.equal((await route({id:'test',email_confirmed_at:'2026-10-04'},'admin')).value,'acolher-app/');
 assert.equal((await route({id:'test',email_confirmed_at:'2026-10-04'},'usuario',{id:'own'})).value,'acolher-app/');
 const intake=fs.readFileSync('triagem.html','utf8');assert.match(intake,/<textarea required name="details" minlength="20" maxlength="2000"/);
 assert.match(fs.readFileSync('triagem.js','utf8'),/acolherSafety.escape\(value\)/);
 assert.match(fs.readFileSync('usuario.js','utf8'),/acolherSafety.escape\(item.reason\)/);
 console.log('PASS: unconfirmed access denied, confirmed routing, safe destinations, required story, HTML escaping.');
})().catch(e=>{console.error(e);process.exitCode=1});
