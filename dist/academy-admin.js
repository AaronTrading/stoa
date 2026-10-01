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

  const initialize = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return;

    const [{ data: profile }, { data: chapterRows, error }] = await Promise.all([
      supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
      supabase.from('chapters').select('id,title,order_index,pillar:pillars(title,order_index)').eq('is_visible', true).order('order_index'),
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
    createButton.hidden = false;
  };

  createButton.addEventListener('click', () => {
    form.reset();
    form.elements.duration_minutes.value = 10;
    setStatus('');
    dialog.showModal();
    requestAnimationFrame(() => form.elements.title.focus());
  });
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
    const chapter = chapters.find((item) => item.id === chapterId);
    if (!chapter || !title || !Number.isInteger(duration) || duration < 1) {
      setStatus('Complétez les champs obligatoires.', 'error');
      return;
    }

    submitButton.disabled = true;
    setStatus('Création du module…');
    const { data: lastModule, error: orderError } = await supabase.from('modules').select('order_index').eq('chapter_id', chapterId).order('order_index', { ascending: false }).limit(1).maybeSingle();
    if (orderError) {
      submitButton.disabled = false;
      setStatus(`Création impossible : ${orderError.message}`, 'error');
      return;
    }

    const orderIndex = (lastModule?.order_index ?? -1) + 1;
    const { data: moduleRow, error: moduleError } = await supabase.from('modules').insert({
      chapter_id: chapterId,
      title,
      description,
      duration_minutes: duration,
      order_index: orderIndex,
      is_visible: true,
    }).select('id').single();

    if (moduleError) {
      submitButton.disabled = false;
      setStatus(`Création impossible : ${moduleError.message}`, 'error');
      return;
    }

    const { error: contentError } = await supabase.from('subchapters').insert({
      module_id: moduleRow.id,
      title: 'Cours',
      content: '<p>Commencez à rédiger votre module ici.</p>',
      order_index: 0,
    });
    if (contentError) {
      await supabase.from('modules').delete().eq('id', moduleRow.id);
      submitButton.disabled = false;
      setStatus(`Création impossible : ${contentError.message}`, 'error');
      return;
    }

    setStatus('Module créé. Ouverture de l’éditeur…', 'success');
    location.href = `/module?chapitre=${chapter.order_index + 1}&module=${orderIndex + 1}`;
  });

  initialize();
}
