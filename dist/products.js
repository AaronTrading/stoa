import { oliveOffer } from './commercial-config.js';

const price=new Intl.NumberFormat('fr-FR',{style:'currency',currency:oliveOffer.currency,minimumFractionDigits:2}).format(oliveOffer.price);
document.querySelectorAll('[data-olive-price]').forEach(node=>{node.textContent=price;});
document.querySelectorAll('[data-olive-checkout]').forEach(link=>{link.href=oliveOffer.paymentLink;link.rel='noopener';});
document.querySelectorAll('[data-year]').forEach(node=>{node.textContent=new Date().getFullYear();});

if(new URLSearchParams(location.search).get('commande')==='confirmee'){
  const confirmation=document.querySelector('[data-order-confirmation]');
  if(confirmation){confirmation.hidden=false;confirmation.scrollIntoView({behavior:'smooth',block:'center'});}
}
