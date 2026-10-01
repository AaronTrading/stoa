import { supabase } from './supabase.js';

let catalogRequest;

export const lessonUrl = (chapter, lesson, resume = false) => `/module?chapitre=${chapter.order_index + 1}&module=${lesson.order_index + 1}${resume ? '&reprendre=1' : ''}`;

export const loadCatalog = async ({ refresh = false } = {}) => {
  if (!catalogRequest || refresh) {
    catalogRequest = supabase.from('chapters')
      .select('id,title,description,order_index,pillar_id,visual_key,pillar:pillars(id,title,order_index),modules(id,title,description,duration_minutes,order_index,is_visible)')
      .eq('is_visible', true).order('order_index')
      .then(({ data, error }) => {
        if (error) throw error;
        const chapters = (data || []).map((chapter) => ({
          ...chapter,
          lessons: (chapter.modules || []).filter((lesson) => lesson.is_visible !== false).sort((a, b) => a.order_index - b.order_index),
        }));
        const lessons = chapters.flatMap((chapter) => chapter.lessons.map((lesson) => ({
          ...lesson, chapter, pillar: chapter.pillar, url: lessonUrl(chapter, lesson),
        })));
        const pillars = [...new Map(chapters.filter((chapter) => chapter.pillar).map((chapter) => [chapter.pillar.id, chapter.pillar])).values()].sort((a, b) => a.order_index - b.order_index);
        return { chapters, lessons, pillars };
      });
  }
  return catalogRequest;
};

export const loadMemberSnapshot = async (userId) => {
  const [catalog, progressResult, stateResult] = await Promise.all([
    loadCatalog(),
    supabase.from('user_progress').select('module_id,status').eq('user_id', userId).eq('status', 'completed').is('subchapter_id', null),
    supabase.from('user_learning_state').select('*').eq('user_id', userId).order('last_read_at', { ascending: false }),
  ]);
  const completed = new Set((progressResult.data || []).map((row) => row.module_id));
  const states = stateResult.data || [];
  const stateByLesson = new Map(states.map((state) => [state.module_id, state]));
  const recent = states.map((state) => ({ state, lesson: catalog.lessons.find((lesson) => lesson.id === state.module_id) })).filter((item) => item.lesson);
  const resume = recent[0] || null;
  const next = catalog.lessons.find((lesson) => !completed.has(lesson.id)) || catalog.lessons[0] || null;
  const percent = catalog.lessons.length ? Math.round(completed.size / catalog.lessons.length * 100) : 0;
  return { ...catalog, completed, states, stateByLesson, recent, resume, next, percent };
};

export const resumeUrl = (item) => {
  if (!item) return '/academie';
  const path = item.state?.url_path || item.lesson.url;
  return `${path}${path.includes('?') ? '&' : '?'}reprendre=1`;
};
