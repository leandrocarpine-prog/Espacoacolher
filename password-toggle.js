document.querySelectorAll('input[type="password"]').forEach(input=>{
  if(input.closest('.password-control'))return;
  const wrapper=document.createElement('span');wrapper.className='password-control';input.before(wrapper);wrapper.appendChild(input);
  const button=document.createElement('button');button.type='button';button.className='password-visibility';button.setAttribute('aria-label','Mostrar senha');button.setAttribute('aria-pressed','false');button.title='Mostrar senha';button.innerHTML='<svg class="eye-on" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg><svg class="eye-off" viewBox="0 0 24 24" aria-hidden="true"><path d="m3 3 18 18M10.6 6.2A10.5 10.5 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-2.1 2.8M6.5 6.7C3.9 8.4 2.5 12 2.5 12s3.5 6 9.5 6a9 9 0 0 0 3-.5M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>';
  button.addEventListener('click',()=>{const visible=input.type==='text';input.type=visible?'password':'text';button.setAttribute('aria-pressed',String(!visible));button.setAttribute('aria-label',visible?'Mostrar senha':'Ocultar senha');button.title=visible?'Mostrar senha':'Ocultar senha';input.focus()});
  wrapper.appendChild(button);
});
