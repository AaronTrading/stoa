import { supabase } from './supabase.js';
import { coachingOffer,formatCommercialPrice } from './commercial-config.js';

const track=(name,detail={})=>{if(Array.isArray(window.dataLayer))window.dataLayer.push({event:name,...detail});window.dispatchEvent(new CustomEvent('stoa:commercial-event',{detail:{name,...detail}}));};
const setCommercialCopy=()=>{document.querySelectorAll('[data-coaching-duration]').forEach(node=>node.textContent=`${coachingOffer.durationMonths} mois`);document.querySelectorAll('[data-coaching-regular-price]').forEach(node=>node.textContent=formatCommercialPrice(coachingOffer.regularPrice));document.querySelectorAll('[data-coaching-launch-price]').forEach(node=>node.textContent=formatCommercialPrice(coachingOffer.launchPrice));};
const showCheckoutStatus=message=>document.querySelectorAll('.coaching-checkout-status').forEach(node=>node.textContent=message);

window.addEventListener('stoa:coaching-purchase-completed',event=>track('coaching_purchase_completed',event.detail||{}));

document.querySelectorAll('[data-coaching-event]').forEach(link=>link.addEventListener('click',()=>track(link.dataset.coachingEvent,{placement:link.closest('section')?.className||'page'})));
document.querySelectorAll('[data-start-coaching]').forEach(button=>button.addEventListener('click',()=>{track('coaching_cta_click',{placement:button.closest('section')?.id||button.closest('section')?.className||'page'});if(coachingOffer.checkoutUrl){track('coaching_checkout_started',{offer:coachingOffer.name,price:coachingOffer.launchPrice});location.assign(coachingOffer.checkoutUrl);return;}showCheckoutStatus('Le paiement sécurisé sera ouvert prochainement. Votre accès actuel reste inchangé.');button.closest('section')?.querySelector('.coaching-checkout-status')?.scrollIntoView({behavior:'smooth',block:'nearest'});}));

const pricing=document.querySelector('[data-coaching-pricing]');if(pricing)new IntersectionObserver((entries,observer)=>{if(entries.some(entry=>entry.isIntersecting)){track('coaching_pricing_view',{offer:coachingOffer.name,price:coachingOffer.launchPrice});observer.disconnect();}},{threshold:.35}).observe(pricing);

async function initialize(){const user=(await supabase.auth.getSession()).data.session?.user;if(!user){location.replace('/#connexion');return;}const [{data:profile},{data:access,error}]=await Promise.all([supabase.from('profiles').select('role').eq('id',user.id).maybeSingle(),supabase.rpc('get_my_coaching_access')]);if(!['member','coaching','admin'].includes(profile?.role)){location.replace('/');return;}if(!error&&access?.length){location.replace('/coaching');return;}setCommercialCopy();track('coaching_page_view',{member:true});}
initialize();
