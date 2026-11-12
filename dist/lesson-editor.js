import { supabase } from './supabase.js';

const lesson = document.querySelector('#lesson-content');
const pencil = document.querySelector('#lesson-edit-pencil');
const bar = document.querySelector('#lesson-editor-bar');
const status = document.querySelector('#lesson-editor-status');
const imageInput = document.querySelector('#lesson-image-input');
const imageButton = document.querySelector('label[for="lesson-image-input"]');
const artwork = document.querySelector('#lesson-artwork');
const coverInput = document.querySelector('#lesson-cover-input');
const coverButton = document.querySelector('#lesson-artwork-change');
const fontSelect = document.querySelector('#lesson-font-select');
const copyBlockButton = document.querySelector('#lesson-copy-block-add');
const imageSelectorButton = document.querySelector('#lesson-image-selector-add');
const imageSelectorInput = document.querySelector('#lesson-image-selector-input');
let lessonData;
let editing = false;
let original = {};
let savedRange;
let activeEditor;
let draggedElement;
let pendingCoverFile;
let coverPreviewUrl;

const editableAreas = () => [...document.querySelectorAll('#lesson-title, [data-subchapter-title], .lesson-subchapter-content')];
const setStatus = (text, tone = '') => { status.textContent = text; status.dataset.tone = tone; };
const escapeHtml = (value = '') => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const pastedMarkupPattern = /<\/?(?:p|div|h[2-4]|ul|ol|li|blockquote|figure|table|section|strong|b|em|i|u|a|span|br)\b|&lt;\/?(?:p|div|h[2-4]|ul|ol|li|blockquote|figure|table|section|strong|b|em|i|u|a|span|br)\b/i;
const decodePastedMarkup = (value = '') => {
  let html = String(value);
  if (/&lt;\/?(?:p|div|h[2-4]|ul|ol|li|blockquote|figure|table|section|strong|b|em|i|u|a|span|br)\b/i.test(html)) {
    const decoder = document.createElement('textarea'); decoder.innerHTML = html; html = decoder.value;
  }
  return html;
};
const cleanHtml = (html) => {
  const template = document.createElement('template');
  template.innerHTML = html;
  template.content.querySelectorAll('.lesson-copy-button').forEach((button) => button.remove());
  template.content.querySelectorAll('.lesson-image-selector-tabs').forEach((tabs) => tabs.remove());
  template.content.querySelectorAll('font[face]').forEach((font) => {
    const face = (font.getAttribute('face') || '').toLowerCase();
    const kind = face.includes('cormorant') ? 'serif' : face.includes('segoe') ? 'sans' : '';
    if (!kind) { font.replaceWith(...font.childNodes); return; }
    const span = document.createElement('span');
    span.dataset.font = kind;
    span.append(...font.childNodes);
    font.replaceWith(span);
  });
  const allowed = new Set(['P','DIV','BR','H2','H3','H4','STRONG','B','EM','I','U','A','OL','UL','LI','BLOCKQUOTE','FIGURE','IMG','FIGCAPTION','SECTION','SPAN']);
  [...template.content.querySelectorAll('*')].forEach((element) => {
    if (!allowed.has(element.tagName)) { element.replaceWith(...element.childNodes); return; }
    const source = element.tagName === 'IMG' ? element.getAttribute('src') || '' : '';
    const href = element.tagName === 'A' ? element.getAttribute('href') || '' : '';
    const copyBlock = element.tagName === 'SECTION' && (element.hasAttribute('data-copy-block') || element.classList.contains('lesson-copy-block'));
    const imageSelector = element.tagName === 'SECTION' && (element.hasAttribute('data-image-selector') || element.classList.contains('lesson-image-selector'));
    const imageOption = element.tagName === 'FIGURE' && (element.hasAttribute('data-image-option') || element.classList.contains('lesson-image-selector-option'));
    const imageLabel = imageOption ? String(element.getAttribute('data-label') || 'Option').trim().slice(0, 60) : '';
    const font = element.tagName === 'SPAN' ? element.getAttribute('data-font') || '' : '';
    if (element.tagName === 'SECTION' && !copyBlock && !imageSelector) { element.remove(); return; }
    if (element.tagName === 'SPAN' && !['sans','serif'].includes(font)) { element.replaceWith(...element.childNodes); return; }
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
    if (element.tagName === 'FIGURE' && imageOption) { element.className = 'lesson-image-selector-option'; element.dataset.imageOption = ''; element.dataset.label = imageLabel || 'Option'; }
    else if (element.tagName === 'FIGURE') element.className = 'lesson-inline-image';
    if (element.tagName === 'SECTION' && copyBlock) { element.className = 'lesson-copy-block'; element.dataset.copyBlock = ''; }
    else if (element.tagName === 'SECTION' && imageSelector) { element.className = 'lesson-image-selector'; element.dataset.imageSelector = ''; }
    if (element.tagName === 'SPAN') element.dataset.font = font;
  });
  return template.innerHTML.trim();
};

const hydrateCopyBlocks = () => {
  document.querySelectorAll('.lesson-copy-block[data-copy-block]').forEach((block) => {
    block.querySelector(':scope > .lesson-copy-button')?.remove();
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'lesson-copy-button'; button.textContent = 'Copier';
    button.contentEditable = 'false'; button.setAttribute('aria-label', 'Copier le contenu de ce bloc');
    block.prepend(button);
  });
};

const showImageSelectorOption = (selector, index) => {
  const options = [...selector.querySelectorAll(':scope > .lesson-image-selector-option[data-image-option]')];
  const tabs = [...selector.querySelectorAll(':scope > .lesson-image-selector-tabs button')];
  const activeIndex = Math.max(0, Math.min(Number(index) || 0, options.length - 1));
  options.forEach((option, optionIndex) => { option.hidden = optionIndex !== activeIndex; });
  tabs.forEach((tab, tabIndex) => { tab.classList.toggle('active', tabIndex === activeIndex); tab.setAttribute('aria-selected', String(tabIndex === activeIndex)); });
};

const hydrateImageSelectors = () => {
  document.querySelectorAll('.lesson-image-selector[data-image-selector]').forEach((selector) => {
    selector.contentEditable = 'false';
    selector.querySelector(':scope > .lesson-image-selector-tabs')?.remove();
    const options = [...selector.querySelectorAll(':scope > .lesson-image-selector-option[data-image-option]')];
    if (!options.length) return;
    const tabs = document.createElement('div'); tabs.className = 'lesson-image-selector-tabs'; tabs.setAttribute('role', 'tablist');
    options.forEach((option, index) => {
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = option.dataset.label || `Option ${index + 1}`;
      button.dataset.imageSelectorIndex = String(index); button.setAttribute('role', 'tab'); button.contentEditable = 'false';
      tabs.append(button);
    });
    selector.prepend(tabs); showImageSelectorOption(selector, 0);
  });
};

const serializeEditorContent = (element) => {
  const clone = element.cloneNode(true);
  clone.querySelectorAll('.lesson-copy-button').forEach((button) => button.remove());
  clone.querySelectorAll('.lesson-image-selector-tabs').forEach((tabs) => tabs.remove());
  clone.querySelectorAll('.lesson-image-selector-option').forEach((option) => option.removeAttribute('hidden'));
  clone.querySelectorAll('.lesson-editor-after-selector').forEach((paragraph) => {
    if (!paragraph.textContent.trim()) paragraph.remove();
    else paragraph.removeAttribute('class');
  });
  return cleanHtml(clone.innerHTML);
};

const copyBlockText = async (block, button) => {
  const clone = block.cloneNode(true);
  clone.querySelectorAll('.lesson-copy-button').forEach((item) => item.remove());
  const text = clone.innerText.trim();
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text; textarea.style.position = 'fixed'; textarea.style.opacity = '0';
    document.body.append(textarea); textarea.select(); document.execCommand('copy'); textarea.remove();
  }
  button.textContent = 'Copié'; button.dataset.copied = 'true';
  window.setTimeout(() => { button.textContent = 'Copier'; delete button.dataset.copied; }, 1400);
};

const prepareFigures = () => {
  document.querySelectorAll('.lesson-subchapter-content figure:not(.lesson-image-selector-option)').forEach((figure) => {
    figure.draggable = editing;
    figure.title = editing ? 'Faites glisser l’image pour la déplacer. Cliquez puis Suppr pour l’effacer.' : '';
  });
  document.querySelectorAll('.lesson-image-selector[data-image-selector]').forEach((selector) => {
    selector.contentEditable = 'false'; selector.draggable = editing;
    selector.title = editing ? 'Faites glisser ce bloc pour le déplacer.' : '';
  });
};

const ensureSpaceAfterImageSelectors = () => {
  document.querySelectorAll('.lesson-image-selector[data-image-selector]').forEach((selector) => {
    if (selector.nextElementSibling) return;
    const paragraph = document.createElement('p'); paragraph.className = 'lesson-editor-after-selector';
    paragraph.append(document.createElement('br')); selector.after(paragraph);
  });
};

const enterEditMode = () => {
  if (!lessonData || editing) return;
  editing = true;
  original = { title: document.querySelector('#lesson-title').textContent, copy: document.querySelector('#lesson-copy').innerHTML, coverSrc: artwork.src, coverAlt: artwork.alt };
  lesson.classList.add('lesson-editing'); pencil.hidden = true; bar.hidden = false;
  editableAreas().forEach((element) => { element.contentEditable = 'true'; element.spellcheck = true; });
  hydrateImageSelectors(); prepareFigures(); ensureSpaceAfterImageSelectors();
  document.querySelector('#lesson-title').focus();
  setStatus('Cliquez dans le texte pour le modifier.');
};

const leaveEditMode = () => {
  editing = false;
  lesson.classList.remove('lesson-editing'); pencil.hidden = false; bar.hidden = true;
  editableAreas().forEach((element) => element.removeAttribute('contenteditable'));
  document.querySelectorAll('.editor-image-selected').forEach((element) => element.classList.remove('editor-image-selected'));
  prepareFigures(); savedRange = undefined; activeEditor = undefined;
  if (fontSelect) fontSelect.value = '';
};

const restoreOriginal = () => {
  document.querySelector('#lesson-title').textContent = original.title;
  document.querySelector('#lesson-copy').innerHTML = original.copy;
  if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
  coverPreviewUrl = undefined; pendingCoverFile = undefined;
  artwork.src = original.coverSrc; artwork.alt = original.coverAlt;
  if (coverInput) coverInput.value = '';
  leaveEditMode();
};

const uploadCover = async (file) => {
  const safeName = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
  const path = `modules/${lessonData.moduleId}/cover-${crypto.randomUUID()}-${safeName}`;
  const { error } = await supabase.storage.from('module-assets').upload(path, file, { contentType: file.type, cacheControl: '31536000' });
  if (error) throw error;
  return supabase.storage.from('module-assets').getPublicUrl(path).data.publicUrl;
};

const saveLesson = async () => {
  const title = document.querySelector('#lesson-title').textContent.trim();
  if (!title) { setStatus('Le titre ne peut pas être vide.', 'error'); return; }
  let coverImageUrl = lessonData.coverImageUrl || null;
  if (pendingCoverFile) {
    setStatus('Import de l’image principale…');
    try { coverImageUrl = await uploadCover(pendingCoverFile); }
    catch (error) { setStatus(`Échec : ${error.message}`, 'error'); return; }
  }
  setStatus('Enregistrement…');
  const promises = [supabase.from('modules').update({ title, cover_image_url: coverImageUrl }).eq('id', lessonData.moduleId)];
  document.querySelectorAll('[data-subchapter-id]').forEach((section) => {
    const known = lessonData.sections.find((item) => item.id === section.dataset.subchapterId);
    const titleElement = section.querySelector('[data-subchapter-title]');
    const sectionTitle = titleElement?.textContent.trim() || known?.title || 'Cours';
    const content = serializeEditorContent(section.querySelector('.lesson-subchapter-content'));
    promises.push(supabase.from('subchapters').update({ title: sectionTitle, content }).eq('id', section.dataset.subchapterId));
  });
  const results = await Promise.all(promises);
  const error = results.find((result) => result.error)?.error;
  if (error) { setStatus(`Échec : ${error.message}`, 'error'); return; }
  await supabase.from('subchapter_images').delete().in('subchapter_id', lessonData.sections.map((item) => item.id));
  document.querySelectorAll('.lesson-subchapter-content').forEach((element) => { element.innerHTML = serializeEditorContent(element); });
  hydrateCopyBlocks();
  hydrateImageSelectors();
  if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
  coverPreviewUrl = undefined; pendingCoverFile = undefined; lessonData.coverImageUrl = coverImageUrl || '';
  artwork.src = coverImageUrl || artwork.src;
  original = { title, copy: document.querySelector('#lesson-copy').innerHTML, coverSrc: artwork.src, coverAlt: artwork.alt };
  document.title = `${title} — STOA`;
  leaveEditMode();
};

const deleteLesson = async () => {
  if (!lessonData?.moduleId || !confirm('Supprimer définitivement cette leçon et tout son contenu ?')) return;
  const button = document.querySelector('#lesson-edit-delete');
  button.disabled = true;
  setStatus('Suppression…');
  const { error } = await supabase.rpc('admin_delete_module', { p_id: lessonData.moduleId });
  if (error) { button.disabled = false; setStatus(`Échec : ${error.message}`, 'error'); return; }
  location.href = '/academie';
};

const initialize = async () => {
  lessonData = window.__STOA_LESSON_DATA__;
  hydrateCopyBlocks();
  hydrateImageSelectors();
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
document.querySelector('#lesson-edit-delete')?.addEventListener('click', deleteLesson);
coverButton?.addEventListener('click', () => coverInput?.click());
coverInput?.addEventListener('change', () => {
  const file = coverInput.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) { coverInput.value = ''; setStatus('Choisissez une image de moins de 10 Mo.', 'error'); return; }
  if (coverPreviewUrl) URL.revokeObjectURL(coverPreviewUrl);
  pendingCoverFile = file; coverPreviewUrl = URL.createObjectURL(file);
  artwork.src = coverPreviewUrl; artwork.alt = `Nouvelle image principale de ${document.querySelector('#lesson-title').textContent.trim()}`;
  setStatus('Nouvelle image prête. Enregistrez la leçon pour la publier.');
});

document.addEventListener('selectionchange', () => {
  if (!editing) return;
  const selection = getSelection(); if (!selection?.rangeCount) return;
  const range = selection.getRangeAt(0), area = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
  const editor = area?.closest?.('.lesson-subchapter-content');
  if (editor) { savedRange = range.cloneRange(); activeEditor = editor; }
});

bar?.addEventListener('mousedown', (event) => { if (event.target.closest('button[data-edit-command],button[data-edit-block],#lesson-link-add,#lesson-copy-block-add,#lesson-image-selector-add')) event.preventDefault(); });
bar?.addEventListener('click', (event) => {
  const commandButton = event.target.closest('[data-edit-command]');
  const blockButton = event.target.closest('[data-edit-block]');
  if (!commandButton && !blockButton) return;
  if (commandButton) document.execCommand(commandButton.dataset.editCommand, false);
  if (blockButton) document.execCommand('formatBlock', false, blockButton.dataset.editBlock);
  activeEditor?.focus();
});

fontSelect?.addEventListener('change', () => {
  const font = fontSelect.value;
  if (!font) return;
  if (!activeEditor || !savedRange || !activeEditor.contains(savedRange.commonAncestorContainer)) {
    setStatus('Sélectionnez d’abord le texte à modifier.', 'error');
    fontSelect.value = '';
    return;
  }
  activeEditor.focus();
  const selection = getSelection();
  selection.removeAllRanges();
  selection.addRange(savedRange.cloneRange());
  document.execCommand('styleWithCSS', false, false);
  document.execCommand('fontName', false, font);
  if (selection.rangeCount) savedRange = selection.getRangeAt(0).cloneRange();
  setStatus(`Police ${font === 'Segoe UI' ? 'Segoe UI' : 'Cormorant'} appliquée.`);
  fontSelect.value = '';
});

copyBlockButton?.addEventListener('click', () => {
  if (!editing) return;
  activeEditor ||= document.querySelector('.lesson-subchapter-content');
  if (!activeEditor) { setStatus('Aucun contenu disponible.', 'error'); return; }
  const block = document.createElement('section');
  block.className = 'lesson-copy-block'; block.dataset.copyBlock = '';
  const paragraph = document.createElement('p'); paragraph.textContent = 'Écrivez ici le contenu à copier.';
  block.append(paragraph); activeEditor.append(block); hydrateCopyBlocks();
  const range = document.createRange(); range.selectNodeContents(paragraph);
  const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range);
  savedRange = range.cloneRange(); activeEditor.focus(); block.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setStatus('Bloc copiable ajouté. Remplacez son contenu puis enregistrez.');
});

const placeInsertionMarker = () => {
  document.querySelectorAll('.lesson-image-cursor').forEach((marker) => marker.remove());
  if (!activeEditor) return;
  const marker = document.createElement('span'); marker.className = 'lesson-image-cursor'; marker.setAttribute('aria-hidden', 'true');
  if (savedRange && activeEditor.contains(savedRange.commonAncestorContainer)) {
    const range = savedRange.cloneRange(); range.collapse(false); range.insertNode(marker);
  } else activeEditor.append(marker);
};

imageSelectorButton?.addEventListener('click', () => {
  if (!editing) return;
  activeEditor ||= document.querySelector('.lesson-subchapter-content');
  if (!activeEditor) { setStatus('Aucun contenu disponible.', 'error'); return; }
  placeInsertionMarker();
  imageSelectorInput?.click();
});

imageSelectorInput?.addEventListener('change', async () => {
  const files = [...(imageSelectorInput.files || [])]; imageSelectorInput.value = '';
  if (files.length < 2) { setStatus('Choisissez au moins deux images.', 'error'); return; }
  if (files.length > 8 || files.some((file) => !file.type.startsWith('image/') || file.size > 10 * 1024 * 1024)) { setStatus('Choisissez de 2 à 8 images de moins de 10 Mo.', 'error'); return; }
  const labels = files.map((file, index) => {
    const defaultLabel = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || `Option ${index + 1}`;
    return window.prompt(`Nom de l’option ${index + 1} :`, defaultLabel)?.trim() || defaultLabel;
  });
  setStatus('Import des images…');
  try {
    const images = await Promise.all(files.map(async (file, index) => {
      const safeName = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
      const path = `modules/${lessonData.moduleId}/selector-${crypto.randomUUID()}-${safeName}`;
      const { error } = await supabase.storage.from('module-assets').upload(path, file, { contentType: file.type, cacheControl: '31536000' });
      if (error) throw error;
      return { src: supabase.storage.from('module-assets').getPublicUrl(path).data.publicUrl, label: labels[index] };
    }));
    const selector = document.createElement('section'); selector.className = 'lesson-image-selector'; selector.dataset.imageSelector = '';
    images.forEach(({ src, label }) => {
      const figure = document.createElement('figure'); figure.className = 'lesson-image-selector-option'; figure.dataset.imageOption = ''; figure.dataset.label = label;
      const image = document.createElement('img'); image.src = src; image.alt = label; image.loading = 'lazy';
      figure.append(image); selector.append(figure);
    });
    insertImageAtMarker(selector); hydrateImageSelectors(); prepareFigures(); ensureSpaceAfterImageSelectors(); selector.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setStatus('Sélecteur d’images ajouté. Enregistrez la leçon pour le publier.');
  } catch (error) { setStatus(`Échec : ${error.message}`, 'error'); }
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
  const copyButton = event.target.closest('.lesson-copy-button');
  if (copyButton) { event.preventDefault(); copyBlockText(copyButton.closest('.lesson-copy-block'), copyButton); return; }
  const selectorButton = event.target.closest('[data-image-selector-index]');
  if (selectorButton) { event.preventDefault(); showImageSelectorOption(selectorButton.closest('.lesson-image-selector'), selectorButton.dataset.imageSelectorIndex); return; }
});

imageButton?.addEventListener('click', () => {
  if (!activeEditor || !savedRange || !activeEditor.contains(savedRange.commonAncestorContainer)) return;
  placeInsertionMarker();
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
  if (!editing || !event.target.matches('.lesson-subchapter-content img') || event.target.closest('.lesson-image-selector')) return;
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
  const contentEditor = event.target.closest('.lesson-subchapter-content');
  if (!contentEditor) {
    document.execCommand('insertText', false, text.replace(/\s+/g, ' ').trim());
    return;
  }
  const clipboardHtml = event.clipboardData?.getData('text/html') || '';
  const markup = clipboardHtml || (pastedMarkupPattern.test(text) ? decodePastedMarkup(text) : '');
  if (markup) document.execCommand('insertHTML', false, cleanHtml(markup));
  else document.execCommand('insertText', false, text.replace(/\r/g, ''));
});
lesson?.addEventListener('dragstart', (event) => {
  if (!editing) return;
  draggedElement = event.target.closest('.lesson-image-selector[data-image-selector],.lesson-subchapter-content figure:not(.lesson-image-selector-option)');
});
lesson?.addEventListener('dragover', (event) => { if (editing && draggedElement && event.target.closest('.lesson-subchapter-content')) event.preventDefault(); });
lesson?.addEventListener('drop', (event) => {
  const targetEditor = event.target.closest('.lesson-subchapter-content');
  if (!editing || !draggedElement || !targetEditor || draggedElement.contains(event.target)) return;
  event.preventDefault();
  const targetBlock = event.target.closest('p,h2,h3,h4,blockquote,ul,ol,figure,section');
  if (targetBlock && targetBlock !== draggedElement && targetEditor.contains(targetBlock)) {
    const bounds = targetBlock.getBoundingClientRect();
    if (event.clientY > bounds.top + bounds.height / 2) targetBlock.after(draggedElement);
    else targetBlock.before(draggedElement);
  } else targetEditor.append(draggedElement);
  const movedSelector = draggedElement.matches('.lesson-image-selector');
  draggedElement = undefined; ensureSpaceAfterImageSelectors();
  setStatus(movedSelector ? 'Sélecteur d’images déplacé.' : 'Image déplacée.');
});
lesson?.addEventListener('dragend', () => { draggedElement = undefined; });
