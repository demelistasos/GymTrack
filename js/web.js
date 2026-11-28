'use strict';
// GymTrack · Έκδοση για κινητό (web app): λειτουργία χωρίς internet, νέες εκδόσεις,
// αντίγραφο σε αρχείο, οθόνη που δεν σβήνει στην προπόνηση, ήχος στο iPhone.
// Στην εφαρμογή για υπολογιστή (Electron) τίποτα από αυτά δεν τρέχει.

const WEB_VERSION = '9 · 28/11/2026'; // το βάζει το GitHub κατά τη δημοσίευση
const isWeb = () => !isApp() && /^https?:$/.test(location.protocol);
const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const webVersion = () => WEB_VERSION.startsWith('__') ? 'δοκιμαστική' : WEB_VERSION;

// ---------- χωρίς internet + νέες εκδόσεις ----------
let webUpdateReady = false;
function setupWeb() {
  if (!isWeb()) return;
  // ζητάμε από τον browser να μη σβήνει τα δεδομένα όταν γεμίσει ο χώρος
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch { /* τίποτα */ }
  if (!('serviceWorker' in navigator)) return;
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.register('sw.js').then(reg => {
    // έλεγχος για νέα έκδοση όποτε ξανανοίγει η εφαρμογή
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
  }).catch(() => { /* χωρίς λειτουργία offline */ });
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || webUpdateReady) return;
    webUpdateReady = true;
    updBanner(`${icon('bolt')}<span class="grow">Υπάρχει νέα έκδοση του GymTrack.</span><button class="btn small primary" data-action="web-reload">Άνοιγμα νέας έκδοσης</button><button class="icon-btn sm" data-action="update-later" aria-label="Κλείσιμο">${icon('x')}</button>`);
  });
}

// ---------- αντίγραφο ασφαλείας σε αρχείο ----------
async function webExport() {
  await persist();
  const name = `GymTrack-${today()}.json`;
  const text = JSON.stringify(DB, null, 1);
  const file = new File([text], name, { type: 'application/json' });
  const done = () => { DB.settings.lastBackup = today(); save(); render(); };
  // στο iPhone ανοίγει το «Κοινοποίηση»: «Αποθήκευση στα Αρχεία» ή αποστολή στον εαυτό σου
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Αντίγραφο GymTrack' }); done(); toast(`${icon('check')} Το αντίγραφο έγινε`); }
    catch (e) { if (e && e.name !== 'AbortError') toast('Δεν έγινε το αντίγραφο.', 'bad'); }
    return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  done(); toast(`${icon('check')} Κατέβηκε το ${esc(name)}`);
}
function webImport() {
  const inp = document.createElement('input');
  inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = async () => {
    const f = inp.files && inp.files[0]; if (!f) return;
    let data;
    try { data = JSON.parse(await f.text()); } catch { toast('Το αρχείο δεν είναι αντίγραφο του GymTrack.', 'bad'); return; }
    if (!data || typeof data !== 'object' || !('profile' in data || 'sessions' in data)) { toast('Το αρχείο δεν είναι αντίγραφο του GymTrack.', 'bad'); return; }
    confirmBox('Άνοιγμα αντιγράφου', `Τα τωρινά δεδομένα θα αντικατασταθούν με αυτά του «${esc(f.name)}».`, 'Αντικατάσταση', () => { DB = normalize(data); save(); render(); toast(`${icon('check')} Άνοιξε το αντίγραφο`); });
  };
  inp.click();
}
// υπενθύμιση: στο κινητό τα δεδομένα είναι μόνο εκεί
function backupDue() {
  if (!isWeb()) return false;
  const has = DB.sessions.length || Object.keys(DB.food).length || DB.body.length;
  if (!has) return false;
  const last = DB.settings.lastBackup;
  return !last || last <= addDays(today(), -7);
}

// ---------- η οθόνη να μη σβήνει όσο γίνεται προπόνηση ----------
let wakeLock = null;
async function keepAwake() {
  const want = !!(DB && DB.active) && document.visibilityState === 'visible';
  try {
    if (want && !wakeLock && navigator.wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); }
    else if (!want && wakeLock) { await wakeLock.release(); wakeLock = null; }
  } catch { wakeLock = null; }
}
document.addEventListener('visibilitychange', () => keepAwake());

// ---------- έλεγχος οθόνης (για να βρίσκουμε προβλήματα σε κάθε κινητό) ----------
function screenReport() {
  const probe = css => { const d = document.createElement('div'); d.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;' + css; document.body.appendChild(d); const h = d.getBoundingClientRect().height; d.remove(); return Math.round(h); };
  const r = sel => { const e = $(sel); if (!e) return '–'; const b = e.getBoundingClientRect(); return `${Math.round(b.top)}→${Math.round(b.bottom)}`; };
  const vv = window.visualViewport;
  const rows = [
    ['Οθόνη (screen)', `${screen.width} × ${screen.height}`],
    ['Ορατό (inner)', `${innerWidth} × ${innerHeight}`],
    ['clientHeight', document.documentElement.clientHeight],
    ['visualViewport', vv ? `${Math.round(vv.width)} × ${Math.round(vv.height)} (+${Math.round(vv.offsetTop)})` : '–'],
    ['100vh / dvh / lvh / svh', `${probe('height:100vh')} / ${probe('height:100dvh')} / ${probe('height:100lvh')} / ${probe('height:100svh')}`],
    ['Ασφαλή περιθώρια π/κ', `${probe('height:env(safe-area-inset-top)')} / ${probe('height:env(safe-area-inset-bottom)')}`],
    ['Αρχική οθόνη', `${isStandalone() ? 'ναι' : 'όχι'} (standalone ${navigator.standalone === true ? 'ναι' : 'όχι'})`],
    ['Εφαρμογή (app)', r('.app')],
    ['Μενού (side)', r('.side')],
    ['Κλάσεις', document.documentElement.className || '–'],
    ['Pixel ratio', devicePixelRatio],
    ['Browser', navigator.userAgent.replace(/^Mozilla\/5\.0 /, '')]
  ];
  return rows;
}
function openScreenReport() {
  const rows = screenReport();
  const text = rows.map(([a, b]) => `${a}: ${b}`).join('\n');
  openModal('Έλεγχος οθόνης', `<p class="muted small">Βγάλε screenshot αυτό το παράθυρο και στείλ' το, για να προσαρμοστεί η εφαρμογή στο κινητό σου.</p>
    <div class="list">${rows.map(([a, b]) => `<div class="kv"><span>${esc(a)}</span><b style="text-align:right;word-break:break-word">${esc(b)}</b></div>`).join('')}</div>
    <button class="btn ghost block" data-action="copy-report" data-text="${esc(text)}">Αντιγραφή</button>`);
}

// ---------- ήχος: το iPhone παίζει ήχο μόνο αν «ξεκλειδωθεί» με άγγιγμα ----------
let audioCtx = null;
function unlockAudio() {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
  } catch { audioCtx = null; }
}
document.addEventListener('pointerdown', unlockAudio, { passive: true });
