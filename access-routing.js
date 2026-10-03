/* Shared post-login destination. Authorization remains enforced by database policies. */
window.acolherDestination=async function(fallback='usuario.html'){
 const {data:{user},error}=await window.sb.auth.getUser();
 if(error||!user)return 'login.html';
 const {data:profile,error:profileError}=await window.sb.from('profiles').select('role').eq('id',user.id).maybeSingle();
 if(profileError)throw Error('Não foi possível verificar as permissões. Tente novamente.');
 if(profile?.role==='admin')return 'acolher-app/';
 const {data:application,error:applicationError}=await window.sb.from('professional_applications').select('id').eq('user_id',user.id).maybeSingle();
 if(applicationError)throw Error('Não foi possível verificar o cadastro profissional. Tente novamente.');
 if(application)return 'acolher-app/';
 // Only allow known patient destinations, never an arbitrary URL from the query string.
 return ['usuario.html','questionario.html'].includes(fallback)?fallback:'usuario.html';
};
