const menu=document.querySelector('.menu-button'),navigation=document.querySelector('#main-nav');
document.querySelectorAll('.current-year').forEach(year=>year.textContent=new Date().getFullYear());
const pageFooter=document.querySelector('.site-footer');
if(pageFooter){const footerObserver=new IntersectionObserver(entries=>entries.forEach(entry=>pageFooter.classList.toggle('footer-visible',entry.isIntersecting)),{threshold:.18});footerObserver.observe(pageFooter)}
menu?.addEventListener('click',()=>{const open=navigation.classList.toggle('open');menu.classList.toggle('active',open);menu.setAttribute('aria-expanded',String(open))});

const finePointer=matchMedia('(pointer:fine)').matches&&!matchMedia('(prefers-reduced-motion:reduce)').matches;
document.querySelectorAll('.topics-panel article,.pro-card,.glass-profile').forEach(card=>{if(!finePointer)return;card.addEventListener('pointermove',event=>{const box=card.getBoundingClientRect(),x=(event.clientX-box.left)/box.width-.5,y=(event.clientY-box.top)/box.height-.5;card.style.setProperty('--rx',`${y*-3}deg`);card.style.setProperty('--ry',`${x*4}deg`)});card.addEventListener('pointerleave',()=>{card.style.setProperty('--rx','0deg');card.style.setProperty('--ry','0deg')})});
document.querySelectorAll('.button,.nav-cta,.screen-button').forEach(button=>button.addEventListener('pointermove',event=>{const box=button.getBoundingClientRect();button.style.setProperty('--pointer-x',`${event.clientX-box.left}px`);button.style.setProperty('--pointer-y',`${event.clientY-box.top}px`)}));
