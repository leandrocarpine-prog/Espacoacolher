const header=document.querySelector('.site-header');
const menuButton=document.querySelector('.menu-button');
const nav=document.querySelector('#main-nav');
const dialog=document.querySelector('#start-dialog');
const dialogContinue=document.querySelector('#dialog-continue');

const progressBar=document.querySelector('.page-progress i');
function updateScrollState(){
  header.classList.toggle('scrolled',scrollY>20);
  if(progressBar){const available=document.documentElement.scrollHeight-innerHeight;progressBar.style.transform=`scaleX(${available>0?Math.min(scrollY/available,1):0})`}
}
window.addEventListener('scroll',updateScrollState,{passive:true});
updateScrollState();
menuButton.addEventListener('click',()=>{const open=nav.classList.toggle('open');menuButton.classList.toggle('active',open);menuButton.setAttribute('aria-expanded',String(open))});
nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{nav.classList.remove('open');menuButton.classList.remove('active');menuButton.setAttribute('aria-expanded','false')}));

const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(item=>observer.observe(item));

const needs={
  ansiedade:{number:'01',kicker:'ANSIEDADE E SOBRECARGA',title:'Quando a mente não encontra pausa.',copy:'Preocupações constantes, crises, tensão, dificuldade para descansar ou a sensação de estar sempre no limite podem ser trabalhadas com cuidado e sem julgamentos.',items:['Ansiedade e medos','Estresse e esgotamento','Dificuldade para desacelerar']},
  neuro:{number:'02',kicker:'NEURODIVERGÊNCIAS',title:'Compreender seu modo de estar no mundo.',copy:'Um espaço para elaborar vivências relacionadas a TDAH, autismo e outras formas de neurodivergência, considerando sua história para além de rótulos ou respostas prontas.',items:['Identidade e autocompreensão','Rotina e sobrecarga','Relações e pertencimento']},
  relacoes:{number:'03',kicker:'RELACIONAMENTOS E VÍNCULOS',title:'Quando estar com o outro também dói.',copy:'Conflitos, padrões que se repetem, separações ou dificuldade para estabelecer limites podem ser compreendidos a partir da sua experiência e dos seus vínculos.',items:['Conflitos afetivos','Limites e comunicação','Família e vínculos']},
  mudancas:{number:'04',kicker:'MUDANÇAS, PERDAS E RECOMEÇOS',title:'Dar lugar ao que mudou.',copy:'Lutos, separações, mudanças profissionais ou momentos de transição podem provocar desorientação. A psicoterapia oferece tempo e espaço para elaborar o vivido.',items:['Luto e perdas','Transições de vida','Crises e recomeços']},
  autoconhecimento:{number:'05',kicker:'AUTOCONHECIMENTO',title:'Conhecer-se também é uma forma de cuidado.',copy:'Nem sempre é preciso esperar uma crise. A análise pode ajudar a reconhecer desejos, escolhas, repetições e novas possibilidades para a própria vida.',items:['Escolhas e desejos','Padrões de repetição','Projetos de vida']}
};
const needDetail=document.querySelector('#need-detail');
document.querySelectorAll('.need-button').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('.need-button').forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-selected',String(active))});
  const data=needs[button.dataset.need];
  needDetail.classList.remove('content-change');void needDetail.offsetWidth;needDetail.classList.add('content-change');
  needDetail.querySelector('.need-art b').textContent=data.number;needDetail.querySelector('.detail-kicker').textContent=data.kicker;needDetail.querySelector('h3').textContent=data.title;needDetail.querySelector('.detail-copy').textContent=data.copy;needDetail.querySelector('ul').innerHTML=data.items.map(item=>`<li>${item}</li>`).join('');
}));

function openDialog(){dialog.showModal();document.body.classList.add('dialog-open')}
function closeDialog(){dialog.close();document.body.classList.remove('dialog-open')}
document.querySelectorAll('[data-open-start]').forEach(button=>button.addEventListener('click',openDialog));
document.querySelector('[data-close-dialog]').addEventListener('click',closeDialog);
dialog.addEventListener('click',event=>{if(event.target===dialog)closeDialog()});
dialog.addEventListener('close',()=>document.body.classList.remove('dialog-open'));
document.querySelectorAll('[data-start-value]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('[data-start-value]').forEach(item=>item.classList.toggle('selected',item===button));
  const value=button.dataset.startValue;sessionStorage.setItem('espacoAcolherParaQuem',value);
  dialogContinue.classList.remove('disabled');dialogContinue.href=`login.html?cadastro=1&next=${encodeURIComponent('triagem.html')}&para=${value}`;
}));

document.querySelectorAll('.faq-list details').forEach(detail=>detail.addEventListener('toggle',()=>{if(detail.open)document.querySelectorAll('.faq-list details').forEach(other=>{if(other!==detail)other.open=false})}));
document.querySelector('#year').textContent=new Date().getFullYear();

// Movimento sutil: responde ao cursor sem interferir com toque ou acessibilidade.
const finePointer=matchMedia('(pointer:fine)').matches&&!matchMedia('(prefers-reduced-motion:reduce)').matches;
const hero=document.querySelector('.hero');
const heroArt=document.querySelector('.hero-image');
if(finePointer&&hero&&heroArt){
  hero.addEventListener('pointermove',event=>{const box=hero.getBoundingClientRect(),x=(event.clientX-box.left)/box.width-.5,y=(event.clientY-box.top)/box.height-.5;heroArt.style.setProperty('--mx',`${x*22}px`);heroArt.style.setProperty('--my',`${y*18}px`);heroArt.style.setProperty('--mx-soft',`${x*-12}px`);heroArt.style.setProperty('--my-soft',`${y*-10}px`)},{passive:true});
  hero.addEventListener('pointerleave',()=>['--mx','--my','--mx-soft','--my-soft'].forEach(name=>heroArt.style.setProperty(name,'0px')));
}
document.querySelectorAll('.button,.nav-cta').forEach(button=>button.addEventListener('pointermove',event=>{const box=button.getBoundingClientRect();button.style.setProperty('--pointer-x',`${event.clientX-box.left}px`);button.style.setProperty('--pointer-y',`${event.clientY-box.top}px`)}));
document.querySelectorAll('.therapy-card').forEach(card=>{if(!finePointer)return;card.addEventListener('pointermove',event=>{const box=card.getBoundingClientRect(),x=(event.clientX-box.left)/box.width-.5,y=(event.clientY-box.top)/box.height-.5;card.style.setProperty('--rx',`${y*-3}deg`);card.style.setProperty('--ry',`${x*4}deg`)});card.addEventListener('pointerleave',()=>{card.style.setProperty('--rx','0deg');card.style.setProperty('--ry','0deg')})});
document.querySelectorAll('a[href]').forEach(link=>link.addEventListener('click',event=>{const url=new URL(link.href,location.href);if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||link.target==='_blank'||url.origin!==location.origin||url.hash&&url.pathname===location.pathname)return;event.preventDefault();document.body.classList.add('page-leaving');setTimeout(()=>location.href=url.href,190)}));
