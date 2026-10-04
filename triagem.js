const form=document.querySelector('#intake-form');
const steps=[...document.querySelectorAll('.intake-step')];
const sideSteps=[...document.querySelectorAll('#intake-steps li')];
const backButton=document.querySelector('#intake-back');
const nextButton=document.querySelector('#intake-next');
const submitButton=document.querySelector('#intake-submit');
const feedback=document.querySelector('#intake-feedback');
let currentStep=0,currentUser;

function showFeedback(message=''){feedback.textContent=message;feedback.classList.toggle('visible',Boolean(message))}
function updateStep(){
  steps.forEach((step,index)=>step.classList.toggle('active',index===currentStep));
  sideSteps.forEach((step,index)=>{step.classList.toggle('active',index===currentStep);step.classList.toggle('done',index<currentStep)});
  backButton.classList.toggle('hidden',currentStep===0);nextButton.classList.toggle('hidden',currentStep===steps.length-1);submitButton.classList.toggle('hidden',currentStep!==steps.length-1);
  document.querySelector('#mobile-step').textContent=`Etapa ${currentStep+1} de ${steps.length}`;document.querySelector('#mobile-progress').style.width=`${(currentStep+1)/steps.length*100}%`;showFeedback();
  document.querySelector('.intake-card').scrollIntoView({behavior:'smooth',block:'start'});
  if(currentStep===steps.length-1)buildReview();
}
function validateStep(){const required=[...steps[currentStep].querySelectorAll('[required]')];for(const field of required){if(!field.checkValidity()){field.reportValidity();showFeedback('Confira os campos desta etapa para continuar.');return false}}if(currentStep===2&&!window.acolherSafety.storyValid(form.elements.details.value)){showFeedback('Explique brevemente o motivo da procura, com pelo menos 20 caracteres.');return false}return true}
function selectedText(name){const selected=form.querySelector(`[name="${name}"]:checked`);return selected?.value||form.elements[name]?.value||'Não informado'}
function buildReview(){const rows=[['Atendimento',selectedText('for_whom')],['Cidade',form.elements.city.value],['Motivo principal',selectedText('reason')],['Um pouco da sua história',form.elements.details.value.trim()],['Modalidade',selectedText('modality')],['Melhor período',selectedText('preferred_period')],['Disponibilidade',form.elements.preferred_days.value],['Condição',form.elements.interest.value]];document.querySelector('#review-box').innerHTML=rows.map(([label,value])=>`<div><span>${label}</span><b>${window.acolherSafety.escape(value)}</b></div>`).join('')}
nextButton.addEventListener('click',()=>{if(!validateStep())return;currentStep++;updateStep()});backButton.addEventListener('click',()=>{if(currentStep>0){currentStep--;updateStep()}});
form.elements.details.addEventListener('input',event=>document.querySelector('#details-count').textContent=event.target.value.length);

async function init(){
  if(!window.sb){showFeedback('Não foi possível iniciar o ambiente seguro. Atualize a página.');return}
  const {data:{user}}=await window.sb.auth.getUser();
  if(user&&!user.email_confirmed_at){await window.sb.auth.signOut({scope:'local'});return location.replace('login.html?confirmacao=1');}
  if(!user){
    const localPreview=(location.hostname==='127.0.0.1'||location.hostname==='localhost')&&new URLSearchParams(location.search).has('preview');
    if(!localPreview)return location.replace(`login.html?cadastro=1&next=${encodeURIComponent('triagem.html')}`);
    currentUser={id:'visual-preview'};
  }else currentUser=user;
  const {data:profile}=await window.sb.from('profiles').select('city').eq('id',currentUser.id).maybeSingle();if(profile?.city)form.elements.city.value=profile.city;
  const initial=new URLSearchParams(location.search).get('para')||sessionStorage.getItem('espacoAcolherParaQuem');const map={mim:'Para mim',filho:'Filho(a)',familiar:'Familiar'};if(map[initial]){const field=form.querySelector(`[name="for_whom"][value="${map[initial]}"]`);if(field)field.checked=true}
}

form.addEventListener('submit',async event=>{
  event.preventDefault();if(submitButton.disabled||!validateStep())return;
  if(!window.acolherSafety.storyValid(form.elements.details.value))return showFeedback('Conte um pouco da sua história antes de enviar.');
  const values=Object.fromEntries(new FormData(form));const birth=new Date(`${values.birth_date}T12:00:00`),today=new Date();let age=today.getFullYear()-birth.getFullYear();if(today<new Date(today.getFullYear(),birth.getMonth(),birth.getDate()))age--;
  if(!Number.isFinite(age)||age<0||age>120)return showFeedback('Confira a data de nascimento informada.');
  submitButton.disabled=true;submitButton.innerHTML='Enviando com segurança…';
  try{
  const {error}=await window.sb.from('intake_requests').insert({user_id:currentUser.id,for_whom:values.for_whom,age,city:values.city.trim(),reason:values.reason,details:values.details?.trim()||null,modality:values.modality,preferred_period:values.preferred_period,preferred_days:values.preferred_days.trim(),interest:values.interest,desired_start:values.desired_start,consent_accepted:true});
  submitButton.disabled=false;submitButton.innerHTML='Enviar solicitação <span>→</span>';
  if(error)throw error;
  form.classList.add('hidden');document.querySelector('.intake-mobile-progress').classList.add('hidden');document.querySelector('#intake-success').classList.remove('hidden');document.querySelector('#intake-success').focus();sessionStorage.removeItem('espacoAcolherParaQuem');
  }catch{showFeedback('Não foi possível enviar agora. Confira sua conexão e tente novamente.');}
  finally{submitButton.disabled=false;submitButton.innerHTML='Enviar solicitação <span>→</span>';}

});
updateStep();init();
