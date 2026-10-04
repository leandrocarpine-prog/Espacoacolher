import { createClient } from 'npm:@supabase/supabase-js@2';
const cors={'Access-Control-Allow-Origin':'https://leandrocarpine-prog.github.io','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS'};
const reply=(status:number,data:unknown)=>new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json'}});
const db=createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false}});
const enc=new TextEncoder();
const b64=(bytes:Uint8Array)=>btoa(String.fromCharCode(...bytes)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
let cached:{value:string,until:number}|null=null;
async function googleToken(){
 if(cached&&cached.until>Date.now())return cached.value;
 const key=JSON.parse(Deno.env.get('FCM_SERVICE_ACCOUNT')!);const now=Math.floor(Date.now()/1000);
 const header=b64(enc.encode(JSON.stringify({alg:'RS256',typ:'JWT'})));
 const payload=b64(enc.encode(JSON.stringify({iss:key.client_email,scope:'https://www.googleapis.com/auth/firebase.messaging',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600})));
 const pem=key.private_key.replace(/-----[^-]+-----|\s/g,'');const bytes=Uint8Array.from(atob(pem),c=>c.charCodeAt(0));
 const signing=await crypto.subtle.importKey('pkcs8',bytes,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
 const sig=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',signing,enc.encode(header+'.'+payload));
 const res=await fetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:header+'.'+payload+'.'+b64(new Uint8Array(sig))})});
 if(!res.ok)throw Error('FCM authentication failed');const data=await res.json();cached={value:data.access_token,until:Date.now()+3000000};return cached.value;
}
Deno.serve(async req=>{
 if(req.method==='OPTIONS')return new Response('ok',{headers:cors});
 if(req.method!=='POST')return reply(405,{error:'method'});
 try{
  const secret=Deno.env.get('PUSH_WEBHOOK_SECRET');
  if(!secret||req.headers.get('x-webhook-secret')!==secret){
   const jwt=(req.headers.get('Authorization')||'').replace(/^Bearer /,'');
   const {data:{user},error}=await db.auth.getUser(jwt);if(error||!user)return reply(401,{error:'authentication'});
   const {data:profile}=await db.from('profiles').select('role').eq('id',user.id).single();if(profile?.role!=='admin')return reply(403,{error:'admin only'});
   const body=await req.json();if(typeof body.token!=='string'||body.token.length<20||body.token.length>4096)return reply(400,{error:'token'});
   if(body.action==='unregister'){await db.from('admin_push_devices').delete().eq('user_id',user.id).eq('token',body.token);return reply(200,{registered:false})}
   if(body.action!=='register')return reply(400,{error:'action'});
   const {error:write}=await db.from('admin_push_devices').upsert({user_id:user.id,token:body.token,updated_at:new Date().toISOString()},{onConflict:'token'});if(write)throw Error('registration');
   return reply(200,{registered:true});
  }
  const {data:events,error:claimError}=await db.rpc('claim_push_events');if(claimError)throw Error('queue unavailable');
  if(!events?.length)return reply(200,{sent:0});
  const {data:devices,error:devicesError}=await db.from('admin_push_devices').select('token,user_id');if(devicesError)throw Error('devices unavailable');
  const {data:admins,error:adminError}=await db.from('profiles').select('id').eq('role','admin');if(adminError)throw Error('permissions unavailable');
  const allowed=new Set((admins||[]).map(p=>p.id));const targets=(devices||[]).filter(d=>allowed.has(d.user_id));let sent=0;
  for(const event of events){
   if(!targets.length){await db.from('push_outbox').update({state:'pending',last_error:'No registered administrator device',updated_at:new Date().toISOString()}).eq('id',event.id);continue}
   let failed=false;
   for(const device of targets){
    try{
     const {data:receipt,error:receiptError}=await db.from('push_deliveries').select('event_id').eq('event_id',event.id).eq('token',device.token).maybeSingle();
     if(receiptError)throw Error('receipt unavailable');if(receipt)continue;
     const access=await googleToken();
     const response=await fetch('https://fcm.googleapis.com/v1/projects/espaco-acolher-c9623/messages:send',{method:'POST',headers:{Authorization:'Bearer '+access,'Content-Type':'application/json'},body:JSON.stringify({message:{token:device.token,notification:{title:'Espaço Acolher',body:event.kind==='professional'?'Novo cadastro profissional para analisar.':event.kind==='intake'?'Nova solicitação recebida.':'Novo cadastro de paciente recebido.'},data:{event_id:event.id,kind:event.kind},android:{priority:'high',notification:{channel_id:'acolher_cadastros',tag:event.id}}}})});
     if(!response.ok){const err=await response.json();failed=true;if(err.error?.details?.some((d:{errorCode:string})=>d.errorCode==='UNREGISTERED')){await db.from('admin_push_devices').delete().eq('token',device.token)}}else{const {error:receiptWrite}=await db.from('push_deliveries').upsert({event_id:event.id,token:device.token});if(receiptWrite)throw Error('receipt persistence');sent++}
    }catch{failed=true}
   }
   await db.from('push_outbox').update({state:failed?'pending':'sent',last_error:failed?'Delivery failed; retry scheduled':null,updated_at:new Date().toISOString()}).eq('id',event.id);
  }
  return reply(200,{sent});
 }catch{return reply(500,{error:'Notification processing failed'})}
});
