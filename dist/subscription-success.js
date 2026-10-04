import { supabase } from './supabase.js';

const status=document.querySelector('#subscription-success-status'),link=document.querySelector('#subscription-success-link'),loader=document.querySelector('.subscription-loader');
const wait=duration=>new Promise(resolve=>setTimeout(resolve,duration));
async function initialize(){const user=(await supabase.auth.getSession()).data.session?.user;if(!user){status.textContent='Connectez-vous avec le compte utilisé lors du paiement pour finaliser l’activation.';loader.hidden=true;return;}for(let attempt=0;attempt<15;attempt++){const {data}=await supabase.rpc('has_active_academy_access',{p_user_id:user.id});if(data){status.textContent='Votre espace est prêt.';loader.classList.add('complete');link.hidden=false;window.dispatchEvent(new CustomEvent('stoa:academy-purchase-completed',{detail:{userId:user.id}}));return;}await wait(2000);}loader.hidden=true;status.textContent='La confirmation prend plus de temps que prévu. Votre paiement n’est pas perdu : actualisez cette page dans un instant ou contactez le support STOA.';}
initialize();
