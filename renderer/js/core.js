'use strict';
// GymTrack · Βασικά: βοηθητικά, δεδομένα, αποθήκευση, υπολογισμοί
// (Τα αρχεία φορτώνονται με τη σειρά του index.html· μοιράζονται τις ίδιες μεταβλητές.)

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const num = v => { const n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return Number.isFinite(n) ? n : null; };
const round = (n, d = 0) => { const f = 10 ** d; return Math.round(n * f) / f; };
const fmt = (n, d = 0) => n == null ? '–' : round(n, d).toLocaleString('el-GR', { maximumFractionDigits: d });
const pad = n => String(n).padStart(2, '0');

// ---------- ημερομηνίες (πάντα τοπική ώρα, μορφή YYYY-MM-DD) ----------
const dkey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return dkey(d); };
const today = () => dkey();
const DAYS = ['Κυριακή', 'Δευτέρα', 'Τρίτη', 'Τετάρτη', 'Πέμπτη', 'Παρασκευή', 'Σάββατο'];
const DAYS_SHORT = ['Κυ', 'Δε', 'Τρ', 'Τε', 'Πε', 'Πα', 'Σα'];
const MONTHS_GEN = ['Ιανουαρίου', 'Φεβρουαρίου', 'Μαρτίου', 'Απριλίου', 'Μαΐου', 'Ιουνίου', 'Ιουλίου', 'Αυγούστου', 'Σεπτεμβρίου', 'Οκτωβρίου', 'Νοεμβρίου', 'Δεκεμβρίου'];
const MONTHS_SHORT = ['Ιαν', 'Φεβ', 'Μαρ', 'Απρ', 'Μαΐ', 'Ιουν', 'Ιουλ', 'Αυγ', 'Σεπ', 'Οκτ', 'Νοε', 'Δεκ'];
const longDate = k => { const d = parseKey(k); return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`; };
const shortDate = k => { const d = parseKey(k); return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`; };
const weekStart = k => { const d = parseKey(k); const w = (d.getDay() + 6) % 7; d.setDate(d.getDate() - w); return dkey(d); }; // Δευτέρα
const mmss = s => `${Math.floor(s / 60)}:${pad(Math.floor(s % 60))}`;

// ---------- δεδομένα ----------
const VERSION = 1;
function freshData() {
  return {
    version: VERSION,
    profile: { name: '', sex: 'm', age: 25, height: null, activity: 1.55, goal: 'cut', manual: null },
    program: { rest: 90 },
    workouts: [workoutFromTemplate('full', [1, 3, 5])],   // οι προπονήσεις μου (τίτλος, μέρες, ασκήσεις)
    customExercises: [],   // δικές μου ασκήσεις, εκτός από τις 50 έτοιμες
    sessions: [],          // ολοκληρωμένες προπονήσεις
    active: null,          // προπόνηση σε εξέλιξη
    food: {},              // { 'YYYY-MM-DD': [ {id,name,kcal,p,meal,qty} ] }
    water: {},             // { 'YYYY-MM-DD': ποτήρια }
    myFoods: [],           // δικά μου τρόφιμα
    body: [],              // ζυγίσεις { date, weight, waist }
    shop: DEFAULT_SHOP.map(([name, cat]) => ({ id: uid(), name, cat, done: false })),
    settings: { theme: 'dark', waterGoal: 8 }
  };
}
// συμπληρώνει ό,τι λείπει (π.χ. από παλιότερη έκδοση ή χαλασμένο αρχείο)
function normalize(d) {
  const f = freshData();
  if (!d || typeof d !== 'object') return f;
  const out = { ...f, ...d };
  out.profile = { ...f.profile, ...(d.profile || {}) };
  out.program = { rest: (d.program && +d.program.rest) || 90 };
  if (!Array.isArray(out.customExercises)) out.customExercises = [];
  // Παλιά έκδοση: ένα μόνο πρόγραμμα. Γίνεται η προπόνηση «Όλο το σώμα», και ό,τι άσκηση
  // είχε προστεθεί με το χέρι μπαίνει στις «δικές μου».
  if (!Array.isArray(d.workouts)) {
    const old = d.program && Array.isArray(d.program.exercises) && d.program.exercises.length ? d.program.exercises : null;
    if (old) {
      const items = [];
      for (const e of old) {
        if (!e || !e.id) continue;
        if (!EXERCISES.some(x => x.id === e.id) && !out.customExercises.some(x => x.id === e.id))
          out.customExercises.push({ id: e.id, group: 'Άλλο', name: String(e.name || 'Άσκηση'), kind: e.kind || 'weight', sets: +e.sets || 3, reps: +e.reps || 10, tip: e.tip || '' });
        items.push({ id: e.id, sets: +e.sets || 3, reps: +e.reps || 10 });
      }
      out.workouts = [{ id: 'w' + uid(), name: 'Όλο το σώμα', days: Array.isArray(d.program.days) ? d.program.days : [1, 3, 5], items }];
    } else out.workouts = f.workouts;
  }
  out.workouts = out.workouts.filter(w => w && typeof w === 'object').map(w => ({
    id: w.id || 'w' + uid(), name: String(w.name || 'Προπόνηση'),
    days: Array.isArray(w.days) ? w.days.filter(x => x >= 0 && x <= 6) : [],
    items: Array.isArray(w.items) ? w.items.filter(i => i && i.id).map(i => ({ id: i.id, sets: Math.max(1, +i.sets || 3), reps: Math.max(1, +i.reps || 10) })) : []
  }));
  out.settings = { ...f.settings, ...(d.settings || {}) };
  for (const k of ['sessions', 'myFoods', 'body', 'shop']) if (!Array.isArray(out[k])) out[k] = f[k];
  for (const k of ['food', 'water']) if (!out[k] || typeof out[k] !== 'object' || Array.isArray(out[k])) out[k] = {};
  out.version = VERSION;
  return out;
}

let DB = null;
const isApp = () => !!window.gymtrack;
const LS_KEY = 'gymtrack-data';
async function loadData() {
  if (isApp()) {
    const r = await window.gymtrack.load();
    if (r && r.error) toast(r.error, 'bad');
    return normalize(r && r.data);
  }
  try { return normalize(JSON.parse(localStorage.getItem(LS_KEY))); } catch { return freshData(); }
}
let saveTimer = null, saving = Promise.resolve();
function save() { clearTimeout(saveTimer); saveTimer = setTimeout(persist, 300); }
function persist() {
  clearTimeout(saveTimer); saveTimer = null;
  const text = JSON.stringify(DB, null, 1);
  // στο κινητό η αποθήκευση γίνεται αμέσως (το iPhone μπορεί να «παγώσει» τη σελίδα μόλις φύγεις)
  if (!isApp()) {
    try { localStorage.setItem(LS_KEY, text); } catch { toast('Δεν χωράει άλλο στη μνήμη του browser. Κάνε αντίγραφο από τις Ρυθμίσεις.', 'bad'); }
    return Promise.resolve();
  }
  saving = saving.then(async () => {
    if (isApp()) { const r = await window.gymtrack.save(text); if (!r || !r.ok) toast('Δεν αποθηκεύτηκε. Δοκιμάζω ξανά…', 'bad'); }
    else { try { localStorage.setItem(LS_KEY, text); } catch { /* ο browser δεν επιτρέπει αποθήκευση */ } }
  }).catch(e => toast('Δεν αποθηκεύτηκε: ' + e.message, 'bad'));
  return saving;
}
window.addEventListener('beforeunload', () => { if (saveTimer) persist(); });
window.addEventListener('pagehide', () => { if (saveTimer) persist(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && saveTimer) persist(); });

// ---------- υπολογισμοί διατροφής ----------
function latestBody() { return [...DB.body].sort((a, b) => a.date.localeCompare(b.date)).filter(b => b.weight).pop() || null; }
function currentWeight() { const b = latestBody(); return b ? b.weight : null; }
// Mifflin–St Jeor
function bmr({ sex, weight, height, age }) {
  if (!weight || !height || !age) return null;
  return 10 * weight + 6.25 * height - 5 * age + (sex === 'f' ? -161 : 5);
}
function targets(profile = DB.profile, weight = currentWeight()) {
  const b = bmr({ ...profile, weight });
  const goal = GOALS.find(g => g.v === profile.goal) || GOALS[0];
  const auto = b ? {
    bmr: Math.round(b),
    tdee: Math.round(b * (profile.activity || 1.55)),
    kcal: Math.round((b * (profile.activity || 1.55) + goal.delta) / 10) * 10,
    p: Math.round(weight * (goal.v === 'bulk' ? 1.8 : 2.0) / 5) * 5
  } : null;
  const m = profile.manual || {};
  return {
    ready: !!auto || !!(m.kcal && m.p),
    auto,
    kcal: m.kcal || (auto && auto.kcal) || null,
    p: m.p || (auto && auto.p) || null,
    manual: !!(m.kcal || m.p)
  };
}
function dayFood(k) { return DB.food[k] || []; }
function dayTotals(k) {
  return dayFood(k).reduce((t, f) => ({ kcal: t.kcal + f.kcal * (f.qty || 1), p: t.p + f.p * (f.qty || 1) }), { kcal: 0, p: 0 });
}

// ---------- υπολογισμοί προπόνησης ----------
// ---------- ασκήσεις και προπονήσεις ----------
const allExercises = () => [...EXERCISES, ...((DB && DB.customExercises) || [])];
const exById = id => allExercises().find(e => e.id === id) || null;
// μια άσκηση μέσα σε προπόνηση: ο ορισμός της + τα σετ/επαναλήψεις αυτής της προπόνησης
function itemDef(it) {
  const e = exById(it.id) || { id: it.id, name: it.id, kind: 'weight', group: 'Άλλο' };
  return { ...e, sets: it.sets || e.sets, reps: it.reps || e.reps };
}
function workoutFromTemplate(tid, days = []) {
  const t = TEMPLATES.find(x => x.id === tid);
  return { id: 'w' + uid(), name: t ? t.name : 'Νέα προπόνηση', days, items: t ? t.items.map(id => { const e = EXERCISES.find(x => x.id === id); return { id, sets: e.sets, reps: e.reps }; }) : [] };
}
const workoutById = id => DB.workouts.find(w => w.id === id) || null;
// προπονήσεις προγραμματισμένες για μια μέρα
const workoutsFor = (k = today()) => DB.workouts.filter(w => w.days.includes(parseKey(k).getDay()));
// πόσες προπονήσεις την εβδομάδα (οι διαφορετικές μέρες του προγράμματος)
const weekGoal = () => Math.max(1, new Set(DB.workouts.flatMap(w => w.days)).size);
const doneSets = ex => (ex.sets || []).filter(s => s.done);
function sessionVolume(s) {
  let v = 0;
  for (const ex of s.ex) if (ex.kind === 'weight') for (const st of doneSets(ex)) v += (num(st.kg) || 0) * (num(st.reps) || 0);
  return Math.round(v);
}
// η προηγούμενη φορά που έγινε η άσκηση
function lastFor(exId, beforeDate) {
  const list = DB.sessions.filter(s => !beforeDate || s.date <= beforeDate).sort((a, b) => (b.end || 0) - (a.end || 0));
  for (const s of list) { const e = s.ex.find(x => x.id === exId); if (e && doneSets(e).length) return { date: s.date, sets: doneSets(e) }; }
  return null;
}
function bestKg(exId) {
  let best = null;
  for (const s of DB.sessions) for (const e of s.ex) if (e.id === exId) for (const st of doneSets(e)) { const k = num(st.kg); if (k != null && (best == null || k > best)) best = k; }
  return best;
}
// Πρόταση: αν την προηγούμενη φορά έβγαλε όλα τα σετ με τις επαναλήψεις του στόχου, ανεβαίνει το βάρος
function suggestion(ex) {
  const last = lastFor(ex.id);
  if (!last || ex.kind !== 'weight') return null;
  const kg = Math.max(...last.sets.map(s => num(s.kg) || 0));
  const allHit = last.sets.length >= ex.sets && last.sets.every(s => (num(s.reps) || 0) >= ex.reps);
  if (!kg) return null;
  return allHit ? { up: true, kg: round(kg + (kg < 20 ? 1 : 2.5), 1), text: `Την προηγούμενη έβγαλες όλα τα σετ. Δοκίμασε ${fmt(kg + (kg < 20 ? 1 : 2.5), 1)} kg.` }
    : { up: false, kg, text: `Μείνε στα ${fmt(kg, 1)} kg μέχρι να βγάλεις ${ex.sets}×${ex.reps}.` };
}
function weekSessions(k = today()) { const s = weekStart(k), e = addDays(s, 6); return DB.sessions.filter(x => x.date >= s && x.date <= e); }
function streakWeeks() {
  // συνεχόμενες εβδομάδες (μέχρι την προηγούμενη) με τουλάχιστον όσες προπονήσεις έχει το πρόγραμμα
  const goal = weekGoal();
  let n = 0, k = addDays(weekStart(today()), -7);
  while (weekSessions(k).length >= goal) { n++; k = addDays(k, -7); }
  if (weekSessions().length >= goal) n++;
  return n;
}
const isTrainingDay = (k = today()) => workoutsFor(k).length > 0;
