import { api } from '../api.js';
import { store } from '../store.js';
import { html } from '../ui.js';
import { navigate } from '../router.js';
import { dayGroupedCards, emptyState, remember } from '../components.js';
import { firstName } from '/shared/format.js';

const FILTERS = [
  ['all', 'Alles', ''],
  ['availability', '🕐 Zeit', 'tone-time'],
  ['activity', '🎯 Aktivitäten', 'tone-activity'],
  ['help', '🤝 Hilfe', 'tone-help'],
];

export default async function feedView(_params, query) {
  const type = query.f && query.f !== 'all' ? query.f : undefined;
  const groupId = query.g || undefined;
  const { posts } = await api.posts({ type, groupId });
  remember(posts);

  const qs = (f, g) => new URLSearchParams(Object.entries({ f, g }).filter(([, v]) => v && v !== 'all')).toString();
  const filterChips = FILTERS.map(
    ([key, label, tone]) => html`<button class="chip ${tone} ${(type ?? 'all') === key ? 'on' : ''}"
      data-action="filter" data-q="${qs(key, groupId)}">${label}</button>`,
  );
  const groupChips =
    store.groups.length > 1
      ? html`<div class="chips" style="margin-top:8px">
          <button class="chip small ${!groupId ? 'on' : ''}" data-action="filter" data-q="${qs(type)}">Alle Gruppen</button>
          ${store.groups.map(
            (g) => html`<button class="chip small ${groupId === g.id ? 'on' : ''}" data-action="filter" data-q="${qs(type, g.id)}">${g.emoji} ${g.name}</button>`,
          )}</div>`
      : '';

  let list;
  if (!store.groups.length) {
    list = emptyState('👥', 'Noch keine Gruppe', 'Gründe eine Gruppe und lade deine Freunde per Link ein.',
      html`<a class="btn dark" href="#/groups?new=1">Gruppe erstellen</a>`);
  } else if (!posts.length) {
    list = emptyState('🌤️', type || groupId ? 'Hier ist gerade nichts los' : 'Noch ist es ruhig',
      'Mach den Anfang – sag, wann du Zeit hast oder worauf du Bock hast.',
      html`<button class="btn dark" data-action="plus">+ Eintrag erstellen</button>`);
  } else {
    list = dayGroupedCards(posts);
  }

  return {
    html: html`
      <header class="topbar">
        <div class="title-wrap">
          <div class="sub">Hi ${firstName(store.user.name)} 👋</div>
          <h1>Was geht bei euch?</h1>
        </div>
        <a class="icon-btn" href="#/notifications" aria-label="Benachrichtigungen">🔔
          <span class="badge-dot" data-unread ${store.unread ? '' : 'hidden'}>${store.unread > 9 ? '9+' : store.unread}</span></a>
      </header>

      <div class="quick">
        <button class="time" data-action="new" data-kind="time"><span class="q-emoji">🕐</span>Ich habe Zeit</button>
        <button class="activity" data-action="new" data-kind="activity"><span class="q-emoji">🎯</span>Aktivität</button>
        <button class="help" data-action="new" data-kind="help"><span class="q-emoji">🤝</span>Hilfe</button>
      </div>

      <div class="chips">${filterChips}</div>
      ${groupChips}
      ${list}`,
    actions: {
      filter: (el) => navigate(`/${el.dataset.q ? `?${el.dataset.q}` : ''}`, { replace: true }),
    },
  };
}
