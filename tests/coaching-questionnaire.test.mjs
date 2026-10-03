import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source=await readFile(new URL('../dist/coaching-questionnaire.js',import.meta.url),'utf8');
const questionnaire=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const { coachingQuestionnaire,isQuestionVisible,visibleQuestions,validateCoachingStep }=questionnaire;

test('le questionnaire comporte 12 étapes et des clés uniques',()=>{
  assert.equal(coachingQuestionnaire.length,12);
  const questions=coachingQuestionnaire.flatMap(step=>step.questions);
  assert.ok(questions.length>=70,`${questions.length} questions seulement`);
  assert.equal(new Set(questions.map(question=>question.key)).size,questions.length);
});

test('la branche activité masque les questions devenues inutiles',()=>{
  const step=coachingQuestionnaire.find(item=>item.key==='corps');
  const inactive=visibleQuestions(step,{active_now:'Non'}).map(question=>question.key);
  assert.ok(inactive.includes('inactive_reason'));
  assert.ok(!inactive.includes('activity_types'));
  const strength=visibleQuestions(step,{active_now:'Oui',activity_types:['Musculation']}).map(question=>question.key);
  assert.ok(strength.includes('strength_experience'));
  assert.ok(!strength.includes('inactive_reason'));
});

test('les détails de vigilance suivent la réponse précédente',()=>{
  const step=coachingQuestionnaire.find(item=>item.key==='vigilance');
  const details=step.questions.find(question=>question.key==='professional_constraints_details');
  assert.equal(isQuestionVisible(details,{professional_constraints:'Non'}),false);
  assert.equal(isQuestionVisible(details,{professional_constraints:'Oui'}),true);
});

test('la validation exige les consentements explicites',()=>{
  const step=coachingQuestionnaire.find(item=>item.key==='confirmation');
  assert.deepEqual(validateCoachingStep(step,{}).map(question=>question.key),['accuracy_confirmed','privacy_confirmed']);
  assert.equal(validateCoachingStep(step,{accuracy_confirmed:true,privacy_confirmed:true}).length,0);
});
