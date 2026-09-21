import { supabase } from './supabase.js';

const lesson = document.querySelector('#lesson-content');
const pencil = document.querySelector('#lesson-edit-pencil');
const bar = document.querySelector('#lesson-editor-bar');
const status = document.querySelector('#lesson-editor-status');
const imageInput = document.querySelector('#lesson-image-input');
const imageButton = document.querySelector('label[for="lesson-image-input"]');
let lessonData;
let editing = false;
let original = {};
let savedRange;
let activeEditor;
let draggedFigure;

const editableAreas = () => [...document.querySelectorAll('#lesson-title, [data-module-description], [data-subchapter-title], .lesson-subchapter-content')];
const setStatus = (text, tone = '') => { status.textContent = text; status.dataset.tone = tone; };
const escapeHtml = (value = '') => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const normalizeQuiz = (value) => {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!parsed || !Array.isArray(parsed.questions)) return { questions: [] };
    return { questions: parsed.questions.map((question) => ({ question: String(question.question || ''), answers: Array.isArray(question.answers) ? question.answers.map(String) : ['', ''], correct: Number.isInteger(Number(question.correct)) ? Number(question.correct) : 0 })) };
  } catch { return { questions: [] }; }
};

const cleanHtml = (html) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  const allowed = new Set(['P','DIV','BR','H2','H3','H4','STRONG','B','EM','I','U','A','OL','UL','LI','BLOCKQUOTE','FIGURE','IMG','FIGCAPTION','SECTION']);
  [...template.content.querySelectorAll('*')].forEach((element) => {
    if (!allowed.has(element.tagName)) { element.replaceWith(...element.childNodes); return; }
    const source = element.tagName === 'IMG' ? element.getAttribute('src') || '' : '';
    const href = element.tagName === 'A' ? element.getAttribute('href') || '' : '';
    const quiz = element.tagName === 'SECTION' ? normalizeQuiz(element.getAttribute('data-quiz')) : null;
    if (element.tagName === 'SECTION' && !quiz.questions.length) { element.remove(); return; }
    [...element.attributes].forEach((attribute) => element.removeAttribute(attribute.name));
    if (element.tagName === 'IMG') {
      if (source.startsWith('https://') || source.startsWith('/')) element.setAttribute('src', source);
      else element.remove();
      element.setAttribute('alt', ''); element.setAttribute('loading', 'lazy');
    }
    if (element.tagName === 'A') {
      if (/^(https?:\/\/|mailto:|\/|#)/i.test(href)) {
        element.setAttribute('href', href);
        if (/^https?:\/\//i.test(href)) { element.setAttribute('target', '_blank'); element.setAttribute('rel', 'noopener noreferrer'); }
      } else element.replaceWith(...element.childNodes);
    }
    if (element.tagName === 'FIGURE') element.className = 'lesson-inline-image';
    if (element.tagName === 'SECTION') { element.className = 'lesson-quiz'; element.dataset.quiz = JSON.stringify(quiz); element.replaceChildren(); }
  });
  return template.innerHTML.trim();
};

const readQuizEditor = (element) => ({ questions: [...element.querySelectorAll('.quiz-editor-question')].map((question) => ({
  question: question.querySelector('[data-quiz-question-text]').value.trim(),
  answers: [...question.querySelectorAll('[data-quiz-answer-text]')].map((input) => input.value.trim()),
  correct: Math.max(0, [...question.querySelectorAll('[data-quiz-correct]')].findIndex((radio) => radio.checked)),
})) });

const renderQuizEditor = (element, quiz) => {
  const identity = crypto.randomUUID();
  element.contentEditable = 'false';
  element.dataset.quiz = JSON.stringify(quiz);
  element.innerHTML = `<div class="quiz-editor-heading"><div><span class="eyebrow">MINI QUIZ</span><h3>Questions du sous-module</h3></div><button type="button" data-quiz-delete aria-label="Supprimer le quiz">×</button></div><div class="quiz-editor-questions">${quiz.questions.map((question, questionIndex) => `<article class="quiz-editor-question"><div class="quiz-editor-question-heading"><strong>Question ${questionIndex + 1}</strong><button type="button" data-quiz-remove-question aria-label="Supprimer cette question">×</button></div><input data-quiz-question-text value="${escapeHtml(question.question)}" placeholder="Écrivez votre question"><div class="quiz-editor-answers">${question.answers.map((answer, answerIndex) => `<label><input type="radio" name="quiz-${identity}-${questionIndex}" data-quiz-correct ${answerIndex === question.correct ? 'checked' : ''} aria-label="Bonne réponse"><input data-quiz-answer-text value="${escapeHtml(answer)}" placeholder="Réponse ${answerIndex + 1}"><button type="button" data-quiz-remove-answer aria-label="Supprimer cette réponse">×</button></label>`).join('')}</div><button type="button" class="quiz-editor-add" data-quiz-add-answer>＋ Ajouter une réponse</button></article>`).join('')}</div><button type="button" class="quiz-editor-add" data-quiz-add-question>＋ Ajouter une question</button>`;
};

const renderQuizForReader = (element) => {
  const quiz = normalizeQuiz(element.dataset.quiz);
  element.contentEditable = 'false';
  element.innerHTML = `<span class="eyebrow">MINI QUIZ</span><h3>Vérifiez ce que vous retenez.</h3><div class="lesson-quiz-questions">${quiz.questions.map((question, questionIndex) => `<fieldset data-quiz-question="${questionIndex}"><legend><span>${String(questionIndex + 1).padStart(2, '0')}</span>${escapeHtml(question.question)}</legend><div>${question.answers.map((answer, answerIndex) => `<button type="button" data-quiz-answer="${answerIndex}" aria-pressed="false"><i></i>${escapeHtml(answer)}</button>`).join('')}</div></fieldset>`).join('')}</div><div class="lesson-quiz-footer"><button type="button" class="button dark" data-quiz-check>Vérifier mes réponses</button><p role="status"></p></div>`;
};

const prepareFigures = () => {
  document.querySelectorAll('.lesson-subchapter-content figure').forEach((figure) => {
    figure.draggable = editing;
    figure.title = editing ? 'Faites glisser l’image pour la déplacer. Cliquez puis Suppr pour l’effacer.' : '';
  });
};

const enterEditMode = () => {
  if (!lessonData || editing) return;
  editing = true;
  original = { title: document.querySelector('#lesson-title').textContent, copy: document.querySelector('#lesson-copy').innerHTML };
  lesson.classList.add('lesson-editing'); pencil.hidden = true; bar.hidden = false;
  editableAreas().forEach((element) => { element.contentEditable = 'true'; element.spellcheck = true; });
  document.querySelectorAll('.lesson-quiz[data-quiz]').forEach((element) => renderQuizEditor(element, normalizeQuiz(element.dataset.quiz)));
  prepareFigures();
  document.querySelector('#lesson-title').focus();
  setStatus('Cliquez dans le texte pour le modifier.');
};

const leaveEditMode = () => {
  editing = false;
  lesson.classList.remove('lesson-editing'); pencil.hidden = false; bar.hidden = true;
  editableAreas().forEach((element) => element.removeAttribute('contenteditable'));
  document.querySelectorAll('.editor-image-selected').forEach((element) => element.classList.remove('editor-image-selected'));
  prepareFigures(); savedRange = undefined; activeEditor = undefined;
};

const restoreOriginal = () => {
  document.querySelector('#lesson-title').textContent = original.title;
  document.querySelector('#lesson-copy').innerHTML = original.copy;
  leaveEditMode();
};

const saveLesson = async () => {
  const title = document.querySelector('#lesson-title').textContent.trim();
  const description = document.querySelector('[data-module-description]')?.textContent.trim() || '';
  if (!title) { setStatus('Le titre ne peut pas être vide.', 'error'); return; }
  const quizEditors = [...document.querySelectorAll('.lesson-quiz[data-quiz]')];
  const quizzes = quizEditors.map(readQuizEditor);
  const invalidQuiz = quizzes.find((quiz) => !quiz.questions.length || quiz.questions.some((question) => !question.question || question.answers.length < 2 || question.answers.some((answer) => !answer) || question.correct < 0 || question.correct >= question.answers.length));
  if (invalidQuiz) { setStatus('Complétez chaque question, avec au moins deux réponses et une bonne réponse.', 'error'); return; }
  quizEditors.forEach((element, index) => { element.dataset.quiz = JSON.stringify(quizzes[index]); element.replaceChildren(); });
  setStatus('Enregistrement…');
  const promises = [supabase.from('modules').update({ title, description }).eq('id', lessonData.moduleId)];
  document.querySelectorAll('[data-subchapter-id]').forEach((section) => {
    const known = lessonData.sections.find((item) => item.id === section.dataset.subchapterId);
    const titleElement = section.querySelector('[data-subchapter-title]');
    const sectionTitle = titleElement?.textContent.trim() || known?.title || 'Cours';
    const content = cleanHtml(section.querySelector('.lesson-subchapter-content').innerHTML);
    promises.push(supabase.from('subchapters').update({ title: sectionTitle, content }).eq('id', section.dataset.subchapterId));
  });
  const results = await Promise.all(promises);
  const error = results.find((result) => result.error)?.error;
  if (error) { setStatus(`Échec : ${error.message}`, 'error'); return; }
  await supabase.from('subchapter_images').delete().in('subchapter_id', lessonData.sections.map((item) => item.id));
  document.querySelectorAll('.lesson-subchapter-content').forEach((element) => { element.innerHTML = cleanHtml(element.innerHTML); });
  document.querySelectorAll('.lesson-quiz[data-quiz]').forEach(renderQuizForReader);
  original = { title, copy: document.querySelector('#lesson-copy').innerHTML };
  document.title = `${title} — STOA`;
  leaveEditMode();
};

const initialize = async () => {
  lessonData = window.__STOA_LESSON_DATA__;
  if (!lessonData || pencil.dataset.ready) return;
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;
  if (!user) return;
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') return;
  pencil.dataset.ready = 'true'; pencil.hidden = false;
};

window.addEventListener('stoa:lesson-ready', initialize);
if (window.__STOA_LESSON_DATA__) initialize();
pencil?.addEventListener('click', enterEditMode);
document.querySelector('#lesson-edit-cancel')?.addEventListener('click', restoreOriginal);
document.querySelector('#lesson-edit-save')?.addEventListener('click', saveLesson);

document.addEventListener('selectionchange', () => {
  if (!editing) return;
  const selection = getSelection(); if (!selection?.rangeCount) return;
  const range = selection.getRangeAt(0), area = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
  const editor = area?.closest?.('.lesson-subchapter-content');
  if (editor) { savedRange = range.cloneRange(); activeEditor = editor; }
});

bar?.addEventListener('mousedown', (event) => { if (event.target.closest('button[data-edit-command],button[data-edit-block],#lesson-link-add')) event.preventDefault(); });
bar?.addEventListener('click', (event) => {
  const commandButton = event.target.closest('[data-edit-command]');
  const blockButton = event.target.closest('[data-edit-block]');
  if (commandButton) document.execCommand(commandButton.dataset.editCommand, false);
  if (blockButton) document.execCommand('formatBlock', false, blockButton.dataset.editBlock);
  activeEditor?.focus();
});

document.querySelector('#lesson-quiz-add')?.addEventListener('click', () => {
  activeEditor ||= document.querySelector('.lesson-subchapter-content');
  if (!activeEditor) { setStatus('Aucun sous-module disponible.', 'error'); return; }
  if (activeEditor.querySelector('.lesson-quiz')) { setStatus('Ce sous-module possède déjà un quiz.', 'error'); return; }
  const quiz = document.createElement('section'); quiz.className = 'lesson-quiz';
  const data = { questions: [{ question: '', answers: ['', ''], correct: 0 }] };
  activeEditor.append(quiz); renderQuizEditor(quiz, data); quiz.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setStatus('Quiz ajouté à la fin du sous-module.');
});

document.querySelector('#lesson-link-add')?.addEventListener('click', () => {
  activeEditor ||= document.querySelector('.lesson-subchapter-content');
  if (!activeEditor) { setStatus('Placez d’abord le curseur dans le contenu.', 'error'); return; }
  const selectedText = savedRange && activeEditor.contains(savedRange.commonAncestorContainer) ? savedRange.toString().trim() : '';
  const label = window.prompt('Texte affiché pour le lien :', selectedText);
  if (label === null || !label.trim()) return;
  const href = window.prompt('Adresse du lien :', 'https://');
  if (href === null || !/^(https?:\/\/|mailto:|\/|#)/i.test(href.trim())) { setStatus('Saisissez une adresse valide.', 'error'); return; }
  const link = document.createElement('a'); link.textContent = label.trim(); link.href = href.trim();
  if (/^https?:\/\//i.test(href.trim())) { link.target = '_blank'; link.rel = 'noopener noreferrer'; }
  if (savedRange && activeEditor.contains(savedRange.commonAncestorContainer)) {
    const range = savedRange.cloneRange(); range.deleteContents(); range.insertNode(link); range.setStartAfter(link); range.collapse(true);
    const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range); savedRange = range.cloneRange();
  } else activeEditor.append(link);
  activeEditor.focus(); setStatus('Lien ajouté.');
});

lesson?.addEventListener('click', (event) => {
  if (!editing) return;
  const quizElement = event.target.closest('.lesson-quiz'); if (!quizElement) return;
  if (event.target.closest('[data-quiz-delete]')) { quizElement.remove(); setStatus('Quiz supprimé.'); return; }
  const quiz = readQuizEditor(quizElement);
  const questionElement = event.target.closest('.quiz-editor-question');
  const questionIndex = questionElement ? [...quizElement.querySelectorAll('.quiz-editor-question')].indexOf(questionElement) : -1;
  if (event.target.closest('[data-quiz-add-question]')) quiz.questions.push({ question: '', answers: ['', ''], correct: 0 });
  else if (event.target.closest('[data-quiz-remove-question]')) { if (quiz.questions.length === 1) { setStatus('Un quiz doit conserver au moins une question.', 'error'); return; } quiz.questions.splice(questionIndex, 1); }
  else if (event.target.closest('[data-quiz-add-answer]')) quiz.questions[questionIndex].answers.push('');
  else if (event.target.closest('[data-quiz-remove-answer]')) {
    if (quiz.questions[questionIndex].answers.length === 2) { setStatus('Une question doit conserver au moins deux réponses.', 'error'); return; }
    const answerRow = event.target.closest('label'), answerIndex = [...questionElement.querySelectorAll('.quiz-editor-answers label')].indexOf(answerRow);
    quiz.questions[questionIndex].answers.splice(answerIndex, 1);
    if (quiz.questions[questionIndex].correct === answerIndex) quiz.questions[questionIndex].correct = 0;
    else if (quiz.questions[questionIndex].correct > answerIndex) quiz.questions[questionIndex].correct--;
  } else return;
  renderQuizEditor(quizElement, quiz);
});

imageButton?.addEventListener('click', () => {
  document.querySelectorAll('.lesson-image-cursor').forEach((marker) => marker.remove());
  if (!activeEditor || !savedRange || !activeEditor.contains(savedRange.commonAncestorContainer)) return;
  const marker = document.createElement('span');
  marker.className = 'lesson-image-cursor'; marker.setAttribute('aria-hidden', 'true');
  const range = savedRange.cloneRange(); range.collapse(false); range.insertNode(marker);
});

const insertImageAtMarker = (figure) => {
  const marker = document.querySelector('.lesson-image-cursor');
  if (!marker) { const paragraph = document.createElement('p'); paragraph.append(document.createElement('br')); activeEditor.append(figure, paragraph); return; }
  const block = marker.closest('p,div,li,blockquote,h2,h3,h4');
  if (!block || block === activeEditor || !activeEditor.contains(block)) { marker.replaceWith(figure); return; }
  const trailingRange = document.createRange();
  trailingRange.setStartAfter(marker); trailingRange.setEnd(block, block.childNodes.length);
  const trailing = trailingRange.extractContents(); marker.remove(); block.after(figure);
  const hasTrailingContent = trailing.textContent.trim() || trailing.querySelector('*');
  const nextBlock = block.cloneNode(false); nextBlock.removeAttribute('class');
  if (hasTrailingContent) nextBlock.append(trailing); else nextBlock.append(document.createElement('br'));
  figure.after(nextBlock);
};

imageInput?.addEventListener('change', async () => {
  const file = imageInput.files?.[0]; imageInput.value = '';
  if (!file || !activeEditor) { setStatus('Placez d’abord le curseur dans le contenu.', 'error'); return; }
  if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) { setStatus('Choisissez une image de moins de 10 Mo.', 'error'); return; }
  setStatus('Import de l’image…');
  const safeName = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
  const path = `modules/${lessonData.moduleId}/${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from('module-assets').upload(path, file, { contentType: file.type, cacheControl: '31536000' });
  if (error) { document.querySelector('.lesson-image-cursor')?.remove(); setStatus(`Échec : ${error.message}`, 'error'); return; }
  const { data } = supabase.storage.from('module-assets').getPublicUrl(path);
  const figure = document.createElement('figure'); figure.className = 'lesson-inline-image';
  const image = document.createElement('img'); image.src = data.publicUrl; image.alt = '';
  const caption = document.createElement('figcaption'); caption.textContent = 'Écrivez une légende…';
  figure.append(image, caption); insertImageAtMarker(figure);
  prepareFigures(); setStatus('Image ajoutée. Faites-la glisser pour la déplacer.');
});

lesson?.addEventListener('click', (event) => {
  if (!editing || !event.target.matches('.lesson-subchapter-content img')) return;
  document.querySelectorAll('.editor-image-selected').forEach((element) => element.classList.remove('editor-image-selected'));
  event.target.closest('figure').classList.add('editor-image-selected');
});
lesson?.addEventListener('keydown', (event) => {
  if (!editing || !['Backspace','Delete'].includes(event.key)) return;
  const selected = document.querySelector('.editor-image-selected');
  if (selected) { event.preventDefault(); selected.remove(); setStatus('Image supprimée.'); }
});
lesson?.addEventListener('paste', (event) => {
  if (!editing || !event.target.closest('[contenteditable="true"]')) return;
  event.preventDefault();
  let text = event.clipboardData?.getData('text/plain') || '';
  if (!event.target.closest('.lesson-subchapter-content')) text = text.replace(/\s+/g, ' ').trim();
  document.execCommand('insertText', false, text.replace(/\r/g, ''));
});
lesson?.addEventListener('dragstart', (event) => { if (editing) draggedFigure = event.target.closest('.lesson-subchapter-content figure'); });
lesson?.addEventListener('dragover', (event) => { if (editing && draggedFigure && event.target.closest('.lesson-subchapter-content')) event.preventDefault(); });
lesson?.addEventListener('drop', (event) => {
  const targetEditor = event.target.closest('.lesson-subchapter-content');
  if (!editing || !draggedFigure || !targetEditor) return;
  event.preventDefault();
  const range = document.caretRangeFromPoint?.(event.clientX, event.clientY);
  if (range && targetEditor.contains(range.startContainer)) range.insertNode(draggedFigure); else targetEditor.append(draggedFigure);
  draggedFigure = undefined; setStatus('Image déplacée.');
});
