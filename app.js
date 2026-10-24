/* =========================================================
   TikTok · Tune My Feed — demo app (plain JS, no build step)
   ========================================================= */
(() => {
  'use strict';

  /* ---------------- helpers ---------------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const ic = (n, c = '') => `<i class="${c}" data-icon="${n}">${ICONS[n] || ''}</i>`;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const now = () => performance.now();
  const shuffle = (a, r = Math.random) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const vibrate = ms => { try { navigator.vibrate && navigator.vibrate(ms); } catch (e) {} };
  function fmt(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    if (n >= 1e4) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    return Number(n).toLocaleString('en-US');
  }
  function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; }
  function seeded(seed) {
    return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  const store = {
    get(k, d) { try { const v = localStorage.getItem('tmf:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('tmf:' + k, JSON.stringify(v)); } catch (e) {} },
    clear() { try { Object.keys(localStorage).filter(k => k.startsWith('tmf:')).forEach(k => localStorage.removeItem(k)); } catch (e) {} },
  };
  const svgURI = svg => 'data:image/svg+xml,' + encodeURIComponent(svg);
  const DEFAULT_AVATAR = svgURI('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="#D0D1D5"/><circle cx="50" cy="40" r="17" fill="#fff"/><path d="M17 94c3-21 16-32 33-32s30 11 33 32z" fill="#fff"/></svg>');
  const letterAvatar = (name, color) => svgURI(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="${color}"/><text x="50" y="50" dy=".35em" text-anchor="middle" font-family="-apple-system,Helvetica,Arial,sans-serif" font-size="46" font-weight="600" fill="#fff">${name[0].toUpperCase()}</text></svg>`);
  const photo = n => `img/avatars/${n}.jpg`;

  /* ---------------- constants ---------------- */
  const TOPICS = ['food', 'travel', 'music', 'fitness', 'pets', 'comedy'];
  const L = { food: 'Food', travel: 'Travel', music: 'Music', fitness: 'Fitness', pets: 'Pets', comedy: 'Comedy' };
  const TOPIC_COLOR = { food: '#F2994A', travel: '#2D9CDB', music: '#9B51E0', fitness: '#27AE60', pets: '#C9A227', comedy: '#EB5757' };
  const TOPIC_WORDS = {
    food: 'food recipe eat eating cook cooking restaurant snack dessert bakery',
    travel: 'travel trip vacation beach ocean nature hike hiking destination',
    music: 'music song dance dancing singer concert band beat',
    fitness: 'fitness gym workout exercise training health',
    pets: 'pets pet cat cats kitten dog animal animals',
    comedy: 'comedy funny lol humor joke meme relatable',
  };
  const LEVELS = ['Much less', 'Less', 'Default', 'More', 'Much more'];
  const WEIGHTS = [0.1, 0.5, 1, 2.5, 5];
  const DEFAULT_PREFS = { food: 2, travel: 2, music: 2, fitness: 2, pets: 2, comedy: 2 };
  const DEFAULT_FOLLOWING = ['mayawanders', 'tyrell.laughs', 'mochiandmiso'];
  const CURATED_START = ['travel-1', 'comedy-1', 'food-3', 'pets-1', 'music-2', 'fitness-1'];
  const ME = { username: 'demo.user', name: 'Demo User', avatar: DEFAULT_AVATAR };

  const PEOPLE = [
    { n: 'maddie🌸', a: photo('travel-3') }, { n: 'carlos_rv', a: letterAvatar('c', '#5B8DEF') },
    { n: 'jess.m', a: photo('food-4') }, { n: 'tk.the.great', a: letterAvatar('t', '#F2994A') },
    { n: 'noor', a: photo('pets-2') }, { n: 'sam_lol', a: letterAvatar('s', '#27AE60') },
    { n: 'priya.s', a: photo('travel-1') }, { n: 'danny_dz', a: DEFAULT_AVATAR },
    { n: 'zoe🦋', a: photo('food-5') }, { n: 'mike.ruiz', a: letterAvatar('m', '#9B51E0') },
    { n: 'gracie', a: photo('travel-2') }, { n: 'keanu.p', a: letterAvatar('k', '#EB5757') },
    { n: 'luisa', a: photo('food-3') }, { n: 'wes', a: DEFAULT_AVATAR },
    { n: 'hannah b', a: photo('travel-4') }, { n: 'rio', a: letterAvatar('r', '#2D9CDB') },
    { n: 'ash.k', a: photo('music-1') }, { n: 'brianna.k', a: letterAvatar('b', '#C9A227') },
  ];
  const COMMENTS = {
    travel: ['adding this to my bucket list rn ✈️', 'where is this?? I need to go', 'the water looks fake omg', 'booking flights as we speak', "went last summer and it's even better in person", "how much was the trip if you don't mind me asking?", 'nature is healing 🌿', 'saving this for my honeymoon', 'this is my sign to take PTO'],
    food: ['I can smell this through my phone', 'recipe pleaseeee 🙏', 'that broth is ILLEGAL', 'the way I just gasped', 'adding this to my list for the weekend', "ok I'm hungry now thanks", 'drop the location 👀', 'not me watching this at 2am', "chef's kiss fr"],
    music: ['this got stuck in my head immediately', 'song name?? 🙏', 'goosebumps 🥹', 'on repeat for the 12th time', 'this needs to be on every playlist', 'the talent on this app is unreal', 'the drop 🔥🔥', 'teach me pls'],
    fitness: ['my legs hurt just watching this', "saving this for tomorrow (I won't do it)", 'form is perfect 👏', "what's your split?", 'the consistency is inspiring', "did this once and couldn't walk for 3 days", 'adding this to my routine', 'motivation unlocked 💪'],
    pets: ['the little paws 😭', "he's so judgy I love him", 'protect him at all costs', 'my cat would never let me do this', 'the way he looked at the camera 💀', 'need a 10 hour version', "he knows he's cute", 'this made my whole day'],
    comedy: ["I'm crying 😂😂", 'why is this so accurate', 'sending this to my roommate', 'the commitment is unmatched', 'I watched this 15 times', 'not the toothbrush 💀', 'this is literally me every monday', 'your neighbors deserve an award'],
    generic: ['the algorithm knows me too well', "this is the content I'm here for", '😂😂😂', 'the editing 🔥', 'who else is watching this in 2026', 'okay but why is this so good', 'underrated', 'came back to watch this again'],
  };
  const REPLIES = ['fr 😂', 'literally same', 'right??', 'this!!', 'no because why is this so true', 'I was about to say this', '💀💀', 'agreed 100%'];
  const CREATOR_REPLIES = { food: 'recipe is pinned! 🫶', travel: 'location is in my bio 🗺️', music: 'full version dropping friday 🎶', fitness: 'save it and tag me when you try it 💪', pets: 'they say thank you 🐾', comedy: 'part 2 coming tomorrow!!' };
  const CHATS = [
    { id: 'c1', p: PEOPLE[0], last: 'omg you HAVE to see this 😭', time: '2m', unread: true, msgs: [['them', 'video', 'pets-2'], ['them', 'text', 'omg you HAVE to see this 😭']] },
    { id: 'c2', p: PEOPLE[3], last: 'bro this is literally you', time: '1h', unread: true, msgs: [['them', 'video', 'comedy-4'], ['them', 'text', 'bro this is literally you']] },
    { id: 'c3', p: PEOPLE[4], last: 'we have to go here this summer', time: 'Yesterday', unread: false, msgs: [['me', 'text', 'look at this place'], ['them', 'video', 'travel-2'], ['them', 'text', 'we have to go here this summer']] },
    { id: 'c4', p: PEOPLE[5], last: 'Sent a video', time: 'Mon', unread: false, msgs: [['them', 'video', 'food-3']] },
    { id: 'c5', p: PEOPLE[6], last: 'hahaha stop', time: '10/18', unread: false, msgs: [['me', 'video', 'comedy-1'], ['them', 'text', 'hahaha stop']] },
  ];
  const BOT_REPLIES = ['hahaha 😂', 'wait that’s so good', 'omg yes', 'sending this to everyone', 'LOL', 'ok I’m obsessed', '🫶🫶'];

  /* ---------------- state ---------------- */
  const S = {
    videos: [], byId: {}, byTopic: {},
    liked: new Set(store.get('liked', [])),
    saved: new Set(store.get('saved', [])),
    reposted: new Set(store.get('reposted', [])),
    following: new Set(store.get('following', DEFAULT_FOLLOWING)),
    likedComments: new Set(store.get('likedComments', [])),
    myComments: store.get('myComments', {}),
    prefs: Object.assign({}, DEFAULT_PREFS, store.get('prefs', {})),
    penalty: store.get('penalty', {}),
    flags: Object.assign({ coachShown: false, tuneUsed: false }, store.get('flags', {})),
    lastMix: store.get('lastMix', null),
    muted: true, speed: 1, autoScroll: false, captions: false, translate: false, restricted: false,
    tab: 'foryou', nav: 'home', feeds: {}, swipes: 0, userPaused: false,
    fit: 1, scrubbing: false, profileTab: 'videos',
  };
  const persist = {
    liked: () => store.set('liked', [...S.liked]),
    saved: () => store.set('saved', [...S.saved]),
    reposted: () => store.set('reposted', [...S.reposted]),
    following: () => store.set('following', [...S.following]),
    likedComments: () => store.set('likedComments', [...S.likedComments]),
    myComments: () => store.set('myComments', S.myComments),
    prefs: () => store.set('prefs', S.prefs),
    penalty: () => store.set('penalty', S.penalty),
    flags: () => store.set('flags', S.flags),
  };
  const likeCount = v => v.likes + (S.liked.has(v.id) ? 1 : 0);
  const saveCount = v => v.saves + (S.saved.has(v.id) ? 1 : 0);
  const commentCount = v => v.comments + (S.myComments[v.id] || []).length;

  /* ---------------- DOM refs ---------------- */
  const device = $('#device'), app = $('#app'), feedEl = $('#feed'), trackEl = $('#track');
  const overlaysEl = $('#overlays'), sheetsEl = $('#sheets'), toastsEl = $('#toasts');
  const progressEl = $('#progress'), progressFill = $('#progressFill'), progressThumb = $('#progressThumb');
  const coachEl = $('#coachmark'), updatingEl = $('#updating');
  const slideOf = new WeakMap();
  let CTX = null;     // { v, slide } — the video a menu/sheet is acting on
  let TUNE = null;    // open Tune My Feed sheet state

  /* =========================================================
     Layout: laptop iPhone frame vs. real phone
     ========================================================= */
  const isPhoneLayout = () => matchMedia('(max-width: 600px)').matches ||
    (matchMedia('(pointer: coarse)').matches && Math.min(screen.width, screen.height) <= 600);
  function fit() {
    const phone = isPhoneLayout();
    document.documentElement.classList.toggle('is-phone', phone);
    if (phone) { S.fit = 1; device.style.removeProperty('--fit'); }
    else { S.fit = Math.min(1, (innerHeight - 56) / 844, (innerWidth - 40) / 390); device.style.setProperty('--fit', S.fit); }
    setTrack(0, false);
    moveUnderline();
    positionDemoPanel();
    pool.forEach(p => { if (p.item && !p.el.hidden) fitCaption(p); });
  }
  addEventListener('resize', fit);
  if (window.visualViewport) {
    visualViewport.addEventListener('resize', () => {
      const kb = Math.max(0, innerHeight - visualViewport.height - visualViewport.offsetTop);
      app.style.setProperty('--kb', (document.documentElement.classList.contains('is-phone') && kb > 80 ? kb : 0) + 'px');
    });
  }
  document.addEventListener('gesturestart', e => e.preventDefault());
  document.addEventListener('dragstart', e => e.preventDefault());
  document.addEventListener('dblclick', e => e.preventDefault());

  /* =========================================================
     Recommendation engine
     ========================================================= */
  let keySeq = 0;
  const mkItem = id => ({ key: id + '#' + (++keySeq), id });
  const topicWeight = t => WEIGHTS[S.prefs[t]] * (S.penalty[t] ?? 1);
  // Weighted picks by topic using smooth weighted round-robin with noise: random-looking order,
  // but every batch lands close to the chosen weights (so a live demo never gets an unlucky draw).
  // Never repeats any of the last 3 videos; within a topic prefers the least-recently-seen clip.
  function generate(n, historyIds, firstTopic = null) {
    const hist = historyIds.slice(), out = [];
    const w = Object.fromEntries(TOPICS.map(t => [t, topicWeight(t)]));
    const total = TOPICS.reduce((a, t) => a + w[t], 0);
    const credit = Object.fromEntries(TOPICS.map(t => [t, Math.random() * w[t]]));
    for (let k = 0; k < n; k++) {
      const recent = hist.slice(-3);
      TOPICS.forEach(t => { credit[t] += w[t] * (0.55 + Math.random() * 0.9); });
      const topic = k === 0 && firstTopic ? firstTopic : TOPICS.reduce((b, t) => (credit[t] > credit[b] ? t : b), TOPICS[0]);
      credit[topic] -= total;
      let cands = S.byTopic[topic].filter(id => !recent.includes(id));
      if (!cands.length) cands = S.videos.map(v => v.id).filter(id => !recent.includes(id));
      cands = shuffle(cands).sort((a, b) => hist.lastIndexOf(a) - hist.lastIndexOf(b));
      out.push(cands[0]); hist.push(cands[0]);
    }
    return out;
  }
  function cycle(ids, times) {
    let out = [];
    for (let i = 0; i < times; i++) {
      let next = i ? shuffle(ids) : ids.slice();
      if (out.length && next.length > 1 && next[0] === out[out.length - 1]) next.push(next.shift());
      out = out.concat(next);
    }
    return out;
  }
  function buildFeed(name) {
    if (name === 'foryou') {
      const isDefault = TOPICS.every(t => S.prefs[t] === 2) && !Object.keys(S.penalty).length;
      let ids = isDefault ? CURATED_START.slice() : ['travel-1', ...generate(5, ['travel-1'])];
      ids = ids.concat(generate(24, ids));
      return { name, list: ids.map(mkItem), index: 0 };
    }
    const ids = name === 'following'
      ? S.videos.filter(v => S.following.has(v.username)).map(v => v.id)
      : shuffle(S.videos.map(v => v.id), seeded(42));
    return { name, list: cycle(ids, 3).map(mkItem), index: 0, cycleIds: ids };
  }
  const curFeed = () => S.feeds[S.tab];
  function ensureMore(f) {
    if (f.list.length - f.index > 6) return;
    if (f.name === 'foryou') f.list = f.list.concat(generate(20, f.list.map(i => i.id)).map(mkItem));
    else if (f.cycleIds.length) f.list = f.list.concat(cycle(f.cycleIds, 1).map(mkItem));
  }
  function rebuildUpcoming(f, firstTopic = null) {
    const head = f.list.slice(0, f.index + 1);
    f.list = head.concat(generate(30, head.map(i => i.id), firstTopic).map(mkItem));
  }
  const upcomingTopics = (f, n = 10) => f.list.slice(f.index + 1, f.index + 1 + n).map(i => S.byId[i.id].topic);

  /* =========================================================
     Slide UI
     ========================================================= */
  const stripTags = s => s.replace(/#[\p{L}\p{N}_]+/gu, '').replace(/\s+/g, ' ').trim();
  const captionHTML = t => esc(t).replace(/#([\p{L}\p{N}_]+)/gu, '<b class="tag" data-action="hashtag" data-tag="$1">#$1</b>');

  function slideUI(v) {
    const followed = S.following.has(v.username);
    const rep = S.reposted.has(v.id);
    return `
      <div class="rail">
        <div class="rail-avatar">
          <img src="${v.avatar}" alt="" data-action="creator">
          ${followed ? '' : `<button class="follow-btn" data-action="follow" aria-label="Follow">${ic('plus', 'pl')}${ic('check', 'chk')}</button>`}
        </div>
        <button class="rail-btn like ${S.liked.has(v.id) ? 'on' : ''}" data-action="like" aria-label="Like">${ic('heart')}<span class="count">${fmt(likeCount(v))}</span></button>
        <button class="rail-btn cmt" data-action="comments" aria-label="Comments">${ic('comment')}<span class="count">${fmt(commentCount(v))}</span></button>
        <button class="rail-btn save ${S.saved.has(v.id) ? 'on' : ''}" data-action="save" aria-label="Favorites">${ic('bookmark')}<span class="count">${fmt(saveCount(v))}</span></button>
        <button class="rail-btn" data-action="share" aria-label="Share">${ic('share')}<span class="count">${fmt(v.shares)}</span></button>
        <button class="disc" data-action="sound" aria-label="Sound"><img src="${v.avatar}" alt=""></button>
      </div>
      <div class="info">
        <button class="repost-pill ${rep ? 'done' : ''}" data-action="repost">${ic('repost')}<span>${rep ? 'You reposted' : 'Repost to followers'}</span></button>
        <div class="username"><span data-action="creator">${esc(v.name)}</span>${v.verified ? `<span class="verified">${ic('check')}</span>` : ''}</div>
        <div class="caption" data-action="caption-toggle"></div>
        ${v.translation ? `<button class="see-translation" data-action="translate">See translation</button>` : ''}
        <div class="sound-row" data-action="sound">${ic('note')}<div class="marquee"><div class="mq"><span>${esc(v.sound)}</span><span>${esc(v.sound)}</span></div></div></div>
      </div>
      <div class="big-play">${ICONS.play}</div>
      <div class="auto-caption">${esc(stripTags(S.translate && v.translation ? v.translation : v.caption))}</div>`;
  }

  function fitCaption(s) {
    const el = s.ui.querySelector('.caption'); if (!el || !s.v) return;
    const text = s.v.caption;
    el.classList.toggle('expanded', !!s.expanded);
    el.innerHTML = captionHTML(text);
    if (s.expanded || !el.offsetParent) return;
    const max = 19 * 2 + 3;
    if (el.scrollHeight <= max) return;
    const words = text.split(' ');
    const more = '… <button class="more" data-action="caption-toggle">more</button>';
    let lo = 0, hi = words.length;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      el.innerHTML = captionHTML(words.slice(0, mid).join(' ')) + more;
      if (el.scrollHeight <= max) lo = mid; else hi = mid - 1;
    }
    el.innerHTML = captionHTML(words.slice(0, lo).join(' ')) + more;
  }

  const vidFrom = el => (el.closest('[data-vid]') || {}).dataset?.vid;
  const slideFromEl = el => slideOf.get(el.closest('.slide'));

  function refreshCounts(id) {
    const v = S.byId[id];
    $$(`.slide[data-vid="${id}"]`).forEach(el => {
      const like = $('.rail-btn.like', el), save = $('.rail-btn.save', el), cmt = $('.rail-btn.cmt', el);
      if (like) { like.classList.toggle('on', S.liked.has(id)); $('.count', like).textContent = fmt(likeCount(v)); }
      if (save) { save.classList.toggle('on', S.saved.has(id)); $('.count', save).textContent = fmt(saveCount(v)); }
      if (cmt) $('.count', cmt).textContent = fmt(commentCount(v));
    });
  }
  function toggleLike(id) {
    S.liked.has(id) ? S.liked.delete(id) : S.liked.add(id);
    if (S.liked.has(id)) vibrate(8);
    persist.liked(); refreshCounts(id);
  }
  function toggleSave(id) {
    const on = !S.saved.has(id);
    on ? S.saved.add(id) : S.saved.delete(id);
    persist.saved(); refreshCounts(id);
    toast(on ? 'Added to Favorites' : 'Removed from Favorites');
  }
  function likeBurst(s, x, y) {
    if (!s) return;
    const r = s.el.getBoundingClientRect();
    const h = document.createElement('i');
    h.className = 'burst-heart';
    h.innerHTML = ICONS.heart;
    h.style.left = (x - r.left) / S.fit + 'px';
    h.style.top = (y - r.top) / S.fit + 'px';
    h.style.setProperty('--r', (Math.random() * 36 - 18).toFixed(1) + 'deg');
    s.el.appendChild(h);
    setTimeout(() => h.remove(), 1000);
    if (!S.liked.has(s.v.id)) toggleLike(s.v.id);
  }

  /* =========================================================
     Feed rendering (pool of 3 reusable slides)
     ========================================================= */
  const pool = [];
  function createPoolSlide() {
    const el = document.createElement('div');
    el.className = 'slide';
    el.hidden = true;
    el.innerHTML = '<video class="v" playsinline webkit-playsinline preload="auto" muted disableremoteplayback></video><div class="slide-ui"></div>';
    const s = { el, video: el.firstElementChild, ui: el.lastElementChild, key: null, item: null, v: null, idx: -1, ctx: 'feed' };
    s.video.muted = true;
    s.video.addEventListener('ended', () => { if (S.autoScroll && s === cur()) go(1); });
    s.video.addEventListener('play', () => el.classList.remove('paused'));
    s.video.addEventListener('pause', () => el.classList.add('paused'));
    slideOf.set(el, s);
    trackEl.appendChild(el);
    return s;
  }
  for (let i = 0; i < 3; i++) pool.push(createPoolSlide());

  function bindSlide(s, item) {
    const v = S.byId[item.id];
    s.key = item.key; s.item = item; s.v = v; s.expanded = false; s.needsFit = true;
    s.el.dataset.vid = v.id;
    s.el.className = 'slide';
    if (s.video.getAttribute('src') !== v.src) { s.video.src = v.src; s.video.poster = v.poster; }
    else { try { s.video.currentTime = 0; } catch (e) {} }
    s.video.loop = !S.autoScroll;
    s.video.muted = S.muted;
    s.ui.innerHTML = slideUI(v);
  }
  function hideSlide(s) { s.el.hidden = true; s.key = null; s.item = null; s.idx = -1; s.video.pause(); }
  const cur = () => { const f = curFeed(); return f && pool.find(p => p.item && p.idx === f.index); };

  function setTrack(dragPx = 0, animate = false) {
    const f = curFeed(); if (!f) return;
    trackEl.classList.toggle('animating', animate);
    trackEl.style.transform = `translate3d(0, ${-f.index * feedEl.clientHeight + dragPx}px, 0)`;
  }

  function renderFeed({ animate = false } = {}) {
    const f = curFeed();
    const empty = !f.list.length;
    $('#feedEmpty').hidden = !empty;
    if (empty) { pool.forEach(hideSlide); renderEmptyFeed(); syncPlayback(); return; }
    const want = [f.index - 1, f.index, f.index + 1].filter(i => i >= 0 && i < f.list.length);
    const used = new Set(), assign = new Map();
    for (const i of want) {
      const s = pool.find(p => p.key === f.list[i].key && !used.has(p));
      if (s) { assign.set(i, s); used.add(s); }
    }
    for (const i of want) {
      if (assign.has(i)) continue;
      const s = pool.find(p => !used.has(p));
      bindSlide(s, f.list[i]); assign.set(i, s); used.add(s);
    }
    pool.forEach(p => { if (!used.has(p)) hideSlide(p); });
    assign.forEach((s, i) => { s.el.hidden = false; s.el.style.top = (i * 100) + '%'; s.idx = i; });
    assign.forEach(s => { if (s.needsFit) { s.needsFit = false; fitCaption(s); } });
    setTrack(0, animate);
    syncPlayback();
  }

  function renderEmptyFeed() {
    $('#feedEmpty').innerHTML = `${ic('friends')}<b>No videos yet</b><p>Videos from accounts you follow will show up here.</p><button class="btn-red" data-tab="foryou">Browse For You</button>`;
  }

  function go(delta) {
    const f = curFeed(); if (!f || !f.list.length) return false;
    const ni = clamp(f.index + delta, 0, f.list.length - 1);
    if (ni === f.index) return false;
    f.index = ni;
    S.userPaused = false;
    ensureMore(f);
    renderFeed({ animate: true });
    if (f.name === 'foryou' && delta > 0) onSwipe();
    if (!$('#demoPanel').hidden) renderDemoPanel();
    return true;
  }

  /* ---------------- playback ---------------- */
  function playVideo(v) {
    v.muted = S.muted;
    v.defaultPlaybackRate = S.speed; v.playbackRate = S.speed;
    const p = v.play();
    if (p && p.catch) p.catch(err => {
      if (err && err.name === 'NotAllowedError' && !v.muted) {
        v.muted = true; S.muted = true; showUnmuteHint();
        v.play().catch(() => {});
      }
    });
  }
  const feedActive = () => S.nav === 'home' && !overlayStack.length && !document.hidden;
  function syncPlayback() {
    const c = cur();
    const play = feedActive() && !S.userPaused;
    pool.forEach(p => {
      if (p === c && play) playVideo(p.video);
      else if (!p.video.paused) p.video.pause();
      p.el.classList.toggle('user-paused', p === c && S.userPaused);
    });
    overlayStack.forEach((o, i) => {
      const top = i === overlayStack.length - 1 && !document.hidden;
      $$('video[data-autoplay]', o.el).forEach(v => { if (top && !o.userPaused) playVideo(v); else v.pause(); });
    });
  }
  document.addEventListener('visibilitychange', syncPlayback);

  function unmute() {
    S.muted = false; hideUnmuteHint();
    const c = cur(); if (c && feedActive()) { c.video.muted = false; playVideo(c.video); }
    $$('video').forEach(v => { if (!v.paused) v.muted = false; });
  }
  const showUnmuteHint = () => { $('#unmuteHint').hidden = false; };
  const hideUnmuteHint = () => { $('#unmuteHint').hidden = true; };

  function progressLoop() {
    requestAnimationFrame(progressLoop);
    const c = cur(); if (!c) return;
    const v = c.video, d = v.duration;
    if (!S.scrubbing && d > 0) {
      const pct = (v.currentTime / d * 100) + '%';
      progressFill.style.width = pct; progressThumb.style.left = pct;
    }
    if (v.currentTime > 3.5 && !c.el.classList.contains('show-repost')) c.el.classList.add('show-repost');
  }

  /* ---------------- scrubbing ---------------- */
  const mmss = t => { t = Math.max(0, t || 0); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(Math.floor(t % 60)).padStart(2, '0'); };
  function scrubTo(e) {
    const c = cur(); if (!c || !(c.video.duration > 0)) return;
    const r = progressEl.getBoundingClientRect();
    const pct = clamp((e.clientX - r.left) / r.width, 0, 1);
    c.video.currentTime = pct * c.video.duration;
    progressFill.style.width = progressThumb.style.left = pct * 100 + '%';
    $('#scrubTime').innerHTML = `<b>${mmss(c.video.currentTime)}</b> / ${mmss(c.video.duration)}`;
  }
  progressEl.addEventListener('pointerdown', e => {
    if (!cur()) return;
    S.scrubbing = true; app.classList.add('scrubbing');
    try { progressEl.setPointerCapture(e.pointerId); } catch (err) {}
    scrubTo(e);
  });
  progressEl.addEventListener('pointermove', e => { if (S.scrubbing) scrubTo(e); });
  const endScrub = () => { if (!S.scrubbing) return; S.scrubbing = false; app.classList.remove('scrubbing'); suppressClick(); };
  progressEl.addEventListener('pointerup', endScrub);
  progressEl.addEventListener('pointercancel', endScrub);

  /* =========================================================
     Gestures: swipe, tap, double-tap, long-press
     ========================================================= */
  let suppressUntil = 0;
  const suppressClick = () => { suppressUntil = now() + 350; };
  document.addEventListener('click', e => { if (now() < suppressUntil) { e.stopPropagation(); e.preventDefault(); } }, true);

  function attachGestures(el, o) {
    let st = null, lastTap = null, tapTimer = null;
    const down = new Set();
    const onDown = e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      down.add(e.pointerId);
      if (st) { if (down.size >= 2) { st.multi = true; clearTimeout(st.lp); } return; }
      const onControl = !!e.target.closest('button, a, input, textarea, label, [data-action]');
      st = { id: e.pointerId, x0: e.clientX, y0: e.clientY, t0: now(), ly: e.clientY, lt: now(), vy: 0, drag: false, lp: 0, lpFired: false, onControl, multi: false };
      o.onDown && o.onDown(e);
      if (!onControl && o.onLongPress) {
        st.lp = setTimeout(() => {
          if (!st || st.drag || st.multi) return;
          st.lpFired = true; o.onLongPress(st.x0, st.y0);
        }, 450);
      }
    };
    const onMove = e => {
      if (!st || e.pointerId !== st.id) return;
      const dx = e.clientX - st.x0, dy = e.clientY - st.y0;
      if (!st.drag && !st.lpFired && !st.multi) {
        if (Math.abs(dy) > 8 && Math.abs(dy) > Math.abs(dx) * 1.1 && o.canDrag && o.canDrag()) { st.drag = true; clearTimeout(st.lp); o.onDragStart && o.onDragStart(); }
        else if (Math.hypot(dx, dy) > 10) clearTimeout(st.lp);
      }
      if (st.drag) {
        const t = now(); st.vy = (e.clientY - st.ly) / Math.max(1, t - st.lt); st.ly = e.clientY; st.lt = t;
        o.onDrag && o.onDrag(dy);
      }
    };
    const onUp = e => {
      down.delete(e.pointerId);
      if (!st || e.pointerId !== st.id) return;
      clearTimeout(st.lp);
      const s = st; st = null;
      if (s.drag) { o.onDragEnd && o.onDragEnd(e.clientY - s.y0, now() - s.lt > 90 ? 0 : s.vy); suppressClick(); return; }
      if (s.lpFired) { suppressClick(); return; }
      if (e.type === 'pointercancel') return;
      const moved = Math.hypot(e.clientX - s.x0, e.clientY - s.y0);
      if (s.multi) { if (moved < 24 && now() - s.t0 < 600) o.onTwoFinger && o.onTwoFinger(); return; }
      if (s.onControl || moved > 12) return;
      handleTap(e.clientX, e.clientY);
    };
    function handleTap(x, y) {
      const t = now();
      const isDouble = lastTap && t - lastTap.t < 300 && Math.hypot(x - lastTap.x, y - lastTap.y) < 80;
      lastTap = { t, x, y };
      if (isDouble) { clearTimeout(tapTimer); tapTimer = null; o.onDoubleTap && o.onDoubleTap(x, y); return; }
      if (o.onTapUp && o.onTapUp(x, y)) return;          // handled immediately (inside the user gesture)
      tapTimer = setTimeout(() => { tapTimer = null; o.onTap && o.onTap(x, y); }, 280);
    }
    el.addEventListener('pointerdown', onDown);
    addEventListener('pointermove', onMove, { passive: true });
    addEventListener('pointerup', onUp);
    addEventListener('pointercancel', onUp);
    el.addEventListener('contextmenu', e => e.preventDefault());
    return () => {
      el.removeEventListener('pointerdown', onDown);
      removeEventListener('pointermove', onMove);
      removeEventListener('pointerup', onUp);
      removeEventListener('pointercancel', onUp);
    };
  }

  let coachGuard = false;
  attachGestures(feedEl, {
    canDrag: () => !!(curFeed() && curFeed().list.length),
    onDown: () => { coachGuard = !coachEl.hidden; if (coachGuard) dismissCoach(); },
    onDragStart: () => trackEl.classList.remove('animating'),
    onDrag: dy => {
      const f = curFeed(); let d = dy / S.fit;
      if ((f.index === 0 && d > 0) || (f.index === f.list.length - 1 && d < 0)) d *= 0.3;
      setTrack(d, false);
    },
    onDragEnd: (dy, vy) => {
      const d = dy / S.fit, h = feedEl.clientHeight;
      let moved = false;
      if (d < -h * 0.16 || vy < -0.45) moved = go(1);
      else if (d > h * 0.16 || vy > 0.45) moved = go(-1);
      if (!moved) setTrack(0, true);
    },
    onTapUp: () => {
      if (coachGuard) { coachGuard = false; return true; }
      if (app.classList.contains('clear-display')) { app.classList.remove('clear-display'); return true; }
      if (S.muted) { unmute(); return true; }
      if (S.userPaused) { S.userPaused = false; syncPlayback(); return true; }
      return false;
    },
    onTap: () => { S.userPaused = true; syncPlayback(); },
    onDoubleTap: (x, y) => likeBurst(cur(), x, y),
    onLongPress: () => { const c = cur(); if (c) openActionSheet(c); },
    onTwoFinger: () => toggleDemoPanel(),
  });

  let wheelAcc = 0, wheelLock = false, wheelTimer = 0;
  feedEl.addEventListener('wheel', e => {
    e.preventDefault();
    if (!feedInteractive()) return;
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => { wheelLock = false; wheelAcc = 0; }, 160);
    if (wheelLock) return;
    wheelAcc += e.deltaY;
    if (Math.abs(wheelAcc) > 28) { go(wheelAcc > 0 ? 1 : -1); wheelLock = true; wheelAcc = 0; }
  }, { passive: false });
  const feedInteractive = () => S.nav === 'home' && !overlayStack.length && !sheetStack.length;

  /* ---------------- coachmark (discoverability) ---------------- */
  function onSwipe() {
    S.swipes++;
    if (S.swipes >= 5 && !S.flags.coachShown && !S.flags.tuneUsed) {
      S.flags.coachShown = true; persist.flags();
      setTimeout(() => { if (feedInteractive()) { coachEl.hidden = false; setTimeout(dismissCoach, 6000); } }, 650);
    }
  }
  function dismissCoach() {
    if (coachEl.hidden || coachEl.classList.contains('out')) return;
    coachEl.classList.add('out');
    setTimeout(() => { coachEl.hidden = true; coachEl.classList.remove('out'); }, 250);
  }

  /* =========================================================
     Overlay screens (stack) & bottom sheets (stack)
     ========================================================= */
  const overlayStack = [];
  function pushScreen({ cls = '', html, dark = false, anim = 'right', onMount, onClose }) {
    const el = document.createElement('div');
    el.className = `screen ${dark ? 'dark' : ''} ${anim === 'up' ? 'from-bottom' : anim === 'fade' ? 'fade' : ''} ${cls}`;
    el.innerHTML = html;
    overlaysEl.appendChild(el);
    const o = { el, dark, onClose, userPaused: false };
    overlayStack.push(o);
    onMount && onMount(o);
    el.getBoundingClientRect();
    requestAnimationFrame(() => el.classList.add('in'));
    dismissCoach(); updateChrome(); syncPlayback();
    return o;
  }
  function popScreen(o = overlayStack[overlayStack.length - 1]) {
    if (!o || !overlayStack.includes(o)) return;
    overlayStack.splice(overlayStack.indexOf(o), 1);
    o.el.classList.remove('in');
    $$('video', o.el).forEach(v => v.pause());
    o.onClose && o.onClose(o);
    setTimeout(() => o.el.remove(), 380);
    updateChrome(); syncPlayback();
  }
  const sheetStack = [];
  function openSheet({ cls = '', html, dim = false, dragAnywhere = false, hidesUI = false, onMount, onClose }) {
    const layer = document.createElement('div');
    layer.className = 'sheet-layer';
    layer.innerHTML = `<div class="sheet-backdrop ${dim ? 'dim' : ''}"></div><div class="sheet ${cls}">${html}</div>`;
    sheetsEl.appendChild(layer);
    const o = { layer, sheet: $('.sheet', layer), dragAnywhere, hidesUI, onClose, closed: false };
    sheetStack.push(o);
    $('.sheet-backdrop', layer).addEventListener('click', () => closeSheet(o));
    onMount && onMount(o);
    layer.getBoundingClientRect();
    requestAnimationFrame(() => layer.classList.add('open'));
    dismissCoach(); updateChrome();
    return o;
  }
  function closeSheet(o = sheetStack[sheetStack.length - 1]) {
    if (!o || o.closed) return;
    o.closed = true;
    sheetStack.splice(sheetStack.indexOf(o), 1);
    o.layer.classList.remove('open');
    o.layer.style.pointerEvents = 'none';
    o.onClose && o.onClose(o);
    setTimeout(() => o.layer.remove(), 400);
    updateChrome();
  }
  const closeAllSheets = () => sheetStack.slice().reverse().forEach(o => closeSheet(o));

  // Drag a sheet down to dismiss it
  let sd = null;
  sheetsEl.addEventListener('pointerdown', e => {
    const sheet = e.target.closest('.sheet'); if (!sheet) return;
    const o = sheetStack.find(x => x.sheet === sheet); if (!o) return;
    if (e.target.closest('[data-nodrag], input, textarea, .slider, .seg, .switch')) return;
    if (!o.dragAnywhere && !e.target.closest('[data-drag], .grabber')) return;
    sd = { o, id: e.pointerId, y0: e.clientY, ly: e.clientY, lt: now(), vy: 0, drag: false };
  });
  addEventListener('pointermove', e => {
    if (!sd || e.pointerId !== sd.id) return;
    const dy = (e.clientY - sd.y0) / S.fit;
    if (!sd.drag) {
      if (dy > 6) { sd.drag = true; sd.o.sheet.classList.add('dragging'); }
      else if (dy < -8) { sd = null; return; }
    }
    if (sd.drag) {
      const t = now(); sd.vy = (e.clientY - sd.ly) / Math.max(1, t - sd.lt); sd.ly = e.clientY; sd.lt = t;
      sd.o.sheet.style.setProperty('--drag', Math.max(0, dy) + 'px');
    }
  }, { passive: true });
  const sheetUp = e => {
    if (!sd || e.pointerId !== sd.id) return;
    const s = sd; sd = null;
    if (!s.drag) return;
    s.o.sheet.classList.remove('dragging');
    suppressClick();
    const dy = (e.clientY - s.y0) / S.fit;
    if (dy > Math.min(150, s.o.sheet.offsetHeight * 0.28) || s.vy > 0.55) closeSheet(s.o);
    else s.o.sheet.style.setProperty('--drag', '0px');
  };
  addEventListener('pointerup', sheetUp);
  addEventListener('pointercancel', sheetUp);

  function updateChrome() {
    const top = overlayStack[overlayStack.length - 1];
    const tabLight = S.nav !== 'home';
    const lightBehind = top ? !top.dark : tabLight;
    device.classList.toggle('sb-dark', lightBehind);
    device.classList.toggle('nav-light', tabLight);
    device.classList.toggle('hi-dark', sheetStack.length > 0 || lightBehind);
    app.classList.toggle('menu-open', sheetStack.some(o => o.hidesUI));
  }

  /* ---------------- toasts ---------------- */
  let toastTimer = 0;
  function toast(msg, { icon = null, ms = 1900 } = {}) {
    clearTimeout(toastTimer);
    toastsEl.innerHTML = '';
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = (icon ? ic(icon) : '') + `<span>${esc(msg)}</span>`;
    toastsEl.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    toastTimer = setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 250); }, ms);
    return t;
  }
  function progressToast(label, done) {
    clearTimeout(toastTimer);
    toastsEl.innerHTML = '';
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<svg class="ring" viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" stroke="rgba(255,255,255,.25)"/><circle class="p" cx="20" cy="20" r="16" stroke="#fff" stroke-dasharray="100.5" stroke-dashoffset="100.5" stroke-linecap="round" transform="rotate(-90 20 20)"/></svg><span>${label} 0%</span>`;
    toastsEl.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    const c = $('.p', t), sp = $('span', t);
    let p = 0;
    const iv = setInterval(() => {
      p = Math.min(100, p + 5 + Math.random() * 9);
      c.style.strokeDashoffset = 100.5 * (1 - p / 100);
      sp.textContent = `${label} ${Math.round(p)}%`;
      if (p >= 100) {
        clearInterval(iv);
        setTimeout(() => toast(done, { icon: 'check', ms: 1500 }), 150);
      }
    }, 90);
  }

  /* =========================================================
     Long-press menu (screenshot 3) + its actions
     ========================================================= */
  function openActionSheet(slide) {
    CTX = { v: slide.v, slide };
    vibrate(12);
    const seg = [0.5, 1, 1.5, 2].map(r => `<button data-action="speed" data-rate="${r}" class="${S.speed === r ? 'on' : ''}">${r.toFixed(1)}×</button>`).join('');
    openSheet({
      cls: 'action-sheet', dragAnywhere: true, hidesUI: true,
      html: `
        <div class="grabber"></div>
        <div class="a-group">
          <button class="a-row" data-action="download">${ic('download')}<span>Download</span></button>
          <button class="a-row" data-action="not-interested">${ic('notInterested')}<span>Not interested</span></button>
          <button class="a-row ${S.flags.tuneUsed ? '' : 'featured'}" data-action="open-tune">${ic('tune')}<span>Tune My Feed</span><span class="new-pill">New</span></button>
          <button class="a-row" data-action="report">${ic('flag')}<span>Report</span></button>
        </div>
        <div class="a-group">
          <div class="a-row">${ic('speed')}<span class="grow">Speed</span><div class="seg" data-nodrag>${seg}</div></div>
          <button class="a-row" data-action="clear-display">${ic('clear')}<span>Clear display</span></button>
          <div class="a-row" data-action="toggle-autoscroll">${ic('autoScroll')}<span class="grow">Auto scroll</span><span class="switch ${S.autoScroll ? 'on' : ''}"></span></div>
          <button class="a-row" data-action="captions">${ic('captions')}<span>Captions and translation</span></button>
          <button class="a-row" data-action="cast">${ic('cast')}<span>Cast</span></button>
          <button class="a-row" data-action="pip">${ic('pip')}<span>Picture-in-Picture</span></button>
        </div>
        <div class="a-group">
          <button class="a-row" data-action="why">${ic('question')}<span>Why this post</span></button>
        </div>`,
    });
  }

  function notInterested(ctx, { penalize = true, message = "Got it. You'll see fewer videos like this." } = {}) {
    const t = ctx.v.topic;
    if (penalize) { S.penalty[t] = +((S.penalty[t] ?? 1) * 0.75).toFixed(3); persist.penalty(); }
    toast(message);
    if (ctx.slide.ctx === 'viewer') { popScreen(ctx.slide.screen); return; }
    const f = S.feeds[S.tab];
    const idx = f.list.findIndex(it => it.key === ctx.slide.key);
    if (idx < 0) return;
    f.list.splice(idx, 1);
    if (f.index > idx) f.index--;
    if (f.name === 'foryou') rebuildUpcoming(f); else ensureMore(f);
    f.index = clamp(f.index, 0, Math.max(0, f.list.length - 1));
    S.userPaused = false;
    renderFeed();
    const c = cur();
    if (c) { c.el.classList.add('enter'); setTimeout(() => c.el.classList.remove('enter'), 400); }
    if (!$('#demoPanel').hidden) renderDemoPanel();
  }

  function requestPiP(video) {
    try {
      if (document.pictureInPictureElement) { document.exitPictureInPicture(); return; }
      if (video.requestPictureInPicture && document.pictureInPictureEnabled) {
        video.requestPictureInPicture().catch(() => toast("Picture-in-Picture isn't available right now"));
        return;
      }
      if (video.webkitSupportsPresentationMode && video.webkitSupportsPresentationMode('picture-in-picture')) {
        video.webkitSetPresentationMode('picture-in-picture'); return;
      }
    } catch (e) {}
    toast("Picture-in-Picture isn't supported in this browser");
  }

  function openReport(v) {
    const reasons = ['Violence, abuse, and criminal exploitation', 'Hate and harassment', 'Suicide and self-harm', 'Disordered eating and unhealthy body image', 'Dangerous activities and challenges', 'Nudity and sexual content', 'Shocking and graphic content', 'Misinformation', 'Deceptive behavior and spam', 'Regulated goods and activities', 'Frauds and scams', 'Sharing personal information', 'Counterfeits and intellectual property', 'Other'];
    openSheet({
      cls: 'report-sheet',
      html: `<div class="grabber"></div>
        <div class="s-head" data-drag><span>Report</span><button class="s-r" data-action="close-sheet" aria-label="Close">${ic('close')}</button></div>
        <div class="s-scroll report-body"><div class="desc">Select a reason</div>
        ${reasons.map(r => `<button class="l-row bordered" data-action="report-reason"><span class="grow">${r}</span>${ic('chevronRight', 'chev')}</button>`).join('')}</div>`,
    });
  }

  function openWhy(v) {
    const T = L[v.topic];
    openSheet({
      cls: 'why-sheet',
      html: `<div class="grabber"></div>
        <div class="s-head" data-drag><span>Why this post</span><button class="s-r" data-action="close-sheet" aria-label="Close">${ic('close')}</button></div>
        <div class="s-scroll">
          <div class="why-item"><span class="wi">${ic('eye')}</span><div><b>You watched similar ${T} videos</b><span>You're seeing this because you watched similar ${T} videos and engaged with them.</span></div></div>
          <div class="why-item"><span class="wi">${ic('trending')}</span><div><b>This video is popular right now</b><span>It's getting lots of views from people with interests like yours.</span></div></div>
          <div class="why-item"><span class="wi">${ic('user')}</span><div><b>Similar to accounts you engage with</b><span>@${esc(v.username)} posts content like creators you interact with.</span></div></div>
          <button class="why-tune" data-action="why-tune"><span class="wi">${ic('tune')}</span><span><b>Tune My Feed</b><span>See more or less ${T} on For You</span></span>${ic('chevronRight', 'chev')}</button>
        </div>`,
    });
  }

  function openCaptions() {
    openSheet({
      html: `<div class="grabber"></div>
        <div class="s-head" data-drag><span>Captions and translation</span><button class="s-r" data-action="close-sheet" aria-label="Close">${ic('close')}</button></div>
        <div class="l-row" data-action="cap-toggle" data-k="captions"><span class="grow">Show captions<span class="sub">Auto-generated captions on videos</span></span><span class="switch ${S.captions ? 'on' : ''}"></span></div>
        <div class="l-row" data-action="cap-toggle" data-k="translate"><span class="grow">Translate captions<span class="sub">Translate to English</span></span><span class="switch ${S.translate ? 'on' : ''}"></span></div>
        <p class="desc">Captions are generated automatically and may not be 100% accurate.</p>`,
    });
  }

  function openCast() {
    const o = openSheet({
      html: `<div class="grabber"></div>
        <div class="s-head" data-drag><span>Cast to a device</span><button class="s-r" data-action="close-sheet" aria-label="Close">${ic('close')}</button></div>
        <div class="cast-body"><div class="cast-search"><span class="spinner"></span>Looking for devices on your Wi-Fi…</div></div>`,
    });
    setTimeout(() => {
      if (o.closed) return;
      $('.cast-body', o.sheet).innerHTML = ['Living Room TV', 'Bedroom TV', 'Office Display'].map((d, i) =>
        `<button class="l-row" data-action="cast-to" data-name="${d}">${ic('cast')}<span class="grow">${d}<span class="sub">${i === 2 ? 'Last used 3 days ago' : 'Available'}</span></span>${ic('chevronRight', 'chev')}</button>`).join('') +
        `<p class="desc">Make sure your phone and TV are on the same Wi-Fi network.</p>`;
    }, 1400);
  }

  /* =========================================================
     Tune My Feed (the new feature)
     ========================================================= */
  const currentForYouVideo = () => { const f = S.feeds.foryou; return f && f.list.length ? S.byId[f.list[f.index].id] : null; };

  function openTune(v, from = 'menu') {
    const basis = v || currentForYouVideo();
    const draft = Object.assign({}, S.prefs);
    const rows = TOPICS.map(t => `
      <div class="topic-row ${basis && basis.topic === t ? 'current' : ''}" data-topic="${t}">
        <div class="topic-top">
          <span class="topic-ic">${ic('t_' + t)}</span>
          <span class="topic-name">${L[t]}${basis && basis.topic === t ? '<span class="this-tag">This video</span>' : ''}</span>
          <span class="topic-val"></span>
        </div>
        <div class="slider" role="slider" tabindex="0" aria-label="${L[t]}" aria-valuemin="0" aria-valuemax="4" data-topic="${t}">
          <div class="sl-track"><div class="sl-fill"></div>${[0, 1, 2, 3, 4].map(i => `<span class="sl-tick" style="left:${i * 25}%"></span>`).join('')}</div>
          <div class="sl-thumb"></div>
        </div>
        <div class="sl-ends"><span>Less</span><span>More</span></div>
      </div>`).join('');
    const card = basis ? `
      <div class="basis-card">
        <img src="${basis.poster}" alt="">
        <span class="basis-label">Based on this video</span>
        <span class="basis-topic">${ic('t_' + basis.topic)}${L[basis.topic]}</span>
        <span class="basis-meta">@${esc(basis.username)} · ${esc(basis.sound)}</span>
        <div class="basis-actions">
          <button class="btn-less" data-action="basis-step" data-d="-1">${ic('notInterested')}See less</button>
          <button class="btn-more" data-action="basis-step" data-d="1">${ic('heartLine')}See more</button>
        </div>
      </div>` : '';
    const o = openSheet({
      cls: 'tune-sheet', dim: true,
      html: `
        <div class="grabber"></div>
        <div class="tune-head" data-drag>
          <button class="s-l" data-action="tune-back" aria-label="Back">${ic('back')}</button>
          <span>Tune your feed</span>
          <button class="reset" data-action="tune-reset">Reset</button>
        </div>
        <div class="tune-scroll s-scroll">
          <p class="tune-sub">Choose what you want to see more or less of on For You.</p>
          ${card}
          <div class="topics-title"><span>Topics</span></div>
          ${rows}
        </div>
        <div class="tune-foot">
          <button class="btn-primary" data-action="tune-save" disabled>Save</button>
          <p class="tune-note">Changes apply to your For You feed. Find this anytime in Settings › Content preferences.</p>
        </div>`,
      onMount: wireSliders,
      onClose: () => { if (TUNE && TUNE.sheet === o) TUNE = null; },
    });
    TUNE = { sheet: o, draft, basis, from, ctx: CTX };
    refreshTune();
  }

  function wireSliders(o) {
    $$('.slider', o.sheet).forEach(sl => {
      const t = sl.dataset.topic;
      const track = $('.sl-track', sl);
      const valAt = x => { const r = track.getBoundingClientRect(); return Math.round(clamp((x - r.left) / r.width, 0, 1) * 4); };
      const set = val => {
        if (!TUNE || TUNE.draft[t] === val) return;
        TUNE.draft[t] = val; vibrate(5); refreshTune();
      };
      let active = false;
      sl.addEventListener('pointerdown', e => {
        active = true; sl.classList.add('active');
        try { sl.setPointerCapture(e.pointerId); } catch (err) {}
        set(valAt(e.clientX));
      });
      sl.addEventListener('pointermove', e => { if (active) set(valAt(e.clientX)); });
      const end = () => { active = false; sl.classList.remove('active'); };
      sl.addEventListener('pointerup', end);
      sl.addEventListener('pointercancel', end);
      sl.addEventListener('keydown', e => {
        if (!TUNE) return;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); set(clamp(TUNE.draft[t] + 1, 0, 4)); }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); set(clamp(TUNE.draft[t] - 1, 0, 4)); }
      });
    });
  }

  function refreshTune() {
    if (!TUNE) return;
    const { draft, sheet } = TUNE;
    const root = sheet.sheet;
    TOPICS.forEach(t => {
      const row = $(`.topic-row[data-topic="${t}"]`, root); if (!row) return;
      const val = draft[t];
      const lab = $('.topic-val', row);
      lab.textContent = LEVELS[val];
      lab.className = 'topic-val' + (val > 2 ? ' up' : val < 2 ? ' down' : '');
      $('.sl-fill', row).style.width = val * 25 + '%';
      $('.sl-thumb', row).style.left = `calc(12px + (100% - 24px) * ${val / 4})`;
      $$('.sl-tick', row).forEach((tk, i) => tk.classList.toggle('filled', i <= val));
      const sl = $('.slider', row);
      sl.setAttribute('aria-valuenow', val); sl.setAttribute('aria-valuetext', LEVELS[val]);
    });
    $('[data-action="tune-save"]', root).disabled = TOPICS.every(t => draft[t] === S.prefs[t]);
    $('[data-action="tune-reset"]', root).disabled = TOPICS.every(t => draft[t] === 2);
  }

  function tuneMessage(p) {
    const join = a => a.length <= 1 ? a.join('') : a.slice(0, -1).join(', ') + ' & ' + a[a.length - 1];
    const more = TOPICS.filter(t => p[t] > 2).sort((a, b) => p[b] - p[a]).map(t => L[t]);
    const less = TOPICS.filter(t => p[t] < 2).sort((a, b) => p[a] - p[b]).map(t => L[t]);
    if (!more.length && !less.length) return 'Got it — your For You feed is back to default.';
    const parts = [];
    if (more.length) parts.push('more ' + join(more));
    if (less.length) parts.push('less ' + join(less));
    return 'Got it — ' + parts.join(', ') + '.';
  }

  async function saveTune() {
    if (!TUNE) return;
    const old = Object.assign({}, S.prefs), draft = Object.assign({}, TUNE.draft);
    const changed = TOPICS.filter(t => draft[t] !== old[t]);
    S.prefs = draft; persist.prefs();
    changed.forEach(t => delete S.penalty[t]); persist.penalty();
    S.flags.tuneUsed = true; persist.flags();
    closeAllSheets();

    const f = S.feeds.foryou;
    const before = upcomingTopics(f);
    const ups = TOPICS.filter(t => draft[t] > 2).sort((a, b) => (draft[b] - draft[a]) || ((draft[b] - old[b]) - (draft[a] - old[a])));
    const first = ups.find(t => draft[t] > old[t]) || ups[0] || null;
    rebuildUpcoming(f, first);
    S.lastMix = { before, after: upcomingTopics(f) };
    store.set('lastMix', S.lastMix);

    const onForYou = S.nav === 'home' && !overlayStack.length && S.tab === 'foryou';
    if (S.tab === 'foryou') renderFeed();
    if (!$('#demoPanel').hidden) renderDemoPanel();
    if (onForYou) {
      updatingEl.hidden = false;
      await sleep(1250);
      updatingEl.classList.add('out');
      await sleep(280);
      updatingEl.hidden = true; updatingEl.classList.remove('out');
    }
    toast(tuneMessage(draft), { ms: 2600 });
  }

  /* =========================================================
     Comments
     ========================================================= */
  function genComments(v) {
    const r = seeded(hash(v.id));
    const texts = shuffle([...COMMENTS[v.topic], ...COMMENTS.generic], r);
    const people = shuffle(PEOPLE, r);
    const times = ['2m', '18m', '1h', '3h', '6h', '12h', '1d', '2d', '3d', '5d', '1w', '2w'];
    const list = texts.slice(0, 10).map((text, i) => ({
      id: v.id + ':' + i, user: people[i % people.length], text,
      time: times[Math.floor(r() * times.length)],
      likes: Math.floor(Math.pow(r(), 2.4) * v.likes * 0.018) + Math.floor(r() * 40),
      replies: r() < 0.45 ? 1 + Math.floor(r() * 40) : 0,
    })).sort((a, b) => b.likes - a.likes);
    if (r() < 0.7) list.splice(1, 0, { id: v.id + ':creator', user: { n: v.name, a: v.avatar }, creator: true, text: CREATOR_REPLIES[v.topic], time: '1d', likes: Math.floor(v.likes * 0.004), replies: 3 + Math.floor(r() * 30) });
    return list;
  }
  function commentHTML(c) {
    const liked = S.likedComments.has(c.id);
    return `<div class="c-item ${c.isNew ? 'new' : ''} ${c.reply ? 'reply' : ''}" data-cid="${c.id}">
      <img class="c-avatar" src="${c.user.a}" alt="">
      <div class="c-body">
        <div class="c-name">${esc(c.user.n)}${c.creator ? '<span class="creator-tag">· Creator</span>' : ''}</div>
        <div class="c-text">${esc(c.text)}</div>
        <div class="c-meta"><span>${c.time}</span><button data-action="c-reply" data-name="${esc(c.user.n)}">Reply</button></div>
        ${c.replies ? `<button class="c-replies" data-action="c-replies" data-cid="${c.id}" data-n="${c.replies}">View ${c.replies} ${c.replies === 1 ? 'reply' : 'replies'}${ic('chevronDown')}</button>` : ''}
      </div>
      <button class="c-like ${liked ? 'on' : ''}" data-action="c-like" data-cid="${c.id}" data-base="${c.likes}">${ic('heartLine', 'o')}${ic('heart', 'f')}<span>${fmt(c.likes + (liked ? 1 : 0))}</span></button>
    </div>`;
  }
  function openComments(v) {
    const mine = (S.myComments[v.id] || []).map(c => Object.assign({}, c, { user: { n: ME.username, a: ME.avatar } }));
    const list = mine.slice().reverse().concat(genComments(v));
    const o = openSheet({
      cls: 'comments-sheet',
      html: `<div class="c-head" data-drag><span class="c-title">${fmt(commentCount(v))} comments</span><button class="s-r" data-action="close-sheet" aria-label="Close">${ic('close')}</button></div>
        <div class="c-list">${list.map(commentHTML).join('')}</div>
        <form class="c-input-bar" data-nodrag autocomplete="off">
          <img class="c-avatar" src="${ME.avatar}" alt="">
          <label class="c-input"><input type="text" placeholder="Add comment..." enterkeyhint="send" maxlength="150">${ic('at')}${ic('smile')}<button type="submit" class="c-send" aria-label="Post">${ic('send')}</button></label>
        </form>`,
      onMount(o) {
        const form = $('form', o.sheet), input = $('input', form), wrap = $('.c-input', form);
        input.addEventListener('input', () => wrap.classList.toggle('has-text', !!input.value.trim()));
        form.addEventListener('submit', e => {
          e.preventDefault();
          const text = input.value.trim(); if (!text) return;
          const c = { id: 'me:' + Date.now(), text, time: 'Just now', likes: 0, replies: 0 };
          (S.myComments[v.id] = S.myComments[v.id] || []).push(c); persist.myComments();
          const listEl = $('.c-list', o.sheet);
          listEl.insertAdjacentHTML('afterbegin', commentHTML(Object.assign({}, c, { user: { n: ME.username, a: ME.avatar }, isNew: true })));
          listEl.scrollTop = 0;
          input.value = ''; wrap.classList.remove('has-text'); input.blur();
          $('.c-title', o.sheet).textContent = fmt(commentCount(v)) + ' comments';
          refreshCounts(v.id);
        });
      },
    });
    return o;
  }

  /* =========================================================
     Share
     ========================================================= */
  function openShare(v) {
    const apps = [['repost', 'Repost', 'repost', '#FACE15'], ['copy', 'Copy link', 'link', '#2F80ED'], ['messages', 'Messages', 'message', '#34C759'], ['email', 'Email', 'mail', '#5E5CE6'], ['nearby', 'Nearby', 'nearby', '#0A84FF'], ['more', 'More', 'more', '#8E8E93']];
    const acts = [['report', 'Report', 'flag'], ['not-interested', 'Not interested', 'notInterested'], ['download', 'Save video', 'download'], ['duet', 'Duet', 'duet'], ['stitch', 'Stitch', 'stitch'], ['fav', 'Add to Favorites', 'bookmarkLine'], ['livephoto', 'Live photo', 'livePhoto'], ['gif', 'Share as GIF', 'gif']];
    openSheet({
      cls: 'share-sheet',
      html: `<div class="sh-title" data-drag>Send to<button class="s-r" data-action="close-sheet" aria-label="Close">${ic('close')}</button></div>
        <div class="sh-row" data-nodrag>${PEOPLE.slice(0, 9).map(p => `<button class="sh-contact" data-action="share-contact" data-name="${esc(p.n)}"><span class="av"><img src="${p.a}" alt=""><span class="sel">${ic('check')}</span></span><span>${esc(p.n)}</span></button>`).join('')}</div>
        <div class="sh-send"><button class="btn-red btn-block" data-action="share-send">Send</button></div>
        <div class="sh-row" data-nodrag>${apps.map(([k, n, i, c]) => `<button class="sh-app" data-action="share-app" data-k="${k}"><span class="circ" style="background:${c}">${ic(i)}</span><span>${n}</span></button>`).join('')}</div>
        <div class="sh-divider"></div>
        <div class="sh-row" data-nodrag>${acts.map(([k, n, i]) => `<button class="sh-app" data-action="share-act" data-k="${k}"><span class="circ gray">${ic(i)}</span><span>${n}</span></button>`).join('')}</div>
        <button class="sh-cancel" data-action="close-sheet">Cancel</button>`,
    });
  }
  function toggleRepost(id) {
    const on = !S.reposted.has(id);
    on ? S.reposted.add(id) : S.reposted.delete(id);
    persist.reposted();
    $$(`.slide[data-vid="${id}"] .repost-pill`).forEach(p => { p.classList.toggle('done', on); $('span', p).textContent = on ? 'You reposted' : 'Repost to followers'; });
    toast(on ? 'Reposted' : 'Repost removed');
  }
  const fakeLink = v => `https://www.tiktok.com/@${v.username}/video/${7400000000000000000 + (hash(v.id) % 99999999)}`;
  function copyText(text) { try { navigator.clipboard && navigator.clipboard.writeText(text).catch(() => {}); } catch (e) {} }

  /* =========================================================
     Follow
     ========================================================= */
  function setFollow(username, on, { animateBtn = null, silent = false } = {}) {
    on ? S.following.add(username) : S.following.delete(username);
    persist.following();
    if (S.feeds.following && S.tab !== 'following') S.feeds.following = null;
    $$('.slide[data-vid]').forEach(el => {
      const v = S.byId[el.dataset.vid];
      if (!v || v.username !== username) return;
      const btn = $('.follow-btn', el);
      if (on && btn && btn !== animateBtn) btn.remove();
      if (!on && !btn) $('.rail-avatar', el).insertAdjacentHTML('beforeend', `<button class="follow-btn" data-action="follow" aria-label="Follow">${ic('plus', 'pl')}${ic('check', 'chk')}</button>`);
    });
    if (animateBtn) {
      animateBtn.classList.add('done');
      setTimeout(() => animateBtn.classList.add('gone'), 650);
      setTimeout(() => animateBtn.remove(), 1300);
    }
    if (!silent && !animateBtn) toast(on ? 'Following' : 'Unfollowed');
  }

  /* =========================================================
     Screens: search, creator profile, viewer, LIVE, camera,
     settings, chat, activity
     ========================================================= */
  const SUGGEST = [['ramen spots nyc', true], ['cat videos funny', true], ['tulum travel', false], ['battle ropes workout', false], ['tech house dance', false], ['pumpkin pie recipe', false]];
  function openSearch(q = '') {
    pushScreen({
      cls: 'search-screen',
      html: `<form class="s-bar" autocomplete="off"><button type="button" class="back" data-action="pop" aria-label="Back">${ic('back')}</button>
        <label class="s-box ${q ? 'has-text' : ''}">${ic('search')}<input type="search" placeholder="Search" enterkeyhint="search" value="${esc(q)}"><button type="button" class="clr" data-action="s-clear">${ic('close')}</button></label>
        <button type="submit" class="s-go">Search</button></form>
        <div class="scr-body s-results"></div>`,
      onMount(o) {
        const form = $('form', o.el), input = $('input', form), box = $('.s-box', form);
        o.input = input;
        input.addEventListener('input', () => { box.classList.toggle('has-text', !!input.value); if (!input.value) renderSuggestions(o); });
        form.addEventListener('submit', e => { e.preventDefault(); input.blur(); runSearch(o, input.value); });
        if (q) runSearch(o, q); else { renderSuggestions(o); if (!document.documentElement.classList.contains('is-phone')) setTimeout(() => input.focus(), 350); }
      },
    });
  }
  function renderSuggestions(o) {
    $('.s-results', o.el).innerHTML = `
      <div class="sec-title"><span>Recent</span><button data-action="toast" data-msg="Search history cleared">Clear all</button></div>
      ${['donuts', 'waterfall hikes'].map(s => `<button class="sug" data-action="s-sug" data-q="${s}">${ic('clock')}<span class="grow">${s}</span></button>`).join('')}
      <div class="sec-title"><span>You may like</span></div>
      <div class="sug-grid">${SUGGEST.map(([s, hot]) => `<button class="sug" data-action="s-sug" data-q="${s}"><span class="hot" style="${hot ? '' : 'background:var(--ink3)'}"></span><span class="grow">${s}</span></button>`).join('')}</div>`;
  }
  function runSearch(o, q) {
    q = q.trim(); if (!q) return renderSuggestions(o);
    o.input.value = q; $('.s-box', o.el).classList.add('has-text');
    const ql = q.toLowerCase();
    let results;
    if (ql.startsWith('#')) results = S.videos.filter(v => v.caption.toLowerCase().includes(ql));
    else {
      const exactSound = S.videos.filter(v => v.sound.toLowerCase() === ql);
      if (exactSound.length) results = exactSound;
      else {
        const toks = ql.split(/\s+/).filter(t => t.length > 2 || ql.length <= 3);
        results = S.videos.map(v => {
          const hay = `${v.caption} ${v.username} ${v.name} ${v.sound} ${v.topic} ${TOPIC_WORDS[v.topic]}`.toLowerCase();
          return { v, score: toks.filter(t => hay.includes(t)).length };
        }).filter(x => x.score > 0).sort((a, b) => b.score - a.score || b.v.likes - a.v.likes).map(x => x.v);
      }
    }
    const tabs = ['Top', 'Videos', 'Users', 'Sounds', 'LIVE', 'Places'];
    $('.s-results', o.el).innerHTML = `<div class="r-tabs">${tabs.map((t, i) => `<button class="r-tab ${i === 0 ? 'on' : ''}" data-action="r-tab">${t}</button>`).join('')}</div>` +
      (results.length ? `<div class="r-grid">${results.map(v => `
        <button class="r-card" data-action="open-video" data-vid="${v.id}">
          <div class="r-thumb"><img src="${v.poster}" alt="" loading="lazy"><span class="r-date">${['2d ago', '1w ago', '3d ago', '10-12', '5h ago'][hash(v.id) % 5]}</span></div>
          <div class="r-cap">${esc(v.caption)}</div>
          <div class="r-meta"><img src="${v.avatar}" alt=""><span class="nm">${esc(v.username)}</span><span class="lk">${ic('heartLine')}${fmt(likeCount(v))}</span></div>
        </button>`).join('')}</div>`
        : `<div class="empty-state">${ic('search')}<b>No results found</b>Try searching for something else, like “cats” or “ramen”.</div>`);
  }

  function uniqueCreators() {
    const m = new Map();
    S.videos.forEach(v => { if (!m.has(v.username)) m.set(v.username, { username: v.username, name: v.name, avatar: v.avatar, verified: v.verified, topic: v.topic }); });
    return [...m.values()];
  }
  function openCreator(username) {
    const vids = S.videos.filter(v => v.username === username);
    if (!vids.length) return;
    const c = vids[0];
    const likes = vids.reduce((a, v) => a + likeCount(v), 0);
    const followers = Math.round(likes / 9.3);
    const o = pushScreen({
      cls: 'creator-screen',
      html: `<div class="scr-head"><button class="hl" data-action="pop" aria-label="Back">${ic('back')}</button>${esc(c.name)}<div class="hr"><button data-action="toast" data-msg="You'll get notified when @${esc(username)} posts">${ic('bell')}</button><button data-action="share-profile" data-user="${esc(username)}">${ic('share')}</button></div></div>
        <div class="scr-body">
          <div class="p-top">
            <img class="p-avatar" src="${c.avatar}" alt="">
            <div class="p-handle">@${esc(username)}${c.verified ? `<span class="verified">${ic('check')}</span>` : ''}</div>
            <div class="p-stats">
              <div class="p-stat"><b>${120 + hash(username) % 400}</b><span>Following</span></div>
              <div class="p-stat"><b class="fcount">${fmt(followers)}</b><span>Followers</span></div>
              <div class="p-stat"><b>${fmt(likes)}</b><span>Likes</span></div>
            </div>
            <div class="p-btns creator-btns"></div>
            <p class="p-bio">${esc(L[c.topic])} creator ✨ new videos every week<br>📩 collabs in bio</p>
          </div>
          <div class="p-tabs"><button class="p-tab on" data-action="toast" data-msg="Videos">${ic('grid')}</button><button class="p-tab" data-action="toast" data-msg="Reposts are private">${ic('repost')}</button><button class="p-tab" data-action="toast" data-msg="Liked videos are private">${ic('heartLine')}</button></div>
          <div class="grid">${vids.map((v, i) => `<button class="cell" data-action="open-video" data-vid="${v.id}"><img src="${v.poster}" alt="">${i === 0 && vids.length > 1 ? '<span class="pin">Pinned</span>' : ''}<span class="views">${ic('playLine')}${fmt(Math.round(likeCount(v) * 7.4))}</span></button>`).join('')}</div>
        </div>`,
      onMount(o) { o.username = username; renderCreatorBtns(o); },
    });
    return o;
  }
  function renderCreatorBtns(o) {
    const on = S.following.has(o.username);
    $('.creator-btns', o.el).innerHTML = on
      ? `<button class="btn-gray" style="width:164px" data-action="creator-message">Message</button><button class="btn-gray sq" data-action="creator-follow" aria-label="Unfollow">${ic('user')}</button>`
      : `<button class="btn-red" style="width:164px" data-action="creator-follow">Follow</button><button class="btn-gray" data-action="creator-message">Message</button>`;
  }

  function openViewer(id) {
    const v = S.byId[id]; if (!v) return;
    pushScreen({
      cls: 'viewer', dark: true,
      html: `<button class="viewer-back" data-action="pop" aria-label="Back">${ic('back')}</button>
        <div class="slide" data-vid="${v.id}"><video class="v" playsinline webkit-playsinline preload="auto" loop data-autoplay></video><div class="slide-ui"></div></div>
        <button class="viewer-bar" data-action="comments" data-vid="${v.id}">${ic('smile')}<span class="grow">Add comment...</span>${ic('at')}</button>`,
      onMount(o) {
        const el = $('.slide', o.el);
        const s = { el, video: $('video', el), ui: $('.slide-ui', el), v, item: { id: v.id, key: 'viewer' }, ctx: 'viewer', screen: o };
        slideOf.set(el, s);
        s.video.src = v.src; s.video.poster = v.poster; s.video.muted = S.muted;
        s.ui.innerHTML = slideUI(v);
        requestAnimationFrame(() => fitCaption(s));
        s.video.addEventListener('timeupdate', () => { if (s.video.currentTime > 3.5) el.classList.add('show-repost'); });
        s.video.addEventListener('play', () => el.classList.remove('paused'));
        s.video.addEventListener('pause', () => el.classList.add('paused'));
        o.destroy = attachGestures(el, {
          onTapUp: () => {
            if (app.classList.contains('clear-display')) { app.classList.remove('clear-display'); return true; }
            if (S.muted) { unmute(); return true; }
            if (o.userPaused) { o.userPaused = false; el.classList.remove('user-paused'); playVideo(s.video); return true; }
            return false;
          },
          onTap: () => { o.userPaused = true; el.classList.add('user-paused'); s.video.pause(); },
          onDoubleTap: (x, y) => likeBurst(s, x, y),
          onLongPress: () => openActionSheet(s),
        });
      },
      onClose(o) { o.destroy && o.destroy(); },
    });
  }

  function openLive() {
    const host = S.byId['music-4'];
    const chat = ['this is so good 🔥', 'hiii from Brazil 🇧🇷', 'the energy!!', 'teach us the choreo', 'omg I love this song', '❤️❤️❤️', 'how long have you been dancing?', 'queen 👑', 'sent a Rose 🌹', 'first time catching your live!', 'do the part 2 move', 'shoutout pls 🙏'];
    pushScreen({
      cls: 'live-screen', dark: true, anim: 'up',
      html: `<video src="${host.src}" poster="${host.poster}" playsinline webkit-playsinline loop data-autoplay></video>
        <div class="live-tap"></div>
        <div class="live-top">
          <div class="host-pill"><img src="${host.avatar}" alt=""><div><div class="hn">${esc(host.name)}</div><div class="hl">${ic('heart')}<span class="lk">24.8K</span></div></div><button class="host-follow" data-action="live-follow">Follow</button></div>
          <div class="live-viewers"><div class="avs">${PEOPLE.slice(0, 3).map(p => `<img src="${p.a}" alt="">`).join('')}</div><span class="cnt">1.2K</span><button class="x" data-action="pop" aria-label="Close">${ic('close')}</button></div>
        </div>
        <div class="live-tags"><span class="lv">LIVE</span><span>${ic('trending')}Dance · Top 3</span></div>
        <div class="live-chat"></div>
        <form class="live-bottom" autocomplete="off"><label class="live-input"><input placeholder="Comment..." enterkeyhint="send" maxlength="80"></label>
          <button type="button" class="live-ic" data-action="toast" data-msg="Ask the host a question">${ic('question')}</button>
          <button type="button" class="live-ic" data-action="live-gift">${ic('gift')}</button>
          <button type="button" class="live-ic" data-action="share-live">${ic('share')}</button></form>`,
      onMount(o) {
        const box = $('.live-chat', o.el);
        let likes = 24800, viewers = 1200, i = 0;
        const add = (name, avatar, text, sys = false) => {
          box.insertAdjacentHTML('beforeend', `<div class="lc-msg ${sys ? 'sys' : ''}">${avatar ? `<img src="${avatar}" alt="">` : ''}<span><span class="n">${esc(name)}</span>${esc(text)}</span></div>`);
          while (box.children.length > 12) box.firstElementChild.remove();
        };
        add('', null, 'Welcome to LIVE! Be kind and follow the Community Guidelines.', true);
        o.iv = setInterval(() => {
          const p = PEOPLE[(i * 7 + 3) % PEOPLE.length];
          if (i % 5 === 4) add(p.n, p.a, 'joined', true); else add(p.n, p.a, chat[i % chat.length]);
          i++;
          viewers += Math.round(Math.random() * 30 - 8); likes += Math.round(Math.random() * 60);
          $('.cnt', o.el).textContent = fmt(viewers); $('.lk', o.el).textContent = fmt(likes);
        }, 1300);
        $('.live-tap', o.el).addEventListener('click', () => floatHeart(o.el));
        const form = $('form', o.el), input = $('input', form);
        form.addEventListener('submit', e => { e.preventDefault(); const t = input.value.trim(); if (!t) return; add(ME.username, ME.avatar, t); input.value = ''; input.blur(); });
        o.add = add;
      },
      onClose(o) { clearInterval(o.iv); },
    });
  }
  function floatHeart(root) {
    const colors = ['#FE2C55', '#25F4EE', '#FACE15', '#FF7AC6', '#8B5CF6'];
    const h = document.createElement('i');
    h.className = 'float-heart';
    h.innerHTML = ICONS.heart;
    h.style.color = colors[Math.floor(Math.random() * colors.length)];
    h.style.setProperty('--dx', (Math.random() * 80 - 50) + 'px');
    root.appendChild(h);
    setTimeout(() => h.remove(), 2500);
  }

  function openCreate() {
    const tools = [['flip', 'Flip'], ['speed', 'Speed'], ['wand', 'Beauty'], ['filters', 'Filters'], ['timer', 'Timer'], ['flash', 'Flash']];
    pushScreen({
      cls: 'create-screen', dark: true, anim: 'up',
      html: `<div class="cam-view"><div class="cam-off"><b>Allow camera access</b><span>Film videos and take photos right from the app.</span><button class="btn-white" data-action="cam-enable">Enable camera</button></div></div>
        <div class="cam-top"><button class="x" data-action="pop" aria-label="Close">${ic('close')}</button><button class="add-sound" data-action="toast" data-msg="Trending sound: Tech House vibes">${ic('note')}Add sound</button></div>
        <div class="cam-tools">${tools.map(([i, n]) => `<button class="cam-tool" data-action="cam-tool" data-name="${n}">${ic(i)}<span>${n}</span></button>`).join('')}</div>
        <div class="cam-bottom">
          <div class="dur-tabs">${['10m', '60s', '15s', 'Photo', 'Text'].map(d => `<button class="${d === '15s' ? 'on' : ''}" data-action="cam-dur">${d}</button>`).join('')}</div>
          <div class="rec-row">
            <button class="rec-side" data-action="toast" data-msg="Effects: try Green Screen ✨"><span class="fx">${ic('effects')}</span><span>Effects</span></button>
            <button class="rec-btn" data-action="cam-rec" aria-label="Record"><svg viewBox="0 0 82 82"><circle cx="41" cy="41" r="38" stroke-dasharray="238.8" stroke-dashoffset="238.8"/></svg></button>
            <button class="rec-side" data-action="toast" data-msg="Upload from your camera roll"><span class="thumb"><img src="${S.byId['travel-2'].poster}" alt=""></span><span>Upload</span></button>
          </div>
          <div class="mode-tabs">${['POST', 'CREATE', 'LIVE'].map(m => `<button class="${m === 'CREATE' ? 'on' : ''}" data-action="cam-mode">${m}</button>`).join('')}</div>
        </div>`,
      onClose(o) { stopRecording(o); if (o.stream) o.stream.getTracks().forEach(t => t.stop()); },
    });
  }
  function stopRecording(o, save = false) {
    if (!o.rec) return;
    cancelAnimationFrame(o.rec.raf);
    o.rec = null;
    const btn = $('.rec-btn', o.el); btn && btn.classList.remove('rec');
    const c = $('.rec-btn circle', o.el); c && (c.style.strokeDashoffset = 238.8);
    const t = $('.rec-timer', o.el); t && t.remove();
    if (save) toast('Saved to drafts', { icon: 'check' });
  }

  function openSettings() {
    const row = (icon, label, action = 'soon') => `<button class="l-row" data-action="${action}" data-msg="${label}">${ic(icon)}<span class="grow">${label}</span>${ic('chevronRight', 'chev')}</button>`;
    pushScreen({
      html: `<div class="scr-head bordered"><button class="hl" data-action="pop" aria-label="Back">${ic('back')}</button>Settings and privacy</div>
        <div class="scr-body">
          <div class="sec-title">Account</div>${row('user', 'Account')}${row('lock', 'Privacy')}${row('shield', 'Security & permissions')}${row('link', 'Share profile', 'copy-profile')}
          <div class="sec-title">Content & Display</div>${row('bell', 'Notifications')}${row('live', 'LIVE')}${row('clock', 'Activity center')}${row('tune', 'Content preferences', 'open-content-prefs')}${row('megaphone', 'Ads')}${row('playLine', 'Playback')}${row('moon', 'Display')}${row('globe', 'Language')}${row('hourglass', 'Screen time')}
          <div class="sec-title">Support & About</div>${row('flag', 'Report a problem')}${row('question', 'Support')}${row('info', 'Terms and Policies')}
          <div class="sec-title">Login</div>${row('user', 'Switch account')}${row('key', 'Log out')}
          <div style="height:30px"></div>
        </div>`,
    });
  }
  function openContentPrefs() {
    pushScreen({
      html: `<div class="scr-head bordered"><button class="hl" data-action="pop" aria-label="Back">${ic('back')}</button>Content preferences</div>
        <div class="scr-body">
          <p class="desc" style="padding-top:14px">Manage the videos you see on your For You and Following feeds.</p>
          <div class="sec-title">For You feed</div>
          <button class="l-row" data-action="open-tune-settings">${ic('tune')}<span class="grow">Tune My Feed <span class="new-pill">New</span><span class="sub">Choose what you see more or less of</span></span>${ic('chevronRight', 'chev')}</button>
          <button class="l-row" data-action="refresh-fyp">${ic('flip')}<span class="grow">Refresh your For You feed<span class="sub">Start fresh with new recommendations</span></span>${ic('chevronRight', 'chev')}</button>
          <button class="l-row" data-action="soon" data-msg="Filter video keywords">${ic('filters')}<span class="grow">Filter video keywords</span>${ic('chevronRight', 'chev')}</button>
          <div class="sec-title">General</div>
          <div class="l-row" data-action="toggle-restricted">${ic('shield')}<span class="grow">Restricted Mode<span class="sub">Limit content that may not be suitable for all audiences</span></span><span class="switch ${S.restricted ? 'on' : ''}"></span></div>
          <button class="l-row" data-action="soon" data-msg="Following feed preferences">${ic('friends')}<span class="grow">Following feed preferences</span>${ic('chevronRight', 'chev')}</button>
        </div>`,
    });
  }

  function openChat(chat) {
    chat.unread = false; updateBadge();
    if (S.nav === 'inbox') renderInbox();
    const bubble = ([who, type, val]) => {
      const av = who === 'them' ? `<img class="av" src="${chat.p.a}" alt="">` : '';
      if (type === 'video') {
        const v = S.byId[val];
        return `<div class="msg-row ${who}">${av}<button class="msg video" data-action="open-video" data-vid="${v.id}"><img src="${v.poster}" alt=""><span class="mv-cap"><img src="${v.avatar}" alt="">${esc(v.username)}</span></button></div>`;
      }
      return `<div class="msg-row ${who}">${av}<div class="msg">${esc(val)}</div></div>`;
    };
    pushScreen({
      html: `<div class="scr-head bordered"><button class="hl" data-action="pop" aria-label="Back">${ic('back')}</button>
          <div class="chat-who"><img src="${chat.p.a}" alt=""><div>${esc(chat.p.n)}<small>Active now</small></div></div>
          <div class="hr"><button data-action="soon" data-msg="Chat settings">${ic('more')}</button></div></div>
        <div class="chat-body"><div class="chat-time">${chat.time === '2m' || chat.time === '1h' ? 'Today' : chat.time}</div>${chat.msgs.map(bubble).join('')}</div>
        <form class="chat-input" autocomplete="off"><label class="pill"><input placeholder="Message..." enterkeyhint="send" maxlength="300">${ic('smile')}</label><button type="submit" class="c-send" style="display:flex" aria-label="Send">${ic('send')}</button></form>`,
      onMount(o) {
        const body = $('.chat-body', o.el), form = $('form', o.el), input = $('input', form);
        body.scrollTop = body.scrollHeight;
        form.addEventListener('submit', e => {
          e.preventDefault();
          const t = input.value.trim(); if (!t) return;
          chat.msgs.push(['me', 'text', t]); chat.last = t; chat.time = 'now';
          body.insertAdjacentHTML('beforeend', bubble(['me', 'text', t]));
          input.value = ''; body.scrollTop = body.scrollHeight;
          setTimeout(() => {
            body.insertAdjacentHTML('beforeend', `<div class="msg-row them typing-row"><img class="av" src="${chat.p.a}" alt=""><div class="msg typing"><span></span><span></span><span></span></div></div>`);
            body.scrollTop = body.scrollHeight;
          }, 600);
          setTimeout(() => {
            const tr = $('.typing-row', body); tr && tr.remove();
            const r = BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)];
            chat.msgs.push(['them', 'text', r]); chat.last = r;
            body.insertAdjacentHTML('beforeend', bubble(['them', 'text', r]));
            body.scrollTop = body.scrollHeight;
          }, 1900);
        });
      },
    });
  }

  function openActivity(kind) {
    const titles = { followers: 'New followers', activity: 'Activity', system: 'System notifications' };
    let rows = '';
    if (kind === 'followers') {
      rows = PEOPLE.slice(2, 7).map((p, i) => `<div class="p-row"><img src="${p.a}" alt=""><div class="grow"><div class="nm">${esc(p.n)}</div><div class="sb">started following you · ${['1h', '3h', '1d', '2d', '4d'][i]}</div></div><button class="btn-follow" data-action="follow-back">Follow back</button></div>`).join('');
    } else if (kind === 'activity') {
      const items = [['liked your comment.', 'food-3'], ['commented: "this is so me 😂"', 'comedy-1'], ['liked your repost.', 'travel-2'], ['mentioned you in a comment.', 'pets-1'], ['liked your comment.', 'music-2']];
      rows = items.map(([t, vid], i) => { const p = PEOPLE[(i * 3 + 1) % PEOPLE.length], v = S.byId[vid]; return `<button class="p-row" data-action="open-video" data-vid="${vid}"><img src="${p.a}" alt=""><div class="grow"><div class="nm" style="font-size:14px;font-weight:500"><b>${esc(p.n)}</b>&nbsp;${esc(t)}</div><div class="sb">${['2m', '1h', '5h', '1d', '2d'][i]}</div></div><img src="${v.poster}" alt="" style="width:40px;height:54px;border-radius:4px"></button>`; }).join('');
    } else {
      rows = [['Tune My Feed is here ✨', 'Hold any video and tap “Tune My Feed” to choose what you see more or less of.'], ['Account updates', 'Your video reached 1,000 views.'], ['Security', 'New login on iPhone · Today 6:02 PM']]
        .map(([t, s]) => `<div class="p-row"><span class="i-ic" style="background:#161823">${ic('megaphone')}</span><div class="grow"><div class="nm">${esc(t)}</div><div class="sb" style="white-space:normal">${esc(s)}</div></div></div>`).join('');
    }
    pushScreen({ html: `<div class="scr-head bordered"><button class="hl" data-action="pop" aria-label="Back">${ic('back')}</button>${titles[kind]}</div><div class="scr-body">${rows}</div>` });
  }

  /* =========================================================
     Tab screens: Friends / Inbox / Profile
     ========================================================= */
  function switchNav(name) {
    if (name === S.nav) { if (name === 'home') refreshHome(); return; }
    closeAllSheets();
    while (overlayStack.length) popScreen();
    S.nav = name;
    $$('.nav-item[data-nav]').forEach(b => b.classList.toggle('active', b.dataset.nav === name));
    ['friends', 'inbox', 'profile'].forEach(n => { $('#screen-' + n).hidden = n !== name; });
    if (name === 'friends') renderFriends();
    if (name === 'inbox') renderInbox();
    if (name === 'profile') renderProfile();
    if (name !== 'home') dismissCoach();
    updateChrome(); syncPlayback();
  }
  function refreshHome() {
    const f = curFeed(); if (!f) return;
    if (f.name === 'foryou') { rebuildUpcoming(f); renderFeed(); }
    toast(f.name === 'foryou' ? 'Your For You feed is up to date' : 'You’re all caught up', { ms: 1200 });
  }

  function renderFriends() {
    const sugg = uniqueCreators().filter(c => !S.following.has(c.username)).slice(0, 7);
    const fv = S.videos.filter(v => S.following.has(v.username));
    $('#screen-friends').innerHTML = `
      <div class="p-head"><div class="hl"><button data-action="soon" data-msg="Find friends">${ic('addFriend')}</button></div>Friends<div class="hr"><button data-action="open-search" aria-label="Search">${ic('search')}</button></div></div>
      <button class="f-search" data-action="open-search">${ic('search')}Search</button>
      <div class="sec-title"><span>Find friends</span></div>
      <button class="p-row" data-action="soon" data-msg="Contacts"><span class="i-ic" style="background:#2F80ED">${ic('user')}</span><div class="grow"><div class="nm">Contacts</div><div class="sb">Find your contacts</div></div>${ic('chevronRight', 'chev')}</button>
      <button class="p-row" data-action="copy-profile"><span class="i-ic" style="background:#FE2C55">${ic('link')}</span><div class="grow"><div class="nm">Invite friends</div><div class="sb">Share your profile link</div></div>${ic('chevronRight', 'chev')}</button>
      <div class="sec-title"><span>Suggested accounts</span></div>
      ${sugg.map((c, i) => `<div class="p-row"><img src="${c.avatar}" alt="" data-action="creator" data-user="${c.username}"><div class="grow" data-action="creator" data-user="${c.username}"><div class="nm">${esc(c.name)}${c.verified ? `<span class="verified">${ic('check')}</span>` : ''}</div><div class="sb">${i % 2 ? 'Suggested for you' : `Followed by ${esc(PEOPLE[i].n)}`}</div></div><button class="btn-follow" data-action="f-follow" data-user="${c.username}">Follow</button></div>`).join('') || '<div class="desc">You follow everyone we know about 🎉</div>'}
      ${fv.length ? `<div class="sec-title"><span>From accounts you follow</span></div><div class="f-posts">${fv.map(v => `<button class="f-post" data-action="open-video" data-vid="${v.id}"><img src="${v.poster}" alt=""><span class="who"><img src="${v.avatar}" alt="">${esc(v.name)}</span></button>`).join('')}</div>` : ''}`;
  }

  function updateBadge() {
    const n = CHATS.filter(c => c.unread).length;
    const b = $('#inboxBadge'); b.textContent = n; b.hidden = !n;
  }
  function renderInbox() {
    $('#screen-inbox').innerHTML = `
      <div class="p-head"><div class="hl"><button data-action="soon" data-msg="Find friends">${ic('addFriend')}</button></div>Inbox<div class="hr"><button data-action="soon" data-msg="New message">${ic('compose')}</button></div></div>
      <div class="stories">
        <button class="story" data-action="open-create"><span class="ring seen"><span class="me">${ic('profileFill')}</span><span class="add">${ic('plusBold')}</span></span><span>Your story</span></button>
        ${PEOPLE.slice(0, 7).map((p, i) => `<button class="story" data-action="toast" data-msg="${esc(p.n)} hasn't posted a story today"><span class="ring ${i > 3 ? 'seen' : ''}"><img src="${p.a}" alt=""></span><span>${esc(p.n)}</span></button>`).join('')}
      </div>
      <button class="i-row" data-action="open-activity" data-k="followers"><span class="i-ic" style="background:#20D5EC">${ic('user')}</span><div class="i-main"><div class="i-title">New followers</div><div class="i-sub">jess.m started following you.</div></div><div class="i-end"><span class="i-count">3</span></div></button>
      <button class="i-row" data-action="open-activity" data-k="activity"><span class="i-ic" style="background:#FE2C55">${ic('bell')}</span><div class="i-main"><div class="i-title">Activity</div><div class="i-sub">carlos_rv liked your comment.</div></div><div class="i-end"><span class="i-count">12</span></div></button>
      <button class="i-row" data-action="open-activity" data-k="system"><span class="i-ic" style="background:#161823">${ic('megaphone')}</span><div class="i-main"><div class="i-title">System notifications</div><div class="i-sub">Tune My Feed is here ✨ Hold any video to try it.</div></div><div class="i-end"><span>1h</span></div></button>
      <div class="sec-title"><span>Messages</span></div>
      ${CHATS.map(c => `<button class="i-row ${c.unread ? 'unread' : ''}" data-action="open-chat" data-id="${c.id}"><img src="${c.p.a}" alt=""><div class="i-main"><div class="i-title">${esc(c.p.n)}</div><div class="i-sub">${esc(c.last)} · ${esc(c.time)}</div></div><div class="i-end">${c.unread ? '<span class="i-dot"></span>' : ''}</div></button>`).join('')}
      <div style="height:20px"></div>`;
  }

  function renderProfile() {
    const tab = S.profileTab;
    const tabs = [['videos', 'grid'], ['private', 'lock'], ['reposts', 'repost'], ['saved', 'bookmarkLine'], ['liked', 'heartLine']];
    $('#screen-profile').innerHTML = `
      <div class="p-head"><div class="hl"><button data-action="soon" data-msg="Find friends">${ic('addFriend')}</button></div>${ME.name}${ic('chevronDown', 'chev')}
        <div class="hr"><button data-action="toast" data-msg="128 profile views in the last 30 days">${ic('footprint')}</button><button data-action="profile-menu" aria-label="Menu">${ic('menu')}</button></div></div>
      <div class="p-top">
        <img class="p-avatar" src="${ME.avatar}" alt="">
        <div class="p-handle">@${ME.username}</div>
        <div class="p-stats">
          <div class="p-stat"><b>${S.following.size + 125}</b><span>Following</span></div>
          <div class="p-stat"><b>2,431</b><span>Followers</span></div>
          <div class="p-stat"><b>18.6K</b><span>Likes</span></div>
        </div>
        <div class="p-btns"><button class="btn-gray" data-action="soon" data-msg="Edit profile">Edit profile</button><button class="btn-gray" data-action="copy-profile">Share profile</button><button class="btn-gray sq" data-action="soon" data-msg="Add friends" aria-label="Add friends">${ic('addFriend')}</button></div>
        <p class="p-bio">Product nerd 📱 building Tune My Feed<br>Hold any video to try it ✨</p>
      </div>
      <div class="p-tabs">${tabs.map(([k, i]) => `<button class="p-tab ${tab === k ? 'on' : ''}" data-action="p-tab" data-k="${k}">${ic(i)}</button>`).join('')}</div>
      <div class="p-content">${profileContent(tab)}</div>`;
  }
  function gridOf(ids) {
    return `<div class="grid">${ids.map(id => { const v = S.byId[id]; return v ? `<button class="cell" data-action="open-video" data-vid="${v.id}"><img src="${v.poster}" alt=""><span class="views">${ic('playLine')}${fmt(Math.round(likeCount(v) * 7.4))}</span></button>` : ''; }).join('')}</div>`;
  }
  function profileContent(tab) {
    const empty = (icon, title, sub, cta = '') => `<div class="empty-state">${ic(icon)}<b>${title}</b>${sub}${cta}</div>`;
    if (tab === 'videos') return empty('upload', 'Share your first video', 'Your videos will appear here.', `<div style="margin-top:16px"><button class="btn-red" data-action="open-create">Upload</button></div>`);
    if (tab === 'private') return empty('lock', 'Your private videos', 'To make your videos only visible to you, set them to “Private” in settings.');
    if (tab === 'reposts') return S.reposted.size ? gridOf([...S.reposted].reverse()) : empty('repost', 'No reposts yet', 'Videos you repost will appear here.');
    if (tab === 'saved') return S.saved.size ? gridOf([...S.saved].reverse()) : empty('bookmarkLine', 'No favorites yet', 'Tap the bookmark on a video to save it here.');
    return S.liked.size ? gridOf([...S.liked].reverse()) : empty('heartLine', 'No liked videos yet', 'Videos you like will appear here.');
  }

  /* =========================================================
     Top tabs: Community · Following · For You
     ========================================================= */
  function moveUnderline(animate = false) {
    const a = $('.tab.active'), u = $('#tabUnderline');
    if (!a || !u || !a.offsetWidth) return;
    u.classList.toggle('no-anim', !animate);
    u.style.transform = `translateX(${a.offsetLeft + a.offsetWidth / 2 - 11}px)`;
  }
  function switchTab(name) {
    if (name === S.tab) return;
    pool.forEach(p => p.video.pause());
    S.tab = name; S.userPaused = false;
    if (!S.feeds[name]) S.feeds[name] = buildFeed(name);
    $$('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === name));
    moveUnderline(true);
    dismissCoach();
    renderFeed();
  }

  /* =========================================================
     Demo panel (triple-tap status bar · two-finger tap · "D")
     ========================================================= */
  function toggleDemoPanel(force) {
    const p = $('#demoPanel');
    const show = force ?? p.hidden;
    p.hidden = !show;
    if (show) { renderDemoPanel(); positionDemoPanel(); }
  }
  function positionDemoPanel() {
    const p = $('#demoPanel');
    if (p.hidden || document.documentElement.classList.contains('is-phone')) { p.style.left = ''; return; }
    const r = device.getBoundingClientRect();
    if (innerWidth - r.right > 340) p.style.left = r.right + 32 + 'px';
    else if (r.left > 340) p.style.left = r.left - 342 + 'px';
    else p.style.left = Math.max(10, innerWidth - 322) + 'px';
  }
  function renderDemoPanel() {
    const p = $('#demoPanel');
    const f = S.feeds.foryou; if (!f) return;
    const nowT = upcomingTopics(f), before = S.lastMix && S.lastMix.before;
    const count = arr => TOPICS.reduce((m, t) => (m[t] = arr.filter(x => x === t).length, m), {});
    const cn = count(nowT), cb = before ? count(before) : null;
    p.innerHTML = `
      <div class="dp-head"><span><b>Demo panel</b><small>Tune My Feed</small></span><button data-action="demo-close" aria-label="Close">${ic('close')}</button></div>
      <div class="dp-sec">Next 10 videos on For You</div>
      ${cb ? '<div class="dp-legend"><span>Before last save</span><span class="now">Now</span></div>' : ''}
      ${TOPICS.map(t => `<div class="dp-row"><span class="lbl">${L[t]}</span><div class="dp-bars">${cb ? `<div class="dp-bar"><span style="width:${cb[t] * 10}%"></span></div>` : ''}<div class="dp-bar now"><span style="width:${cn[t] * 10}%"></span></div></div><span class="num">${cb ? cb[t] + ' → ' : ''}<b>${cn[t]}</b></span></div>`).join('')}
      <div class="dp-sec">Up next (in order)</div>
      <div class="dp-queue">${nowT.map(t => `<span style="background:${TOPIC_COLOR[t]}" title="${L[t]}">${L[t][0]}</span>`).join('')}</div>
      <div class="dp-sec">Your settings</div>
      <div class="dp-chips">${TOPICS.map(t => `<span class="${S.prefs[t] > 2 ? 'up' : S.prefs[t] < 2 ? 'down' : ''}">${L[t]}: ${LEVELS[S.prefs[t]]}</span>`).join('')}</div>
      <div class="dp-actions"><button data-action="demo-close">Close</button><button class="danger" data-action="demo-reset">Reset demo</button></div>
      <div class="dp-foot">Swipes this session: ${S.swipes} · Tip shown: ${S.flags.coachShown ? 'yes' : 'no'}<br>Weights — Much less 0.1 · Less 0.5 · Default 1 · More 2.5 · Much more 5</div>`;
  }
  let sbTaps = [];
  $('#sbHit').addEventListener('pointerdown', () => {
    const t = now();
    sbTaps = sbTaps.filter(x => t - x < 650); sbTaps.push(t);
    if (sbTaps.length >= 3) { sbTaps = []; toggleDemoPanel(); }
  });

  /* =========================================================
     Click actions (event delegation)
     ========================================================= */
  const ctxFromEl = el => {
    const s = slideFromEl(el);
    if (s) return { v: s.v, slide: s };
    const id = vidFrom(el);
    return id ? { v: S.byId[id], slide: null } : CTX;
  };
  const A = {
    // feed / rail
    like: el => { const c = ctxFromEl(el); toggleLike(c.v.id); },
    save: el => { const c = ctxFromEl(el); toggleSave(c.v.id); },
    comments: el => { CTX = ctxFromEl(el); openComments(CTX.v); },
    share: el => { CTX = ctxFromEl(el); openShare(CTX.v); },
    follow: el => { const c = ctxFromEl(el); setFollow(c.v.username, true, { animateBtn: el }); },
    creator: el => { const u = el.dataset.user || ctxFromEl(el).v.username; openCreator(u); },
    sound: el => openSearch(ctxFromEl(el).v.sound),
    hashtag: el => openSearch('#' + el.dataset.tag),
    repost: el => toggleRepost(ctxFromEl(el).v.id),
    'caption-toggle': el => { const s = slideFromEl(el); if (!s) return; s.expanded = !s.expanded; fitCaption(s); },
    translate: el => {
      const s = slideFromEl(el); if (!s) return;
      const next = el.nextElementSibling;
      if (next && next.classList.contains('translation')) { next.remove(); el.textContent = 'See translation'; }
      else { el.insertAdjacentHTML('afterend', `<div class="translation">${esc(s.v.translation)}</div>`); el.textContent = 'Hide translation'; }
    },
    unmute: () => unmute(),
    'open-live': () => openLive(),
    'open-search': () => openSearch(),
    'open-create': () => openCreate(),
    'goto-foryou': () => switchTab('foryou'),

    // generic
    'close-sheet': () => closeSheet(),
    pop: () => popScreen(),
    toast: el => toast(el.dataset.msg),
    soon: el => toast(`${el.dataset.msg || 'This'} isn't part of this demo`),

    // long-press menu
    download: () => { closeAllSheets(); progressToast('Saving video…', 'Saved to Photos'); },
    'not-interested': () => { closeAllSheets(); if (CTX) notInterested(CTX); },
    report: () => { closeAllSheets(); if (CTX) openReport(CTX.v); },
    'open-tune': () => { const c = CTX; closeSheet(); openTune(c && c.v, 'menu'); },
    speed: el => {
      S.speed = parseFloat(el.dataset.rate);
      $$('.seg button', el.parentElement.parentElement).forEach(b => b.classList.toggle('on', b === el));
      $$('video').forEach(v => { v.defaultPlaybackRate = S.speed; v.playbackRate = S.speed; });
    },
    'clear-display': () => { closeSheet(); app.classList.add('clear-display'); toast('Tap the screen to exit clear display', { ms: 1400 }); },
    'toggle-autoscroll': el => {
      S.autoScroll = !S.autoScroll;
      $('.switch', el).classList.toggle('on', S.autoScroll);
      pool.forEach(p => { p.video.loop = !S.autoScroll; });
      toast(S.autoScroll ? 'Auto scroll on' : 'Auto scroll off', { ms: 1100 });
    },
    captions: () => { closeSheet(); openCaptions(); },
    'cap-toggle': el => {
      const k = el.dataset.k; S[k] = !S[k];
      $('.switch', el).classList.toggle('on', S[k]);
      app.classList.toggle('captions-on', S.captions);
      $$('.slide[data-vid]').forEach(se => { const v = S.byId[se.dataset.vid], ac = $('.auto-caption', se); if (v && ac) ac.textContent = stripTags(S.translate && v.translation ? v.translation : v.caption); });
    },
    cast: () => { closeSheet(); openCast(); },
    'cast-to': el => { closeSheet(); toast(`Casting to ${el.dataset.name}`, { icon: 'cast' }); },
    pip: () => { const c = CTX; closeSheet(); if (c && c.slide) requestPiP(c.slide.video); },
    why: () => { closeSheet(); if (CTX) openWhy(CTX.v); },
    'why-tune': () => { const c = CTX; closeSheet(); openTune(c && c.v, 'why'); },
    'report-reason': el => {
      const body = el.closest('.sheet');
      $('.s-head span', body).textContent = 'Report';
      $('.report-body', body).innerHTML = `<div class="report-done"><span class="okc">${ic('check')}</span><b>Thanks for reporting</b><p>We'll review this video and take action if it violates our Community Guidelines. You won't see this video again.</p><button class="btn-red btn-block" data-action="report-done">Done</button></div>`;
    },
    'report-done': () => { closeSheet(); if (CTX && CTX.slide) notInterested(CTX, { penalize: false, message: 'Video hidden' }); },

    // Tune My Feed
    'tune-back': () => {
      if (!TUNE) return closeSheet();
      const t = TUNE; closeSheet(t.sheet);
      if (t.from === 'menu' && t.ctx && t.ctx.slide && t.ctx.slide.v && t.ctx.slide.v.id === t.ctx.v.id) setTimeout(() => openActionSheet(t.ctx.slide), 120);
    },
    'tune-reset': () => { if (!TUNE) return; TOPICS.forEach(t => { TUNE.draft[t] = 2; }); refreshTune(); },
    'tune-save': () => saveTune(),
    'basis-step': el => {
      if (!TUNE || !TUNE.basis) return;
      const t = TUNE.basis.topic;
      TUNE.draft[t] = clamp(TUNE.draft[t] + Number(el.dataset.d), 0, 4);
      vibrate(6); refreshTune();
      const row = $(`.topic-row[data-topic="${t}"]`, TUNE.sheet.sheet);
      row.classList.remove('flash'); void row.offsetWidth; row.classList.add('flash');
    },
    'open-tune-settings': () => openTune(currentForYouVideo(), 'settings'),
    'refresh-fyp': () => { const f = S.feeds.foryou; rebuildUpcoming(f); if (S.tab === 'foryou') renderFeed(); toast('Your For You feed has been refreshed'); },
    'toggle-restricted': el => { S.restricted = !S.restricted; $('.switch', el).classList.toggle('on', S.restricted); toast(S.restricted ? 'Restricted Mode on' : 'Restricted Mode off'); },

    // comments
    'c-like': el => {
      const id = el.dataset.cid, base = Number(el.dataset.base);
      S.likedComments.has(id) ? S.likedComments.delete(id) : S.likedComments.add(id);
      persist.likedComments();
      el.classList.toggle('on', S.likedComments.has(id));
      $('span', el).textContent = fmt(base + (S.likedComments.has(id) ? 1 : 0));
    },
    'c-reply': el => { const input = $('.comments-sheet input'); if (!input) return; input.value = '@' + el.dataset.name + ' '; input.closest('.c-input').classList.add('has-text'); input.focus(); },
    'c-replies': el => {
      const n = Number(el.dataset.n), item = el.closest('.c-item');
      const r = seeded(hash(el.dataset.cid));
      const html = Array.from({ length: Math.min(n, 3) }, (_, i) => commentHTML({ id: el.dataset.cid + ':r' + i, user: PEOPLE[Math.floor(r() * PEOPLE.length)], text: REPLIES[Math.floor(r() * REPLIES.length)], time: ['1h', '5h', '1d'][i], likes: Math.floor(r() * 90), replies: 0, reply: true })).join('');
      item.insertAdjacentHTML('afterend', html);
      if (n > 3) { el.dataset.n = 0; el.innerHTML = `View ${n - 3} more${ic('chevronDown')}`; el.dataset.action = 'toast'; el.dataset.msg = 'Showing the top replies'; }
      else el.remove();
    },

    // share
    'share-contact': el => { el.classList.toggle('on'); el.closest('.sheet').classList.toggle('has-sel', !!$('.sh-contact.on', el.closest('.sheet'))); },
    'share-send': el => {
      const names = $$('.sh-contact.on', el.closest('.sheet')).map(x => x.dataset.name);
      closeSheet(); toast(names.length === 1 ? `Sent to ${names[0]}` : `Sent to ${names.length} friends`, { icon: 'check' });
    },
    'share-app': el => {
      const k = el.dataset.k, v = CTX && CTX.v; if (!v) return;
      closeSheet();
      if (k === 'repost') return toggleRepost(v.id);
      if (k === 'copy') { copyText(fakeLink(v)); return toast('Link copied'); }
      if (k === 'more' && navigator.share) { navigator.share({ title: v.name, text: v.caption, url: fakeLink(v) }).catch(() => {}); return; }
      toast({ messages: 'Opening Messages…', email: 'Opening Mail…', nearby: 'Looking for people nearby…', more: 'More sharing options' }[k]);
    },
    'share-act': el => {
      const k = el.dataset.k, c = CTX; if (!c) return;
      closeSheet();
      if (k === 'report') return openReport(c.v);
      if (k === 'not-interested') return c.slide ? notInterested(c) : toast("Got it. You'll see fewer videos like this.");
      if (k === 'download') return progressToast('Saving video…', 'Saved to Photos');
      if (k === 'fav') { if (!S.saved.has(c.v.id)) toggleSave(c.v.id); else toast('Already in Favorites'); return; }
      toast({ duet: 'Duet: opening camera…', stitch: 'Stitch: pick up to 5 seconds', livephoto: 'Saved as Live Photo', gif: 'GIF created' }[k]);
    },
    'share-live': () => { copyText('https://www.tiktok.com/@kiko.dance/live'); toast('LIVE link copied'); },
    'share-profile': el => { copyText(`https://www.tiktok.com/@${el.dataset.user}`); toast('Profile link copied'); },
    'copy-profile': () => { copyText(`https://www.tiktok.com/@${ME.username}`); toast('Profile link copied'); },

    // screens
    'open-video': el => openViewer(el.dataset.vid || vidFrom(el)),
    'p-tab': el => { S.profileTab = el.dataset.k; renderProfile(); },
    'profile-menu': () => openSheet({
      dragAnywhere: true,
      html: `<div class="grabber"></div><div style="padding:8px 0 6px">
        <button class="l-row" data-action="soon" data-msg="Creator tools">${ic('sparkle')}<span class="grow">Creator tools</span></button>
        <button class="l-row" data-action="soon" data-msg="Your QR code">${ic('qr')}<span class="grow">Your QR code</span></button>
        <button class="l-row" data-action="open-settings">${ic('gear')}<span class="grow">Settings and privacy</span></button></div>`,
    }),
    'open-settings': () => { closeSheet(); openSettings(); },
    'open-content-prefs': () => openContentPrefs(),
    'creator-follow': el => { const o = overlayStack.find(x => x.el.contains(el)); if (!o) return; setFollow(o.username, !S.following.has(o.username)); renderCreatorBtns(o); },
    'creator-message': () => { const o = overlayStack[overlayStack.length - 1]; const v = S.videos.find(x => x.username === o.username); openChat({ id: 'x', p: { n: v.name, a: v.avatar }, last: '', time: 'now', unread: false, msgs: [] }); },
    'f-follow': el => { const on = !S.following.has(el.dataset.user); setFollow(el.dataset.user, on, { silent: true }); el.classList.toggle('following', on); el.textContent = on ? 'Following' : 'Follow'; },
    'follow-back': el => { const on = !el.classList.contains('following'); el.classList.toggle('following', on); el.textContent = on ? 'Friends' : 'Follow back'; },
    'open-chat': el => openChat(CHATS.find(c => c.id === el.dataset.id)),
    'open-activity': el => openActivity(el.dataset.k),
    's-sug': el => { const o = overlayStack[overlayStack.length - 1]; runSearch(o, el.dataset.q); },
    's-clear': el => { const o = overlayStack[overlayStack.length - 1]; o.input.value = ''; el.closest('.s-box').classList.remove('has-text'); renderSuggestions(o); },
    'r-tab': el => { $$('.r-tab', el.parentElement).forEach(b => b.classList.toggle('on', b === el)); },
    'live-follow': el => { const on = !el.classList.contains('done'); el.classList.toggle('done', on); el.textContent = on ? 'Following' : 'Follow'; },
    'live-gift': el => { const o = overlayStack.find(x => x.el.contains(el)); o && o.add && o.add(ME.username, ME.avatar, 'sent a Rose 🌹'); for (let i = 0; i < 6; i++) setTimeout(() => floatHeart(o.el), i * 120); },
    'cam-enable': el => {
      const o = overlayStack.find(x => x.el.contains(el)); const view = $('.cam-view', o.el);
      const fallback = () => {
        view.innerHTML = `<video src="${S.byId['comedy-3'].src}" playsinline webkit-playsinline muted loop autoplay></video>`;
        $('video', view).play().catch(() => {});
        toast('Camera needs HTTPS — showing a preview instead', { ms: 2200 });
      };
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return fallback();
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false }).then(stream => {
        o.stream = stream;
        view.innerHTML = '<video class="mirror" playsinline muted autoplay></video>';
        const v = $('video', view); v.srcObject = stream; v.play().catch(() => {});
      }).catch(fallback);
    },
    'cam-rec': el => {
      const o = overlayStack.find(x => x.el.contains(el));
      if (o.rec) return stopRecording(o, true);
      const total = 15000, t0 = now(), c = $('circle', el);
      el.classList.add('rec');
      o.el.insertAdjacentHTML('beforeend', '<div class="rec-timer">00:00</div>');
      const tick = () => {
        const p = Math.min(1, (now() - t0) / total);
        c.style.strokeDashoffset = 238.8 * (1 - p);
        const tm = $('.rec-timer', o.el); if (tm) tm.textContent = mmss((now() - t0) / 1000);
        if (p >= 1) return stopRecording(o, true);
        o.rec.raf = requestAnimationFrame(tick);
      };
      o.rec = { raf: requestAnimationFrame(tick) };
    },
    'cam-tool': el => { el.classList.toggle('on'); toast(`${el.dataset.name} ${el.classList.contains('on') ? 'on' : 'off'}`, { ms: 1000 }); },
    'cam-dur': el => { $$('button', el.parentElement).forEach(b => b.classList.toggle('on', b === el)); },
    'cam-mode': el => { $$('button', el.parentElement).forEach(b => b.classList.toggle('on', b === el)); if (el.textContent === 'LIVE') toast('Go LIVE needs 1,000 followers'); },

    // demo panel
    'demo-close': () => toggleDemoPanel(false),
    'demo-reset': () => { store.clear(); location.reload(); },
  };

  document.addEventListener('click', e => {
    const nav = e.target.closest('[data-nav]');
    if (nav) { switchNav(nav.dataset.nav); return; }
    const tab = e.target.closest('[data-tab]');
    if (tab) { if (S.nav !== 'home') switchNav('home'); switchTab(tab.dataset.tab); return; }
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    const fn = A[el.dataset.action];
    if (fn) { e.preventDefault(); fn(el, e); }
  });

  /* ---------------- keyboard (laptop demo) ---------------- */
  document.addEventListener('keydown', e => {
    if (e.target.matches('input, textarea')) { if (e.key === 'Escape') e.target.blur(); return; }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (k === 'd' || k === 'D') return toggleDemoPanel();
    if (k === 'Escape') {
      if (sheetStack.length) return TUNE && sheetStack[sheetStack.length - 1] === TUNE.sheet ? A['tune-back']() : closeSheet();
      if (overlayStack.length) return popScreen();
      if (!$('#demoPanel').hidden) return toggleDemoPanel(false);
      return app.classList.remove('clear-display');
    }
    if (!feedInteractive()) return;
    if (k === 'ArrowDown' || k === 'j') { e.preventDefault(); go(1); }
    else if (k === 'ArrowUp' || k === 'k') { e.preventDefault(); go(-1); }
    else if (k === ' ') { e.preventDefault(); if (S.muted) unmute(); else { S.userPaused = !S.userPaused; syncPlayback(); } }
    else if (k === 'l') { const c = cur(); if (c) toggleLike(c.v.id); }
    else if (k === 'm') { if (S.muted) unmute(); else { S.muted = true; $$('video').forEach(v => { v.muted = true; }); showUnmuteHint(); } }
    else if (k === 'h') { const c = cur(); if (c) openActionSheet(c); }
  });

  /* =========================================================
     Boot
     ========================================================= */
  async function boot() {
    let data = null;
    try {
      const r = await fetch('data/videos.json', { cache: 'no-cache' });
      if (!r.ok) throw new Error(r.status);
      data = await r.json();
    } catch (e) { data = window.VIDEOS_FALLBACK || []; }
    S.videos = data;
    data.forEach(v => { S.byId[v.id] = v; });
    TOPICS.forEach(t => { S.byTopic[t] = data.filter(v => v.topic === t).map(v => v.id); });

    $$('[data-icon]').forEach(el => { if (!el.firstElementChild) el.innerHTML = ICONS[el.dataset.icon] || ''; });
    S.feeds.foryou = buildFeed('foryou');
    fit();
    renderFeed();
    showUnmuteHint();
    updateBadge();
    requestAnimationFrame(progressLoop);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { moveUnderline(); pool.forEach(p => { if (p.item && !p.el.hidden) fitCaption(p); }); });
    setTimeout(moveUnderline, 300);
  }
  boot();

  // Expose a tiny hook for debugging in the console
  window.__tmf = { S, go, openTune, toggleDemoPanel, generate };
})();
