(()=>{
  const body=document.body;
  if(!body.classList.contains('home-v2'))return;

  const items=[...document.querySelectorAll('.reveal')];
  const directionPairs=[
    ['.intro-media','from-left'],['.intro-copy','from-right'],
    ['.social-visual','from-left'],['.social-copy','from-right'],
    ['.professional-portrait','from-left'],['.professional-copy','from-right'],
    ['.portal-copy','from-left'],['.portal-window','from-right']
  ];
  directionPairs.forEach(([selector,className])=>document.querySelector(selector)?.classList.add(className));

  document.querySelectorAll('.therapy-card').forEach((card,index)=>{
    if(!card.classList.contains('reveal')){card.classList.add('reveal');items.push(card)}
    card.style.setProperty('--home-delay',`${Math.min(index%3,2)*90}ms`);
  });
  document.querySelectorAll('.process-grid article').forEach((card,index)=>{
    if(!card.classList.contains('reveal')){card.classList.add('reveal');items.push(card)}
    card.style.setProperty('--home-delay',`${index*85}ms`);
  });
  document.querySelectorAll('.social-facts>div').forEach((card,index)=>{
    if(!card.classList.contains('reveal')){card.classList.add('reveal');items.push(card)}
    card.style.setProperty('--home-delay',`${index*90}ms`);
  });

  if(matchMedia('(prefers-reduced-motion: reduce)').matches||!('IntersectionObserver' in window)){
    items.forEach(item=>item.classList.add('visible'));
    return;
  }

  body.classList.add('home-motion');
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>entry.target.classList.toggle('visible',entry.isIntersecting));
  },{threshold:.08,rootMargin:'-2% 0px -8% 0px'});
  items.forEach(item=>observer.observe(item));

  // Conteúdo visível na abertura nunca depende de um ciclo futuro do observer.
  requestAnimationFrame(()=>items.forEach(item=>{
    const rect=item.getBoundingClientRect();
    if(rect.top<innerHeight&&rect.bottom>0)item.classList.add('visible');
  }));
})();
