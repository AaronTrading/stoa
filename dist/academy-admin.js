import { supabase } from './supabase.js';

const libraryHeading = document.querySelector('.library-heading');

if (libraryHeading) {
  const createButton = document.createElement('button');
  createButton.id = 'academy-module-create';
  createButton.className = 'academy-module-create';
  createButton.type = 'button';
  createButton.hidden = true;
  createButton.innerHTML = '<span aria-hidden="true">＋</span> Nouveau module';

  const dialog = document.createElement('dialog');
  dialog.className = 'academy-module-dialog';
  dialog.innerHTML = `
    <button class="dialog-close" type="button" aria-label="Fermer">×</button>
    <span class="eyebrow">ADMINISTRATION</span>
    <h2>Créer un module</h2>
    <p>Ajoutez une nouvelle leçon au chapitre de votre choix.</p>
    <form id="academy-module-form">
      <label>Chapitre<select name="chapter_id" required></select></label>
      <label>Position dans le chapitre<select name="order_index" required></select></label>
      <label>Titre du module<input name="title" type="text" maxlength="160" required placeholder="Nom du nouveau module"></label>
      <label>Description<textarea name="description" rows="4" placeholder="Courte introduction du module"></textarea></label>
      <label class="academy-module-duration">Durée estimée<input name="duration_minutes" type="number" min="1" max="600" value="10" required><span>minutes</span></label>
      <p class="academy-module-status" role="status" aria-live="polite"></p>
      <button class="button dark" type="submit">Créer le module <span>→</span></button>
    </form>`;

  libraryHeading.append(createButton);
  document.body.append(dialog);

  const form = dialog.querySelector('form');
  const chapterSelect = form.elements.chapter_id;
  const orderSelect = form.elements.order_index;
  const status = dialog.querySelector('.academy-module-status');
  const submitButton = form.querySelector('[type="submit"]');
  let chapters = [];

  const setStatus = (message, tone = '') => {
    status.textContent = message;
    status.dataset.tone = tone;
  };

  const closeDialog = () => {
    if (!submitButton.disabled) dialog.close();
  };

  const renderOrderOptions = () => {
    const chapter = chapters.find((item) => item.id === chapterSelect.value);
    const modules = [...(chapter?.modules || [])].sort((left, right) => left.order_index - right.order_index);
    orderSelect.innerHTML = modules.map((module, index) => `<option value="${index}">${index + 1} — Avant ${module.title.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')}</option>`).join('') + `<option value="${modules.length}" selected>${modules.length + 1} — À la fin</option>`;
  };

  const initialize = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return;

    const [{ data: profile }, { data: chapterRows, error }] = await Promise.all([
      supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
      supabase.from('chapters').select('id,title,order_index,pillar:pillars(title,order_index),modules(id,title,order_index)').eq('is_visible', true).order('order_index'),
    ]);
    if (profile?.role !== 'admin' || error || !chapterRows?.length) return;

    chapters = chapterRows;
    const groups = new Map();
    chapters.forEach((chapter) => {
      const pillar = chapter.pillar?.title || 'Académie';
      if (!groups.has(pillar)) groups.set(pillar, []);
      groups.get(pillar).push(chapter);
    });
    groups.forEach((items, pillar) => {
      const group = document.createElement('optgroup');
      group.label = pillar;
      items.forEach((chapter) => {
        const option = document.createElement('option');
        option.value = chapter.id;
        option.textContent = chapter.title;
        group.append(option);
      });
      chapterSelect.append(group);
    });
    renderOrderOptions();
    createButton.hidden = false;
  };

  createButton.addEventListener('click', () => {
    form.reset();
    form.elements.duration_minutes.value = 10;
    renderOrderOptions();
    setStatus('');
    dialog.showModal();
    requestAnimationFrame(() => form.elements.title.focus());
  });
  chapterSelect.addEventListener('change', renderOrderOptions);
  dialog.querySelector('.dialog-close').addEventListener('click', closeDialog);
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog || submitButton.disabled) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = new FormData(form);
    const chapterId = String(values.get('chapter_id') || '');
    const title = String(values.get('title') || '').trim();
    const description = String(values.get('description') || '').trim();
    const duration = Number(values.get('duration_minutes'));
    const orderIndex = Number(values.get('order_index'));
    const chapter = chapters.find((item) => item.id === chapterId);
    if (!chapter || !title || !Number.isInteger(duration) || duration < 1 || !Number.isInteger(orderIndex) || orderIndex < 0) {
      setStatus('Complétez les champs obligatoires.', 'error');
      return;
    }

    submitButton.disabled = true;
    setStatus('Création du module…');
    const { data, error } = await supabase.rpc('admin_create_module_at_position', {
      p_chapter_id: chapterId,
      p_title: title,
      p_description: description,
      p_duration_minutes: duration,
      p_order_index: orderIndex,
    });
    const created = Array.isArray(data) ? data[0] : data;
    if (error || !created) {
      submitButton.disabled = false;
      setStatus(`Création impossible : ${error?.message || 'réponse invalide'}`, 'error');
      return;
    }

    setStatus('Module créé. Ouverture de l’éditeur…', 'success');
    location.href = `/module?chapitre=${chapter.order_index + 1}&module=${Number(created.module_order_index) + 1}`;
  });

  initialize();
}
