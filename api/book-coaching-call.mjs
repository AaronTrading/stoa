import { createHmac } from 'node:crypto';

const supabaseUrl=process.env.SUPABASE_URL||'';
const publishableKey=process.env.SUPABASE_PUBLISHABLE_KEY||process.env.SUPABASE_ANON_KEY||'';
const secretKey=process.env.SUPABASE_SERVICE_ROLE_KEY||process.env.SUPABASE_SECRET_KEY||'';
const sender=process.env.GMAIL_SENDER_EMAIL||'coaching.stoa@gmail.com';
const siteUrl=(process.env.SITE_URL||'https://stoa-coaching.fr').replace(/\/$/,'');

const clean=value=>String(value||'').replace(/[\r\n]+/g,' ').trim();
const html=value=>String(value||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const encoded=value=>`=?UTF-8?B?${Buffer.from(value,'utf8').toString('base64')}?=`;
const base64Url=value=>Buffer.from(value,'utf8').toString('base64url');
async function rest(path,{method='GET',body,authorization=secretKey}={}){const response=await fetch(`${supabaseUrl}${path}`,{method,headers:{apikey:secretKey,Authorization:`Bearer ${authorization}`,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});const text=await response.text(),payload=text?JSON.parse(text):null;if(!response.ok)throw new Error(payload?.message||payload?.error_description||`Supabase ${response.status}`);return payload;}
async function userFromRequest(request){const jwt=String(request.headers.authorization||'').replace(/^Bearer\s+/i,'');if(!jwt)return null;const response=await fetch(`${supabaseUrl}/auth/v1/user`,{headers:{apikey:publishableKey,Authorization:`Bearer ${jwt}`}});const user=await response.json();return response.ok&&user?.id?user:null;}
async function gmailToken(){const clientId=process.env.GMAIL_CLIENT_ID,clientSecret=process.env.GMAIL_CLIENT_SECRET,refreshToken=process.env.GMAIL_REFRESH_TOKEN;if(!clientId||!clientSecret||!refreshToken)throw new Error('Notifications Gmail non configurées.');const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({client_id:clientId,client_secret:clientSecret,refresh_token:refreshToken,grant_type:'refresh_token'}),signal:AbortSignal.timeout(8000)});const payload=await response.json();if(!response.ok||!payload.access_token)throw new Error('Connexion Gmail impossible.');return payload.access_token;}
async function sendMail(token,to,subject,text,bodyHtml){if(!token||!to)throw new Error('Destinataire de notification manquant.');const boundary=`stoa_${crypto.randomUUID().replaceAll('-','')}`,raw=[`From: STOA <${sender}>`,`To: ${clean(to)}`,`Subject: ${encoded(clean(subject))}`,'MIME-Version: 1.0',`Content-Type: multipart/alternative; boundary="${boundary}"`,'',`--${boundary}`,'Content-Type: text/plain; charset=UTF-8','',text,`--${boundary}`,'Content-Type: text/html; charset=UTF-8','',bodyHtml,`--${boundary}--`,''].join('\r\n');const response=await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send',{method:'POST',headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({raw:base64Url(raw)}),signal:AbortSignal.timeout(10000)});if(!response.ok)throw new Error('Notification Gmail impossible.');}
async function verifyCaptcha(token,ip){const secret=process.env.TURNSTILE_SECRET_KEY;if(!secret)return process.env.VERCEL_ENV!=='production';if(!token)return false;const result=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({secret,response:String(token),remoteip:ip}),signal:AbortSignal.timeout(8000)});const payload=await result.json().catch(()=>({}));return Boolean(result.ok&&payload.success);}
const requestIp=request=>clean(String(request.headers['x-vercel-forwarded-for']||request.headers['x-forwarded-for']||request.socket?.remoteAddress||'unknown').split(',')[0]);
const fingerprint=value=>createHmac('sha256',process.env.BOOKING_RATE_LIMIT_SECRET||secretKey).update(value).digest('hex');
const formatDate=value=>new Intl.DateTimeFormat('fr-FR',{dateStyle:'full',timeStyle:'short',timeZone:'Europe/Paris'}).format(new Date(value));

export default async function handler(request,response){
  if(request.method==='OPTIONS')return response.status(204).end();
  if(!supabaseUrl||!publishableKey||!secretKey)return response.status(500).json({error:'Configuration serveur incomplète.'});
  try{
    if(request.method==='GET'){
      await rest('/rest/v1/rpc/cleanup_stale_coaching_booking_holds',{method:'POST',body:{}});
      const slots=await rest('/rest/v1/coaching_availability_slots?status=eq.available&starts_at=gte.'+encodeURIComponent(new Date(Date.now()+8*3600000).toISOString())+'&select=id,starts_at,duration_minutes&order=starts_at.asc&limit=80');
      return response.status(200).json({slots,turnstileSiteKey:process.env.TURNSTILE_SITE_KEY||''});
    }
    if(request.method!=='POST')return response.status(405).json({error:'Méthode non autorisée.'});
    const user=await userFromRequest(request),body=request.body||{},email=clean(body.email).toLowerCase(),ip=requestIp(request);
    if(!body.slotId||!clean(body.firstName)||!clean(body.lastName)||!/^\S+@\S+\.\S+$/.test(email)||!clean(body.addressLine1)||!clean(body.postalCode)||!clean(body.city)||!clean(body.country))return response.status(400).json({error:'Complétez les champs obligatoires.'});
    if(!user&&!await verifyCaptcha(body.captchaToken,ip))return response.status(400).json({error:'Validez la protection anti-robot avant de réserver.'});
    const [deviceAllowed,emailAllowed]=await Promise.all([
      rest('/rest/v1/rpc/consume_booking_rate_limit',{method:'POST',body:{p_fingerprint:`device:${fingerprint(`${ip}|${String(request.headers['user-agent']||'').slice(0,240)}`)}`,p_max_attempts:5,p_window_minutes:60}}),
      rest('/rest/v1/rpc/consume_booking_rate_limit',{method:'POST',body:{p_fingerprint:`email:${fingerprint(email)}`,p_max_attempts:3,p_window_minutes:1440}})
    ]);
    if(!deviceAllowed||!emailAllowed)return response.status(429).json({error:'Trop de tentatives. Réessayez plus tard.'});
    const rows=await rest('/rest/v1/rpc/book_coaching_call',{method:'POST',body:{p_slot_id:body.slotId,p_user_id:user?.id||null,p_first_name:clean(body.firstName).slice(0,80),p_last_name:clean(body.lastName).slice(0,80),p_email:email,p_phone:clean(body.phone).slice(0,40)||null,p_address_line1:clean(body.addressLine1).slice(0,200),p_address_line2:clean(body.addressLine2).slice(0,200)||null,p_postal_code:clean(body.postalCode).slice(0,30),p_city:clean(body.city).slice(0,100),p_country:clean(body.country).slice(0,100),p_reason:clean(body.reason).slice(0,1500),p_stage:body.stage==='post_purchase'?'post_purchase':'pre_purchase'}}),booking=rows?.[0];
    if(!booking)throw new Error('Réservation introuvable.');
    try{
      const when=formatDate(booking.starts_at),token=await gmailToken(),details=`${clean(body.firstName)} ${clean(body.lastName)} · ${email}${clean(body.phone)?` · ${clean(body.phone)}`:''}`;
      await sendMail(token,booking.coach_email,'Nouvel appel Coaching STOA',`Un appel a été réservé le ${when}.\n${details}\nMotif : ${clean(body.reason)||'Non renseigné'}`,`<div style="font-family:Arial,sans-serif;line-height:1.65;color:#293127"><h1 style="font-family:Georgia,serif;font-weight:500">Nouvel appel Coaching</h1><p><strong>${html(when)}</strong></p><p>${html(details)}</p><p>${html(clean(body.reason)||'Aucun motif renseigné.')}</p></div>`);
      await sendMail(token,email,'Votre appel Coaching STOA est confirmé',`Votre appel de 15 minutes est confirmé le ${when}.\nPour modifier votre demande, contactez ${sender}.`, `<div style="font-family:Arial,sans-serif;line-height:1.65;color:#293127"><h1 style="font-family:Georgia,serif;font-weight:500">Votre rendez-vous est confirmé.</h1><p>Nous vous retrouverons le <strong>${html(when)}</strong>.</p><p>Ce premier échange de 15 minutes est gratuit. Votre adresse est collectée pour organiser la livraison de votre cadeau de bienvenue si vous rejoignez le Coaching.</p><p><a href="${siteUrl}">STOA Coaching</a></p></div>`);
      const confirmed=await rest('/rest/v1/rpc/confirm_coaching_booking_notifications',{method:'POST',body:{p_booking_id:booking.booking_id}});
      if(!confirmed)throw new Error('Confirmation transactionnelle impossible.');
    }catch(notificationError){
      await rest('/rest/v1/rpc/release_coaching_booking_hold',{method:'POST',body:{p_booking_id:booking.booking_id}}).catch(()=>null);
      throw notificationError;
    }
    return response.status(201).json({ok:true,bookingId:booking.booking_id,startsAt:booking.starts_at});
  }catch(error){console.error('book-coaching-call',error);const message=error instanceof Error?error.message:'',conflict=/unavailable|already exists/i.test(message);return response.status(conflict?409:503).json({error:message.includes('eight hours')?'Ce créneau doit être réservé au moins 8 heures à l’avance.':message.includes('already exists')?'Vous avez déjà un appel à venir. Contactez STOA pour le modifier.':message.includes('unavailable')?'Ce créneau vient d’être réservé. Choisissez-en un autre.':'La réservation n’a pas été confirmée. Aucun créneau ne vous a été bloqué.'});}
}
