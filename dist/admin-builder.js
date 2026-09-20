import { supabase } from './supabase.js';

const root = document.querySelector('#admin-builder');
if (root) {
  const chapterSelect = root.querySelector('#builder-chapter');
  const moduleList = root.querySelector('#builder-modules');
  const subchapterList = root.querySelector('#builder-subchapters');
  const empty = root.querySelector('#builder-empty');
  const editor = root.querySelector('#builder-editor');
  const moduleForm = root.querySelector('#builder-module-form');
  const subchapterForm = root.querySelector('#builder-subchapter-form');
  const contentInput = root.querySelector('#builder-subchapter-content');
  const imageList = root.querySelector('#builder-image-list');
  const imageUpload = root.querySelector('#builder-image-upload');
  const status = root.querySelector('#builder-status');
  let chapters = [], modules = [], subchapters = [], images = [];
  let selectedModuleId = '', selectedSubchapterId = '';

  const escapeHtml = (value = '') => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  const setStatus = (text, tone = 'info') => { status.textContent = text; status.dataset.tone = tone; };
  const fail = (error, fallback) => setStatus(`${fallback} : ${error?.message || error}`, 'error');
  const selectedModule = () => modules.find((item) => item.id === selectedModuleId);
  const selectedSubchapter = () => subchapters.find((item) => item.id === selectedSubchapterId);

  const loadChapters = async () => {
    const { data, error } = await supabase.from('chapters').select('id,title,category,order_index').order('order_index');
    if (error) throw error;
    chapters = data || [];
    chapterSelect.innerHTML = chapters.map((chapter) => `<option value="${chapter.id}">${escapeHtml(chapter.title || chapter.category)}</option>`).join('');
  };

  const renderModules = () => {
    moduleList.innerHTML = modules.length ? modules.map((module) => `<button type="button" data-module-id="${module.id}" class="${module.id === selectedModuleId ? 'active' : ''}"><span>${String(module.order_index + 1).padStart(2, '0')}</span><strong>${escapeHtml(module.title)}</strong></button>`).join('') : '<p class="builder-list-empty">Aucun module.</p>';
  };

  const renderSubchapters = () => {
    subchapterList.innerHTML = subchapters.length ? subchapters.map((item) => `<button type="button" data-subchapter-id="${item.id}" class="${item.id === selectedSubchapterId ? 'active' : ''}"><span>${item.order_index + 1}</span>${escapeHtml(item.title)}</button>`).join('') : '<p class="builder-list-empty">Aucun sous-module.</p>';
  };

  const renderImages = () => {
    const rows = images.filter((image) => image.subchapter_id === selectedSubchapterId);
    imageList.innerHTML = rows.length ? rows.map((image) => `<article class="builder-image-card" data-image-id="${image.id}"><img src="${escapeHtml(image.image_url)}" alt=""><div><label>Texte alternatif<input data-image-field="alt_text" value="${escapeHtml(image.alt_text || '')}"></label><label>Légende<input data-image-field="caption" value="${escapeHtml(image.caption || '')}"></label><label>Après le paragraphe<input data-image-field="position_index" type="number" min="0" value="${image.position_index}"></label><div class="builder-image-actions"><button type="button" data-image-save>Enregistrer</button><button type="button" data-image-delete>Supprimer</button></div></div></article>`).join('') : '<p class="builder-list-empty">Aucune image dans ce sous-module.</p>';
  };

  const fillSubchapter = () => {
    const item = selectedSubchapter();
    subchapterForm.hidden = !item;
    if (!item) return;
    root.querySelector('#builder-subchapter-title').value = item.title;
    root.querySelector('#builder-subchapter-order').value = item.order_index + 1;
    contentInput.value = item.content || '';
    renderImages();
  };

  const loadSubchapters = async (preferredId = '') => {
    const { data, error } = await supabase.from('subchapters').select('id,module_id,title,content,order_index').eq('module_id', selectedModuleId).order('order_index');
    if (error) throw error;
    subchapters = data || [];
    selectedSubchapterId = subchapters.some((item) => item.id === preferredId) ? preferredId : (subchapters[0]?.id || '');
    if (subchapters.length) {
      const { data: imageRows, error: imageError } = await supabase.from('subchapter_images').select('id,subchapter_id,image_url,alt_text,caption,position_index,order_index,storage_path').in('subchapter_id', subchapters.map((item) => item.id)).order('order_index');
      if (imageError) throw imageError;
      images = imageRows || [];
    } else images = [];
    renderSubchapters(); fillSubchapter();
  };

  const selectModule = async (id) => {
    selectedModuleId = id;
    const module = selectedModule();
    renderModules();
    empty.hidden = Boolean(module); editor.hidden = !module;
    if (!module) return;
    root.querySelector('#builder-module-title').value = module.title;
    root.querySelector('#builder-module-description').value = module.description || '';
    root.querySelector('#builder-module-duration').value = module.duration_minutes || 1;
    root.querySelector('#builder-module-order').value = module.order_index + 1;
    await loadSubchapters();
  };

  const loadModules = async (preferredId = '') => {
    const { data, error } = await supabase.from('modules').select('id,chapter_id,title,description,duration_minutes,order_index').eq('chapter_id', chapterSelect.value).order('order_index');
    if (error) throw error;
    modules = data || [];
    await selectModule(modules.some((item) => item.id === preferredId) ? preferredId : (modules[0]?.id || ''));
  };

  const initialize = async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return;
    root.hidden = false;
    try { await loadChapters(); await loadModules(); } catch (error) { fail(error, 'L’éditeur ne peut pas être chargé'); }
  };

  chapterSelect.addEventListener('change', () => loadModules().catch((error) => fail(error, 'Les modules ne peuvent pas être chargés')));
  moduleList.addEventListener('click', (event) => { const button = event.target.closest('[data-module-id]'); if (button) selectModule(button.dataset.moduleId).catch((error) => fail(error, 'Le module ne peut pas être ouvert')); });
  subchapterList.addEventListener('click', (event) => { const button = event.target.closest('[data-subchapter-id]'); if (!button) return; selectedSubchapterId = button.dataset.subchapterId; renderSubchapters(); fillSubchapter(); });

  root.querySelector('#builder-new-module').addEventListener('click', async () => {
    const nextOrder = modules.length ? Math.max(...modules.map((item) => item.order_index)) + 1 : 0;
    const { data, error } = await supabase.from('modules').insert({ chapter_id: chapterSelect.value, title: 'Nouveau module', description: '', duration_minutes: 10, order_index: nextOrder }).select('id').single();
    if (error) return fail(error, 'Le module ne peut pas être créé');
    await loadModules(data.id); setStatus('Module créé. Vous pouvez maintenant le modifier.', 'success');
  });

  moduleForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const { error } = await supabase.rpc('admin_update_module', { p_id: selectedModuleId, p_title: root.querySelector('#builder-module-title').value.trim(), p_description: root.querySelector('#builder-module-description').value.trim(), p_duration_minutes: Number(root.querySelector('#builder-module-duration').value), p_order_index: Number(root.querySelector('#builder-module-order').value) - 1 });
    if (error) return fail(error, 'Le module ne peut pas être enregistré');
    await loadModules(selectedModuleId); setStatus('Module enregistré. La modification est publique.', 'success');
  });

  root.querySelector('#builder-delete-module').addEventListener('click', async () => {
    const module = selectedModule();
    if (!module || !confirm(`Supprimer définitivement « ${module.title} » et tous ses sous-modules ?`)) return;
    const { error } = await supabase.rpc('admin_delete_module', { p_id: module.id });
    if (error) return fail(error, 'Le module ne peut pas être supprimé');
    await loadModules(); setStatus('Module supprimé.', 'success');
  });

  root.querySelector('#builder-new-subchapter').addEventListener('click', async () => {
    const nextOrder = subchapters.length ? Math.max(...subchapters.map((item) => item.order_index)) + 1 : 0;
    const { data, error } = await supabase.from('subchapters').insert({ module_id: selectedModuleId, title: 'Nouveau sous-module', content: '', order_index: nextOrder }).select('id').single();
    if (error) return fail(error, 'Le sous-module ne peut pas être créé');
    await loadSubchapters(data.id); setStatus('Sous-module créé.', 'success');
  });

  subchapterForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const { error } = await supabase.rpc('admin_update_subchapter', { p_id: selectedSubchapterId, p_title: root.querySelector('#builder-subchapter-title').value.trim(), p_content: contentInput.value, p_order_index: Number(root.querySelector('#builder-subchapter-order').value) - 1 });
    if (error) return fail(error, 'Le sous-module ne peut pas être enregistré');
    await loadSubchapters(selectedSubchapterId); setStatus('Sous-module enregistré. Le nouveau contenu est public.', 'success');
  });

  root.querySelector('#builder-delete-subchapter').addEventListener('click', async () => {
    const item = selectedSubchapter();
    if (!item || !confirm(`Supprimer définitivement « ${item.title} » ?`)) return;
    const { error } = await supabase.rpc('admin_delete_subchapter', { p_id: item.id });
    if (error) return fail(error, 'Le sous-module ne peut pas être supprimé');
    await loadSubchapters(); setStatus('Sous-module supprimé.', 'success');
  });

  root.querySelector('.builder-toolbar').addEventListener('click', (event) => {
    const button = event.target.closest('[data-format]'); if (!button) return;
    const formats = { bold: ['**', '**'], italic: ['*', '*'], underline: ['__', '__'], heading: ['## ', ''], quote: ['> ', ''], list: ['- ', ''] };
    const [before, after] = formats[button.dataset.format];
    const start = contentInput.selectionStart, end = contentInput.selectionEnd;
    const selected = contentInput.value.slice(start, end) || (button.dataset.format === 'heading' ? 'Titre' : 'texte');
    contentInput.setRangeText(`${before}${selected}${after}`, start, end, 'select'); contentInput.focus();
  });

  imageUpload.addEventListener('change', async () => {
    const files = [...(imageUpload.files || [])]; if (!files.length || !selectedSubchapterId) return;
    setStatus(`Import de ${files.length} image${files.length > 1 ? 's' : ''}…`);
    let nextOrder = images.filter((item) => item.subchapter_id === selectedSubchapterId).reduce((max, item) => Math.max(max, item.order_index + 1), 0);
    for (const file of files) {
      if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) { setStatus(`${file.name} ignorée : format invalide ou plus de 10 Mo.`, 'error'); continue; }
      const safeName = file.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase();
      const path = `modules/${selectedModuleId}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from('module-assets').upload(path, file, { contentType: file.type, cacheControl: '31536000' });
      if (uploadError) { fail(uploadError, `Échec de l’import de ${file.name}`); continue; }
      const { data: publicData } = supabase.storage.from('module-assets').getPublicUrl(path);
      const { error: rowError } = await supabase.from('subchapter_images').insert({ subchapter_id: selectedSubchapterId, image_url: publicData.publicUrl, storage_path: path, alt_text: '', caption: '', position_index: 1, order_index: nextOrder++ });
      if (rowError) { await supabase.storage.from('module-assets').remove([path]); fail(rowError, `Échec de l’ajout de ${file.name}`); }
    }
    imageUpload.value = ''; await loadSubchapters(selectedSubchapterId); setStatus('Images ajoutées.', 'success');
  });

  imageList.addEventListener('click', async (event) => {
    const card = event.target.closest('[data-image-id]'); if (!card) return;
    const image = images.find((item) => item.id === card.dataset.imageId); if (!image) return;
    if (event.target.closest('[data-image-save]')) {
      const value = (field) => card.querySelector(`[data-image-field="${field}"]`).value;
      const { error } = await supabase.from('subchapter_images').update({ alt_text: value('alt_text').trim(), caption: value('caption').trim() || null, position_index: Math.max(0, Number(value('position_index')) || 0) }).eq('id', image.id);
      if (error) return fail(error, 'L’image ne peut pas être enregistrée');
      await loadSubchapters(selectedSubchapterId); setStatus('Image enregistrée.', 'success');
    }
    if (event.target.closest('[data-image-delete]')) {
      if (!confirm('Supprimer définitivement cette image ?')) return;
      const { error } = await supabase.from('subchapter_images').delete().eq('id', image.id);
      if (error) return fail(error, 'L’image ne peut pas être supprimée');
      if (image.storage_path) await supabase.storage.from('module-assets').remove([image.storage_path]);
      await loadSubchapters(selectedSubchapterId); setStatus('Image supprimée.', 'success');
    }
  });

  initialize();
}
