(() => {
 const form=document.querySelector('#recovery-form'),button=form.querySelector('[type=submit]'),feedback=document.querySelector('#recovery-feedback');
 let allowed=false;
 const ready=()=>{allowed=true;button.disabled=false;feedback.textContent='Link validado. Digite sua nova senha.';};
 window.sb.auth.onAuthStateChange(event=>{if(event==='PASSWORD_RECOVERY')ready();});
 window.sb.auth.getSession().then(({data,error})=>{
  // A valid Auth session is still required for the password update.
  if(!error&&data.session)ready();else feedback.textContent='Link inválido ou expirado. Solicite outro na tela de acesso.';
 }).catch(()=>{feedback.textContent='Não foi possível verificar o link. Confira sua conexão.';});
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(!allowed||button.disabled)return;
  const password=form.elements.password.value;
  if(password!==form.elements.confirmation.value){feedback.textContent='As senhas precisam ser iguais.';return;}
  if(!(password.length>=8&&/[A-Z]/.test(password)&&/[a-z]/.test(password)&&/\d/.test(password)&&/[^A-Za-z0-9]/.test(password))){feedback.textContent='A senha precisa atender aos requisitos indicados.';return;}
  button.disabled=true;
  try{const {error}=await window.sb.auth.updateUser({password});if(error)throw error;
   allowed=false;form.reset();feedback.textContent='Senha alterada. Entre novamente com sua nova senha.';
   await window.sb.auth.signOut({scope:'local'});
  }catch{feedback.textContent='Não foi possível alterar a senha. Verifique o link e tente novamente.';}
  finally{button.disabled=!allowed;}
 });
})();
