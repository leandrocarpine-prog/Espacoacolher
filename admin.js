const statusNames={nova:'Nova',em_analise:'Em análise',contato_realizado:'Contato realizado',agendada:'Agendada',em_atendimento:'Em atendimento',lista_espera:'Lista de espera',encaminhada:'Encaminhada',encerrada:'Encerrada'};
const statusOrder=Object.keys(statusNames);
let leads=[],appointments=[],professionals=[],calendarDate=new Date(),adminProfile;
const esc=(value='')=>String(value).replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
const initials=name=>String(name||'Pessoa').split(' ').filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();
const profileOf=lead=>lead.profiles||{};
const toast=message=>{const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),2400)};
const formatDate=value=>new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(value)).replace('.','');
const empty=(title,text)=>`<div class="none"><b>${title}</b>${text}</div>`;
const person=lead=>{const p=profileOf(lead);return `<div class="person"><span class="avatar">${initials(p.full_name)}</span><div><b>${esc(p.full_name||'Paciente')}</b><small>${esc(p.city||lead.city||'Cidade não informada')}</small></div></div>`};
const pill=status=>`<span class="pill ${status}">${esc(statusNames[status]||status)}</span>`;

async function init(){
  if(!window.sb)return location.replace('admin-login.html');
  const {data:{user}}=await window.sb.auth.getUser();
  if(!user)return location.replace('admin-login.html');
  const {data:profile,error}=await window.sb.from('profiles').select('*').eq('id',user.id).single();
  if(error||profile?.role!=='admin'){await window.sb.auth.signOut();return location.replace('admin-login.html?erro=permissao')}
  adminProfile=profile;
  const name=profile.full_name||'Leandro';
  document.querySelector('#admin-name').textContent=name;document.querySelector('#admin-first-name').textContent=name.split(' ')[0];document.querySelector('#admin-avatar').textContent=initials(name);
  document.querySelector('#today').textContent=new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'numeric',month:'long'}).format(new Date());
  await loadData();document.querySelector('#admin-loading').remove();
}

async function loadData(){
  const [leadResult,eventResult,proResult]=await Promise.all([
    window.sb.from('intake_requests').select('*,profiles(full_name,city,phone)').order('created_at',{ascending:false}),
    window.sb.from('appointments').select('*').order('starts_at',{ascending:true}),
    window.sb.from('professional_applications').select('*').order('created_at',{ascending:false})
  ]);
  if(leadResult.error)return toast('Não foi possível carregar as solicitações.');
  leads=leadResult.data||[];appointments=eventResult.data||[];
  professionals=proResult.error?[]:(proResult.data||[]);
  renderAll();
  if(proResult.error)document.querySelector('#professional-list').innerHTML=empty('Cadastro profissional ainda não ativado','Aplique o arquivo de configuração do Supabase para liberar esta área.');
}

function metrics(){
  const count=status=>leads.filter(x=>x.status===status).length,pending=professionals.filter(x=>x.status==='pendente').length;
  document.querySelector('#metric-new').textContent=count('nova');document.querySelector('#metric-triage').textContent=count('em_analise');document.querySelector('#metric-contact').textContent=count('contato_realizado');document.querySelector('#metric-pro').textContent=pending;document.querySelector('#nav-new').textContent=count('nova');document.querySelector('#nav-pro').textContent=pending;
}
function renderRecent(){const target=document.querySelector('#recent-list');target.innerHTML=leads.length?leads.slice(0,5).map(lead=>`<div class="lead-mini">${person(lead)}<span>${esc(lead.modality)}</span><span>${formatDate(lead.created_at)}</span>${pill(lead.status)}</div>`).join(''):empty('Nenhuma solicitação','Os pedidos enviados pelo site aparecerão aqui.')}
function renderPipeline(){const max=Math.max(leads.length,1);document.querySelector('#pipeline').innerHTML=`<div class="pipeline">${statusOrder.slice(0,5).map(status=>{const count=leads.filter(x=>x.status===status).length;return `<div class="pipeline-row"><div><b>${statusNames[status]}</b><span>${count}</span></div><div class="bar"><i style="width:${count/max*100}%"></i></div></div>`}).join('')}</div>`}
function statusOptions(selected){return statusOrder.map(status=>`<option value="${status}" ${status===selected?'selected':''}>${statusNames[status]}</option>`).join('')}
function renderLeads(){
  const query=document.querySelector('#lead-search').value.toLowerCase(),filter=document.querySelector('#status-filter').value;
  const list=leads.filter(item=>{const p=profileOf(item);return `${p.full_name} ${p.city} ${item.city} ${item.reason}`.toLowerCase().includes(query)&&(!filter||item.status===filter)});
  document.querySelector('#lead-count').textContent=`${list.length} solicitaç${list.length===1?'ão':'ões'}`;
  document.querySelector('#all-leads').innerHTML=list.length?list.map(lead=>`<div class="lead-row">${person(lead)}<div><b>${esc(lead.reason)}</b><small>${esc(lead.modality)}</small></div><span>${formatDate(lead.created_at)}</span><select data-status="${lead.id}" aria-label="Alterar status">${statusOptions(lead.status)}</select><a class="more" href="${profileOf(lead).phone?`https://wa.me/55${String(profileOf(lead).phone).replace(/\D/g,'')}`:'#'}" target="_blank" aria-label="Abrir WhatsApp">↗</a></div>`).join(''):empty('Nenhuma solicitação encontrada','Ajuste os filtros ou aguarde um novo envio.');
  document.querySelectorAll('[data-status]').forEach(select=>select.addEventListener('change',()=>updateStatus(select.dataset.status,select.value)));
}
async function updateStatus(id,status){const {error}=await window.sb.from('intake_requests').update({status,updated_at:new Date().toISOString()}).eq('id',id);if(error)return toast('Não foi possível atualizar o status.');const lead=leads.find(x=>x.id===id);lead.status=status;renderAll();toast('Status atualizado com segurança.')}
function renderTriages(){const groups=['nova','em_analise'];document.querySelector('#triage-board').innerHTML=groups.map(status=>{const list=leads.filter(x=>x.status===status);return `<div class="kanban-column"><div class="kanban-title">${statusNames[status]}<span>${list.length}</span></div>${list.length?list.map(lead=>`<article class="kanban-card">${person(lead)}<small>${esc(lead.reason)} · ${esc(lead.modality)}</small><small>Recebido em ${formatDate(lead.created_at)}</small><footer><button data-advance="${lead.id}" data-next="${status==='nova'?'em_analise':'contato_realizado'}">${status==='nova'?'Iniciar análise':'Registrar contato'}</button></footer></article>`).join(''):empty('Tudo em dia','Nenhuma solicitação nesta etapa.')}</div>`}).join('');document.querySelectorAll('[data-advance]').forEach(button=>button.addEventListener('click',()=>updateStatus(button.dataset.advance,button.dataset.next)))}
function renderContacts(){const list=leads.filter(x=>['contato_realizado','agendada','em_atendimento','lista_espera'].includes(x.status));document.querySelector('#contact-list').innerHTML=list.length?list.map(lead=>{const phone=profileOf(lead).phone;return `<div class="contact-row">${person(lead)}<span>${esc(lead.modality)}</span>${pill(lead.status)}${phone?`<a href="https://wa.me/55${String(phone).replace(/\D/g,'')}" target="_blank">Conversar ↗</a>`:'<span>Sem telefone</span>'}</div>`}).join(''):empty('Nenhum acompanhamento ativo','Os contatos avançados aparecerão aqui.')}
function renderProfessionals(){
  const target=document.querySelector('#professional-list');if(!professionals.length){target.innerHTML=empty('Nenhum cadastro profissional','Novas solicitações de profissionais aparecerão aqui.');return}
  target.innerHTML=professionals.map(item=>`<article class="professional-card"><header><span class="avatar">${initials(item.full_name)}</span><div><h3>${esc(item.full_name)}</h3><p>${esc(item.crp)} · ${esc(item.city)}</p></div><span class="review-status ${item.status}">${item.status==='pendente'?'Pendente':item.status==='aprovado'?'Aprovado':'Não aprovado'}</span></header><div class="professional-meta"><span><b>Contato</b>${esc(item.phone)}</span><span><b>Atuação</b>${esc(item.specialties)}</span></div><p>${esc(item.presentation||'Sem apresentação adicional.')}</p><footer><button class="secondary" data-review="${item.id}" data-decision="recusado">Não aprovar</button><button class="primary" data-review="${item.id}" data-decision="aprovado">Aprovar profissional</button></footer></article>`).join('');
  document.querySelectorAll('[data-review]').forEach(button=>button.addEventListener('click',()=>reviewProfessional(button.dataset.review,button.dataset.decision)));
}
async function reviewProfessional(id,status){const {error}=await window.sb.from('professional_applications').update({status,reviewed_at:new Date().toISOString(),reviewed_by:adminProfile.id}).eq('id',id);if(error)return toast('Não foi possível concluir a análise.');const item=professionals.find(x=>x.id===id);item.status=status;renderProfessionals();metrics();toast(status==='aprovado'?'Profissional aprovado.':'Cadastro não aprovado.')}
function renderAgenda(){const year=calendarDate.getFullYear(),month=calendarDate.getMonth(),first=new Date(year,month,1),days=new Date(year,month+1,0).getDate(),offset=first.getDay();document.querySelector('#month-title').textContent=new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(first);const cells=[];for(let i=0;i<offset;i++)cells.push('<span></span>');for(let day=1;day<=days;day++){const date=`${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`,today=date===new Date().toISOString().slice(0,10),has=appointments.some(x=>String(x.starts_at).slice(0,10)===date);cells.push(`<span class="${today?'today ':''}${has?'has-event':''}">${day}</span>`)}document.querySelector('#calendar-grid').innerHTML=cells.join('');document.querySelector('#event-list').innerHTML=appointments.length?appointments.map(item=>{const date=new Date(item.starts_at);return `<div class="event-row"><div class="event-date"><b>${date.getDate()}</b><small>${new Intl.DateTimeFormat('pt-BR',{month:'short'}).format(date).replace('.','')}</small></div><div><strong>${esc(item.public_note||'Atendimento')}</strong><span>${date.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})} · ${esc(item.modality)}</span></div></div>`}).join(''):empty('Agenda livre','Nenhum compromisso foi registrado.')}
function renderAll(){metrics();renderRecent();renderPipeline();renderLeads();renderTriages();renderProfessionals();renderContacts();renderAgenda()}

document.querySelector('#status-filter').innerHTML='<option value="">Todos os status</option>'+statusOptions('');
document.querySelector('.weekdays').innerHTML='<span>D</span><span>S</span><span>T</span><span>Q</span><span>Q</span><span>S</span><span>S</span>';
document.querySelector('#lead-search').addEventListener('input',renderLeads);document.querySelector('#status-filter').addEventListener('change',renderLeads);
document.querySelectorAll('.sidebar nav button').forEach(button=>button.addEventListener('click',()=>openPage(button.dataset.page)));document.querySelectorAll('[data-go]').forEach(button=>button.addEventListener('click',()=>openPage(button.dataset.go)));
function openPage(id){document.querySelectorAll('.sidebar nav button').forEach(x=>x.classList.toggle('active',x.dataset.page===id));document.querySelectorAll('.page').forEach(x=>x.classList.toggle('active',x.id===id));document.querySelector('#page-title').textContent=document.querySelector(`.sidebar nav button[data-page="${id}"] span`).textContent;document.querySelector('.sidebar').classList.remove('open')}
document.querySelector('#prev-month').addEventListener('click',()=>{calendarDate=new Date(calendarDate.getFullYear(),calendarDate.getMonth()-1,1);renderAgenda()});document.querySelector('#next-month').addEventListener('click',()=>{calendarDate=new Date(calendarDate.getFullYear(),calendarDate.getMonth()+1,1);renderAgenda()});document.querySelector('.mobile-menu').addEventListener('click',()=>document.querySelector('.sidebar').classList.toggle('open'));document.querySelector('#refresh-data').addEventListener('click',loadData);document.querySelector('#admin-logout').addEventListener('click',async()=>{await window.sb.auth.signOut();location.replace('admin-login.html')});
init();
