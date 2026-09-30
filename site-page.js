const menu=document.querySelector('.menu-button'),navigation=document.querySelector('#main-nav');
menu?.addEventListener('click',()=>{const open=navigation.classList.toggle('open');menu.classList.toggle('active',open);menu.setAttribute('aria-expanded',String(open))});
