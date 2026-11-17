'use strict';
// GymTrack · Πρόοδος: κιλά, μέση, δύναμη ανά άσκηση, συνέπεια

let progEx = null;

function pageProgress() {
  const body = [...DB.body].sort((a, b) => a.date.localeCompare(b.date));
  const wts = body.filter(b => b.weight).map(b => ({ x: b.date, y: b.weight }));
  const waist = body.filter(b => b.waist).map(b => ({ x: b.date, y: b.waist }));
  const weighted = DB.program.exercises.filter(e => e.kind === 'weight');
  if (!progEx || !weighted.find(e => e.id === progEx)) progEx = weighted[0] ? weighted[0].id : null;
  const strength = [];
  for (const s of [...DB.sessions].sort((a, b) => a.date.localeCompare(b.date))) {
    const e = s.ex.find(x => x.id === progEx); if (!e) continue;
    const mx = Math.max(0, ...doneSets(e).map(st => num(st.kg) || 0)); if (mx) strength.push({ x: s.date, y: mx });
  }
  const weeks = [7, 6, 5, 4, 3, 2, 1, 0].map(n => addDays(weekStart(today()), -7 * n));
  const delta = (arr, u) => arr.length >= 2 ? (() => { const d = arr[arr.length - 1].y - arr[0].y; return `<span class="delta ${d < 0 ? 'down' : d > 0 ? 'up' : ''}">${d > 0 ? '+' : ''}${fmt(d, 1)} ${u}</span>`; })() : '';
  return `<header class="page-head"><div><p class="eyebrow">Πρόοδος</p><h1>Πώς πας</h1></div>
      <button class="btn primary" data-action="body-add">${icon('plus')} Νέα μέτρηση</button></header>
    <div class="grid two-col">
      <div class="card"><div class="card-head"><h3>Κιλά</h3>${delta(wts, 'kg')}</div>${lineChart(wts, { unit: 'kg', color: 'var(--accent)' })}</div>
      <div class="card"><div class="card-head"><h3>Μέση</h3>${delta(waist, 'cm')}</div>${lineChart(waist, { unit: 'cm', color: 'var(--protein)' })}
        <p class="muted small">Η μεζούρα δείχνει την κοιλιά καλύτερα από τη ζυγαριά.</p></div>
      <div class="card"><div class="card-head"><h3>Δύναμη</h3>
        <select data-field="prog-ex" aria-label="Άσκηση">${weighted.map(e => `<option value="${e.id}" ${e.id === progEx ? 'selected' : ''}>${esc(e.name.split(' (')[0])}</option>`).join('')}</select></div>
        ${lineChart(strength, { unit: 'kg', color: 'var(--kcal)' })}<p class="muted small">Τα περισσότερα κιλά που σήκωσες σε κάθε προπόνηση.</p></div>
      <div class="card"><div class="card-head"><h3>Συνέπεια</h3><span class="muted small">προπονήσεις / εβδομάδα</span></div>
        ${barChart(weeks.map(w => ({ v: weekSessions(w).length, label: shortDate(w), title: `Εβδομάδα από ${shortDate(w)}` })), { goal: DB.program.days.length })}
        <p class="muted small">Στόχος: ${DB.program.days.length} τη βδομάδα. Η συνέπεια μετράει περισσότερο από όλα.</p></div>
    </div>
    <div class="card"><div class="card-head"><h3>Μετρήσεις</h3></div>
      ${body.length ? `<table class="tbl"><thead><tr><th>Ημερομηνία</th><th>Κιλά</th><th>Μέση</th><th></th></tr></thead><tbody>
        ${[...body].reverse().map(b => `<tr><td>${shortDate(b.date)} ${parseKey(b.date).getFullYear()}</td><td>${b.weight ? fmt(b.weight, 1) + ' kg' : '–'}</td><td>${b.waist ? fmt(b.waist, 1) + ' cm' : '–'}</td>
          <td class="end"><button class="icon-btn sm" data-action="body-del" data-date="${b.date}" aria-label="Διαγραφή">${icon('trash')}</button></td></tr>`).join('')}
      </tbody></table>` : '<p class="muted">Ζυγίσου μία φορά την εβδομάδα, το πρωί πριν φας, και μέτρα τη μέση στο ύψος του αφαλού.</p>'}
    </div>`;
}

function openBodyForm() {
  const last = latestBody(), k = today(), ex = DB.body.find(b => b.date === k);
  openModal('Νέα μέτρηση', `<form class="form" data-form="body">
    <label>Ημερομηνία<input name="date" type="date" value="${k}" max="${k}"></label>
    <div class="two"><label>Κιλά<input name="weight" inputmode="decimal" autofocus value="${ex && ex.weight ? ex.weight : ''}" placeholder="${last ? fmt(last.weight, 1) : 'π.χ. 82,5'}"></label>
    <label>Μέση (cm)<input name="waist" inputmode="decimal" value="${ex && ex.waist ? ex.waist : ''}" placeholder="προαιρετικό"></label></div>
    <p class="muted small">Ζυγίσου το πρωί, μετά την τουαλέτα και πριν φας. Η μέση μετριέται στο ύψος του αφαλού, χωρίς να σφίγγεις.</p>
    <div class="row end gap"><button type="button" class="btn ghost" data-action="modal-close">Άκυρο</button><button class="btn primary">Αποθήκευση</button></div></form>`);
}
function saveBody(form) {
  const f = new FormData(form);
  const date = f.get('date') || today(), weight = num(f.get('weight')), waist = num(f.get('waist'));
  if (!weight && !waist) { toast('Γράψε κιλά ή μέση.', 'bad'); return; }
  if (weight && (weight < 30 || weight > 300)) { toast('Τα κιλά δεν φαίνονται σωστά.', 'bad'); return; }
  const ex = DB.body.find(b => b.date === date);
  if (ex) { if (weight) ex.weight = weight; if (waist) ex.waist = waist; } else DB.body.push({ date, weight, waist });
  save(); closeModal(); render(); toast(`${icon('check')} Η μέτρηση αποθηκεύτηκε`);
}
