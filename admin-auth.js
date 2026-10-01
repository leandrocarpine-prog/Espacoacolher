const form=document.querySelector('#admin-login-form');
const feedback=document.querySelector('#admin-login-feedback');
const adminEmail=username=>`${username.trim().toLowerCase()}@admin.espacoacolher.app`;

async function redirectIfAdmin(){
  const {data:{user}}=await window.sb.auth.getUser();
  if(!user)return;
  const {data:profile}=await window.sb.from('profiles').select('role').eq('id',user.id).maybeSingle();
  if(profile?.role==='admin')location.replace('admin.html');
}

form.addEventListener('submit',async event=>{
  event.preventDefault();
  const button=form.querySelector('button'),values=Object.fromEntries(new FormData(form));
  button.disabled=true;feedback.textContent='Verificando acesso…';feedback.className='feedback success';
  const {data,error}=await window.sb.auth.signInWithPassword({email:adminEmail(values.username),password:values.password});
  if(error){button.disabled=false;feedback.textContent='Usuário ou senha incorretos.';feedback.className='feedback';return}
  const {data:profile,error:profileError}=await window.sb.from('profiles').select('role').eq('id',data.user.id).single();
  if(profileError||profile?.role!=='admin'){
    await window.sb.auth.signOut();button.disabled=false;feedback.textContent='Esta conta não possui permissão administrativa.';feedback.className='feedback';return;
  }
  location.replace('admin.html');
});

redirectIfAdmin();
