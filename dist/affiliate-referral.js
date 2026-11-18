import { supabase } from './supabase.js';
import { normalizeAffiliateReference } from './affiliate-utils.js';

export const AFFILIATE_STORAGE_KEY='stoa-affiliate-attribution-v1';
export { normalizeAffiliateReference } from './affiliate-utils.js';

const readStored=()=>{
  try{
    const value=JSON.parse(localStorage.getItem(AFFILIATE_STORAGE_KEY)||'null');
    if(value?.slug&&Number(value.expiresAt)>Date.now())return value;
  }catch{}
  localStorage.removeItem(AFFILIATE_STORAGE_KEY);
  return null;
};

const visitorToken=()=>{
  const key='stoa-affiliate-visitor-v1',existing=localStorage.getItem(key);
  if(existing)return existing;
  const bytes=new Uint8Array(18);crypto.getRandomValues(bytes);
  const token=[...bytes].map(value=>value.toString(16).padStart(2,'0')).join('');
  localStorage.setItem(key,token);return token;
};

const persist=row=>{
  const value={slug:row.slug,promoCode:row.promo_code,discountLabel:row.discount_label,expiresAt:Date.now()+Number(row.attribution_days||30)*86400000};
  localStorage.setItem(AFFILIATE_STORAGE_KEY,JSON.stringify(value));
  window.dispatchEvent(new CustomEvent('stoa:affiliate-attribution',{detail:value}));
  return value;
};

export const getAffiliateAttribution=()=>readStored();

export async function resolveAffiliateReference(reference,{track=false}={}){
  const clean=normalizeAffiliateReference(reference);if(!clean)return null;
  const rpc=track?'track_affiliate_visit':'resolve_affiliate_reference';
  const params=track?{p_reference:clean,p_visitor_token:visitorToken(),p_landing_path:`${location.pathname}${location.search}${location.hash}`}:{p_reference:clean};
  const {data,error}=await supabase.rpc(rpc,params);
  if(error)return null;
  const row=Array.isArray(data)?data[0]:data;
  return row?.slug?persist(row):null;
}

export async function initializeAffiliateAttribution(){
  const params=new URLSearchParams(location.search),reference=params.get('ref')||params.get('code');
  if(reference)return resolveAffiliateReference(reference,{track:true});
  return readStored();
}

