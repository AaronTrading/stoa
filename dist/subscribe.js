import { supabase } from './supabase.js';
import { academyOffer,formatAcademyPrice } from './commercial-config.js';

const button=document.querySelector('#subscribe-start'),status=document.querySelector('#subscribe-status');
document.querySelectorAll('[data-academy-first-month-price]').forEach(node=>node.textContent=formatAcademyPrice(academyOffer.firstMonthPrice));
document.querySelectorAll('[data-academy-recurring-price]').forEach(node=>node.textContent=formatAcademyPrice(academyOffer.recurringPrice));
document.querySelectorAll('[data-year]').forEach(node=>node.textContent=new Date().getFullYear());
if(new URLSearchParams(location.search).has('annule'))status.textContent='Le paiement a été annulé. Aucun prélèvement n’a été effectué.';

let user,hasAccess=false;
const setBusy=busy=>{button.disabled=busy;button.setAttribute('aria-busy',String(busy));};
async function initialize(){user=(await supabase.auth.getSession()).data.session?.user;if(!user){button.textContent='Créer un compte ou se connecter';return;}const {data,error}=await supabase.rpc('has_active_academy_access',{p_user_id:user.id});if(!error&&data){hasAccess=true;button.innerHTML='Accéder à l’Académie <span>→</span>';status.textContent='Votre accès est actif.';}}
button.addEventListener('click',async()=>{if(!user){document.querySelector('[data-auth-link]')?.click();return;}if(hasAccess){location.assign('/accueil');return;}setBusy(true);status.textContent='Ouverture du paiement sécurisé…';const {data,error}=await supabase.functions.invoke('create-checkout',{body:{offer:'academy'}});setBusy(false);if(error||!data?.url){status.textContent=data?.error||error?.message||'Le paiement ne peut pas être ouvert pour le moment.';return;}location.assign(data.url);});
initialize();
