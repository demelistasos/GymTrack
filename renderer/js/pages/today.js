'use strict';
// GymTrack · Σελίδα «Σήμερα»

function greeting() {
  const h = new Date().getHours();
  const name = DB.profile.name ? `, ${esc(DB.profile.name)}` : '';
  return (h < 12 ? 'Καλημέρα' : h < 18 ? 'Γεια σου' : 'Καλησπέρα') + name;
}

function pageToday() {
  const k = today();
  const t = targets(), tot = dayTotals(k);
  const ws = weekSessions(k), goalW = weekGoal();
  const trainedToday = DB.sessions.some(s => s.date === k);
  const water = DB.water[k] || 0, wg = DB.settings.waterGoal || 8;
  const w = latestBody();
  const ws0 = weekStart(k);

  // κάρτα προπόνησης
  let workoutCard;
  if (DB.active) {
    const done = DB.active.ex.reduce((n, e) => n + doneSets(e).length, 0), all = DB.active.ex.reduce((n, e) => n + e.sets.length, 0);
    workoutCard = `<div class="card hero live">
      <div class="hero-top"><span class="pill live-pill"><i class="dot"></i> Σε εξέλιξη</span><span class="muted">${done}/${all} σετ</span></div>
      <h2>Η προπόνηση σε περιμένει</h2>
      <p class="muted">Ξεκίνησες στις ${new Date(DB.active.start).toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit' })}.</p>
      <button class="btn primary lg" data-action="go" data-page="workout">${icon('play')} Συνέχεια</button></div>`;
  } else if (trainedToday) {
    const s = DB.sessions.filter(x => x.date === k).pop();
    workoutCard = `<div class="card hero done">
      <div class="hero-top"><span class="pill ok">${icon('check')} Έγινε</span></div>
      <h2>Μπράβο, η σημερινή προπόνηση έγινε</h2>
      <p class="muted">${Math.round((s.end - s.start) / 60000)} λεπτά · ${s.ex.reduce((n, e) => n + doneSets(e).length, 0)} σετ · ${fmt(sessionVolume(s))} kg συνολικά</p>
      <button class="btn ghost" data-action="session-open" data-id="${s.id}">Δες τι έκανες</button></div>`;
  } else if (isTrainingDay(k)) {
    const todays = workoutsFor(k), w = todays[0], items = w.items.map(itemDef);
    workoutCard = `<div class="card hero">
      <div class="hero-top"><span class="pill accent">${icon('workout')} Μέρα προπόνησης</span><span class="muted">${items.length} ασκήσεις</span></div>
      <h2>${esc(w.name)}</h2>
      <p class="muted">${items.filter(e => e.kind !== 'cardio').map(e => esc(shortName(e.name))).join(' · ')}</p>
      <div class="row gap wrap"><button class="btn primary lg" data-action="workout-start" data-id="${w.id}">${icon('play')} Ξεκίνα προπόνηση</button>
      ${todays.length > 1 || DB.workouts.length > 1 ? '<button class="btn ghost" data-action="workout-choose">Άλλη προπόνηση</button>' : ''}</div></div>`;
  } else {
    const next = [1, 2, 3, 4, 5, 6, 7].map(n => addDays(k, n)).find(isTrainingDay);
    workoutCard = `<div class="card hero restday">
      <div class="hero-top"><span class="pill">Ξεκούραση</span></div>
      <h2>Σήμερα ξεκουράζεσαι</h2>
      <p class="muted">${next ? `Επόμενη προπόνηση: <b>${DAYS[parseKey(next).getDay()]}</b>. ` : ''}Ένα περπάτημα 30 λεπτών μετράει κι αυτό.</p>
      <button class="btn ghost" data-action="workout-start" data-id="">${icon('play')} Θέλω να γυμναστώ πάντως</button></div>`;
  }

  const setup = !t.ready ? `<div class="card setup">
      <div class="setup-ic">${icon('bolt')}</div>
      <div><h3>Ας βγάλουμε τους στόχους σου</h3><p class="muted">Με ύψος και κιλά υπολογίζω πόσες θερμίδες και πόση πρωτεΐνη χρειάζεσαι για να πέσει η κοιλιά.</p></div>
      <button class="btn primary" data-action="profile-setup">Ξεκίνα</button></div>` : '';

  const kcalLeft = t.kcal ? t.kcal - Math.round(tot.kcal) : null;
  const nutrition = `<div class="card nutri">
    <div class="card-head"><h3>Διατροφή σήμερα</h3><button class="btn small ghost" data-action="go" data-page="food">Όλα ${icon('right')}</button></div>
    <div class="rings">
      ${ring(tot.kcal, t.kcal, { color: 'var(--kcal)', label: fmt(tot.kcal), sub: t.kcal ? `από ${fmt(t.kcal)} kcal` : 'kcal' })}
      ${ring(tot.p, t.p, { color: 'var(--protein)', label: fmt(tot.p) + '<small>g</small>', sub: t.p ? `από ${fmt(t.p)} g πρωτ.` : 'πρωτεΐνη' })}
    </div>
    <p class="center muted small">${kcalLeft == null ? 'Συμπλήρωσε το προφίλ για στόχους.' : kcalLeft >= 0 ? `Σου μένουν <b class="txt">${fmt(kcalLeft)} kcal</b>${t.p ? ` και <b class="txt">${fmt(Math.max(0, t.p - tot.p))} g</b> πρωτεΐνη` : ''}` : `Πέρασες τον στόχο κατά <b class="warn-t">${fmt(-kcalLeft)} kcal</b>. Δεν πειράζει, αύριο πάλι.`}</p>
    <button class="btn primary block" data-action="food-add" data-date="${k}">${icon('plus')} Πρόσθεσε φαγητό</button>
  </div>`;

  const waterCard = `<div class="card water">
    <div class="card-head"><h3>${icon('drop', 'blue')} Νερό</h3><span class="muted">${water}/${wg} ποτήρια</span></div>
    <div class="glasses">${Array.from({ length: Math.max(wg, water) }, (_, i) => `<button class="glass ${i < water ? 'on' : ''}" data-action="water-set" data-n="${i < water && i === water - 1 ? i : i + 1}" aria-label="${i + 1} ποτήρια"></button>`).join('')}</div>
  </div>`;

  const week = `<div class="card week">
    <div class="card-head"><h3>Η εβδομάδα σου</h3><span class="muted">${ws.length}/${goalW} προπονήσεις</span></div>
    <div class="weekdays">${[0, 1, 2, 3, 4, 5, 6].map(i => {
      const d = addDays(ws0, i), dd = parseKey(d).getDay();
      const trained = DB.sessions.some(s => s.date === d), planned = workoutsFor(d).length > 0;
      return `<div class="wd ${trained ? 'trained' : ''} ${planned ? 'planned' : ''} ${d === k ? 'now' : ''}"><span>${DAYS_SHORT[dd]}</span><i>${trained ? icon('check') : parseKey(d).getDate()}</i></div>`;
    }).join('')}</div>
    <div class="mini-stats">
      <div><b>${streakWeeks()}</b><span>εβδομάδες στη σειρά</span></div>
      <div><b>${DB.sessions.length}</b><span>προπονήσεις συνολικά</span></div>
    </div></div>`;

  const bodyCard = `<div class="card body">
    <div class="card-head"><h3>${icon('scale')} Σώμα</h3><button class="btn small ghost" data-action="body-add">${icon('plus')} Μέτρηση</button></div>
    ${w ? `<div class="big-num">${fmt(w.weight, 1)}<small> kg</small></div><p class="muted small">Τελευταία μέτρηση: ${shortDate(w.date)}${w.waist ? ` · μέση ${fmt(w.waist, 1)} cm` : ''}</p>${bodyDelta()}`
      : '<p class="muted">Ζυγίσου μία φορά την εβδομάδα, το πρωί, και μέτρα τη μέση με μεζούρα.</p>'}
  </div>`;

  return `<header class="page-head"><div><p class="eyebrow">${longDate(k)}</p><h1>${greeting()}</h1></div></header>
    ${setup}
    <div class="grid today-grid">
      <div class="col">${workoutCard}${week}</div>
      <div class="col">${nutrition}${waterCard}${bodyCard}</div>
    </div>
    ${backupDue() ? `<div class="card setup soft"><div class="setup-ic">${icon('folder')}</div><div><h3>Ώρα για αντίγραφο ασφαλείας</h3><p class="muted">Τα δεδομένα σου είναι μόνο σε αυτό το κινητό. Κράτα ένα αντίγραφο στα Αρχεία (iCloud).</p></div><button class="btn primary" data-action="web-export">Αντίγραφο</button></div>` : ''}`;
}

function bodyDelta() {
  const list = [...DB.body].filter(b => b.weight).sort((a, b) => a.date.localeCompare(b.date));
  if (list.length < 2) return '';
  const d = list[list.length - 1].weight - list[0].weight;
  const wl = [...DB.body].filter(b => b.waist).sort((a, b) => a.date.localeCompare(b.date));
  const dw = wl.length >= 2 ? wl[wl.length - 1].waist - wl[0].waist : null;
  const chip = (v, u) => `<span class="delta ${v < 0 ? 'down' : v > 0 ? 'up' : ''}">${v > 0 ? '+' : ''}${fmt(v, 1)} ${u}</span>`;
  return `<p class="small">Από την αρχή: ${chip(d, 'kg')}${dw != null ? ` · μέση ${chip(dw, 'cm')}` : ''}</p>`;
}
