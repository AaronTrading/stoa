import { supabase } from './supabase.js';

const form = document.querySelector('#profile-form');
const nameInput = document.querySelector('#profile-name');
const emailInput = document.querySelector('#profile-email');
const fileInput = document.querySelector('#profile-avatar-input');
const avatarImage = document.querySelector('#profile-avatar-image');
const avatarInitial = document.querySelector('#profile-avatar-initial');
const removeButton = document.querySelector('#profile-avatar-remove');
const message = document.querySelector('#profile-message');
const saveButton = form.querySelector('button[type="submit"]');

let user;
let profile;
let pendingAvatar;
let previewUrl;

const setMessage = (text, tone = 'info') => {
  message.textContent = text;
  message.dataset.tone = tone;
};

const setBusy = (busy) => {
  saveButton.disabled = busy;
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

const roleLabels = { member: 'Académie', coaching: 'Accompagnement', admin: 'Administration' };

const initializeProfile = async () => {
  const { data: sessionData } = await supabase.auth.getSession();
  user = sessionData.session?.user;
  if (!user) {
    location.replace('/#connexion');
    return;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, role, created_at')
    .eq('id', user.id)
    .single();

  if (error) {
    setMessage('Votre profil ne peut pas être chargé pour le moment.', 'error');
    return;
  }

  profile = data;
  const fullName = profile.full_name || user.user_metadata?.full_name || user.user_metadata?.name || '';
  const avatarUrl = profile.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
  nameInput.value = fullName;
  emailInput.value = user.email || '';
  document.querySelector('#profile-role').textContent = roleLabels[profile.role] || 'Membre';
  document.querySelector('#profile-created-at').textContent = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(profile.created_at));
  document.querySelector('#profile-provider').textContent = user.app_metadata?.provider === 'discord' ? 'Connecté avec Discord' : 'Connecté par email';
  showAvatar(avatarUrl, fullName || user.email);
  removeButton.hidden = !avatarUrl;
};

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    fileInput.value = '';
    setMessage('Choisissez une image JPG, PNG ou WebP.', 'error');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    fileInput.value = '';
    setMessage('Cette image dépasse la limite de 5 Mo.', 'error');
    return;
  }
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = URL.createObjectURL(file);
  pendingAvatar = file;
  showAvatar(previewUrl, nameInput.value || user?.email);
  removeButton.hidden = false;
  setMessage('Photo prête à être enregistrée.');
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const fullName = nameInput.value.trim();
  if (!fullName) {
    setMessage('Renseignez votre nom complet.', 'error');
    return;
  }

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
      setBusy(false);
      setMessage(`La photo n’a pas pu être envoyée : ${uploadError.message}`, 'error');
      return;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(avatarPath);
    avatarUrl = `${data.publicUrl}?v=${Date.now()}`;
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ full_name: fullName, avatar_url: avatarUrl })
    .eq('id', user.id);

  if (profileError) {
    setBusy(false);
    setMessage(`Le profil n’a pas pu être enregistré : ${profileError.message}`, 'error');
    return;
  }

  const { error: userError } = await supabase.auth.updateUser({ data: { full_name: fullName, avatar_url: avatarUrl } });
  setBusy(false);
  if (userError) {
    setMessage('Le profil est enregistré, mais l’avatar du menu sera actualisé à la prochaine connexion.', 'error');
    return;
  }

  profile = { ...profile, full_name: fullName, avatar_url: avatarUrl };
  pendingAvatar = null;
  fileInput.value = '';
  showAvatar(avatarUrl, fullName);
  document.querySelectorAll('[data-auth-avatar]').forEach((element) => {
    element.textContent = avatarUrl ? '' : fullName.charAt(0).toUpperCase();
    element.style.backgroundImage = avatarUrl ? `url("${avatarUrl}")` : '';
    element.classList.toggle('has-image', Boolean(avatarUrl));
  });
  setMessage('Votre profil a bien été mis à jour.', 'success');
});

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
  showAvatar('', nameInput.value || user.email);
  removeButton.hidden = true;
  document.querySelectorAll('[data-auth-avatar]').forEach((element) => {
    element.textContent = (nameInput.value || user.email || 'S').charAt(0).toUpperCase();
    element.style.backgroundImage = '';
    element.classList.remove('has-image');
  });
  setMessage('Votre photo de profil a été supprimée.', 'success');
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
