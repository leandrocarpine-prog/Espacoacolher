// Android-only bridge restricted to this site's origin and administrative session.
(() => {
 let lastStatus='Toque para permitir avisos de novos cadastros.',waiting=false,timeout;
 const native=()=>window.AcolherPush;
 function show(){const el=document.querySelector('#push-status');if(el)el.textContent=lastStatus;const b=document.querySelector('#enable-push');if(b)b.disabled=waiting;}
 async function register(){
  if(!native()){lastStatus='Para receber avisos com o app fechado, instale a versão Android com notificações.';show();return;}
  const {data:{session}}=await sb.auth.getSession();if(!session)return;
  waiting=true;lastStatus='Conectando notificações…';show();
  clearTimeout(timeout);timeout=setTimeout(()=>{waiting=false;lastStatus='A ativação demorou mais que o esperado. Tente novamente.';show();},25000);
  native().postMessage(JSON.stringify({action:'register',access_token:session.access_token}));
 }
 if(native())native().onmessage=e=>{
  try {const result=JSON.parse(e.data);waiting=false;clearTimeout(timeout);
   if(result.registered){localStorage.setItem('acolher-push-optin','1');lastStatus='Este celular está registrado para avisos, inclusive com o app fechado.';}
   else lastStatus=result.error==='permission'?'Permita notificações nas configurações do Android e tente novamente.':'Não foi possível ativar. Tente novamente com conexão à internet.';
   show();
  }catch {waiting=false;lastStatus='Falha ao ativar notificações.';show();}
 };
 document.addEventListener('click',e=>{if(e.target.closest('#enable-push'))register().catch(()=>{waiting=false;lastStatus='Não foi possível conectar.';show();});});
 window.AcolherNotifications={
  html:()=>'<p id="push-status" role="status"></p><button class="secondary" id="enable-push">Ativar notificações neste celular</button>',
  show,
  ready:()=>{if(localStorage.getItem('acolher-push-optin')==='1')register().catch(()=>{});},
  logout:async()=>{localStorage.removeItem('acolher-push-optin');if(!native())return;const {data:{session}}=await sb.auth.getSession();if(session)native().postMessage(JSON.stringify({action:'unregister',access_token:session.access_token}));}
 };
 // Re-register refreshed Firebase tokens only after administrative sign-in.
 sb.auth.onAuthStateChange((event,session)=>{
  if(!session||!['SIGNED_IN','INITIAL_SESSION'].includes(event))return;
  setTimeout(async()=>{
   const {data}=await sb.from('profiles').select('role').eq('id',session.user.id).single();
   if(data?.role==='admin')window.AcolherNotifications.ready();
  },0);
 });
})();
