(()=>{
  const mobile=matchMedia('(max-width:700px)');
  let observer,snapTimer,pages=[],settling=false;
  const settle=()=>{
    if(!mobile.matches||!pages.length||settling)return;
    const target=pages.reduce((best,page)=>Math.abs(page.getBoundingClientRect().top)<Math.abs(best.getBoundingClientRect().top)?page:best,pages[0]);
    if(Math.abs(target.getBoundingClientRect().top)>7){settling=true;target.scrollIntoView({behavior:'smooth',block:'start'});setTimeout(()=>{settling=false},850)}
  };
  const scheduleSettle=()=>{if(settling)return;clearTimeout(snapTimer);snapTimer=setTimeout(settle,150)};
  const setup=()=>{
    observer?.disconnect();
    settling=false;
    removeEventListener('scroll',scheduleSettle);
    document.querySelectorAll('.snap-page').forEach(item=>item.classList.remove('snap-page','snap-active'));
    if(!mobile.matches)return;
    pages=[document.querySelector('.therapy-intro'),document.querySelector('.therapy-paths'),document.querySelector('.therapy-journey'),document.querySelector('.therapy-modalities'),document.querySelector('.therapy-final'),document.querySelector('.site-footer')].filter(Boolean);
    pages.forEach(page=>page.classList.add('snap-page'));
    pages[0]?.classList.add('snap-active');
    observer=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('snap-active',entry.isIntersecting&&entry.intersectionRatio>.35)),{root:null,threshold:[.15,.35,.6]});
    pages.forEach(page=>observer.observe(page));
    addEventListener('scroll',scheduleSettle,{passive:true});
  };
  setup();mobile.addEventListener?.('change',setup);addEventListener('pageshow',setup);
})();
