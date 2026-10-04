(() => {
 const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const destination=value=>['usuario.html','triagem.html','questionario.html'].includes(value)?value:'usuario.html';
 const storyValid=value=>typeof value==='string'&&value.trim().length>=20&&value.trim().length<=2000;
 window.acolherSafety={escape,destination,storyValid};
})();
