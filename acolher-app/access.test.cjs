const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(role,application){
 const calls=[],nodes=new Map();
 const element=()=>({hidden:false,dataset:{},style:{setProperty(){}},addEventListener(){},querySelector(){return element()},querySelectorAll(){return []},insertAdjacentHTML(){},replaceChildren(){},setAttribute(){},classList:{toggle(){},add(){}}});
 const document={querySelector(s){if(!nodes.has(s))nodes.set(s,element());return nodes.get(s)},querySelectorAll(){return []}};
 const sb={auth:{getUser:async()=>({data:{user:{id:'self'}}}),signOut:async()=>{}},from(table){const filters=[];const q={select(){return q},eq(k,v){filters.push([k,v]);return q},order(){return q},single(){return result()},maybeSingle(){return result()},then(a,b){return result().then(a,b)}};function result(){calls.push({table,filters});return Promise.resolve({data:table==='profiles'?(filters.some(([k])=>k==='role')?[]:{id:'self',full_name:'Test Admin',role}):table==='professional_applications'?(filters.length?application:[]):[],error:null})}return q},channel(){return {on(){return this},subscribe(){}}},removeChannel:async()=>{}};
 const context=vm.createContext({window:{sb,scrollTo(){}},document,history:{replaceState(){},pushState(){}},addEventListener(){},console,setTimeout});
 vm.runInContext(fs.readFileSync('acolher-app/app.js','utf8'),context);return {context,calls,nodes};
}
(async()=>{
 for(const status of ['pendente','aprovado','recusado']){
  const t=setup('usuario',{id:'app',full_name:'Own Professional',status});await new Promise(r=>setTimeout(r,10));
  assert(t.calls.every(c=>['profiles','professional_applications'].includes(c.table)&&c.filters.some(([k,v])=>(k==='id'||k==='user_id')&&v==='self')));
  assert.equal(vm.runInContext('view',t.context),'personal');
  vm.runInContext("changeView('professionals');openDetail('patient','other')",t.context);
  assert.equal(vm.runInContext('view',t.context),'personal');assert.equal(vm.runInContext('detail',t.context),null);
 }
 const admin=setup('admin',null);await new Promise(r=>setTimeout(r,10));assert(admin.calls.some(c=>c.table==='intake_requests'));
 vm.runInContext("changeView('personal')",admin.context);assert.match(admin.nodes.get('#content').innerHTML,/Voltar ao painel executivo/);
 vm.runInContext("changeView('home')",admin.context);assert.match(admin.nodes.get('#content').innerHTML,/Minha área profissional/);
 const patient=setup('usuario',null);await new Promise(r=>setTimeout(r,10));assert(!patient.calls.some(c=>c.table==='intake_requests'));
 assert.equal(vm.runInContext("loginEmail('leandro')",admin.context),'leandro@admin.espacoacolher.app');assert.equal(vm.runInContext("loginEmail('Doctor@Example.com')",admin.context),'doctor@example.com');
 console.log('PASS: admin combined access, professional isolation, patient denial, login formats.');
})().catch(e=>{console.error(e);process.exitCode=1});
