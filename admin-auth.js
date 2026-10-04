const form=document.querySelector('#admin-login-form');
const feedback=document.querySelector('#admin-login-feedback');
const adminEmail=username=>{const login=username.trim().toLowerCase();return login.includes('@')?login:`${login}@admin.espacoacolher.app`};

async function redirectIfAdmin(){
  const {data:{user}}=await window.sb.auth.getUser();
  if(!user||!user.email_confirmed_at)return;
  const {data:profile}=await window.sb.from('profiles').select('role').eq('id',user.id).maybeSingle();
  if(profile?.role==='admin')location.replace('acolher-app/');
}

form.addEventListener('submit',async event=>{
  event.preventDefault();
  const button=form.querySelector('[type=submit]'),values=Object.fromEntries(new FormData(form));
  if(button.disabled)return;button.disabled=true;try{feedback.textContent='Verificando acesso…';feedback.className='feedback success';
  const {data,error}=await window.sb.auth.signInWithPassword({email:adminEmail(values.username),password:values.password});
  if(error||!data.user?.email_confirmed_at){button.disabled=false;feedback.textContent='Usuário ou senha incorretos.';feedback.className='feedback';return}
  const {data:profile,error:profileError}=await window.sb.from('profiles').select('role').eq('id',data.user.id).single();
  if(profileError||profile?.role!=='admin'){
    await window.sb.auth.signOut();button.disabled=false;feedback.textContent='Esta conta não possui permissão administrativa.';feedback.className='feedback';return;
  }
  location.replace('acolher-app/');
  }catch{feedback.textContent='Não foi possível conectar. Tente novamente.';feedback.className='feedback';}finally{button.disabled=false;}
});

redirectIfAdmin().catch(()=>{feedback.textContent='Não foi possível verificar a conta.'});
