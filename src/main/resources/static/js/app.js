// Campus Connect frontend: a small hash-routed single page app (no framework, no build step).
(() => {
  'use strict';

  /* ---------------- helpers ---------------- */
  const $ = (s, r = document) => r.querySelector(s);
  const esc = v => String(v ?? '').replace(/[&<>"']/g,
    c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const toDate = v => { const s = String(v).slice(0, 19); return new Date(s.length === 10 ? s + 'T00:00:00' : s); };
  const fmtDate = v => toDate(v).toLocaleDateString([], { dateStyle: 'medium' });
  const plural = (n, word, many = word + 's') => `${n} ${n === 1 ? word : many}`;
  function ago(v) {
    const s = Math.max(1, Math.round((Date.now() - toDate(v)) / 1000));
    for (const [name, sec] of [['day', 86400], ['hour', 3600], ['minute', 60]]) {
      if (s >= sec) return plural(Math.floor(s / sec), name) + ' ago';
    }
    return 'just now';
  }

  const ROLE_LABEL = { STUDENT: 'Student', FACULTY: 'Faculty', CLUB_LEAD: 'Club lead', ADMIN: 'Admin' };
  const state = { user: readUser() };

  function readUser() { try { return JSON.parse(localStorage.getItem('cc_user')); } catch { return null; } }
  function saveSession(token, user) {
    localStorage.setItem('cc_token', token);
    saveUser(user);
  }
  function saveUser(user) { localStorage.setItem('cc_user', JSON.stringify(user)); state.user = user; }
  function clearSession() { localStorage.removeItem('cc_token'); localStorage.removeItem('cc_user'); state.user = null; }

  // UI-side permission checks only hide buttons. The server enforces the same rules.
  const can = (...roles) => !!state.user && roles.includes(state.user.role);
  const owns = ownerId => !!state.user && (state.user.role === 'ADMIN' || state.user.id === ownerId);

  let toastTimer;
  function toast(msg, isError = false) {
    const t = $('#toast');
    t.textContent = msg;
    t.className = 'show' + (isError ? ' error' : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = ''; }, 3200);
  }
  const guard = fn => async (...args) => { try { return await fn(...args); } catch (e) { toast(e.message, true); } };

  const head = (title, sub, action = '') =>
    `<header class="page-head"><div><h1>${esc(title)}</h1>${sub ? `<p>${esc(sub)}</p>` : ''}</div>${action}</header>`;
  const empty = msg => `<p class="empty">${esc(msg)}</p>`;
  const badge = (text, cls = '') => `<span class="badge ${esc(cls)}">${esc(text)}</span>`;
  const delBtn = (act, id) => `<button class="link danger" data-act="${act}" data-id="${id}">Delete</button>`;
  const byline = (user, when) => `<div class="meta"><span>${esc(user?.name || 'Unknown')}</span>${user?.role ? badge(ROLE_LABEL[user.role], user.role) : ''}<span>${ago(when)}</span></div>`;
  const newBtn = label => `<button class="btn primary" data-act="new">${esc(label)}</button>`;

  /* ---------------- modal form ---------------- */
  function openForm({ title, fields, submitLabel, onSubmit }) {
    const dlg = $('#modal');
    const control = f => {
      const common = `name="${f.name}" ${f.required ? 'required' : ''}`;
      if (f.type === 'textarea') return `<textarea ${common} rows="4" maxlength="${f.max || 2000}"></textarea>`;
      if (f.type === 'select') {
        return `<select ${common}>${f.options.map(o => {
          const v = typeof o === 'string' ? o : o.value, l = typeof o === 'string' ? o : o.label;
          return `<option value="${esc(v)}">${esc(l)}</option>`;
        }).join('')}</select>`;
      }
      return `<input ${common} type="${f.type || 'text'}" maxlength="${f.max || 150}" placeholder="${esc(f.placeholder || '')}">`;
    };
    dlg.innerHTML = `<form class="form">
      <h2>${esc(title)}</h2>
      ${fields.map(f => `<label>${esc(f.label)}${control(f)}</label>`).join('')}
      <p class="form-error" hidden></p>
      <div class="actions">
        <button type="button" class="btn ghost" data-close>Cancel</button>
        <button type="submit" class="btn primary">${esc(submitLabel)}</button>
      </div></form>`;
    const form = $('form', dlg), err = $('.form-error', dlg);
    $('[data-close]', dlg).onclick = () => dlg.close();
    form.onsubmit = async e => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form));
      Object.keys(data).forEach(k => { if (data[k] === '') delete data[k]; }); // omit empty optional fields
      try { await onSubmit(data); dlg.close(); }
      catch (ex) { err.textContent = ex.message; err.hidden = false; }
    };
    dlg.showModal();
    const first = $('input, textarea, select', dlg);
    if (first) first.focus();
  }

  function openInfo(title, html) {
    const dlg = $('#modal');
    dlg.innerHTML = `<div class="form"><h2>${esc(title)}</h2>${html}<div class="actions"><button class="btn primary" data-close>Close</button></div></div>`;
    $('[data-close]', dlg).onclick = () => dlg.close();
    dlg.showModal();
  }

  /* ---------------- auth screen ---------------- */
  function renderAuth(mode = 'login') {
    const reg = mode === 'register';
    $('#app').innerHTML = `
      <div class="auth">
        <section class="auth-intro">
          <div class="brand">Campus Connect</div>
          <h1>Everything happening on campus, in one place.</h1>
          <p>Find events and clubs, share study material, spot internships and talk with your whole university. What you can do depends on your role.</p>
          <div class="demo"><span>Try a demo account:</span>
            <button data-demo="student@campus.edu|student123">Student</button>
            <button data-demo="lead@campus.edu|lead123">Club lead</button>
            <button data-demo="faculty@campus.edu|faculty123">Faculty</button>
            <button data-demo="admin@campus.edu|admin123">Admin</button>
          </div>
        </section>
        <section class="auth-card">
          <form id="auth-form">
            <h2>${reg ? 'Create your account' : 'Sign in'}</h2>
            ${reg ? '<label>Full name<input name="name" required maxlength="100"></label>' : ''}
            <label>Email<input name="email" type="email" required autocomplete="username"></label>
            ${reg ? '<label>Department<input name="department" maxlength="100" placeholder="e.g. Computer Science"></label>' : ''}
            <label>Password<input name="password" type="password" required minlength="${reg ? 6 : 1}" autocomplete="${reg ? 'new-password' : 'current-password'}"></label>
            <p class="form-error" hidden></p>
            <button class="btn primary" type="submit">${reg ? 'Create account' : 'Sign in'}</button>
            <p class="switch">${reg ? 'Already have an account?' : 'New here?'}
              <button type="button" class="link" id="switch">${reg ? 'Sign in' : 'Create an account'}</button></p>
          </form>
        </section>
      </div>`;
    const errEl = $('.form-error');
    $('#switch').onclick = () => renderAuth(reg ? 'login' : 'register');
    document.querySelectorAll('[data-demo]').forEach(b => {
      b.onclick = () => { const [email, password] = b.dataset.demo.split('|'); authenticate('/auth/login', { email, password }, errEl); };
    });
    $('#auth-form').onsubmit = e => {
      e.preventDefault();
      authenticate(reg ? '/auth/register' : '/auth/login', Object.fromEntries(new FormData(e.target)), errEl);
    };
  }

  async function authenticate(path, data, errEl) {
    try {
      const res = await api.post(path, data);
      saveSession(res.token, res.user);
      history.replaceState(null, '', '#/home');
      route();
    } catch (e) { errEl.textContent = e.message; errEl.hidden = false; }
  }

  /* ---------------- shell + router ---------------- */
  const NAV = [['home', 'Home'], ['announcements', 'Announcements'], ['events', 'Events'], ['clubs', 'Clubs'],
               ['resources', 'Resources'], ['jobs', 'Jobs & internships'], ['forum', 'Forum']];

  function renderShell() {
    const u = state.user;
    const items = u.role === 'ADMIN' ? [...NAV, ['admin', 'Manage users']] : NAV;
    $('#app').innerHTML = `
      <div class="shell">
        <aside class="side">
          <div class="brand">Campus Connect<small>${esc(u.department || 'Your university')}</small></div>
          <nav class="nav" aria-label="Main">${items.map(([k, l]) => `<a href="#/${k}" data-nav="${k}">${l}</a>`).join('')}</nav>
          <div class="me">
            <div><strong>${esc(u.name)}</strong><br>${badge(ROLE_LABEL[u.role], u.role)}</div>
            <button class="btn ghost" id="logout">Sign out</button>
          </div>
        </aside>
        <main id="view" tabindex="-1"></main>
      </div>`;
    $('#logout').onclick = () => { clearSession(); history.replaceState(null, '', location.pathname); renderAuth(); };
  }

  function markNav(name) {
    document.querySelectorAll('[data-nav]').forEach(a => {
      const on = a.dataset.nav === name;
      a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
  }

  async function route() {
    if (!state.user) return renderAuth();
    const [name, id] = location.hash.replace(/^#\/?/, '').split('/');
    const key = routes[name] ? name : 'home';
    if (!$('#view')) renderShell();
    markNav(key);
    const root = $('#view');
    root.onclick = root.oninput = root.onchange = null;
    root.innerHTML = '<p class="empty">Loading…</p>';
    try { await routes[key](root, id); }
    catch (e) { root.innerHTML = `<p class="empty error">${esc(e.message)}</p>`; }
  }

  /* ---------------- views ---------------- */
  async function viewHome(root) {
    const [ann, events, clubs, jobs] = await Promise.all(['/announcements', '/events', '/clubs', '/jobs'].map(p => api.get(p)));
    const uid = state.user.id, now = new Date();
    const upcoming = events.filter(e => toDate(e.startTime) >= now);
    const going = upcoming.filter(e => e.attendeeIds.includes(uid)).length;
    const myClubs = clubs.filter(c => c.memberIds.includes(uid)).length;
    const mini = (title, sub, href) => `<a class="mini" href="${href}"><strong>${esc(title)}</strong><span>${esc(sub)}</span></a>`;
    root.innerHTML = head(`Hello, ${state.user.name.split(' ')[0]}`, 'Here is what is happening on campus.') +
      `<p class="summary">You are going to ${plural(going, 'upcoming event')} and belong to ${plural(myClubs, 'club')}.</p>
      <div class="grid-2">
        <section class="panel"><h2>Latest announcements</h2>
          ${ann.slice(0, 3).map(a => mini(a.title, `${a.author?.name || 'Unknown'}, ${ago(a.createdAt)}`, '#/announcements')).join('') || empty('Nothing yet.')}
        </section>
        <section class="panel"><h2>Coming up</h2>
          ${upcoming.slice(0, 3).map(e => mini(e.title, `${toDate(e.startTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} at ${e.location}`, '#/events')).join('') || empty('No upcoming events.')}
        </section>
        <section class="panel"><h2>Open opportunities</h2>
          ${jobs.slice(0, 3).map(j => mini(j.title, `${j.company}${j.deadline ? ', apply by ' + fmtDate(j.deadline) : ''}`, '#/jobs')).join('') || empty('No postings yet.')}
        </section>
      </div>`;
  }

  async function viewAnnouncements(root) {
    const list = await api.get('/announcements');
    root.innerHTML = head('Announcements', 'Official notices from faculty and administration.',
        can('FACULTY', 'ADMIN') ? newBtn('New announcement') : '') +
      `<div class="stack">${list.map(a => `
        <article class="row"><div class="body"><h3>${esc(a.title)}</h3><p>${esc(a.content)}</p>${byline(a.author, a.createdAt)}</div>
        ${owns(a.author?.id) ? `<div class="row-actions">${delBtn('del', a.id)}</div>` : ''}</article>`).join('') || empty('No announcements yet.')}</div>`;
    root.onclick = guard(async e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'new') {
        openForm({
          title: 'New announcement', submitLabel: 'Post announcement',
          fields: [{ name: 'title', label: 'Title', required: true }, { name: 'content', label: 'Message', type: 'textarea', required: true, max: 3000 }],
          onSubmit: async d => { await api.post('/announcements', d); toast('Announcement posted'); route(); }
        });
      } else if (b.dataset.act === 'del' && confirm('Delete this announcement?')) {
        await api.del('/announcements/' + b.dataset.id); toast('Announcement deleted'); route();
      }
    });
  }

  async function viewEvents(root) {
    const events = await api.get('/events');
    const now = new Date(), uid = state.user.id;
    const upcoming = events.filter(e => toDate(e.startTime) >= now);
    const past = events.filter(e => toDate(e.startTime) < now).reverse();
    const row = e => {
      const d = toDate(e.startTime), isPast = d < now, going = e.attendeeIds.includes(uid);
      return `<article class="row event ${isPast ? 'past' : ''}">
        <div class="date"><b>${d.getDate()}</b><span>${d.toLocaleString([], { month: 'short' })}</span></div>
        <div class="body"><h3>${esc(e.title)}</h3><p>${esc(e.description)}</p>
          <div class="meta"><span>${d.toLocaleTimeString([], { timeStyle: 'short' })}</span><span>${esc(e.location)}</span>
            ${e.category ? badge(e.category) : ''}<span>${e.attendeeIds.length} going</span><span>Hosted by ${esc(e.organizer?.name || 'Unknown')}</span></div></div>
        <div class="row-actions">
          ${isPast ? '' : `<button class="btn ${going ? 'ghost' : 'primary'}" data-act="rsvp" data-id="${e.id}">${going ? 'Cancel RSVP' : 'RSVP'}</button>`}
          ${owns(e.organizer?.id) ? delBtn('del', e.id) : ''}</div></article>`;
    };
    root.innerHTML = head('Events', 'Workshops, fests, talks and meetups.', can('CLUB_LEAD', 'FACULTY', 'ADMIN') ? newBtn('Create event') : '') +
      `<div class="stack">${upcoming.map(row).join('') || empty('No upcoming events yet.')}</div>` +
      (past.length ? `<h2 class="section-title">Past events</h2><div class="stack">${past.map(row).join('')}</div>` : '');
    root.onclick = guard(async e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'new') {
        openForm({
          title: 'Create event', submitLabel: 'Create event',
          fields: [
            { name: 'title', label: 'Title', required: true },
            { name: 'description', label: 'Description', type: 'textarea' },
            { name: 'location', label: 'Location', required: true },
            { name: 'category', label: 'Category', type: 'select', options: ['Technical', 'Cultural', 'Sports', 'Academic', 'Social'] },
            { name: 'startTime', label: 'Starts at', type: 'datetime-local', required: true }
          ],
          onSubmit: async d => { await api.post('/events', d); toast('Event created'); route(); }
        });
      } else if (b.dataset.act === 'rsvp') {
        const ev = await api.post(`/events/${b.dataset.id}/rsvp`);
        toast(ev.attendeeIds.includes(uid) ? 'You are going' : 'RSVP cancelled'); route();
      } else if (b.dataset.act === 'del' && confirm('Delete this event?')) {
        await api.del('/events/' + b.dataset.id); toast('Event deleted'); route();
      }
    });
  }

  async function viewClubs(root) {
    const clubs = await api.get('/clubs');
    const uid = state.user.id;
    root.innerHTML = head('Clubs', 'Find your people.', can('CLUB_LEAD', 'ADMIN') ? newBtn('Start a club') : '') +
      `<div class="grid-cards">${clubs.map(c => {
        const member = c.memberIds.includes(uid), lead = c.lead?.id === uid;
        return `<article class="card">
          ${c.category ? `<div class="meta">${badge(c.category)}</div>` : ''}
          <h3>${esc(c.name)}</h3><p>${esc(c.description)}</p>
          <div class="meta"><span>${plural(c.memberIds.length, 'member')}</span><span>Led by ${esc(c.lead?.name || 'Unknown')}</span></div>
          <div class="foot">
            ${lead ? badge('You lead this club', 'CLUB_LEAD')
                   : `<button class="btn ${member ? 'ghost' : 'primary'}" data-act="join" data-id="${c.id}">${member ? 'Leave club' : 'Join club'}</button>`}
            ${owns(c.lead?.id) ? delBtn('del', c.id) : ''}</div></article>`;
      }).join('') || empty('No clubs yet.')}</div>`;
    root.onclick = guard(async e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'new') {
        openForm({
          title: 'Start a club', submitLabel: 'Create club',
          fields: [
            { name: 'name', label: 'Club name', required: true, max: 100 },
            { name: 'category', label: 'Category', type: 'select', options: ['Technical', 'Creative', 'Cultural', 'Sports', 'Social'] },
            { name: 'description', label: 'What is it about?', type: 'textarea' }
          ],
          onSubmit: async d => { await api.post('/clubs', d); toast('Club created'); route(); }
        });
      } else if (b.dataset.act === 'join') {
        const c = await api.post(`/clubs/${b.dataset.id}/join`);
        toast(c.memberIds.includes(uid) ? 'You joined ' + c.name : 'You left ' + c.name); route();
      } else if (b.dataset.act === 'del' && confirm('Delete this club?')) {
        await api.del('/clubs/' + b.dataset.id); toast('Club deleted'); route();
      }
    });
  }

  async function viewResources(root) {
    const list = await api.get('/resources');
    root.innerHTML = head('Resources', 'Notes, links and study material shared by the community.', newBtn('Share a resource')) +
      `<input class="search" type="search" id="q" placeholder="Search resources" aria-label="Search resources">
       <div class="stack">${list.map(r => `
        <article class="row" data-text="${esc((r.title + ' ' + (r.description || '') + ' ' + (r.category || '')).toLowerCase())}">
          <div class="body"><h3><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.title)}</a></h3>
            ${r.description ? `<p>${esc(r.description)}</p>` : ''}
            <div class="meta">${r.category ? badge(r.category) : ''}<span>Shared by ${esc(r.uploadedBy?.name || 'Unknown')}</span><span>${ago(r.createdAt)}</span></div></div>
          ${owns(r.uploadedBy?.id) ? `<div class="row-actions">${delBtn('del', r.id)}</div>` : ''}</article>`).join('') || empty('Nothing shared yet.')}</div>`;
    root.oninput = e => {
      if (e.target.id !== 'q') return;
      const q = e.target.value.trim().toLowerCase();
      root.querySelectorAll('[data-text]').forEach(el => { el.hidden = !el.dataset.text.includes(q); });
    };
    root.onclick = guard(async e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'new') {
        openForm({
          title: 'Share a resource', submitLabel: 'Share resource',
          fields: [
            { name: 'title', label: 'Title', required: true },
            { name: 'url', label: 'Link', type: 'url', required: true, max: 1000, placeholder: 'https://' },
            { name: 'category', label: 'Subject or topic', placeholder: 'e.g. Operating Systems' },
            { name: 'description', label: 'Short description', type: 'textarea', max: 1000 }
          ],
          onSubmit: async d => { await api.post('/resources', d); toast('Resource shared'); route(); }
        });
      } else if (b.dataset.act === 'del' && confirm('Delete this resource?')) {
        await api.del('/resources/' + b.dataset.id); toast('Resource deleted'); route();
      }
    });
  }

  async function viewJobs(root) {
    let jobs = await api.get('/jobs');
    let filter = 'ALL';
    const uid = state.user.id;
    const today = new Date(); today.setHours(0, 0, 0, 0);

    const card = j => {
      const applied = j.applicantIds.includes(uid);
      const closed = j.deadline && toDate(j.deadline) < today;
      const manage = owns(j.postedBy?.id);
      return `<article class="row"><div class="body">
          <div class="meta">${badge(j.type === 'JOB' ? 'Job' : 'Internship', j.type)}${closed ? badge('Closed') : ''}</div>
          <h3>${esc(j.title)}</h3>
          <div class="meta"><span>${esc(j.company)}</span>${j.location ? `<span>${esc(j.location)}</span>` : ''}${j.deadline ? `<span>Apply by ${fmtDate(j.deadline)}</span>` : ''}</div>
          ${j.description ? `<p>${esc(j.description)}</p>` : ''}</div>
        <div class="row-actions">
          ${can('STUDENT') && !(closed && !applied) ? `<button class="btn ${applied ? 'ghost' : 'primary'}" data-act="apply" data-id="${j.id}">${applied ? 'Withdraw' : 'Apply'}</button>` : ''}
          ${manage ? `<button class="link" data-act="applicants" data-id="${j.id}">Applicants (${j.applicantIds.length})</button>${delBtn('del', j.id)}` : ''}
        </div></article>`;
    };
    const paint = () => {
      const shown = jobs.filter(j => filter === 'ALL' || j.type === filter);
      root.innerHTML = head('Jobs & internships', 'Opportunities posted by faculty and the placement cell.', can('FACULTY', 'ADMIN') ? newBtn('Post an opportunity') : '') +
        `<div class="tabs">${[['ALL', 'All'], ['INTERNSHIP', 'Internships'], ['JOB', 'Jobs']]
          .map(([k, l]) => `<button data-filter="${k}" class="${filter === k ? 'on' : ''}">${l}</button>`).join('')}</div>
         <div class="stack">${shown.map(card).join('') || empty('Nothing posted here yet.')}</div>`;
    };
    paint();

    root.onclick = guard(async e => {
      const f = e.target.closest('[data-filter]');
      if (f) { filter = f.dataset.filter; return paint(); }
      const b = e.target.closest('[data-act]'); if (!b) return;
      const id = Number(b.dataset.id);
      if (b.dataset.act === 'new') {
        openForm({
          title: 'Post an opportunity', submitLabel: 'Post opportunity',
          fields: [
            { name: 'title', label: 'Role title', required: true },
            { name: 'company', label: 'Company', required: true },
            { name: 'type', label: 'Type', type: 'select', required: true, options: [{ value: 'INTERNSHIP', label: 'Internship' }, { value: 'JOB', label: 'Full-time job' }] },
            { name: 'location', label: 'Location', placeholder: 'City or Remote' },
            { name: 'deadline', label: 'Apply by', type: 'date' },
            { name: 'description', label: 'Details', type: 'textarea', max: 3000 }
          ],
          onSubmit: async d => { await api.post('/jobs', d); toast('Opportunity posted'); route(); }
        });
      } else if (b.dataset.act === 'apply') {
        const updated = await api.post(`/jobs/${id}/apply`);
        jobs = jobs.map(j => (j.id === id ? updated : j));
        paint();
        toast(updated.applicantIds.includes(uid) ? 'Application recorded' : 'Application withdrawn');
      } else if (b.dataset.act === 'applicants') {
        const people = await api.get(`/jobs/${id}/applicants`);
        openInfo('Applicants', people.length
          ? `<ul class="plain-list">${people.map(p => `<li><strong>${esc(p.name)}</strong><span>${esc(p.email)}${p.department ? ', ' + esc(p.department) : ''}</span></li>`).join('')}</ul>`
          : empty('No one has applied yet.'));
      } else if (b.dataset.act === 'del' && confirm('Delete this posting?')) {
        await api.del('/jobs/' + id); toast('Posting deleted');
        jobs = jobs.filter(j => j.id !== id); paint();
      }
    });
  }

  async function viewForum(root, id) {
    if (id) return viewThread(root, id);
    const posts = await api.get('/forum');
    root.innerHTML = head('Forum', 'Ask questions, share advice, start a discussion.', newBtn('Start a thread')) +
      `<div class="stack">${posts.map(p => `
        <article class="row"><div class="body">
          <h3><a href="#/forum/${p.id}">${esc(p.title)}</a></h3>
          <div class="meta">${p.category ? badge(p.category) : ''}<span>${esc(p.author?.name || 'Unknown')}</span><span>${ago(p.createdAt)}</span><span>${plural(p.commentCount, 'reply', 'replies')}</span></div>
        </div></article>`).join('') || empty('No threads yet. Be the first to start one.')}</div>`;
    root.onclick = guard(async e => {
      const b = e.target.closest('[data-act="new"]'); if (!b) return;
      openForm({
        title: 'Start a thread', submitLabel: 'Post thread',
        fields: [
          { name: 'title', label: 'Title', required: true, max: 200 },
          { name: 'category', label: 'Topic', type: 'select', options: ['General', 'Academics', 'Careers', 'Campus life', 'Clubs'] },
          { name: 'content', label: 'What do you want to discuss?', type: 'textarea', required: true, max: 4000 }
        ],
        onSubmit: async d => { const p = await api.post('/forum', d); toast('Thread posted'); location.hash = '#/forum/' + p.id; }
      });
    });
  }

  async function viewThread(root, id) {
    const [post, comments] = await Promise.all([api.get('/forum/' + id), api.get(`/forum/${id}/comments`)]);
    const canModerate = c => can('FACULTY') || owns(c?.id);
    root.innerHTML = `<a class="back" href="#/forum">Back to forum</a>
      <article class="panel">
        ${post.category ? `<div class="meta">${badge(post.category)}</div>` : ''}
        <h1>${esc(post.title)}</h1>
        <p class="thread-body">${esc(post.content)}</p>
        ${byline(post.author, post.createdAt)}
        ${canModerate(post.author) ? `<div>${delBtn('del-post', post.id)}</div>` : ''}
      </article>
      <h2 class="section-title">${comments.length === 1 ? '1 reply' : comments.length + ' replies'}</h2>
      <div class="panel">
        ${comments.map(c => `<div class="comment">${byline(c.author, c.createdAt)}<p>${esc(c.content)}</p>${canModerate(c.author) ? `<div>${delBtn('del-comment', c.id)}</div>` : ''}</div>`).join('')
          || empty('No replies yet. Start the conversation.')}
        <form class="comment-form" id="comment-form">
          <textarea name="content" rows="3" required maxlength="2000" placeholder="Write a reply" aria-label="Write a reply"></textarea>
          <button class="btn primary" type="submit">Post reply</button>
        </form>
      </div>`;
    $('#comment-form').onsubmit = guard(async e => {
      e.preventDefault();
      const content = new FormData(e.target).get('content').trim();
      if (!content) return;
      await api.post(`/forum/${id}/comments`, { content });
      route();
    });
    root.onclick = guard(async e => {
      const b = e.target.closest('[data-act]'); if (!b) return;
      if (b.dataset.act === 'del-post' && confirm('Delete this thread and all its replies?')) {
        await api.del('/forum/' + b.dataset.id); toast('Thread deleted'); location.hash = '#/forum';
      } else if (b.dataset.act === 'del-comment' && confirm('Delete this reply?')) {
        await api.del('/forum/comments/' + b.dataset.id); toast('Reply deleted'); route();
      }
    });
  }

  async function viewAdmin(root) {
    if (!can('ADMIN')) { root.innerHTML = empty('Only administrators can manage users.'); return; }
    const users = await api.get('/users');
    root.innerHTML = head('Manage users', 'New sign-ups start as students. Promote people to club lead or faculty here.') +
      `<div class="table-wrap"><table>
        <thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Role</th></tr></thead>
        <tbody>${users.map(u => `<tr>
          <td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${esc(u.department || '')}</td>
          <td>${u.id === state.user.id ? badge(ROLE_LABEL[u.role], u.role)
            : `<select data-role-for="${u.id}" aria-label="Role for ${esc(u.name)}">${Object.keys(ROLE_LABEL)
                .map(r => `<option value="${r}" ${r === u.role ? 'selected' : ''}>${ROLE_LABEL[r]}</option>`).join('')}</select>`}</td>
        </tr>`).join('')}</tbody></table></div>`;
    root.onchange = async e => {
      const s = e.target.closest('[data-role-for]'); if (!s) return;
      try { await api.put(`/users/${s.dataset.roleFor}/role`, { role: s.value }); toast('Role updated'); }
      catch (err) { toast(err.message, true); route(); }
    };
  }

  const routes = {
    home: viewHome, announcements: viewAnnouncements, events: viewEvents, clubs: viewClubs,
    resources: viewResources, jobs: viewJobs, forum: viewForum, admin: viewAdmin
  };

  /* ---------------- start ---------------- */
  api.onUnauthorized = () => { clearSession(); renderAuth(); };
  window.addEventListener('hashchange', route);

  (async function init() {
    if (state.user) {
      // Refresh the stored profile so a role change made by an admin shows up after reload
      try { saveUser(await api.get('/users/me')); } catch { /* handled by onUnauthorized */ }
    }
    route();
  })();
})();
