import { supabase } from './supabase.js';
import { loadMemberSnapshot, resumeUrl } from './member-data.js';

const $ = (selector) => document.querySelector(selector);
const session = (await supabase.auth.getSession()).data.session;
if (!session) location.replace('/#connexion');
else hydrate(session.user);

async function hydrate(user) {
  const [{ data: profile }, snapshot, { data: pinned }] = await Promise.all([
    supabase.from('profiles').select('first_name,full_name,username').eq('id', user.id).maybeSingle(),
    loadMemberSnapshot(user.id),
    supabase.from('community_posts').select('id,title,content').not('pinned_at', 'is', null).order('pinned_at', { ascending: false }).limit(1).maybeSingle(),
  ]);
  const firstName = profile?.first_name || profile?.full_name?.split(/\s+/)[0] || profile?.username || '';
  document.querySelectorAll('[data-user-first-name]').forEach((node) => { node.textContent = firstName; });

  const resume = snapshot.resume;
  const featured = resume?.lesson || snapshot.next;
  if (featured) {
    $('#home-resume').href = resume ? resumeUrl(resume) : featured.url;
    $('#home-resume-title').textContent = featured.title;
    $('#home-resume-meta').textContent = `${featured.pillar?.title || 'Académie'} · ${featured.chapter.title}`;
    $('#home-resume-label').textContent = resume ? 'DERNIÈRE LECTURE' : 'COMMENCER PAR';
    $('#home-resume-image').style.backgroundImage = `url('/assets/categories/${featured.chapter.visual_key || 'autonomie'}.jpg')`;
    $('#home-reading-bar').style.width = `${resume ? Math.round(Number(resume.state.progress_ratio || 0) * 100) : 0}%`;
  }
  $('#home-progress-value').textContent = `${snapshot.percent}%`;
  $('#home-progress').value = snapshot.percent;
  $('#home-progress-caption').textContent = `${snapshot.completed.size} leçon${snapshot.completed.size > 1 ? 's' : ''} terminée${snapshot.completed.size > 1 ? 's' : ''}`;
  if (snapshot.next) {
    $('#home-next-title').textContent = snapshot.next.title;
    $('#home-next-meta').textContent = `${snapshot.next.pillar?.title || 'Académie'} · ${snapshot.next.chapter.title} · ${snapshot.next.duration_minutes || 10} min`;
    $('#home-next-link').href = snapshot.next.url;
  }
  if (pinned) {
    $('#home-news-title').textContent = pinned.title;
    $('#home-news-copy').textContent = pinned.content.length > 170 ? `${pinned.content.slice(0, 167)}…` : pinned.content;
    $('#home-news-link').href = `/posts?publication=${pinned.id}`;
  }
}
