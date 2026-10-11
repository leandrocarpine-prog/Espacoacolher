import {createClient} from 'https://esm.sh/@supabase/supabase-js@2';

const json=(status:number,body:unknown)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json'}});
const statusNames:Record<string,string>={nova:'Solicitação recebida',em_analise:'Em análise',contato_realizado:'Contato realizado',agendada:'Atendimento agendado',em_atendimento:'Em atendimento',lista_espera:'Lista de espera',encaminhada:'Encaminhamento realizado',encerrada:'Solicitação encerrada'};
const normalizePhone=(value:string)=>{const digits=value.replace(/\D/g,'');return digits.startsWith('55')?digits:`55${digits}`};

Deno.serve(async request=>{
  if(request.method!=='POST')return json(405,{error:'method_not_allowed'});
  if(request.headers.get('x-webhook-secret')!==Deno.env.get('WHATSAPP_WEBHOOK_SECRET'))return json(401,{error:'unauthorized'});
  const url=Deno.env.get('SUPABASE_URL'),serviceKey=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),accessToken=Deno.env.get('WHATSAPP_ACCESS_TOKEN'),phoneNumberId=Deno.env.get('WHATSAPP_PHONE_NUMBER_ID');
  if(!url||!serviceKey||!accessToken||!phoneNumberId)return json(503,{error:'configuration_missing'});
  const db=createClient(url,serviceKey,{auth:{persistSession:false}});
  const {data:events,error:claimError}=await db.rpc('claim_whatsapp_status_events');
  if(claimError)return json(500,{error:'claim_failed'});
  let sent=0,failed=0;
  for(const event of events||[]){
    const {data:profile}=await db.from('profiles').select('full_name,phone,whatsapp_opt_in_at,whatsapp_opt_out_at').eq('id',event.user_id).maybeSingle();
    if(!profile?.phone||!profile.whatsapp_opt_in_at||profile.whatsapp_opt_out_at){await db.from('whatsapp_status_outbox').update({state:'failed',last_error:'recipient_not_eligible',updated_at:new Date().toISOString()}).eq('id',event.id);failed++;continue}
    const payload={messaging_product:'whatsapp',to:normalizePhone(profile.phone),type:'template',template:{name:Deno.env.get('WHATSAPP_STATUS_TEMPLATE')||'acolher_status_solicitacao',language:{code:'pt_BR'},components:[{type:'body',parameters:[{type:'text',text:profile.full_name.split(' ')[0]||'Olá'},{type:'text',text:statusNames[event.status]||'Atualização disponível'},{type:'text',text:'https://leandrocarpine-prog.github.io/Espacoacolher/login.html'}]}]}};
    try{
      const response=await fetch(`https://graph.facebook.com/v23.0/${phoneNumberId}/messages`,{method:'POST',headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json'},body:JSON.stringify(payload)});
      if(!response.ok)throw new Error(`meta_${response.status}`);
      await db.from('whatsapp_status_outbox').update({state:'sent',sent_at:new Date().toISOString(),last_error:null,updated_at:new Date().toISOString()}).eq('id',event.id);sent++;
    }catch(error){await db.from('whatsapp_status_outbox').update({state:'failed',last_error:String(error).slice(0,300),updated_at:new Date().toISOString()}).eq('id',event.id);failed++}
  }
  return json(200,{sent,failed});
});
