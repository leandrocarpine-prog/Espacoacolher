(()=>{
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const finePointer=matchMedia('(pointer:fine)').matches;
  document.documentElement.classList.add('motion-ready');
  document.body.classList.add('motion-enter');

  const revealSelectors=[
    'main section:not(.hero)>*',
    '.hero-image',
    '.hero-copy>*',
    '.intro-copy>*',
    '.social-copy>*',
    '.process-head>*',
    '.professional-copy>*',
    '.portal-copy>*',
    '.faq-heading>*',
    '.section-heading',
    '.section-heading>*',
    '.form-heading>*',
    '.screen-copy>*',
    '.screen-visual',
    '.therapy-card',
    '.process-grid article',
    '.social-facts>div',
    '.auth-form>*',
    '.intake-step.active>*',
    '.user-view.active>*',
    '.professional-entry-copy>*',
    '.professional-option',
    '.area-grid article',
    '.profile-card',
    '.admin-main article'
  ];
  let revealItems=[...new Set(revealSelectors.flatMap(selector=>[...document.querySelectorAll(selector)]))]
    .filter(item=>!item.closest('[hidden]')&&!item.classList.contains('motion-reveal'));
  revealItems.forEach(item=>item.classList.add('motion-reveal'));
  // Se um bloco contém elementos animados, anima os filhos para preservar a ordem visual.
  revealItems=revealItems.filter(item=>{
    if(item.querySelector('.motion-reveal')){item.classList.remove('motion-reveal');return false}
    return true;
  });
  const revealGroups=new Map();
  revealItems.forEach(item=>{
    const group=item.closest('section,form,.screen-copy,.auth-form,.admin-main')||document.body;
    if(!revealGroups.has(group))revealGroups.set(group,[]);
    revealGroups.get(group).push(item);
  });
  revealGroups.forEach(items=>items.sort((a,b)=>a.compareDocumentPosition(b)&Node.DOCUMENT_POSITION_FOLLOWING?-1:1)
    .forEach((item,index)=>item.style.setProperty('--motion-delay',`${Math.min(index,8)*105}ms`)));

  if(reduced){
    revealItems.forEach(item=>item.classList.add('is-inview'));
  }else{
    const revealObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
      entry.target.classList.toggle('is-inview',entry.isIntersecting);
    }),{threshold:.08,rootMargin:'-3% 0px -4% 0px'});
    revealItems.forEach(item=>revealObserver.observe(item));
    // Libera apenas o que já está visível na abertura. O restante continua respondendo à rolagem.
    setTimeout(()=>revealItems.forEach(item=>{
      const box=item.getBoundingClientRect();
      if(box.top<innerHeight&&box.bottom>0)item.classList.add('is-inview');
    }),1200);
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

  const parallaxSections=[...document.querySelectorAll('.process')];
  let ticking=false;
  const updateScroll=()=>{
    if(ticking)return;ticking=true;
    requestAnimationFrame(()=>{
      document.body.classList.toggle('motion-scrolled',scrollY>24);
      document.documentElement.style.setProperty('--motion-scroll',String(scrollY));
      if(!reduced)parallaxSections.forEach(section=>{
        const box=section.getBoundingClientRect();
        if(box.bottom>0&&box.top<innerHeight){
          const shift=Math.max(-34,Math.min(34,(box.top-innerHeight*.45)*-.055));
          section.style.setProperty('--process-y',`${shift}px`);
        }
      });
      ticking=false;
    });
  };
  addEventListener('scroll',updateScroll,{passive:true});updateScroll();
})();
