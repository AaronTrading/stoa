import fs from 'node:fs';

const env = Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(Boolean).filter(line=>!line.trim().startsWith('#')).map(line=>{
  const index=line.indexOf('='); return index<0?[line,'']:[line.slice(0,index),line.slice(index+1)];
}));
const secret=env.STRIPE_SECRET_KEY;
if(!secret)throw new Error('STRIPE_SECRET_KEY absent de .env');
const stripe=async(path,{method='GET',body}={})=>{
  const response=await fetch(`https://api.stripe.com/v1${path}`,{method,headers:{Authorization:`Bearer ${secret}`,...(body?{'Content-Type':'application/x-www-form-urlencoded'}:{})},body:body?new URLSearchParams(body):undefined});
  const value=await response.json();if(!response.ok)throw new Error(value?.error?.message||`Stripe ${response.status}`);return value;
};

const found=await stripe(`/products/search?${new URLSearchParams({query:`metadata['stoa_offer']:'olive_oil'`,limit:'10'})}`);
let product=found.data.find(item=>item.active);
if(!product)product=await stripe('/products',{method:'POST',body:{
  name:'Huile d’olive bio extra vierge STOA — 1 L',
  description:'Huile d’olive vierge extra biologique grecque, issue d’olives Koroneïki. Format 1 litre.',
  'images[0]':'https://stoa-coaching.fr/assets/coaching/huile-stoa.png',
  'metadata[stoa_offer]':'olive_oil',
}});

const prices=await stripe(`/prices?${new URLSearchParams({product:product.id,active:'true',limit:'100'})}`);
let price=prices.data.find(item=>item.currency==='eur'&&item.unit_amount===2999&&item.type==='one_time');
if(!price)price=await stripe('/prices',{method:'POST',body:{product:product.id,currency:'eur',unit_amount:'2999','metadata[stoa_offer]':'olive_oil'}});

const links=await stripe('/payment_links?active=true&limit=100');
let link=links.data.find(item=>item.metadata?.stoa_offer==='olive_oil');
if(!link){
  const countries=['AT','BE','BG','HR','CY','CZ','DE','DK','EE','ES','FI','FR','GR','HU','IE','IT','LT','LU','LV','MT','NL','PL','PT','RO','SE','SI','SK'];
  const body={
    'line_items[0][price]':price.id,'line_items[0][quantity]':'1',allow_promotion_codes:'true',billing_address_collection:'required',
    'phone_number_collection[enabled]':'true','invoice_creation[enabled]':'true','managed_payments[enabled]':'false','metadata[stoa_offer]':'olive_oil',
    'after_completion[type]':'redirect','after_completion[redirect][url]':'https://stoa-coaching.fr/boutique?commande=confirmee',
  };
  countries.forEach((country,index)=>{body[`shipping_address_collection[allowed_countries][${index}]`]=country;});
  link=await stripe('/payment_links',{method:'POST',body});
}
console.log(JSON.stringify({productId:product.id,priceId:price.id,paymentLink:link.url},null,2));
