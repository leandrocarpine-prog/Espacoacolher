const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const dir=process.argv[2]||__dirname;
const read=name=>fs.readFileSync(path.join(dir,name),'utf8');
const user={id:'00000000-0000-4000-8000-000000000001',email_confirmed_at:'2026-10-14',user_metadata:{city:'Cidade fictícia',registration_for_whom:'Para mim',registration_reason:'Autoconhecimento',registration_details:'Relato fictício completo para testar o cadastro único.',privacy_accepted:true,registration_intake:{version:1,birth_date:'1990-01-04',modality:'Online',preferred_period:'Noite',preferred_days:'Segunda depois das 18h',interest:'Atendimento particular',desired_start:'Nas próximas semanas'}}};
function setup({existing=false,readError=false,insertError=null,role='usuario',professional=false}={}){
 const rows=existing?[{id:'previous'}]:[],inserted=[];
 const db={auth:{getUser:async()=>({data:{user},error:null})},from(table){return {select(){return this},eq(){return this},limit(){return this},async maybeSingle(){if(table==='profiles')return {data:{role}};if(table==='professional_applications')return {data:professional?{id:'professional'}:null};return {data:rows[0]||null,error:readError?{message:'offline'}:null}},async insert(value){if(insertError)return {error:insertError};if(rows.some(row=>row.id===value.id))return {error:{code:'23505'}};rows.push(value);inserted.push(value);return {error:null}}}}};
 const context=vm.createContext({window:{sb:db},Date,Error});
 vm.runInContext(read('patient-intake.js'),context);vm.runInContext(read('access-routing.js'),context);
 return {context,rows,inserted,ensure:context.window.acolherEnsureInitialIntake,route:context.window.acolherDestination};
}
(async()=>{
 for(const name of ['auth.js','triagem.js','usuario.js','access-routing.js','patient-intake.js'])new vm.Script(read(name),{filename:name});
 const fresh=setup();assert.equal(await fresh.route('triagem.html'),'usuario.html');assert.equal(fresh.inserted.length,1);assert.equal(fresh.inserted[0].details,user.user_metadata.registration_details);assert.equal(fresh.inserted[0].modality,'Online');assert.equal(fresh.inserted[0].id,user.id);
 await fresh.route('triagem.html');await fresh.ensure(user);assert.equal(fresh.inserted.length,1,'return visits must not duplicate or overwrite answers');
 const simultaneous=setup();await Promise.all([simultaneous.ensure(user),simultaneous.ensure(user)]);assert.equal(simultaneous.inserted.length,1,'concurrent retries use the same database primary key');
 const prior=setup({existing:true});assert.equal(await prior.route('triagem.html'),'usuario.html');assert.equal(prior.inserted.length,0);
 const pending=setup();assert.equal(await pending.ensure({...user,email_confirmed_at:null}),false);assert.equal(pending.inserted.length,0);
 const old=setup();assert.equal(await old.ensure({...user,user_metadata:{}}),false);assert.equal(old.inserted.length,0);
 await assert.rejects(setup({readError:true}).ensure(user),/verificar/);await assert.rejects(setup({insertError:{code:'offline'}}).ensure(user),/continuam salvas/);
 assert.equal(await setup({role:'admin'}).route('triagem.html'),'acolher-app/');assert.equal(await setup({professional:true}).route('triagem.html'),'acolher-app/');
 const html=read('login.html');assert.equal((html.match(/<form id="register-form"/g)||[]).length,1);
 for(const name of ['registration_for_whom','registration_reason','registration_details','registration_birth_date','registration_modality','registration_preferred_period','registration_preferred_days','registration_interest','registration_desired_start'])assert(html.includes(`name="${name}"`),name);
 assert(read('auth.js').includes('login.html?next=usuario.html'));
 for(const name of ['login.html','triagem.html','usuario.html']){const s=read(name);assert(s.indexOf('patient-intake.js')<s.indexOf('access-routing.js'),name);}
 console.log('PASS: one signup questionnaire, complete answer mapping, verified-only save, preserved existing requests, concurrent retry deduplication, safe routing and recoverable errors.');
})().catch(error=>{console.error(error);process.exitCode=1});
