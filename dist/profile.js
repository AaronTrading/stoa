import { siteUrl, supabase } from './supabase.js';
import { attachDepartmentPicker, departmentCode, departmentLabel } from './departments.js';

const form = document.querySelector('#profile-form');
const firstNameInput = document.querySelector('#profile-first-name');
const lastNameInput = document.querySelector('#profile-last-name');
const usernameInput = document.querySelector('#profile-username');
const departmentInput = document.querySelector('#profile-department');
const bioInput = document.querySelector('#profile-bio');
attachDepartmentPicker(departmentInput);
const emailInput = document.querySelector('#profile-email');
const fileInput = document.querySelector('#profile-avatar-input');
const avatarImage = document.querySelector('#profile-avatar-image');
const avatarInitial = document.querySelector('#profile-avatar-initial');
const removeButton = document.querySelector('#profile-avatar-remove');
const message = document.querySelector('#profile-message');
const saveButton = form.querySelector('button[type="submit"]');
const cropDialog = document.querySelector('#avatar-crop-dialog');
const cropCanvas = document.querySelector('#avatar-crop-canvas');
const cropContext = cropCanvas.getContext('2d');
const cropZoom = document.querySelector('#avatar-crop-zoom');
const cropApply = document.querySelector('#crop-apply');
const discordLinkButton = document.querySelector('#discord-link-button');
const discordLinkStatus = document.querySelector('#discord-link-status');
const themeInputs = [...document.querySelectorAll('input[name="themePreference"]')];

let user;
let profile;
let pendingAvatar;
let previewUrl;
let cropImage;
let cropSourceUrl;
let cropBaseScale = 1;
let cropOffsetX = 0;
let cropOffsetY = 0;
let dragStart;
let saveTimer;
let saveInFlight = false;
let saveAgain = false;
const usernamePattern = /^[\p{L}\p{N}._;-]{3,30}$/u;

const setMessage = (text, tone = 'info') => {
  message.textContent = text;
  message.dataset.tone = tone;
};

const setBusy = (busy) => {
  if (saveButton) saveButton.disabled = busy;
  fileInput.disabled = busy;
  removeButton.disabled = busy;
};

const showAvatar = (url, fallback = 'S') => {
  avatarInitial.textContent = fallback.trim().charAt(0).toUpperCase() || 'S';
  avatarImage.hidden = !url;
  avatarInitial.hidden = Boolean(url);
  if (url) avatarImage.src = url;
  else avatarImage.removeAttribute('src');
};

const showHeaderAvatar = (url, fallback = 'S') => {
  document.querySelectorAll('[data-auth-avatar]').forEach((element) => {
    element.textContent = url ? '' : fallback.trim().charAt(0).toUpperCase() || 'S';
    element.style.backgroundImage = url ? `url("${url.replace(/"/g, '%22')}")` : '';
    element.style.backgroundPosition = 'center';
    element.style.backgroundSize = 'cover';
    element.style.backgroundRepeat = 'no-repeat';
    element.classList.toggle('has-image', Boolean(url));
  });
};

const roleLabels = { member: 'Académie', coaching: 'Coaching', admin: 'Administration' };
const cropSize = cropCanvas.width;

const setDiscordLinkState = (linked) => {
  discordLinkStatus.textContent = linked ? 'Compte associé' : 'Non associé';
  discordLinkButton.textContent = linked ? 'Associé ✓' : 'Associer';
  discordLinkButton.disabled = linked;
  discordLinkButton.classList.toggle('linked', linked);
};

const applyThemePreference = (theme) => {
  const preference = theme === 'dark' ? 'dark' : 'light';
  localStorage.setItem('stoa-theme', preference);
  document.documentElement.classList.toggle('stoa-dark', preference === 'dark');
  themeInputs.forEach((input) => { input.checked = input.value === preference; });
  document.querySelector('.academy-theme-toggle')?.setAttribute('aria-pressed', String(preference === 'dark'));
};

const cropMetrics = () => {
  const scale = cropBaseScale * Number(cropZoom.value);
  return { scale, width: cropImage.width * scale, height: cropImage.height * scale };
};

const clampCropOffset = () => {
  const { width, height } = cropMetrics();
  const maxX = Math.max(0, (width - cropSize) / 2);
  const maxY = Math.max(0, (height - cropSize) / 2);
  cropOffsetX = Math.min(maxX, Math.max(-maxX, cropOffsetX));
  cropOffsetY = Math.min(maxY, Math.max(-maxY, cropOffsetY));
};

const drawCrop = (context = cropContext, size = cropSize) => {
  if (!cropImage) return;
  clampCropOffset();
  const { width, height } = cropMetrics();
  const ratio = size / cropSize;
  context.clearRect(0, 0, size, size);
  context.fillStyle = '#e9e7df';
  context.fillRect(0, 0, size, size);
  context.drawImage(
    cropImage,
    ((cropSize - width) / 2 + cropOffsetX) * ratio,
    ((cropSize - height) / 2 + cropOffsetY) * ratio,
    width * ratio,
    height * ratio
  );
};

const releaseCropSource = () => {
  if (cropSourceUrl) URL.revokeObjectURL(cropSourceUrl);
  cropSourceUrl = undefined;
  cropImage = undefined;
  dragStart = undefined;
};

const cancelCrop = () => {
  fileInput.value = '';
  if (cropDialog.open) cropDialog.close();
  releaseCropSource();
};

const openCropEditor = (file) => {
  releaseCropSource();
  cropSourceUrl = URL.createObjectURL(file);
  const image = new Image();
  image.onload = () => {
    cropImage = image;
    cropBaseScale = Math.max(cropSize / image.naturalWidth, cropSize / image.naturalHeight);
    cropOffsetX = 0;
    cropOffsetY = 0;
    cropZoom.value = '1';
    drawCrop();
    cropDialog.showModal();
    cropCanvas.focus();
  };
  image.onerror = () => {
    cancelCrop();
    setMessage('Cette image ne peut pas être ouverte.', 'error');
  };
  image.src = cropSourceUrl;
};

const initializeProfile = async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  user = sessionData.session?.user;
  if (!user) {
    location.replace('/#connexion');
    return;
  }

  const [profileResult, identitiesResult, publicProfileResult, themeResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('full_name, first_name, last_name, username, avatar_url, department, bio, role, created_at')
      .eq('id', user.id)
      .single(),
    supabase.auth.getUserIdentities(),
    supabase.rpc('get_community_profiles', { profile_ids: [user.id] }).maybeSingle(),
    supabase.from('profiles').select('theme_preference,theme_updated_at').eq('id', user.id).maybeSingle(),
  ]);

  const { data, error } = profileResult;

  if (error) {
    setMessage('Votre profil ne peut pas être chargé pour le moment.', 'error');
    return;
  }

  const localTheme = localStorage.getItem('stoa-theme');
  const localThemeDate = Date.parse(localStorage.getItem('stoa-theme-updated-at') || 0);
  const remoteThemeDate = Date.parse(themeResult.data?.theme_updated_at || 0);
  const preferredTheme = localTheme && localThemeDate > remoteThemeDate ? localTheme : (themeResult.data?.theme_preference || localTheme || 'light');
  profile = { ...data, theme_preference: preferredTheme };
  if (themeResult.data?.theme_updated_at) localStorage.setItem('stoa-theme-updated-at', themeResult.data.theme_updated_at);
  const fullName = profile.full_name || user.user_metadata?.full_name || user.user_metadata?.name || '';
  const [fallbackFirstName = '', ...fallbackLastName] = fullName.trim().split(/\s+/).filter(Boolean);
  const firstName = profile.first_name || user.user_metadata?.first_name || fallbackFirstName;
  const lastName = profile.last_name || user.user_metadata?.last_name || fallbackLastName.join(' ');
  const username = profile.username || user.user_metadata?.username || user.user_metadata?.user_name || user.user_metadata?.preferred_username || '';
  const avatarUrl = profile.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
  firstNameInput.value = firstName;
  lastNameInput.value = lastName;
  usernameInput.value = username;
  departmentInput.value = departmentLabel(profile.department || user.user_metadata?.department || '');
  bioInput.value = (profile.bio || '').slice(0, 200);
  applyThemePreference(profile.theme_preference);
  if (localTheme && localThemeDate > remoteThemeDate && localTheme !== themeResult.data?.theme_preference) {
    supabase.rpc('set_theme_preference', { p_theme: localTheme });
  }
  emailInput.value = user.email || '';
  document.querySelector('#profile-role').textContent = roleLabels[profile.role] || 'Membre';
  const publicProfile = publicProfileResult.data;
  document.querySelector('#profile-level').textContent = publicProfile ? `Niveau ${publicProfile.level_number} · ${publicProfile.level_label} (${publicProfile.completed_modules} leçon${Number(publicProfile.completed_modules) > 1 ? 's' : ''})` : 'Niveau 1 · Initié';
  document.querySelector('#profile-created-at').textContent = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(profile.created_at));
  document.querySelector('#profile-provider').textContent = user.app_metadata?.provider === 'discord' ? 'Connecté avec Discord' : 'Connecté par email';
  showAvatar(avatarUrl, firstName || user.email);
  removeButton.hidden = !avatarUrl;
  document.querySelectorAll('[data-user-first-name]').forEach((element) => {
    element.textContent = firstName || 'membre';
  });
  const identities = identitiesResult.data?.identities || user.identities || [];
  setDiscordLinkState(identities.some((identity) => identity.provider === 'discord'));
};

themeInputs.forEach((input) => input.addEventListener('change', async () => {
  if (!input.checked || !user) return;
  const savedAt = new Date().toISOString();
  localStorage.setItem('stoa-theme-updated-at', savedAt);
  applyThemePreference(input.value);
  let { error } = await supabase.rpc('set_theme_preference', { p_theme: input.value });
  if (error) ({ error } = await supabase.from('profiles').update({ theme_preference: input.value }).eq('id', user.id));
  if (error) {
    setMessage('Le thème reste actif sur cet appareil et sera resynchronisé automatiquement.', 'error');
    return;
  }
  profile = { ...profile, theme_preference: input.value };
  setMessage(`Le mode ${input.value === 'dark' ? 'sombre' : 'clair'} sera utilisé à chaque connexion.`, 'success');
}));

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    fileInput.value = '';
    setMessage('Choisissez une image JPG, PNG ou WebP.', 'error');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    fileInput.value = '';
    setMessage('Cette image dépasse la limite de 10 Mo.', 'error');
    return;
  }
  openCropEditor(file);
});

cropZoom.addEventListener('input', () => drawCrop());

cropCanvas.addEventListener('pointerdown', (event) => {
  if (!cropImage) return;
  const bounds = cropCanvas.getBoundingClientRect();
  const ratio = cropSize / bounds.width;
  dragStart = { x: event.clientX, y: event.clientY, offsetX: cropOffsetX, offsetY: cropOffsetY, ratio };
  cropCanvas.setPointerCapture(event.pointerId);
  cropCanvas.classList.add('dragging');
});

cropCanvas.addEventListener('pointermove', (event) => {
  if (!dragStart) return;
  cropOffsetX = dragStart.offsetX + (event.clientX - dragStart.x) * dragStart.ratio;
  cropOffsetY = dragStart.offsetY + (event.clientY - dragStart.y) * dragStart.ratio;
  drawCrop();
});

const endCropDrag = () => {
  dragStart = undefined;
  cropCanvas.classList.remove('dragging');
};

cropCanvas.addEventListener('pointerup', endCropDrag);
cropCanvas.addEventListener('pointercancel', endCropDrag);

cropCanvas.addEventListener('keydown', (event) => {
  const movements = { ArrowLeft: [-8, 0], ArrowRight: [8, 0], ArrowUp: [0, -8], ArrowDown: [0, 8] };
  const movement = movements[event.key];
  if (!movement) return;
  event.preventDefault();
  cropOffsetX += movement[0];
  cropOffsetY += movement[1];
  drawCrop();
});

cropApply.addEventListener('click', () => {
  if (!cropImage) return;
  cropApply.disabled = true;
  const output = document.createElement('canvas');
  output.width = 768;
  output.height = 768;
  drawCrop(output.getContext('2d'), output.width);
  output.toBlob((blob) => {
    cropApply.disabled = false;
    if (!blob) {
      setMessage('Le recadrage n’a pas pu être créé.', 'error');
      return;
    }
    pendingAvatar = new File([blob], 'avatar.webp', { type: 'image/webp', lastModified: Date.now() });
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(blob);
    showAvatar(previewUrl, firstNameInput.value || user?.email);
    showHeaderAvatar(previewUrl, firstNameInput.value || user?.email);
    removeButton.hidden = false;
    fileInput.value = '';
    cropDialog.close();
    releaseCropSource();
    setMessage('Photo prête, enregistrement…');
    queueAutoSave(0);
  }, 'image/webp', 0.9);
});

document.querySelector('#crop-close').addEventListener('click', cancelCrop);
document.querySelector('#crop-cancel').addEventListener('click', cancelCrop);
cropDialog.addEventListener('cancel', (event) => {
  event.preventDefault();
  cancelCrop();
});
cropDialog.addEventListener('click', (event) => {
  if (event.target !== cropDialog) return;
  const bounds = cropDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) cancelCrop();
});

const saveProfile = async () => {
  if (!user) return;
  if (saveInFlight) { saveAgain = true; return; }
  const firstName = firstNameInput.value.trim();
  const lastName = lastNameInput.value.trim();
  const username = usernameInput.value.trim();
  const bio = bioInput.value.trim();
  const department = departmentCode(departmentInput.value);
  const fullName = `${firstName} ${lastName}`.trim();
  if (!usernamePattern.test(username)) {
    setMessage('Le pseudo doit contenir 3 à 30 caractères, sans espace. Utilisez uniquement des lettres, chiffres, points, points-virgules, tirets ou tirets bas.', 'error');
    return;
  }
  if (!firstName || !lastName || !department || bio.length > 200) {
    setMessage('Complétez les champs requis pour terminer l’enregistrement.');
    return;
  }

  saveInFlight = true;
  setBusy(true);
  setMessage('Enregistrement en cours…');
  let avatarUrl = profile.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || null;

  if (pendingAvatar) {
    const avatarPath = `${user.id}/avatar`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(avatarPath, pendingAvatar, {
      upsert: true,
      contentType: pendingAvatar.type,
      cacheControl: '3600',
    });
    if (uploadError) {
      saveInFlight = false;
      setBusy(false);
      setMessage(`La photo n’a pas pu être envoyée : ${uploadError.message}`, 'error');
      return;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(avatarPath);
    avatarUrl = `${data.publicUrl}?v=${Date.now()}`;
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name: fullName, first_name: firstName, last_name: lastName, username, department, bio, avatar_url: avatarUrl })
    .eq('id', user.id);

  if (profileError) {
    saveInFlight = false;
    setBusy(false);
    if (profileError.code === '23505') {
      setMessage('Ce pseudo est déjà utilisé. Choisissez-en un autre.', 'error');
      return;
    }
    setMessage(`Le profil n’a pas pu être enregistré : ${profileError.message}`, 'error');
    return;
  }

  const { error: userError } = await supabase.auth.updateUser({
    data: { full_name: fullName, first_name: firstName, last_name: lastName, username, department, avatar_url: avatarUrl },
  });
  profile = { ...profile, full_name: fullName, first_name: firstName, last_name: lastName, username, department, bio, avatar_url: avatarUrl };
  pendingAvatar = null;
  fileInput.value = '';
  showAvatar(avatarUrl, firstName);
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = undefined;
  showHeaderAvatar(avatarUrl, firstName);
  document.querySelectorAll('[data-user-first-name]').forEach((element) => {
    element.textContent = firstName;
  });
  setBusy(false);
  saveInFlight = false;
  setMessage(userError ? 'Profil enregistré. Le menu sera actualisé à la prochaine connexion.' : 'Tout est enregistré.', userError ? 'error' : 'success');
  if (saveAgain) { saveAgain = false; queueAutoSave(0); }
};

const queueAutoSave = (delay = 700) => {
  clearTimeout(saveTimer);
  setMessage('Modifications en attente…');
  saveTimer = setTimeout(saveProfile, delay);
};

[firstNameInput, lastNameInput, usernameInput, departmentInput, bioInput].forEach((input) => {
  input.addEventListener('input', () => queueAutoSave());
  input.addEventListener('change', () => queueAutoSave(150));
});
form.addEventListener('submit', (event) => { event.preventDefault(); queueAutoSave(0); });

removeButton.addEventListener('click', async () => {
  if (!user) return;
  setBusy(true);
  setMessage('Suppression de la photo…');
  const { error: storageError } = await supabase.storage.from('avatars').remove([`${user.id}/avatar`]);
  if (storageError) {
    setBusy(false);
    setMessage(`La photo n’a pas pu être supprimée : ${storageError.message}`, 'error');
    return;
  }
  const { error: profileError } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id);
  const { error: userError } = await supabase.auth.updateUser({ data: { avatar_url: null } });
  setBusy(false);
  if (profileError || userError) {
    setMessage('La photo a été supprimée, mais le profil n’a pas pu être entièrement actualisé.', 'error');
    return;
  }
  profile = { ...profile, avatar_url: null };
  pendingAvatar = null;
  fileInput.value = '';
  showAvatar('', firstNameInput.value || user.email);
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = undefined;
  removeButton.hidden = true;
  showHeaderAvatar('', firstNameInput.value || user.email);
  setMessage('Votre photo de profil a été supprimée.', 'success');
});

discordLinkButton.addEventListener('click', async () => {
  discordLinkButton.disabled = true;
  discordLinkButton.textContent = 'Redirection…';
  setMessage('Ouverture de Discord pour associer votre compte…');
  const { error } = await supabase.auth.linkIdentity({
    provider: 'discord',
    options: { redirectTo: new URL('/profil', siteUrl).href },
  });
  if (error) {
    discordLinkButton.disabled = false;
    discordLinkButton.textContent = 'Associer';
    setMessage(`Le compte Discord n’a pas pu être associé : ${error.message}`, 'error');
  }
});

document.querySelector('#profile-signout').addEventListener('click', async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    setMessage(error.message, 'error');
    return;
  }
  location.replace('/');
});

initializeProfile();
