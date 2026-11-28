'use strict';
// GymTrack · Προπόνηση: οι προπονήσεις μου (τίτλος + ασκήσεις), βιβλιοθήκη ασκήσεων,
// προπόνηση σε εξέλιξη (σετ / επαναλήψεις / κιλά), ιστορικό

let workoutTab = 'plans';          // plans | library | history
let restEnd = null, restTotal = 0;
let openTips = new Set();
let libGroup = '', libQ = '';      // φίλτρα βιβλιοθήκης
let wEdit = null;                  // η προπόνηση που φτιάχνεται / αλλάζει
let exPick = null;                 // επιλογή ασκήσεων: { mode: 'editor' | 'session', group, q }

const KIND_LABEL = { weight: 'κιλά × επαναλήψεις', reps: 'επαναλήψεις', time: 'χρόνος', cardio: 'αερόβιο' };
const repUnit = ex => ex.kind === 'time' ? 'δευτ.' : ex.kind === 'cardio' ? 'λεπτά' : 'επαν.';
const shortName = n => String(n).split(' (')[0];
const daysText = days => days.length ? [1, 2, 3, 4, 5, 6, 0].filter(d => days.includes(d)).map(d => DAYS_SHORT[d]).join(' · ') : 'χωρίς σταθερή μέρα';

function pageWorkout() {
  if (DB.active) return activeSession();
  const tabs = [['plans', 'Προπονήσεις'], ['library', 'Ασκήσεις'], ['history', 'Ιστορικό']];
  const title = { plans: 'Οι προπονήσεις σου', library: 'Ασκήσεις', history: 'Ιστορικό' }[workoutTab];
  const btn = workoutTab === 'plans' ? `<button class="btn primary" data-action="workout-new">${icon('plus')} Νέα προπόνηση</button>`
    : workoutTab === 'library' ? `<button class="btn primary" data-action="ex-edit" data-id="">${icon('plus')} Δική μου άσκηση</button>` : '';
  return `<header class="page-head"><div><p class="eyebrow">Προπόνηση</p><h1>${title}</h1></div>${btn}</header>
    <div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${workoutTab === k ? 'on' : ''}" data-action="workout-tab" data-k="${k}">${l}</button>`).join('')}</div>
    ${workoutTab === 'plans' ? plansView() : workoutTab === 'library' ? libraryView() : historyView()}`;
}

// ---------- οι προπονήσεις μου ----------
function plansView() {
  const list = DB.workouts;
  const cards = list.length ? list.map(w => {
    const items = w.items.map(itemDef);
    const last = [...DB.sessions].filter(s => s.wid === w.id).sort((a, b) => (b.end || 0) - (a.end || 0))[0];
    return `<div class="card plan-card">
      <div class="card-head"><div class="grow"><h3>${esc(w.name)}</h3><span class="muted small">${daysText(w.days)} · ${items.length} ασκήσεις${last ? ` · τελευταία φορά ${shortDate(last.date)}` : ''}</span></div>
        <button class="icon-btn" data-action="workout-edit" data-id="${w.id}" aria-label="Αλλαγή">${icon('edit')}</button></div>
      <div class="set-chips">${items.map(e => `<span class="set-chip">${esc(shortName(e.name))}</span>`).join('') || '<span class="muted small">Δεν έχει ασκήσεις ακόμα.</span>'}</div>
      <button class="btn primary" data-action="workout-start" data-id="${w.id}" ${items.length ? '' : 'disabled'}>${icon('play')} Έναρξη</button>
    </div>`;
  }).join('') : `<div class="empty">${icon('workout')}<h3>Καμία προπόνηση ακόμα</h3><p class="muted">Φτιάξε την πρώτη σου: δώσε τίτλο και διάλεξε ασκήσεις.</p><button class="btn primary" data-action="workout-new">${icon('plus')} Νέα προπόνηση</button></div>`;
  return `<div class="grid two-col plans">${cards}</div>
    <div class="row gap wrap">
      <label class="inline-field">Ξεκούραση ανάμεσα στα σετ
        <select data-field="rest">${[60, 90, 120, 150, 180].map(s => `<option value="${s}" ${DB.program.rest === s ? 'selected' : ''}>${mmss(s)}</option>`).join('')}</select></label>
    </div>
    <div class="card rules">
      <h3>Βασικοί κανόνες</h3>
      <ul>
        <li>Διάλεξε βάρος που σου αφήνει <b>2–3 επαναλήψεις «στην άκρη»</b>. Όχι μέχρι εξάντλησης.</li>
        <li>Όταν βγάζεις άνετα όλα τα σετ, <b>ανέβασε λίγο το βάρος</b>. Η εφαρμογή σού το θυμίζει.</li>
        <li>Για <b>upper / lower</b>: φτιάξε δύο προπονήσεις (υπάρχουν έτοιμες) και βάλε σε καθεμία τις μέρες της.</li>
        <li>Αν δεν ξέρεις μια άσκηση, δες πώς γίνεται στις «Ασκήσεις» ή ζήτα από τον γυμναστή να σου τη δείξει.</li>
      </ul>
    </div>`;
}

// ---------- φτιάξιμο / αλλαγή προπόνησης ----------
function openWorkoutEditor(id) {
  exPick = null;
  if (id) { const w = workoutById(id); if (!w) return; wEdit = JSON.parse(JSON.stringify(w)); wEdit.isNew = false; }
  else wEdit = { id: 'w' + uid(), name: '', days: [], items: [], isNew: true, choosing: true };
  renderEditor(true);
}
function setModal(title, body, first, keepScrollSel) {
  if (first || !$('#modal').classList.contains('open')) { openModal(title, body, { wide: true, onClose: () => { wEdit = null; exPick = null; } }); return; }
  const sc = keepScrollSel ? ($(keepScrollSel) || {}).scrollTop || 0 : 0;
  $('#modal .sheet-head h2').innerHTML = title;
  $('#modal .sheet-body').innerHTML = body;
  if (keepScrollSel && $(keepScrollSel)) $(keepScrollSel).scrollTop = sc;
}
function renderEditor(first) {
  if (exPick && exPick.mode === 'editor') { setModal('Διάλεξε ασκήσεις', pickerBody(), first, '.ex-pick-list'); return; }
  const w = wEdit;
  if (w.choosing) {
    setModal('Νέα προπόνηση', `<p class="muted">Ξεκίνα από έτοιμη προπόνηση και άλλαξέ την όπως θέλεις, ή φτιάξε μία από την αρχή.</p>
      <div class="tpl-grid">${TEMPLATES.map(t => `<button class="tpl" data-action="w-tpl" data-t="${t.id}"><b>${esc(t.name)}</b><span>${esc(t.hint)}</span><small>${t.items.length} ασκήσεις</small></button>`).join('')}
        <button class="tpl blank" data-action="w-tpl" data-t=""><b>${icon('plus')} Από την αρχή</b><span>Κενή προπόνηση, διαλέγεις εσύ τις ασκήσεις</span></button></div>`, first);
    return;
  }
  const body = `<div class="form">
      <label>Τίτλος<input data-field="w-name" value="${esc(w.name)}" placeholder="π.χ. Upper A, Πόδια, Full body" maxlength="40"></label>
      <fieldset><legend>Ποιες μέρες (προαιρετικό)</legend>
        <div class="chips days">${[1, 2, 3, 4, 5, 6, 0].map(d => `<button type="button" class="chip ${w.days.includes(d) ? 'on' : ''}" data-action="w-day" data-d="${d}">${DAYS_SHORT[d]}</button>`).join('')}</div></fieldset>
    </div>
    <div class="ed-head"><b>Ασκήσεις (${w.items.length})</b><span class="muted small">σετ × επαναλήψεις</span></div>
    <div class="ed-list">${w.items.map((it, i) => {
      const e = itemDef(it);
      return `<div class="ed-row">
        <span class="ex-num">${i + 1}</span>
        <div class="grow"><b>${esc(e.name)}</b><span class="muted small">${esc(e.group || '')}</span></div>
        <div class="stepper-sm"><button type="button" class="icon-btn sm" data-action="w-num" data-i="${i}" data-f="sets" data-n="-1" aria-label="Λιγότερα σετ">${icon('minus')}</button><b>${it.sets}</b><button type="button" class="icon-btn sm" data-action="w-num" data-i="${i}" data-f="sets" data-n="1" aria-label="Περισσότερα σετ">${icon('plus')}</button></div>
        <span class="muted">×</span>
        <div class="stepper-sm"><button type="button" class="icon-btn sm" data-action="w-num" data-i="${i}" data-f="reps" data-n="-1" aria-label="Λιγότερες επαναλήψεις">${icon('minus')}</button><b>${it.reps}<small>${e.kind === 'time' ? '″' : e.kind === 'cardio' ? '′' : ''}</small></b><button type="button" class="icon-btn sm" data-action="w-num" data-i="${i}" data-f="reps" data-n="1" aria-label="Περισσότερες επαναλήψεις">${icon('plus')}</button></div>
        <div class="ed-act"><button type="button" class="icon-btn sm" data-action="w-up" data-i="${i}" ${i ? '' : 'disabled'} aria-label="Πάνω">${icon('up')}</button><button type="button" class="icon-btn sm" data-action="w-remove" data-i="${i}" aria-label="Αφαίρεση">${icon('x')}</button></div>
      </div>`;
    }).join('') || '<p class="muted center small">Δεν έχεις βάλει ασκήσεις ακόμα.</p>'}</div>
    <button class="add-line" data-action="w-add-ex">${icon('plus')} Πρόσθεσε ασκήσεις</button>
    <div class="row gap between">${!w.isNew ? `<button class="btn danger ghost" data-action="w-delete">${icon('trash')} Διαγραφή</button>` : '<span></span>'}
      <div class="row gap"><button class="btn ghost" data-action="modal-close">Άκυρο</button><button class="btn primary" data-action="w-save">Αποθήκευση</button></div></div>`;
  setModal(w.isNew ? 'Νέα προπόνηση' : 'Αλλαγή προπόνησης', body, first, '.ed-list');
}
function saveWorkout() {
  const w = wEdit; if (!w) return;
  const name = (w.name || '').trim();
  if (!name) { toast('Δώσε έναν τίτλο στην προπόνηση.', 'bad'); const i = $('[data-field="w-name"]'); if (i) i.focus(); return; }
  if (!w.items.length) { toast('Πρόσθεσε τουλάχιστον μία άσκηση.', 'bad'); return; }
  const clean = { id: w.id, name, days: [...w.days].sort(), items: w.items.map(i => ({ id: i.id, sets: i.sets, reps: i.reps })) };
  const idx = DB.workouts.findIndex(x => x.id === w.id);
  if (idx >= 0) DB.workouts[idx] = clean; else DB.workouts.push(clean);
  save(); closeModal(); render(); toast(`${icon('check')} Η προπόνηση «${esc(name)}» αποθηκεύτηκε`);
}

// ---------- επιλογή ασκήσεων (για προπόνηση ή μέσα στην προπόνηση) ----------
function filterExercises(group, q) {
  q = (q || '').trim().toLowerCase();
  return allExercises().filter(e => (!group || (e.group || 'Άλλο') === group) && (!q || e.name.toLowerCase().includes(q) || (e.group || '').toLowerCase().includes(q)));
}
function pickerBody() {
  const p = exPick;
  const chosen = p.mode === 'editor' ? new Set(wEdit.items.map(i => i.id)) : new Set(DB.active.ex.map(e => e.id));
  const list = filterExercises(p.group, p.q);
  const groups = GROUPS.filter(g => allExercises().some(e => (e.group || 'Άλλο') === g));
  return `<div class="picker">
    <label class="search">${icon('search')}<input data-field="ex-q" value="${esc(p.q)}" placeholder="Αναζήτηση άσκησης…"></label>
    <div class="chips scroll-x"><button class="chip ${!p.group ? 'on' : ''}" data-action="ex-group" data-g="">Όλες</button>${groups.map(g => `<button class="chip ${p.group === g ? 'on' : ''}" data-action="ex-group" data-g="${esc(g)}">${esc(g)}</button>`).join('')}</div>
    <div class="pick-list ex-pick-list">${list.map(e => `<button class="pick-item ${chosen.has(e.id) ? 'chosen' : ''}" data-action="pick-ex" data-id="${esc(e.id)}">
        <div class="grow"><b>${esc(e.name)}</b><span class="muted small">${esc(e.group || 'Άλλο')} · ${KIND_LABEL[e.kind] || ''}</span></div>
        <span class="pick-check">${icon(chosen.has(e.id) ? 'check' : 'plus')}</span></button>`).join('') || '<p class="muted center">Δεν βρέθηκε. Μπορείς να φτιάξεις δική σου άσκηση από την καρτέλα «Ασκήσεις».</p>'}</div>
    ${p.mode === 'editor' ? `<button class="btn primary block" data-action="w-pick-done">${icon('check')} Έτοιμο (${wEdit.items.length} ασκήσεις)</button>` : ''}
  </div>`;
}
function renderPickerOnly() {
  if (!exPick) return;
  if (exPick.mode === 'editor') { renderEditor(); return; }
  setModal('Πρόσθεσε άσκηση', pickerBody(), !$('#modal').classList.contains('open'), '.ex-pick-list');
}
function pickExercise(id) {
  const e = exById(id); if (!e) return;
  if (exPick.mode === 'editor') {
    const i = wEdit.items.findIndex(x => x.id === id);
    if (i >= 0) wEdit.items.splice(i, 1); else wEdit.items.push({ id, sets: e.sets || 3, reps: e.reps || 10 });
    renderEditor();
  } else {
    // μέσα σε προπόνηση: μπαίνει στο τέλος
    DB.active.ex.push(sessionEx({ id, sets: e.sets || 3, reps: e.reps || 10 }));
    save(); closeModal(); render();
    toast(`${icon('check')} Προστέθηκε: ${esc(shortName(e.name))}`);
  }
}

// ---------- βιβλιοθήκη ασκήσεων ----------
function libraryView() {
  const list = filterExercises(libGroup, libQ);
  const groups = GROUPS.filter(g => allExercises().some(e => (e.group || 'Άλλο') === g));
  const shown = groups.filter(g => list.some(e => (e.group || 'Άλλο') === g));
  return `<label class="search lib-search">${icon('search')}<input data-field="lib-q" value="${esc(libQ)}" placeholder="Αναζήτηση στις ${allExercises().length} ασκήσεις…"></label>
    <div class="chips scroll-x"><button class="chip ${!libGroup ? 'on' : ''}" data-action="lib-group" data-g="">Όλες</button>${groups.map(g => `<button class="chip ${libGroup === g ? 'on' : ''}" data-action="lib-group" data-g="${esc(g)}">${esc(g)}</button>`).join('')}</div>
    ${shown.length ? shown.map(g => `<div class="card lib-card"><h3>${esc(g)} <span class="muted small">${list.filter(e => (e.group || 'Άλλο') === g).length}</span></h3>
      ${list.filter(e => (e.group || 'Άλλο') === g).map(e => {
        const best = e.kind === 'weight' ? bestKg(e.id) : null, last = lastFor(e.id), custom = DB.customExercises.some(c => c.id === e.id);
        return `<div class="lib-row">
          <button class="lib-main" data-action="tip-toggle" data-id="${esc(e.id)}"><div class="grow"><b>${esc(e.name)}${custom ? ' <span class="good">δική μου</span>' : ''}</b>
            <span class="muted small">${e.sets} × ${e.reps} ${repUnit(e)}${best ? ` · ρεκόρ ${fmt(best, 1)} kg` : ''}${last ? ` · τελευταία ${shortDate(last.date)}` : ''}</span></div>${icon(openTips.has(e.id) ? 'up' : 'down', 'muted')}</button>
          ${custom ? `<button class="icon-btn sm" data-action="ex-edit" data-id="${esc(e.id)}" aria-label="Αλλαγή">${icon('edit')}</button>` : ''}
        </div>${openTips.has(e.id) ? `<p class="tip">${esc(e.tip || 'Δεν υπάρχει σημείωση.')}</p>` : ''}`;
      }).join('')}</div>`).join('') : '<div class="empty"><p class="muted">Δεν βρέθηκε άσκηση. Φτιάξε δική σου με το κουμπί πάνω.</p></div>'}`;
}

function historyView() {
  const list = [...DB.sessions].sort((a, b) => (b.end || 0) - (a.end || 0));
  if (!list.length) return `<div class="empty">${icon('workout')}<h3>Καμία προπόνηση ακόμα</h3><p class="muted">Μόλις ολοκληρώσεις την πρώτη, θα τη δεις εδώ.</p></div>`;
  return `<div class="list">${list.map(s => `<button class="card row-card" data-action="session-open" data-id="${s.id}">
      <div class="date-badge"><b>${parseKey(s.date).getDate()}</b><span>${MONTHS_SHORT[parseKey(s.date).getMonth()]}</span></div>
      <div class="grow"><h3>${esc(s.name || DAYS[parseKey(s.date).getDay()])}</h3><p class="muted small">${DAYS[parseKey(s.date).getDay()]} · ${Math.max(1, Math.round((s.end - s.start) / 60000))} λεπτά · ${s.ex.reduce((n, e) => n + doneSets(e).length, 0)} σετ · ${fmt(sessionVolume(s))} kg όγκος</p></div>
      ${icon('right', 'muted')}</button>`).join('')}</div>`;
}

function sessionDetail(id) {
  const s = DB.sessions.find(x => x.id === id); if (!s) return;
  openModal(`${esc(s.name || longDate(s.date))}`, `
    <p class="muted">${longDate(s.date)} · ${Math.max(1, Math.round((s.end - s.start) / 60000))} λεπτά · ${fmt(sessionVolume(s))} kg συνολικός όγκος</p>
    <div class="list">${s.ex.filter(e => doneSets(e).length).map(e => `<div class="detail-ex"><b>${esc(e.name)}</b>
      <div class="set-chips">${doneSets(e).map(st => `<span class="set-chip">${e.kind === 'weight' ? `${fmt(num(st.kg), 1)} kg × ${esc(st.reps)}` : `${esc(st.reps)} ${repUnit(e)}`}</span>`).join('')}</div></div>`).join('') || '<p class="muted">Δεν καταγράφηκαν σετ.</p>'}</div>
    <div class="row end gap"><button class="btn danger ghost" data-action="session-delete" data-id="${s.id}">${icon('trash')} Διαγραφή</button><button class="btn primary" data-action="modal-close">Εντάξει</button></div>`);
}

// ---------- προπόνηση σε εξέλιξη ----------
function sessionEx(it) {
  const e = itemDef(it), sg = suggestion(e), last = lastFor(e.id);
  const kg = sg ? sg.kg : last ? num(last.sets[0].kg) : '';
  return { id: e.id, name: e.name, kind: e.kind, target: { sets: e.sets, reps: e.reps },
    sets: Array.from({ length: e.sets }, () => ({ kg: e.kind === 'weight' ? (kg ?? '') : '', reps: e.reps, done: false })) };
}
function startWorkout(id) {
  if (DB.active) { go('workout'); return; }
  let w = id ? workoutById(id) : null;
  if (!w) {
    const todays = workoutsFor();
    if (todays.length === 1) w = todays[0];
    else if (DB.workouts.length === 1) w = DB.workouts[0];
  }
  if (!w) { chooseWorkout(); return; }
  DB.active = { id: uid(), wid: w.id, name: w.name, date: today(), start: Date.now(), ex: w.items.map(sessionEx) };
  closeModal(); save(); go('workout');
}
function chooseWorkout() {
  if (!DB.workouts.length) { workoutTab = 'plans'; go('workout'); openWorkoutEditor(null); return; }
  const todays = new Set(workoutsFor().map(w => w.id));
  openModal('Ποια προπόνηση;', `<div class="list">${DB.workouts.map(w => `<button class="card row-card" data-action="workout-start" data-id="${w.id}">
      <div class="grow"><h3>${esc(w.name)}${todays.has(w.id) ? ' <span class="good">σήμερα</span>' : ''}</h3><p class="muted small">${daysText(w.days)} · ${w.items.length} ασκήσεις</p></div>${icon('play', 'muted')}</button>`).join('')}</div>`);
}

function activeSession() {
  const a = DB.active;
  const done = a.ex.reduce((n, e) => n + doneSets(e).length, 0), all = a.ex.reduce((n, e) => n + e.sets.length, 0);
  return `<header class="page-head session-head">
      <div><p class="eyebrow"><span class="pill live-pill"><i class="dot"></i> ${esc(a.name || 'Σε εξέλιξη')}</span></p><h1 id="elapsed">${mmss((Date.now() - a.start) / 1000)}</h1></div>
      <div class="row gap"><button class="btn ghost" data-action="workout-cancel">Ακύρωση</button><button class="btn primary" data-action="workout-finish">${icon('check')} Τέλος</button></div>
    </header>
    <div class="progress-line">${bar(done, all)}<span class="muted small">${done}/${all} σετ</span></div>
    <div class="list">${a.ex.map((e, ei) => {
      const last = lastFor(e.id), sg = e.kind === 'weight' ? suggestion({ ...e, ...e.target }) : null;
      const complete = e.sets.length && e.sets.every(s => s.done);
      const w = e.kind === 'weight';
      return `<div class="card set-card ${complete ? 'complete' : ''}">
        <div class="card-head"><div><h3>${esc(e.name)}</h3>
          <p class="muted small">Στόχος ${e.target.sets} × ${e.target.reps} ${repUnit(e)}${last ? ` · προηγούμενη: ${esc(last.sets.map(s => w ? `${fmt(num(s.kg), 1)}×${s.reps}` : s.reps).join(', '))}` : ''}</p></div>
          ${complete ? `<span class="pill ok">${icon('check')}</span>` : `<button class="icon-btn sm" data-action="tip-toggle" data-id="${esc(e.id)}" aria-label="Πώς γίνεται">${icon('info')}</button>`}</div>
        ${openTips.has(e.id) && exById(e.id) && exById(e.id).tip ? `<p class="tip">${esc(exById(e.id).tip)}</p>` : ''}
        ${sg && sg.up ? `<p class="hint up">${icon('up')} ${esc(sg.text)}</p>` : ''}
        <div class="sets">
          <div class="set-row head ${w ? 'w' : ''}"><span>Σετ</span>${w ? '<span>kg</span>' : ''}<span>${repUnit(e)}</span><span></span></div>
          ${e.sets.map((s, si) => `<div class="set-row ${w ? 'w' : ''} ${s.done ? 'done' : ''}">
            <span class="set-n">${si + 1}</span>
            ${w ? `<input class="num-in" inputmode="decimal" data-set="kg" data-ei="${ei}" data-si="${si}" value="${esc(s.kg)}" placeholder="0" aria-label="κιλά σετ ${si + 1}">` : ''}
            <input class="num-in" inputmode="numeric" data-set="reps" data-ei="${ei}" data-si="${si}" value="${esc(s.reps)}" placeholder="${e.target.reps}" aria-label="${repUnit(e)} σετ ${si + 1}">
            <button class="check-btn ${s.done ? 'on' : ''}" data-action="set-done" data-ei="${ei}" data-si="${si}" aria-label="Έγινε">${icon('check')}</button>
          </div>`).join('')}
        </div>
        <div class="row gap"><button class="btn small ghost" data-action="set-add" data-ei="${ei}">${icon('plus')} Σετ</button>${e.sets.length > 1 ? `<button class="btn small ghost" data-action="set-remove" data-ei="${ei}">${icon('minus')} Σετ</button>` : ''}
          ${!doneSets(e).length ? `<button class="btn small ghost push-right" data-action="session-remove-ex" data-ei="${ei}">${icon('x')} Αφαίρεση</button>` : ''}</div>
      </div>`;
    }).join('')}</div>
    <button class="add-line" data-action="session-add-ex">${icon('plus')} Πρόσθεσε άσκηση</button>`;
}

function setDone(ei, si) {
  const s = DB.active.ex[ei].sets[si];
  s.done = !s.done;
  if (s.done) {
    // τα επόμενα σετ παίρνουν τα ίδια κιλά, εκτός αν τα άλλαξες ήδη με το χέρι
    for (const nx of DB.active.ex[ei].sets.slice(si + 1)) if (!nx.done && !nx.edited) nx.kg = s.kg;
    startRest(DB.program.rest || 90);
  }
  save(); render();
}
function startRest(sec) { restTotal = sec; restEnd = Date.now() + sec * 1000; tick(); }
function tick() {
  const el = $('#elapsed'); if (el && DB.active) el.textContent = mmss((Date.now() - DB.active.start) / 1000);
  const r = $('#rest');
  if (!restEnd) { r.classList.remove('show'); return; }
  const left = Math.ceil((restEnd - Date.now()) / 1000);
  if (left <= 0) {
    restEnd = null; r.classList.remove('show');
    toast(`${icon('bolt')} Τέλος ξεκούρασης, πάμε για το επόμενο σετ!`, 'accent');
    beep();
    return;
  }
  r.classList.add('show');
  r.innerHTML = `<div class="rest-ring" style="--f:${left / restTotal}"></div><div><span class="muted small">Ξεκούραση</span><b>${mmss(left)}</b></div>
    <button class="btn small ghost" data-action="rest-add">+15″</button><button class="btn small" data-action="rest-skip">Παράλειψη</button>`;
}
function beep() {
  try {
    const ctx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.value = 880; g.gain.setValueAtTime(0.15, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime + 0.5);
  } catch { /* χωρίς ήχο */ }
}

function finishWorkout() {
  const a = DB.active;
  const any = a.ex.some(e => doneSets(e).length);
  if (!any) { confirmBox('Κανένα σετ', 'Δεν έχεις σημειώσει κανένα σετ ως «έγινε». Να κλείσει η προπόνηση χωρίς να αποθηκευτεί;', 'Κλείσιμο χωρίς αποθήκευση', () => { DB.active = null; restEnd = null; save(); render(); }); return; }
  // ρεκόρ: σύγκριση με όλες τις προηγούμενες
  const prs = [];
  for (const e of a.ex) if (e.kind === 'weight') {
    const prev = bestKg(e.id), mx = Math.max(0, ...doneSets(e).map(s => num(s.kg) || 0));
    if (mx && prev != null && mx > prev) prs.push(`${esc(shortName(e.name))}: ${fmt(mx, 1)} kg`);
  }
  a.end = Date.now();
  a.ex = a.ex.map(e => ({ ...e, sets: e.sets.map(s => ({ kg: num(s.kg), reps: num(s.reps), done: !!s.done })) }));
  DB.sessions.push(a); DB.active = null; restEnd = null;
  save(); render();
  const min = Math.max(1, Math.round((a.end - a.start) / 60000));
  openModal('Η προπόνηση ολοκληρώθηκε', `<div class="finish">
      <div class="finish-ic">${icon('trophy')}</div>
      <div class="stat-row"><div><b>${min}′</b><span>διάρκεια</span></div><div><b>${a.ex.reduce((n, e) => n + doneSets(e).length, 0)}</b><span>σετ</span></div><div><b>${fmt(sessionVolume(a))}</b><span>kg όγκος</span></div></div>
      ${prs.length ? `<div class="pr"><b>${icon('trophy')} Νέα ρεκόρ</b><p>${prs.join('<br>')}</p></div>` : ''}
      <p class="muted center">Φάε ένα γεύμα με πρωτεΐνη μέσα στις επόμενες ώρες και πιες νερό.</p>
      <button class="btn primary block" data-action="modal-close">Τέλεια</button></div>`);
}

// ---------- δική μου άσκηση ----------
function editExercise(id) {
  const e = id ? DB.customExercises.find(x => x.id === id) : { id: '', name: '', group: libGroup || 'Άλλο', kind: 'weight', sets: 3, reps: 10, tip: '' };
  if (!e) return;
  openModal(id ? 'Αλλαγή άσκησης' : 'Δική μου άσκηση', `<form class="form" data-form="exercise" data-id="${esc(id)}">
      <label>Όνομα<input name="name" value="${esc(e.name)}" required autofocus placeholder="π.χ. Δικέφαλα στο μηχάνημα"></label>
      <div class="two"><label>Μυϊκή ομάδα<select name="group">${GROUPS.map(g => `<option ${e.group === g ? 'selected' : ''}>${g}</option>`).join('')}</select></label>
      <label>Είδος<select name="kind">${[['weight', 'Κιλά × επαναλήψεις'], ['reps', 'Μόνο επαναλήψεις'], ['time', 'Χρόνος (δευτ.)'], ['cardio', 'Αερόβιο (λεπτά)']].map(([v, l]) => `<option value="${v}" ${e.kind === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label></div>
      <div class="two"><label>Σετ (πρόταση)<input name="sets" type="number" min="1" max="10" value="${e.sets}"></label>
      <label>Επαναλήψεις / χρόνος<input name="reps" type="number" min="1" max="300" value="${e.reps}"></label></div>
      <label>Πώς γίνεται (σημείωση)<textarea name="tip" rows="3">${esc(e.tip || '')}</textarea></label>
      <div class="row gap between">${id ? `<button type="button" class="btn danger ghost" data-action="ex-delete" data-id="${esc(id)}">${icon('trash')} Διαγραφή</button>` : '<span></span>'}
      <div class="row gap"><button type="button" class="btn ghost" data-action="modal-close">Άκυρο</button><button class="btn primary">Αποθήκευση</button></div></div>
    </form>`);
}
function saveExercise(form) {
  const f = new FormData(form), id = form.dataset.id;
  const v = { name: String(f.get('name')).trim(), group: f.get('group') || 'Άλλο', kind: f.get('kind'), sets: Math.max(1, num(f.get('sets')) || 3), reps: Math.max(1, num(f.get('reps')) || 10), tip: String(f.get('tip') || '').trim() };
  if (!v.name) return;
  if (id) Object.assign(DB.customExercises.find(x => x.id === id), v); else DB.customExercises.push({ id: 'x' + uid(), ...v });
  save(); closeModal(); render(); toast(`${icon('check')} Η άσκηση αποθηκεύτηκε`);
}
