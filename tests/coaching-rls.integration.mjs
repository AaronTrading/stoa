import test from 'node:test';
import assert from 'node:assert/strict';

const url=process.env.SUPABASE_URL?.replace(/\/$/,'');
const publicKey=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY;
const secretKey=process.env.SUPABASE_SECRET_KEY;
if(!url||!publicKey||!secretKey)throw new Error('SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY et SUPABASE_SECRET_KEY sont requis.');

const created=[];
const call=async(path,{method='GET',key=secretKey,token=key,body,headers={}}={})=>{
  const response=await fetch(`${url}${path}`,{method,headers:{apikey:key,Authorization:`Bearer ${token}`,...(body?{'Content-Type':'application/json'}:{}),...headers},body:body?JSON.stringify(body):undefined});
  const text=await response.text();let data;try{data=text?JSON.parse(text):null}catch{data=text}
  if(!response.ok)throw new Error(`${method} ${path}: ${response.status} ${typeof data==='string'?data:JSON.stringify(data)}`);
  return data;
};
const createUser=async(label)=>{const stamp=`${Date.now()}-${Math.random().toString(36).slice(2)}`,email=`stoa-rls-${label}-${stamp}@example.test`,password=`Stoa-${stamp}-A7!`;const user=await call('/auth/v1/admin/users',{method:'POST',body:{email,password,email_confirm:true,user_metadata:{username:`rls_${label}_${stamp.replaceAll('-','_')}`}}});created.push(user.id);const session=await call('/auth/v1/token?grant_type=password',{method:'POST',key:publicKey,token:publicKey,body:{email,password}});return{id:user.id,token:session.access_token};};
const rest=(path,options={})=>call(`/rest/v1/${path}`,options);

test('RLS isole deux clients et limite le coach à ses affectations',async()=>{
  const coach=await createUser('coach'),clientA=await createUser('a'),clientB=await createUser('b');
  try{
    await rest('coaching_staff',{method:'POST',body:{user_id:coach.id},headers:{Prefer:'return=minimal'}});
    await rest('coaching_clients',{method:'POST',body:[{client_id:clientA.id,coach_id:coach.id,status:'active'},{client_id:clientB.id,coach_id:null,status:'active'}],headers:{Prefer:'return=minimal'}});
    const goals=await rest('coaching_goals',{method:'POST',body:[{client_id:clientA.id,title:'Objectif A',created_by:coach.id},{client_id:clientB.id,title:'Objectif B',created_by:coach.id}],headers:{Prefer:'return=representation'}});
    await rest('coaching_plans',{method:'POST',body:[{client_id:clientA.id,title:'Plan publié',status:'active',visible_to_client:true,created_by:coach.id},{client_id:clientA.id,title:'Brouillon privé',status:'draft',visible_to_client:false,created_by:coach.id}],headers:{Prefer:'return=minimal'}});
    await rest('coaching_notes',{method:'POST',body:{client_id:clientA.id,author_id:coach.id,content:'Note confidentielle'},headers:{Prefer:'return=minimal'}});

    const ownGoals=await rest('coaching_goals?select=client_id,title',{key:publicKey,token:clientA.token});
    assert.deepEqual(ownGoals.map(row=>row.title),['Objectif A']);
    const hiddenNotes=await rest('coaching_notes?select=id',{key:publicKey,token:clientA.token});
    assert.deepEqual(hiddenNotes,[]);
    const visiblePlans=await rest('coaching_plans?select=title',{key:publicKey,token:clientA.token});
    assert.deepEqual(visiblePlans.map(row=>row.title),['Plan publié']);
    await rest(`coaching_goals?id=eq.${goals[0].id}`,{method:'PATCH',key:publicKey,token:clientA.token,body:{progress:50},headers:{Prefer:'return=minimal'}});
    const forbiddenEdit=await fetch(`${url}/rest/v1/coaching_goals?id=eq.${goals[0].id}`,{method:'PATCH',headers:{apikey:publicKey,Authorization:`Bearer ${clientA.token}`,'Content-Type':'application/json'},body:JSON.stringify({title:'Titre détourné'})});
    assert.ok(forbiddenEdit.status>=400);
    const coachGoals=await rest('coaching_goals?select=client_id,title',{key:publicKey,token:coach.token});
    assert.deepEqual(coachGoals.map(row=>row.title),['Objectif A']);
    const summaries=await call('/rest/v1/rpc/get_coaching_client_summaries',{method:'POST',key:publicKey,token:coach.token,body:{}});
    assert.deepEqual(summaries.map(row=>row.client_id),[clientA.id]);

    const forbidden=await fetch(`${url}/rest/v1/coaching_goals`,{method:'POST',headers:{apikey:publicKey,Authorization:`Bearer ${clientA.token}`,'Content-Type':'application/json'},body:JSON.stringify({client_id:clientB.id,title:'Intrusion',created_by:clientA.id})});
    assert.ok(forbidden.status>=400);
  }finally{
    for(const id of created.reverse())await call(`/auth/v1/admin/users/${id}`,{method:'DELETE'}).catch(()=>{});
  }
});
