const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup(mode){
 const nodes=new Map(),calls=[];
 function node(){return {listeners:{},dataset:{},style:{},elements:{},classList:{add(){},remove(){},toggle(){}},addEventListener(k,v){this.listeners[k]=v},querySelector(selector){this.children??=new Map();if(!this.children.has(selector))this.children.set(selector,node());return this.children.get(selector)},querySelectorAll(){return []},scrollIntoView(){},focus(){},insertAdjacentHTML(pos,html){this.html=html}};}
 function get(s){if(s==='.auth-side')return null;if(!nodes.has(s))nodes.set(s,node());return nodes.get(s);}
 const values={full_name:'Paciente Fictício',email:'fixture@example.invalid',username:'fixture',cpf:'unused',phone:'unused',cep:'unused',street:'Fictícia',number:'0',city:'Cidade fictícia',state:'SP',neighborhood:'Fictício',password:'TestOnly!12345',password_confirmation:'TestOnly!12345',privacy:'on'};
 const register=get('#register-form');register.values=values;
 for(const [name,value] of Object.entries(values))register.elements[name]={value,dataset:{},addEventListener(){},setCustomValidity(){},checkValidity(){return true},reportValidity(){}};
 const login=get('#login-form');login.values={email:values.email,password:values.password};login.elements.email=register.elements.email;
 class FakeFormData {constructor(form){this.pairs=Object.entries(form.values)}[Symbol.iterator](){return this.pairs[Symbol.iterator]();}}
 const sb={auth:{getSession:async()=>({data:{session:null}}),signOut:async opts=>calls.push(['signOut',opts]),signInWithPassword:async()=>{throw Error('offline')},resend:async()=>{if(mode==='offline')throw Error('offline');return {error:null}},signUp:async value=>{calls.push(['signUp',value]);if(mode==='offline')throw Error('offline');return {data:{session:mode==='unexpected-session'?{}:null},error:null}}}};
 const context=vm.createContext({window:{sb},document:{querySelector:get,querySelectorAll(s){return s==='.register-step'?[node(),node(),node()]:[]}},location:{search:'?next=https%3A%2F%2Fevil.example',hash:'',href:'https://leandrocarpine-prog.github.io/Espacoacolher/login.html',replace(url){calls.push(['redirect',url])}},URL,URLSearchParams,FormData:FakeFormData,setTimeout,matchMedia:()=>({matches:false})});
 vm.runInContext(fs.readFileSync('form-safety.js','utf8'),context);vm.runInContext(fs.readFileSync('auth.js','utf8'),context);vm.runInContext('currentStep=2',context);
 return {nodes,calls,register,login,context};
}
(async()=>{
 const normal=setup('pending');await normal.register.listeners.submit({preventDefault(){}});
 assert.match(normal.register.html,/AGUARDANDO CONFIRMAÇÃO/);assert(!normal.calls.some(([kind])=>kind==='redirect'));
 const signup=normal.calls.find(([kind])=>kind==='signUp')[1];assert.equal(new URL(signup.options.emailRedirectTo).searchParams.get('next'),'triagem.html');
 const unexpected=setup('unexpected-session');await unexpected.register.listeners.submit({preventDefault(){}});assert(unexpected.calls.some(([kind,opts])=>kind==='signOut'&&opts.scope==='local'));assert(!unexpected.calls.some(([kind])=>kind==='redirect'));
 const offline=setup('offline');await offline.register.listeners.submit({preventDefault(){}});assert.equal(offline.nodes.get('#register-submit').disabled,false);
 await offline.login.listeners.submit({preventDefault(){}});assert.equal(offline.login.querySelector('[type=submit]').disabled,false);
 const resend=offline.nodes.get('#resend-activation');await resend.listeners.click({currentTarget:resend});assert.equal(resend.disabled,false);assert.match(offline.nodes.get('#login-feedback').textContent,/Não foi possível reenviar/);
 console.log('PASS: signup awaits email, unexpected session blocked, safe activation destination, offline signup/login/resend recover.');
})().catch(e=>{console.error(e);process.exitCode=1});
