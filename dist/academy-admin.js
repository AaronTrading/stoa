import { supabase } from './supabase.js';

const libraryHeading = document.querySelector('.library-heading');
const escapeHtml = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

if (libraryHeading) {
  const createButton = document.createElement('button');
  createButton.id = 'academy-module-create';
  createButton.className = 'academy-module-create';
  createButton.type = 'button';
  createButton.hidden = true;
  createButton.innerHTML = '<span aria-hidden="true">＋</span> Ajouter du contenu';

  const dialog = document.createElement('dialog');
  dialog.className = 'academy-module-dialog academy-content-dialog';
  dialog.innerHTML = `
    <button class="dialog-close" type="button" aria-label="Fermer">×</button>
    <span class="eyebrow">ADMINISTRATION</span>
    <h2>Ajouter à l’Académie</h2>
    <div class="academy-create-tabs" role="tablist" aria-label="Type de contenu">
      <button type="button" class="active" data-create-mode="module">Module</button>
      <button type="button" data-create-mode="chapter">Chapitre</button>
    </div>
    <form id="academy-module-form">
      <label>Chapitre<select name="chapter_id" required></select></label>
      <label>Position dans le chapitre<select name="order_index" required></select></label>
      <label>Titre du module<input name="title" type="text" maxlength="160" required placeholder="Nom du nouveau module"></label>
      <label>Description<textarea name="description" rows="4" placeholder="Courte introduction du module"></textarea></label>
      <label class="academy-module-duration">Durée estimée<input name="duration_minutes" type="number" min="1" max="600" value="10" required><span>minutes</span></label>
      <p class="academy-module-status" role="status" aria-live="polite"></p>
      <button class="button dark" type="submit">Créer le module <span>→</span></button>
    </form>
    <form id="academy-chapter-form" hidden>
      <label>Pilier<select name="pillar_id" required></select></label>
      <label>Position dans le pilier<select name="order_index" required></select></label>
      <label>Titre du chapitre<input name="title" type="text" maxlength="160" required placeholder="Nom du nouveau chapitre"></label>
      <label>Description<textarea name="description" rows="4" placeholder="Courte introduction du chapitre"></textarea></label>
      <p class="academy-module-status" role="status" aria-live="polite"></p>
      <button class="button dark" type="submit">Créer le chapitre <span>→</span></button>
    </form>`;

  libraryHeading.append(createButton);
  document.body.append(dialog);

  const moduleForm = dialog.querySelector('#academy-module-form');
  const chapterForm = dialog.querySelector('#academy-chapter-form');
  const moduleChapterSelect = moduleForm.elements.chapter_id;
  const moduleOrderSelect = moduleForm.elements.order_index;
  const pillarSelect = chapterForm.elements.pillar_id;
  const chapterOrderSelect = chapterForm.elements.order_index;
  let chapters = [];
  let pillars = [];

  const statusFor = (form, message, tone = '') => {
    const status = form.querySelector('[role="status"]');
    status.textContent = message;
    status.dataset.tone = tone;
  };

  const renderModulePositions = () => {
    const chapter = chapters.find((item) => item.id === moduleChapterSelect.value);
    const modules = [...(chapter?.modules || [])].sort((left, right) => left.order_index - right.order_index);
    moduleOrderSelect.innerHTML = modules.map((module, index) => `<option value="${index}">${index + 1} — Avant ${escapeHtml(module.title)}</option>`).join('') + `<option value="${modules.length}" selected>${modules.length + 1} — À la fin</option>`;
  };

  const renderChapterPositions = () => {
    const rows = chapters.filter((chapter) => chapter.pillar?.id === pillarSelect.value).sort((left, right) => left.order_index - right.order_index);
    chapterOrderSelect.innerHTML = rows.map((chapter, index) => `<option value="${index}">${index + 1} — Avant ${escapeHtml(chapter.title)}</option>`).join('') + `<option value="${rows.length}" selected>${rows.length + 1} — À la fin</option>`;
  };

  const setMode = (mode) => {
    dialog.querySelectorAll('[data-create-mode]').forEach((button) => button.classList.toggle('active', button.dataset.createMode === mode));
    moduleForm.hidden = mode !== 'module';
    chapterForm.hidden = mode !== 'chapter';
    requestAnimationFrame(() => (mode === 'module' ? moduleForm : chapterForm).elements.title.focus());
  };

  const initialize = async () => {
    const user = (await supabase.auth.getSession()).data.session?.user;
    if (!user) return;
    const [{ data: profile }, { data: chapterRows, error }, { data: pillarRows }] = await Promise.all([
      supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
      supabase.from('chapters').select('id,title,order_index,pillar:pillars(id,title,order_index),modules(id,title,order_index)').eq('is_visible', true).order('order_index'),
      supabase.from('pillars').select('id,title,order_index').order('order_index'),
    ]);
    if (profile?.role !== 'admin' || error || !chapterRows?.length || !pillarRows?.length) return;
    chapters = chapterRows;
    pillars = pillarRows;

    const groups = new Map();
    chapters.forEach((chapter) => {
      const pillar = chapter.pillar?.title || 'Académie';
      if (!groups.has(pillar)) groups.set(pillar, []);
      groups.get(pillar).push(chapter);
    });
    groups.forEach((items, pillar) => {
      const group = document.createElement('optgroup');
      group.label = pillar;
      items.forEach((chapter) => group.append(new Option(chapter.title, chapter.id)));
      moduleChapterSelect.append(group);
    });
    pillars.forEach((pillar) => pillarSelect.append(new Option(pillar.title, pillar.id)));
    renderModulePositions();
    renderChapterPositions();
    createButton.hidden = false;
  };

  createButton.addEventListener('click', () => {
    moduleForm.reset();
    chapterForm.reset();
    moduleForm.elements.duration_minutes.value = 10;
    renderModulePositions();
    renderChapterPositions();
    statusFor(moduleForm, '');
    statusFor(chapterForm, '');
    setMode('module');
    dialog.showModal();
  });
  dialog.querySelectorAll('[data-create-mode]').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.createMode)));
  moduleChapterSelect.addEventListener('change', renderModulePositions);
  pillarSelect.addEventListener('change', renderChapterPositions);
  dialog.querySelector('.dialog-close').addEventListener('click', () => {
    if (![...dialog.querySelectorAll('[type="submit"]')].some((button) => button.disabled)) dialog.close();
  });

  moduleForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = new FormData(moduleForm);
    const chapter = chapters.find((item) => item.id === values.get('chapter_id'));
    const title = String(values.get('title') || '').trim();
    const duration = Number(values.get('duration_minutes'));
    const orderIndex = Number(values.get('order_index'));
    if (!chapter || !title || !Number.isInteger(duration) || duration < 1 || !Number.isInteger(orderIndex)) return statusFor(moduleForm, 'Complétez les champs obligatoires.', 'error');
    const submit = moduleForm.querySelector('[type="submit"]');
    submit.disabled = true;
    statusFor(moduleForm, 'Création du module…');
    const { data, error } = await supabase.rpc('admin_create_module_at_position', { p_chapter_id: chapter.id, p_title: title, p_description: String(values.get('description') || '').trim(), p_duration_minutes: duration, p_order_index: orderIndex });
    const created = Array.isArray(data) ? data[0] : data;
    if (error || !created) { submit.disabled = false; return statusFor(moduleForm, `Création impossible : ${error?.message || 'réponse invalide'}`, 'error'); }
    location.href = `/module?chapitre=${chapter.order_index + 1}&module=${Number(created.module_order_index) + 1}`;
  });

  chapterForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const values = new FormData(chapterForm);
    const title = String(values.get('title') || '').trim();
    const orderIndex = Number(values.get('order_index'));
    if (!pillars.some((item) => item.id === values.get('pillar_id')) || !title || !Number.isInteger(orderIndex)) return statusFor(chapterForm, 'Complétez les champs obligatoires.', 'error');
    const submit = chapterForm.querySelector('[type="submit"]');
    submit.disabled = true;
    statusFor(chapterForm, 'Création du chapitre…');
    const { data, error } = await supabase.rpc('admin_create_chapter_at_position', { p_pillar_id: values.get('pillar_id'), p_title: title, p_description: String(values.get('description') || '').trim(), p_order_index: orderIndex });
    const created = Array.isArray(data) ? data[0] : data;
    if (error || !created) { submit.disabled = false; return statusFor(chapterForm, `Création impossible : ${error?.message || 'réponse invalide'}`, 'error'); }
    location.href = `/academie?chapitre=${Number(created.chapter_order_index) + 1}`;
  });

  initialize();
}
