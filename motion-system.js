(()=>{
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const finePointer=matchMedia('(pointer:fine)').matches;
  document.documentElement.classList.add('motion-ready');
  document.body.classList.add('motion-enter');

  const revealSelectors=[
    'main section:not(.hero)>*',
    '.section-heading',
    '.screen-copy>*',
    '.screen-visual',
    '.auth-form>*',
    '.intake-step.active>*',
    '.user-view.active>*',
    '.professional-entry-copy>*',
    '.professional-option',
    '.area-grid article',
    '.profile-card',
    '.admin-main article'
  ];
  const revealItems=[...new Set(revealSelectors.flatMap(selector=>[...document.querySelectorAll(selector)]))]
    .filter(item=>!item.closest('[hidden]')&&!item.classList.contains('motion-reveal'));
  revealItems.forEach((item,index)=>{
    item.classList.add('motion-reveal');
    item.style.setProperty('--motion-delay',`${Math.min(index%6,4)*55}ms`);
  });

  if(reduced){
    revealItems.forEach(item=>item.classList.add('is-inview'));
  }else{
    const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
      if(entry.isIntersecting){entry.target.classList.add('is-inview');revealObserver.unobserve(entry.target)}
    }),{threshold:.08,rootMargin:'0px 0px -4% 0px'});
    revealItems.forEach(item=>revealObserver.observe(item));
    // Nunca deixa conteúdo invisível quando a página abre diretamente por uma âncora.
    setTimeout(()=>revealItems.forEach(item=>item.classList.add('is-inview')),1200);
  }

  const sections=[...document.querySelectorAll('main>section,[data-palette]')];
  sections.forEach(section=>section.classList.add('motion-section'));
  if(sections.length&&!reduced){
    const sectionObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
      entry.target.classList.toggle('is-section-active',entry.isIntersecting);
    }),{threshold:.18,rootMargin:'-12% 0px -30% 0px'});
    sections.forEach(section=>sectionObserver.observe(section));
  }

  const interactiveSelectors='button,.button,.nav-cta,.text-link,.small-button,.professional-option,.admin-lock,.intake-choices label>span,.reason-grid label>span';
  document.querySelectorAll(interactiveSelectors).forEach(item=>{
    item.classList.add('motion-interactive');
    item.addEventListener('pointerdown',()=>{item.classList.remove('motion-tap');void item.offsetWidth;item.classList.add('motion-tap')});
    item.addEventListener('animationend',()=>item.classList.remove('motion-tap'));
    if(finePointer&&!reduced)item.addEventListener('pointermove',event=>{
      const box=item.getBoundingClientRect();
      item.style.setProperty('--motion-x',`${event.clientX-box.left}px`);
      item.style.setProperty('--motion-y',`${event.clientY-box.top}px`);
    },{passive:true});
  });

  const tiltSelectors='.process-grid article,.professional-option,.user-grid article,.content-card,.area-grid article,.topics-panel article,.therapy-card:not(.featured)';
  if(finePointer&&!reduced)document.querySelectorAll(tiltSelectors).forEach(card=>{
    card.classList.add('motion-tilt');
    card.addEventListener('pointermove',event=>{
      const box=card.getBoundingClientRect(),x=(event.clientX-box.left)/box.width-.5,y=(event.clientY-box.top)/box.height-.5;
      card.style.setProperty('--motion-rx',`${y*-2.8}deg`);
      card.style.setProperty('--motion-ry',`${x*3.2}deg`);
    },{passive:true});
    card.addEventListener('pointerleave',()=>{card.style.setProperty('--motion-rx','0deg');card.style.setProperty('--motion-ry','0deg')});
  });

  let ticking=false;
  const updateScroll=()=>{
    if(ticking)return;ticking=true;
    requestAnimationFrame(()=>{
      document.body.classList.toggle('motion-scrolled',scrollY>24);
      document.documentElement.style.setProperty('--motion-scroll',String(scrollY));
      ticking=false;
    });
  };
  addEventListener('scroll',updateScroll,{passive:true});updateScroll();
})();
