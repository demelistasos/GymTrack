'use strict';
// GymTrack · Πλοήγηση, κουμπιά, εκκίνηση

const PAGES = [
  ['today', 'Σήμερα', pageToday],
  ['workout', 'Προπόνηση', pageWorkout],
  ['food', 'Διατροφή', pageFood],
  ['progress', 'Πρόοδος', pageProgress],
  ['shop', 'Λίστα', pageShop],
  ['settings', 'Ρυθμίσεις', pageSettings]
];
let route = 'today';

function go(p) { route = p; render(); const m = $('.main'); if (m) m.scrollTop = 0; }
function applyTheme() {
  const light = DB.settings.theme === 'light';
  document.documentElement.dataset.theme = light ? 'light' : 'dark';
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = light ? '#F3F4F0' : '#0C0E11';
}
function renderNav() {
  $('#nav').innerHTML = PAGES.map(([k, l]) => `<button class="${route === k ? 'on' : ''} ${k === 'settings' ? 'nav-settings' : ''}" data-page="${k}" data-action="go" aria-label="${l}">
    ${icon(k)}<span>${l}</span>${k === 'workout' && DB.active ? '<i class="nav-dot"></i>' : ''}</button>`).join('');
}
function render() {
  if (!DB) return;
  keepAwake();
  applyTheme(); renderNav();
  const pg = PAGES.find(p => p[0] === route) || PAGES[0];
  // κρατάμε τη θέση του scroll όταν ξανασχεδιάζεται η ίδια σελίδα
  const main = $('.main'), st = main.dataset.route === route ? main.scrollTop : 0;
  $('#page').innerHTML = pg[2]();
  main.dataset.route = route; main.scrollTop = st;
}

// ---------- κουμπιά ----------
const actions = {
  go: el => go(el.dataset.page),
  'modal-close': () => closeModal(),
  'confirm-ok': () => { const f = pendingConfirm; pendingConfirm = null; closeModal(); if (f) f(); },
  // σήμερα / σώμα / νερό
  'profile-setup': () => openProfile(),
  'body-add': () => openBodyForm(),
  'body-del': el => confirmBox('Διαγραφή μέτρησης', `Να σβηστεί η μέτρηση της ${esc(shortDate(el.dataset.date))};`, 'Διαγραφή', () => { DB.body = DB.body.filter(b => b.date !== el.dataset.date); save(); render(); }),
  'water-set': el => { DB.water[today()] = +el.dataset.n; save(); render(); },
  'water-step': el => { const k = el.dataset.date; DB.water[k] = Math.max(0, (DB.water[k] || 0) + +el.dataset.n); save(); render(); },
  // προπόνηση
  'workout-tab': el => { workoutTab = el.dataset.k; render(); },
  'workout-start': () => startWorkout(),
  'workout-finish': () => finishWorkout(),
  'workout-cancel': () => confirmBox('Ακύρωση προπόνησης', 'Θα χαθούν τα σετ που έγραψες σε αυτή την προπόνηση.', 'Ακύρωση προπόνησης', () => { DB.active = null; restEnd = null; save(); render(); }),
  'set-done': el => setDone(+el.dataset.ei, +el.dataset.si),
  'set-add': el => { const e = DB.active.ex[+el.dataset.ei], l = e.sets[e.sets.length - 1]; e.sets.push({ kg: l ? l.kg : '', reps: l ? l.reps : e.target.reps, done: false }); save(); render(); },
  'set-remove': el => { const e = DB.active.ex[+el.dataset.ei]; if (e.sets.length > 1) e.sets.pop(); save(); render(); },
  'rest-skip': () => { restEnd = null; tick(); },
  'rest-add': () => { if (restEnd) { restEnd += 15000; restTotal += 15; tick(); } },
  'tip-toggle': el => { const id = el.dataset.id; openTips.has(id) ? openTips.delete(id) : openTips.add(id); render(); },
  'day-toggle': el => { const d = +el.dataset.d, days = DB.program.days; DB.program.days = days.includes(d) ? days.filter(x => x !== d) : [...days, d].sort(); save(); render(); },
  'ex-edit': el => editExercise(el.dataset.id),
  'ex-move': el => { const i = +el.dataset.i, a = DB.program.exercises; if (i > 0) { [a[i - 1], a[i]] = [a[i], a[i - 1]]; save(); render(); } },
  'ex-delete': el => { const id = el.dataset.id; closeModal(); confirmBox('Διαγραφή άσκησης', 'Η άσκηση φεύγει από το πρόγραμμα. Οι παλιές προπονήσεις μένουν στο ιστορικό.', 'Διαγραφή', () => { DB.program.exercises = DB.program.exercises.filter(e => e.id !== id); save(); render(); }); },
  'session-open': el => sessionDetail(el.dataset.id),
  'session-delete': el => { const id = el.dataset.id; closeModal(); confirmBox('Διαγραφή προπόνησης', 'Να σβηστεί αυτή η προπόνηση από το ιστορικό;', 'Διαγραφή', () => { DB.sessions = DB.sessions.filter(s => s.id !== id); save(); render(); }); },
  // διατροφή
  'food-tab': el => { foodTab = el.dataset.k; render(); },
  'food-day': el => { const k = addDays(foodDate || today(), +el.dataset.n); foodDate = k > today() ? today() : k; render(); },
  'food-add': el => openFoodPicker(el.dataset.date, el.dataset.meal),
  'food-del': el => { const k = el.dataset.date; DB.food[k] = (DB.food[k] || []).filter(f => f.id !== el.dataset.id); if (!DB.food[k].length) delete DB.food[k]; save(); render(); },
  'pick-meal': el => { pick.meal = el.dataset.m; renderPicker(); },
  'pick-cat': el => { pick.cat = el.dataset.k; renderPicker(); },
  'pick-qty': el => { pick.qty = +el.dataset.v; renderPicker(); },
  'pick-food': el => {
    const f = (el.dataset.id && allFoods().find(x => x.id === el.dataset.id)) || recentFoods().find(x => x.name === el.dataset.name);
    if (f) { addFood(f, pick.qty); closeModal(); }
  },
  // λίστα
  'shop-toggle': el => { const i = DB.shop.find(x => x.id === el.dataset.id); if (i) i.done = !i.done; save(); render(); },
  'shop-del': el => { DB.shop = DB.shop.filter(x => x.id !== el.dataset.id); save(); render(); },
  'shop-reset': () => { DB.shop.forEach(i => { i.done = false; }); save(); render(); },
  'shop-clear': () => { DB.shop = DB.shop.filter(i => !i.done); save(); render(); },
  // ρυθμίσεις
  theme: el => { DB.settings.theme = el.dataset.v; save(); render(); },
  'data-folder': () => window.gymtrack.openFolder(),
  'data-move': async () => { const r = await window.gymtrack.chooseFolder(); if (r && r.changed) { await persist(); appInfo = null; DB = await loadData(); render(); toast(`${icon('check')} Ο φάκελος άλλαξε`); } },
  'data-export': async () => { await persist(); const r = await window.gymtrack.saveAs(JSON.stringify(DB, null, 1), `GymTrack-${today()}.json`, 'json'); if (r && r.ok) toast(`${icon('check')} Αποθηκεύτηκε`); },
  'data-import': async () => {
    const r = await window.gymtrack.importFile(); if (!r) return;
    if (r.error) { toast(esc(r.error), 'bad'); return; }
    confirmBox('Άνοιγμα αρχείου', `Τα τωρινά δεδομένα θα αντικατασταθούν με αυτά του «${esc(r.name)}». Πριν, κρατιέται αντίγραφο της ημέρας.`, 'Αντικατάσταση', () => { DB = normalize(r.data); save(); render(); toast(`${icon('check')} Άνοιξε το αρχείο`); });
  },
  'backup-choose': async el => { const r = await window.gymtrack.backupChoose(el.dataset.k); backupInfo = r.status; render(); if (r.ok) toast(`${icon('check')} Το αντίγραφο έγινε`); else if (r.error) toast(esc(r.error), 'bad'); },
  'backup-now': async el => { const r = await window.gymtrack.backupNow(el.dataset.k); backupInfo = r.status; render(); toast(r.ok ? `${icon('check')} Το αντίγραφο έγινε` : esc(r.error), r.ok ? '' : 'bad'); },
  'backup-remove': async el => { backupInfo = await window.gymtrack.backupRemove(el.dataset.k); render(); },
  'web-export': () => webExport(),
  'web-import': () => webImport(),
  'web-reload': () => { persist().then(() => location.reload()); },
  'update-check': () => window.gymtrack.checkUpdates(),
  'update-log': () => window.gymtrack.openUpdateLog(),
  'update-now': () => askUpdate(),
  'update-later': () => { updLater = true; updBanner(''); },
  'reset-all': () => confirmBox('Διαγραφή όλων', 'Όλες οι προπονήσεις, τα φαγητά και οι μετρήσεις θα σβηστούν. Δεν γίνεται αναίρεση (υπάρχει μόνο το αντίγραφο της ημέρας).', 'Διαγραφή όλων', () => { const theme = DB.settings.theme; DB = freshData(); DB.settings.theme = theme; save(); go('today'); })
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-action]');
  if (!el) { if (e.target.id === 'modal') closeModal(); return; }
  if (el.disabled) return;
  const fn = actions[el.dataset.action];
  if (fn) { e.preventDefault(); fn(el); }
});
document.addEventListener('submit', e => {
  const form = e.target.closest('form[data-form]'); if (!form) return;
  e.preventDefault();
  const kind = form.dataset.form;
  if (kind === 'exercise') saveExercise(form);
  else if (kind === 'body') saveBody(form);
  else if (kind === 'profile') saveProfile(form);
  else if (kind === 'custom-food') {
    const f = new FormData(form), name = String(f.get('name')).trim(), kcal = num(f.get('kcal')), p = num(f.get('p')) || 0;
    if (!name || kcal == null || kcal < 0 || kcal > 5000) { toast('Γράψε όνομα και θερμίδες.', 'bad'); return; }
    if (f.get('keep') && !DB.myFoods.some(x => x.name === name)) DB.myFoods.push({ id: 'm' + uid(), name, kcal, p, portion: '1 μερίδα' });
    addFood({ name, kcal, p, portion: '1 μερίδα' }, pick.qty); closeModal();
  } else if (kind === 'shop-add') {
    const f = new FormData(form), name = String(f.get('name')).trim(); if (!name) return;
    DB.shop.push({ id: uid(), name, cat: f.get('cat') || 'Άλλα', done: false }); save(); render();
    const i = $('form[data-form="shop-add"] input[name="name"]'); if (i) i.focus();
  }
});
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.set && DB.active) {
    const s = DB.active.ex[+el.dataset.ei].sets[+el.dataset.si];
    s[el.dataset.set] = el.value.replace(/[^\d.,]/g, '');
    if (el.dataset.set === 'kg') s.edited = true;
    save();
  } else if (el.dataset.field === 'pick-q') { pick.q = el.value; renderPicker(); }
  else if (el.closest('form[data-form="profile"]')) previewTargets(el.closest('form'));
});
document.addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.field === 'rest') { DB.program.rest = +el.value; save(); }
  else if (el.dataset.field === 'prog-ex') { progEx = el.value; render(); }
  // οι επιλογές με κουκκίδα (radio) δείχνουν ποια είναι διαλεγμένη
  if (el.type === 'radio') { $$(`input[name="${el.name}"]`, el.form).forEach(r => r.closest('label').classList.toggle('on', r.checked)); if (el.form && el.form.dataset.form === 'profile') previewTargets(el.form); }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModal();
  // Enter στα κιλά/επαναλήψεις: πάει στο επόμενο πεδίο
  if (e.key === 'Enter' && e.target.dataset.set) { e.preventDefault(); const ins = $$('.num-in'); const i = ins.indexOf(e.target); if (ins[i + 1]) ins[i + 1].focus(); else e.target.blur(); }
});

// ---------- εκκίνηση ----------
(async function init() {
  DB = await loadData();
  // αν άνοιξε η εφαρμογή σε άλλη μέρα από την προπόνηση που είχε μείνει ανοιχτή, μένει ανοιχτή: ο χρήστης αποφασίζει
  render();
  setInterval(tick, 1000);
  checkJustUpdated();
  setupWeb();
})();
