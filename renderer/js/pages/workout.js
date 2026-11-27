'use strict';
// GymTrack · Προπόνηση: πρόγραμμα, προπόνηση σε εξέλιξη (σετ / επαναλήψεις / κιλά), ιστορικό

let workoutTab = 'program';
let restEnd = null, restTotal = 0;
let openTips = new Set();

const repUnit = ex => ex.kind === 'time' ? (ex.unit || 'δευτ.') : ex.kind === 'cardio' ? (ex.unit || 'λεπτά') : 'επαν.';

function pageWorkout() {
  if (DB.active) return activeSession();
  const tabs = [['program', 'Πρόγραμμα'], ['history', 'Ιστορικό']];
  return `<header class="page-head"><div><p class="eyebrow">Προπόνηση</p><h1>${workoutTab === 'program' ? 'Το πρόγραμμά σου' : 'Ιστορικό'}</h1></div>
      <button class="btn primary" data-action="workout-start">${icon('play')} Ξεκίνα προπόνηση</button></header>
    <div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${workoutTab === k ? 'on' : ''}" data-action="workout-tab" data-k="${k}">${l}</button>`).join('')}</div>
    ${workoutTab === 'program' ? programView() : historyView()}`;
}

function programView() {
  const p = DB.program;
  return `<div class="card">
      <div class="card-head"><h3>Μέρες προπόνησης</h3><span class="muted small">${p.days.length} φορές την εβδομάδα</span></div>
      <div class="chips">${[1, 2, 3, 4, 5, 6, 0].map(d => `<button class="chip ${p.days.includes(d) ? 'on' : ''}" data-action="day-toggle" data-d="${d}">${DAYS[d]}</button>`).join('')}</div>
      <p class="muted small">Άφησε μία μέρα ξεκούραση ανάμεσα. Π.χ. Δευτέρα, Τετάρτη, Παρασκευή.</p>
    </div>
    <div class="list ex-list">${p.exercises.map((e, i) => {
      const last = lastFor(e.id), best = bestKg(e.id), sg = suggestion(e);
      return `<div class="card ex-card">
        <div class="ex-main">
          <span class="ex-num">${i + 1}</span>
          <div class="ex-info"><h3>${esc(e.name)}</h3>
            <p class="muted small">${e.sets} × ${e.reps} ${repUnit(e)}${last && e.kind === 'weight' ? ` · τελευταία: ${esc(last.sets.map(s => `${fmt(num(s.kg), 1)}×${s.reps}`).join(', '))}` : ''}${best ? ` · ρεκόρ ${fmt(best, 1)} kg` : ''}</p>
            ${sg ? `<p class="hint ${sg.up ? 'up' : ''}">${sg.up ? icon('up') : icon('info')} ${esc(sg.text)}</p>` : ''}
          </div>
          <div class="ex-actions">
            <button class="icon-btn" data-action="tip-toggle" data-id="${e.id}" aria-label="Πώς γίνεται" title="Πώς γίνεται">${icon('info')}</button>
            <button class="icon-btn" data-action="ex-move" data-i="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="Πάνω">${icon('up')}</button>
            <button class="icon-btn" data-action="ex-edit" data-id="${e.id}" aria-label="Αλλαγή">${icon('edit')}</button>
          </div>
        </div>
        ${openTips.has(e.id) && e.tip ? `<p class="tip">${esc(e.tip)}</p>` : ''}
      </div>`;
    }).join('')}</div>
    <div class="row gap wrap">
      <button class="btn ghost" data-action="ex-edit" data-id="">${icon('plus')} Νέα άσκηση</button>
      <label class="inline-field">Ξεκούραση ανάμεσα στα σετ
        <select data-field="rest">${[60, 90, 120, 150, 180].map(s => `<option value="${s}" ${p.rest === s ? 'selected' : ''}>${mmss(s)}</option>`).join('')}</select></label>
    </div>
    <div class="card rules">
      <h3>Βασικοί κανόνες</h3>
      <ul>
        <li>Διάλεξε βάρος που σου αφήνει <b>2–3 επαναλήψεις «στην άκρη»</b>. Όχι μέχρι εξάντλησης.</li>
        <li>Όταν βγάζεις άνετα όλα τα σετ, <b>ανέβασε λίγο το βάρος</b>. Η εφαρμογή σού το θυμίζει.</li>
        <li>Τις πρώτες 2 εβδομάδες θα πιαστείς. Είναι φυσιολογικό, μην τα παρατήσεις.</li>
        <li>Αν δεν ξέρεις μια άσκηση, ζήτα από τον γυμναστή να σου τη δείξει μία φορά.</li>
      </ul>
    </div>`;
}

function historyView() {
  const list = [...DB.sessions].sort((a, b) => (b.end || 0) - (a.end || 0));
  if (!list.length) return `<div class="empty">${icon('workout')}<h3>Καμία προπόνηση ακόμα</h3><p class="muted">Μόλις ολοκληρώσεις την πρώτη, θα τη δεις εδώ.</p></div>`;
  return `<div class="list">${list.map(s => `<button class="card row-card" data-action="session-open" data-id="${s.id}">
      <div class="date-badge"><b>${parseKey(s.date).getDate()}</b><span>${MONTHS_SHORT[parseKey(s.date).getMonth()]}</span></div>
      <div class="grow"><h3>${DAYS[parseKey(s.date).getDay()]}</h3><p class="muted small">${Math.max(1, Math.round((s.end - s.start) / 60000))} λεπτά · ${s.ex.reduce((n, e) => n + doneSets(e).length, 0)} σετ · ${fmt(sessionVolume(s))} kg όγκος</p></div>
      ${icon('right', 'muted')}</button>`).join('')}</div>`;
}

function sessionDetail(id) {
  const s = DB.sessions.find(x => x.id === id); if (!s) return;
  openModal(`${longDate(s.date)}`, `
    <p class="muted">${Math.max(1, Math.round((s.end - s.start) / 60000))} λεπτά · ${fmt(sessionVolume(s))} kg συνολικός όγκος</p>
    <div class="list">${s.ex.filter(e => doneSets(e).length).map(e => `<div class="detail-ex"><b>${esc(e.name)}</b>
      <div class="set-chips">${doneSets(e).map(st => `<span class="set-chip">${e.kind === 'weight' ? `${fmt(num(st.kg), 1)} kg × ${esc(st.reps)}` : `${esc(st.reps)} ${repUnit(e)}`}</span>`).join('')}</div></div>`).join('') || '<p class="muted">Δεν καταγράφηκαν σετ.</p>'}</div>
    <div class="row end gap"><button class="btn danger ghost" data-action="session-delete" data-id="${s.id}">${icon('trash')} Διαγραφή</button><button class="btn primary" data-action="modal-close">Εντάξει</button></div>`);
}

// ---------- προπόνηση σε εξέλιξη ----------
function startWorkout() {
  if (DB.active) { go('workout'); return; }
  DB.active = {
    id: uid(), date: today(), start: Date.now(),
    ex: DB.program.exercises.map(e => {
      const sg = suggestion(e), last = lastFor(e.id);
      const kg = sg ? sg.kg : last ? num(last.sets[0].kg) : '';
      return { id: e.id, name: e.name, kind: e.kind, unit: e.unit, target: { sets: e.sets, reps: e.reps },
        sets: Array.from({ length: e.sets }, () => ({ kg: e.kind === 'weight' ? (kg ?? '') : '', reps: e.reps, done: false })) };
    })
  };
  save(); go('workout');
}

function activeSession() {
  const a = DB.active;
  const done = a.ex.reduce((n, e) => n + doneSets(e).length, 0), all = a.ex.reduce((n, e) => n + e.sets.length, 0);
  return `<header class="page-head session-head">
      <div><p class="eyebrow"><span class="pill live-pill"><i class="dot"></i> Σε εξέλιξη</span></p><h1 id="elapsed">${mmss((Date.now() - a.start) / 1000)}</h1></div>
      <div class="row gap"><button class="btn ghost" data-action="workout-cancel">Ακύρωση</button><button class="btn primary" data-action="workout-finish">${icon('check')} Τέλος</button></div>
    </header>
    <div class="progress-line">${bar(done, all)}<span class="muted small">${done}/${all} σετ</span></div>
    <div class="list">${a.ex.map((e, ei) => {
      const last = lastFor(e.id), sg = e.kind === 'weight' ? suggestion(exById(e.id) || { ...e, ...e.target }) : null;
      const complete = e.sets.length && e.sets.every(s => s.done);
      return `<div class="card set-card ${complete ? 'complete' : ''}">
        <div class="card-head"><div><h3>${esc(e.name)}</h3>
          <p class="muted small">Στόχος ${e.target.sets} × ${e.target.reps} ${repUnit(e)}${last ? ` · προηγούμενη: ${esc(last.sets.map(s => e.kind === 'weight' ? `${fmt(num(s.kg), 1)}×${s.reps}` : s.reps).join(', '))}` : ''}</p></div>
          ${complete ? `<span class="pill ok">${icon('check')}</span>` : ''}</div>
        ${sg && sg.up ? `<p class="hint up">${icon('up')} ${esc(sg.text)}</p>` : ''}
        <div class="sets">
          <div class="set-row head ${e.kind === 'weight' ? 'w' : ''}"><span>Σετ</span>${e.kind === 'weight' ? '<span>kg</span>' : ''}<span>${repUnit(e)}</span><span></span></div>
          ${e.sets.map((s, si) => `<div class="set-row ${e.kind === 'weight' ? 'w' : ''} ${s.done ? 'done' : ''}">
            <span class="set-n">${si + 1}</span>
            ${e.kind === 'weight' ? `<input class="num-in" inputmode="decimal" data-set="kg" data-ei="${ei}" data-si="${si}" value="${esc(s.kg)}" placeholder="0" aria-label="κιλά σετ ${si + 1}">` : ''}
            <input class="num-in" inputmode="numeric" data-set="reps" data-ei="${ei}" data-si="${si}" value="${esc(s.reps)}" placeholder="${e.target.reps}" aria-label="${repUnit(e)} σετ ${si + 1}">
            <button class="check-btn ${s.done ? 'on' : ''}" data-action="set-done" data-ei="${ei}" data-si="${si}" aria-label="Έγινε">${icon('check')}</button>
          </div>`).join('')}
        </div>
        <div class="row gap"><button class="btn small ghost" data-action="set-add" data-ei="${ei}">${icon('plus')} Σετ</button>${e.sets.length > 1 ? `<button class="btn small ghost" data-action="set-remove" data-ei="${ei}">${icon('minus')} Σετ</button>` : ''}</div>
      </div>`;
    }).join('')}</div>`;
}

function setDone(ei, si) {
  const s = DB.active.ex[ei].sets[si];
  s.done = !s.done;
  if (s.done) {
    // το επόμενο σετ παίρνει τα ίδια κιλά, αν είναι κενό
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
    if (mx && (prev == null || mx > prev) && prev != null) prs.push(`${esc(e.name.split(' (')[0])}: ${fmt(mx, 1)} kg`);
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

// ---------- αλλαγή άσκησης ----------
function editExercise(id) {
  const e = id ? exById(id) : { id: '', name: '', kind: 'weight', sets: 3, reps: 10, tip: '' };
  openModal(id ? 'Αλλαγή άσκησης' : 'Νέα άσκηση', `<form class="form" data-form="exercise" data-id="${esc(id)}">
      <label>Όνομα<input name="name" value="${esc(e.name)}" required autofocus placeholder="π.χ. Δικέφαλα με αλτήρες"></label>
      <label>Είδος<select name="kind">${[['weight', 'Με βάρος (κιλά × επαναλήψεις)'], ['time', 'Με χρόνο (δευτερόλεπτα)'], ['cardio', 'Αερόβιο (λεπτά)']].map(([v, l]) => `<option value="${v}" ${e.kind === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
      <div class="two"><label>Σετ<input name="sets" type="number" min="1" max="10" value="${e.sets}"></label>
      <label>Επαναλήψεις / χρόνος<input name="reps" type="number" min="1" max="300" value="${e.reps}"></label></div>
      <label>Πώς γίνεται (σημείωση)<textarea name="tip" rows="3">${esc(e.tip || '')}</textarea></label>
      <div class="row gap between">${id ? `<button type="button" class="btn danger ghost" data-action="ex-delete" data-id="${esc(id)}">${icon('trash')} Διαγραφή</button>` : '<span></span>'}
      <div class="row gap"><button type="button" class="btn ghost" data-action="modal-close">Άκυρο</button><button class="btn primary">Αποθήκευση</button></div></div>
    </form>`);
}
function saveExercise(form) {
  const f = new FormData(form), id = form.dataset.id;
  const v = { name: String(f.get('name')).trim(), kind: f.get('kind'), sets: Math.max(1, num(f.get('sets')) || 3), reps: Math.max(1, num(f.get('reps')) || 10), tip: String(f.get('tip') || '').trim() };
  v.unit = v.kind === 'time' ? 'δευτ.' : v.kind === 'cardio' ? 'λεπτά' : undefined;
  if (!v.name) return;
  if (id) Object.assign(exById(id), v); else DB.program.exercises.push({ id: 'x' + uid(), ...v });
  save(); closeModal(); render();
}
