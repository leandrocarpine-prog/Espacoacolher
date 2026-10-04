(()=>{
  const mobile=matchMedia('(max-width:700px)');
  let observer;
  const setup=()=>{
    observer?.disconnect();
    document.querySelectorAll('.snap-page').forEach(item=>item.classList.remove('snap-page','snap-active'));
    if(!mobile.matches)return;
    const pages=[document.querySelector('.therapy-intro'),document.querySelector('.therapy-paths'),document.querySelector('.therapy-journey'),document.querySelector('.therapy-modalities'),document.querySelector('.therapy-final'),document.querySelector('.site-footer')].filter(Boolean);
    pages.forEach(page=>page.classList.add('snap-page'));
    pages[0]?.classList.add('snap-active');
    observer=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('snap-active',entry.isIntersecting&&entry.intersectionRatio>.35)),{root:null,threshold:[.15,.35,.6],rootMargin:'-66px 0px 0px'});
    pages.forEach(page=>observer.observe(page));
  };
  setup();mobile.addEventListener?.('change',setup);addEventListener('pageshow',setup);
})();
