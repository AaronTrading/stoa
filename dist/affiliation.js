import { supabase } from './supabase.js';
import { chartPoints } from './affiliate-utils.js';

const $=selector=>document.querySelector(selector);
const euro=cents=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(Number(cents||0)/100);
const date=value=>new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(value));
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const statusLabel=value=>({pending:'En attente',active:'Actif',cancelled:'Annulé',refunded:'Remboursé'}[value]||value);

function renderChart(daily){
  const chart=$('#affiliate-chart'),clicks=daily.map(row=>Number(row.clicks||0)),referrals=daily.map(row=>Number(row.referrals||0));
  const width=720,height=190,left=20,top=20;
  const grid=[0,.25,.5,.75,1].map(ratio=>`<line x1="${left}" y1="${top+height*ratio}" x2="${left+width}" y2="${top+height*ratio}"/>`).join('');
  const labels=[0,9,19,29].filter(index=>daily[index]).map(index=>`<text x="${left+index*(width/29)}" y="244" text-anchor="${index===0?'start':index===29?'end':'middle'}">${new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'short'}).format(new Date(`${daily[index].date}T12:00:00`))}</text>`).join('');
  chart.innerHTML=`<g class="affiliate-chart-grid">${grid}${labels}</g><polyline class="click-line" points="${chartPoints(clicks,width,height).split(' ').map(point=>{const [x,y]=point.split(',');return `${Number(x)+left},${Number(y)+top}`}).join(' ')}"/><polyline class="referral-line" points="${chartPoints(referrals,width,height).split(' ').map(point=>{const [x,y]=point.split(',');return `${Number(x)+left},${Number(y)+top}`}).join(' ')}"/>`;
}

function renderDashboard(data){
  const {program,metrics,daily,recent_referrals:recent=[]}=data,clicks=Number(metrics.clicks_30d||0),referrals30=(daily||[]).reduce((sum,row)=>sum+Number(row.referrals||0),0),conversion=clicks?Math.round(referrals30/clicks*1000)/10:0;
  $('#affiliate-academy-link').value=`${location.origin}/?ref=${program.slug}#offres`;
  $('#affiliate-coaching-link').value=`${location.origin}/decouvrir-coaching?ref=${program.slug}`;
  $('#affiliate-code').value=program.promo_code;
  const cards=[clicks,Number(metrics.referrals_total||0),`${conversion.toLocaleString('fr-FR')} %`,euro(metrics.pending_commission)];
  document.querySelectorAll('#affiliate-metrics article strong').forEach((node,index)=>node.textContent=cards[index]);
  $('#affiliate-academy-rate').textContent=`${Number(program.academy_commission_rate).toLocaleString('fr-FR')} %`;
  $('#affiliate-coaching-rate').textContent=`${Number(program.coaching_commission_rate).toLocaleString('fr-FR')} %`;
  $('#affiliate-attribution-window').textContent=`Attribution conservée ${program.attribution_days} jours`;
  renderChart(daily||[]);
  $('#affiliate-referral-list').innerHTML=recent.length?recent.map(row=>`<article><div><span class="affiliate-referral-avatar">${esc(row.member_name?.[0]||'M')}</span><span><strong>${esc(row.member_name||'Membre')}</strong><small>${row.offer==='coaching'?'Coaching':'Académie'} · ${date(row.attributed_at)}</small></span></div><span class="affiliate-referral-status" data-status="${esc(row.status)}">${esc(statusLabel(row.status))}</span><strong>${euro(row.commission_amount)}</strong></article>`).join(''):'<p>Aucune attribution pour le moment. Votre prochain partage peut être le premier.</p>';
}

document.addEventListener('click',async event=>{
  const button=event.target.closest('[data-copy]');if(!button)return;
  const input=document.getElementById(button.dataset.copy);await navigator.clipboard.writeText(input.value);button.textContent='Copié ✓';$('#affiliate-copy-status').textContent='Copié dans le presse-papiers.';setTimeout(()=>button.textContent='Copier',1800);
});

async function initialize(){
  const status=$('#affiliate-page-status'),retry=$('#affiliate-retry');
  retry.hidden=true;status.textContent='Chargement de votre espace d’affiliation…';
  const user=(await supabase.auth.getSession()).data.session?.user;
  if(!user){location.replace('/#connexion');return;}
  let result=await supabase.rpc('get_affiliate_dashboard');
  if(result.error){await new Promise(resolve=>setTimeout(resolve,650));result=await supabase.rpc('get_affiliate_dashboard');}
  const {data,error}=result;
  if(error||!data){status.textContent='Votre espace d’affiliation n’a pas pu être chargé. Vous restez sur cette page : réessayez dans un instant.';retry.hidden=false;return;}
  status.textContent='';
  renderDashboard(data);
}
$('#affiliate-retry').addEventListener('click',initialize);
window.addEventListener('stoa:affiliate-shell-unavailable',()=>{const status=$('#affiliate-page-status'),retry=$('#affiliate-retry');status.textContent='La navigation membre répond lentement. Votre espace reste ouvert : réessayez dans un instant.';retry.hidden=false;});
initialize();
