import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read=path=>readFile(new URL(path,import.meta.url),'utf8');
const [access,billing,booking,webhook,checkout,emailApi,auth,bookingPage,bookingJs,coachPage,coachJs,questionnaire,styles,posts]=await Promise.all([
  read('../supabase/migrations/202610040049_access_and_data_integrity.sql'),
  read('../supabase/migrations/202610040050_monotone_billing_and_email_jobs.sql'),
  read('../supabase/migrations/202610040051_coaching_call_booking.sql'),
  read('../supabase/functions/stripe-webhook/index.ts'),
  read('../supabase/functions/create-checkout/index.ts'),
  read('../api/email-center-send.mjs'),
  read('../dist/auth.js'),
  read('../dist/rendez-vous.html'),
  read('../dist/booking.js'),
  read('../dist/coaching-coach.html'),
  read('../dist/coaching-coach.js'),
  read('../dist/coaching-questionnaire.js'),
  read('../dist/styles.css'),
  read('../dist/posts.js'),
]);

test('Community, notifications and support require the Academy entitlement',()=>{
  for(const table of ['channels','messages','message_reactions','community_posts','community_post_comments','community_notifications','support_messages'])assert.match(access,new RegExp(`on public\\.${table}[\\s\\S]{0,220}has_active_academy_access`));
  assert.match(access,/get_channel_messages[\s\S]*where public\.has_active_academy_access\(\)/);
  assert.match(access,/get_community_profiles[\s\S]*where public\.has_active_academy_access\(\)/);
});

test('sensitive Coaching and support fields are protected by triggers',()=>{
  assert.match(access,/protect_support_message_update/);
  assert.match(access,/protect_coaching_questionnaire_client_update/);
  assert.match(access,/protect_coaching_checkin_client_update/);
  assert.match(access,/coaching_habit_logs_habit_client_fkey/);
  assert.match(access,/submit_my_coaching_checkin/);
});

test('Stripe events are monotone and only configured prices are accepted',()=>{
  assert.match(billing,/last_stripe_event_created_at/);
  assert.match(billing,/excluded\.last_stripe_event_created_at,excluded\.last_stripe_event_priority,excluded\.last_stripe_event_id/);
  assert.match(webhook,/UNRECOGNIZED_STRIPE_PRICE/);
  assert.match(checkout,/subscriptions\.list/);
});

test('Email campaigns use an atomic lease and skip delivered recipients',()=>{
  assert.match(billing,/claim_email_campaign/);
  assert.match(billing,/send_lease_expires_at/);
  assert.match(emailApi,/status=eq\.sent/);
  assert.match(emailApi,/multipart\/alternative/);
});

test('password recovery and profile repair are implemented',()=>{
  assert.match(auth,/resetPasswordForEmail/);
  assert.match(auth,/PASSWORD_RECOVERY/);
  assert.match(auth,/updateUser\(\{ password \}\)/);
  assert.match(access,/ensure_my_profile/);
});

test('Coaching booking is atomic, announced by email and mandatory for checkout',()=>{
  assert.match(booking,/for update/);
  assert.match(booking,/interval '8 hours'/);
  assert.match(booking,/complete_coaching_onboarding[\s\S]*coaching_call_bookings/);
  assert.match(checkout,/booking_required/);
  assert.match(checkout,/shipping_address_collection/);
  assert.match(bookingPage,/Adresse de livraison/);
  assert.match(bookingJs,/api\/book-coaching-call/);
  assert.match(coachJs,/coaching_availability_slots/);
  assert.match(coachPage,/coach-calendar-grid/);
  assert.match(coachPage,/data-calendar-preset="morning"/);
  assert.match(coachJs,/toggleAvailability/);
});

test('the Coaching interface translates questionnaire metadata and legacy values',()=>{
  assert.match(coachJs,/coachingSectionLabel\(row\.section_key\)/);
  assert.match(coachJs,/coachingQuestionLabel\(row\.question_key\)/);
  assert.match(coachJs,/formatCoachingAnswer\(row\.question_key,row\.answer\)/);
  assert.doesNotMatch(coachJs,/JSON\.stringify\(row\.answer\)/);
  assert.match(questionnaire,/birth_date',label:'Date de naissance'/);
  assert.match(questionnaire,/batch cooking possible':'Préparation en série possible'/);
  assert.match(questionnaire,/challengeant:'Exigeant'/);
  assert.doesNotMatch(coachPage,/>Onboarding</);
  assert.doesNotMatch(coachPage,/>Check-in/);
});

test('the Coach workspace uses the same breakpoint as the Academy sidebar',()=>{
  assert.match(styles,/@media\(min-width:1121px\)\{\s*body\.academy-experience\.coaching-coach-page>main\.coach-workspace\{\s*width:auto!important/);
  assert.match(styles,/@media\(max-width:1120px\)\{\s*body\.academy-experience\.coaching-coach-page>main\.coach-workspace\{\s*width:100%!important/);
  assert.match(styles,/\.coach-response-grid\{\s*grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
});

test('community uploads use a separate bounded image bucket',()=>{
  assert.match(access,/values\('community-assets'.*8388608/);
  assert.match(access,/image\/jpeg.*image\/png.*image\/webp/);
  assert.match(posts,/community-assets/);
});
