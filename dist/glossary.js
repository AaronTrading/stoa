const query=new URLSearchParams(location.search).get('recherche')?.trim()||'';
if(query){
  const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const needle=normalize(query),entries=[...document.querySelectorAll('.glossary-entry')];
  let shown=0;entries.forEach(entry=>{const match=normalize(entry.textContent).includes(needle);entry.hidden=!match;if(match)shown++;});
  const heading=document.querySelector('.glossary-heading');
  heading?.insertAdjacentHTML('beforeend',`<p class="glossary-search-status">${shown} définition${shown>1?'s':''} pour « <strong></strong> » · <a href="/glossaire">Tout afficher</a></p>`);
  const strong=heading?.querySelector('.glossary-search-status strong');if(strong)strong.textContent=query;
}
