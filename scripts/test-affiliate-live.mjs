import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const env=Object.fromEntries(readFileSync(new URL('../.env',import.meta.url),'utf8').split(/\r?\n/).filter(line=>line&&!line.startsWith('#')&&line.includes('=')).map(line=>{const index=line.indexOf('=');return[line.slice(0,index),line.slice(index+1)];}));
const base=env.SUPABASE_URL,serviceKey=env.SUPABASE_SECRET_KEY,publicKey=env.SUPABASE_PUBLISHABLE_KEY||env.SUPABASE_ANON_KEY;
assert.ok(base&&serviceKey&&publicKey,'Configuration Supabase incomplète');
const serviceHeaders={apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,'Content-Type':'application/json'};
const suffix=`${Date.now()}${Math.random().toString(16).slice(2,8)}`,email=`affiliate-live-${suffix}@example.invalid`,password=`Stoa-${suffix}-Secure!`,slug=`test-${suffix}`.slice(0,40),code=`TEST-${suffix}`.toUpperCase().slice(0,32);
let userId='';
const json=async response=>{const body=await response.json().catch(()=>null);assert.ok(response.ok,JSON.stringify(body));return body;};
try{
  const created=await json(await fetch(`${base}/auth/v1/admin/users`,{method:'POST',headers:serviceHeaders,body:JSON.stringify({email,password,email_confirm:true,user_metadata:{first_name:'Test',last_name:'Affiliation'}})}));
  userId=created.id;
  await json(await fetch(`${base}/rest/v1/academy_entitlements`,{method:'POST',headers:{...serviceHeaders,Prefer:'return=representation'},body:JSON.stringify({user_id:userId,status:'active',source:'manual',note:'Test automatisé temporaire'})}));
  await json(await fetch(`${base}/rest/v1/affiliate_programs`,{method:'POST',headers:{...serviceHeaders,Prefer:'return=representation'},body:JSON.stringify({user_id:userId,slug,promo_code:code,discount_label:'Test affilié',commission_rate:12.5,attribution_days:30,status:'active'})}));
  const visitor=`visitor-${suffix}`.padEnd(20,'0');
  const tracked=await json(await fetch(`${base}/rest/v1/rpc/track_affiliate_visit`,{method:'POST',headers:{apikey:publicKey,'Content-Type':'application/json'},body:JSON.stringify({p_reference:slug,p_visitor_token:visitor,p_landing_path:'/?ref=test'})}));
  assert.equal(tracked[0]?.promo_code,code);
  const login=await json(await fetch(`${base}/auth/v1/token?grant_type=password`,{method:'POST',headers:{apikey:publicKey,'Content-Type':'application/json'},body:JSON.stringify({email,password})}));
  const userHeaders={apikey:publicKey,Authorization:`Bearer ${login.access_token}`,'Content-Type':'application/json'};
  const dashboard=await json(await fetch(`${base}/rest/v1/rpc/get_affiliate_dashboard`,{method:'POST',headers:userHeaders,body:'{}'}));
  assert.equal(dashboard.program.slug,slug);assert.equal(Number(dashboard.metrics.clicks_30d),1);
  const shell=await json(await fetch(`${base}/rest/v1/rpc/get_academy_shell_context`,{method:'POST',headers:userHeaders,body:'{}'}));
  assert.equal(shell.has_academy_access,true);assert.equal(shell.has_affiliate,true);
  console.log(JSON.stringify({database:'ok',public_tracking:'ok',affiliate_dashboard:'ok',conditional_navigation:'ok'}));
}finally{
  if(userId)await fetch(`${base}/auth/v1/admin/users/${userId}`,{method:'DELETE',headers:serviceHeaders});
}
