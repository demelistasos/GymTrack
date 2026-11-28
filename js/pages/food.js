'use strict';
// GymTrack · Διατροφή: ημερολόγιο φαγητού, θερμίδες, πρωτεΐνη, οδηγός

let foodDate = null, foodTab = 'log';
let pick = { date: null, meal: 'lunch', cat: 'home', q: '', qty: 1 };

function guessMeal() { const h = new Date().getHours(); return h < 11 ? 'breakfast' : h < 16 ? 'lunch' : h < 22 ? 'dinner' : 'snack'; }

function pageFood() {
  const tabs = [['log', 'Ημερολόγιο'], ['guide', 'Οδηγός']];
  return `<header class="page-head"><div><p class="eyebrow">Διατροφή</p><h1>${foodTab === 'log' ? 'Τι έφαγες' : 'Οδηγός διατροφής'}</h1></div>
      ${foodTab === 'log' ? `<button class="btn primary" data-action="food-add" data-date="${foodDate || today()}">${icon('plus')} Πρόσθεσε φαγητό</button>` : ''}</header>
    <div class="tabs">${tabs.map(([k, l]) => `<button class="tab ${foodTab === k ? 'on' : ''}" data-action="food-tab" data-k="${k}">${l}</button>`).join('')}</div>
    ${foodTab === 'log' ? foodLog() : foodGuide()}`;
}

function foodLog() {
  const k = foodDate || today();
  const t = targets(), tot = dayTotals(k), items = dayFood(k);
  const isToday = k === today();
  const week = [6, 5, 4, 3, 2, 1, 0].map(n => addDays(k, -n));
  return `<div class="date-nav">
      <button class="icon-btn" data-action="food-day" data-n="-1" aria-label="Προηγούμενη μέρα">${icon('left')}</button>
      <div class="center"><b>${isToday ? 'Σήμερα' : k === addDays(today(), -1) ? 'Χθες' : longDate(k)}</b>${isToday ? `<span class="muted small">${longDate(k)}</span>` : ''}</div>
      <button class="icon-btn" data-action="food-day" data-n="1" ${isToday ? 'disabled' : ''} aria-label="Επόμενη μέρα">${icon('right')}</button>
    </div>
    <div class="grid food-grid">
      <div class="col">
        <div class="card totals">
          <div class="tot-row"><div class="tot-label">${icon('flame', 'kcal-c')} Θερμίδες</div><b>${fmt(tot.kcal)}</b><span class="muted">/ ${t.kcal ? fmt(t.kcal) : '–'} kcal</span></div>
          ${bar(tot.kcal, t.kcal, 'var(--kcal)')}
          <div class="tot-row"><div class="tot-label">${icon('bolt', 'prot-c')} Πρωτεΐνη</div><b>${fmt(tot.p)}</b><span class="muted">/ ${t.p ? fmt(t.p) : '–'} g</span></div>
          ${bar(tot.p, t.p, 'var(--protein)')}
          ${!t.ready ? '<button class="btn small ghost" data-action="profile-setup">Βάλε τους στόχους σου</button>' : ''}
        </div>
        ${Object.entries(MEALS).map(([m, label]) => {
          const list = items.filter(f => f.meal === m);
          const mt = list.reduce((s, f) => s + f.kcal * (f.qty || 1), 0);
          return `<div class="card meal">
            <div class="card-head"><h3>${label}</h3><span class="muted small">${list.length ? fmt(mt) + ' kcal' : ''}</span></div>
            ${list.map(f => `<div class="food-row">
              <div class="grow"><b>${esc(f.name)}</b><span class="muted small">${f.qty && f.qty !== 1 ? `${fmt(f.qty, 1)} × ` : ''}${esc(f.portion || '')}</span></div>
              <span class="kcal-tag">${fmt(f.kcal * (f.qty || 1))}</span><span class="p-tag">${fmt(f.p * (f.qty || 1))}g</span>
              <button class="icon-btn sm" data-action="food-del" data-id="${f.id}" data-date="${k}" aria-label="Αφαίρεση">${icon('x')}</button></div>`).join('')}
            <button class="add-line" data-action="food-add" data-date="${k}" data-meal="${m}">${icon('plus')} Πρόσθεσε στο ${label.toLowerCase()}</button>
          </div>`;
        }).join('')}
      </div>
      <div class="col">
        <div class="card">
          <div class="card-head"><h3>Τελευταίες 7 μέρες</h3><span class="muted small">θερμίδες</span></div>
          ${barChart(week.map(d => ({ v: Math.round(dayTotals(d).kcal), label: DAYS_SHORT[parseKey(d).getDay()], title: `${shortDate(d)}: ${fmt(dayTotals(d).kcal)} kcal` })), { goal: t.kcal, color: 'var(--kcal)', mode: 'max' })}
          ${weekAvg(week, t)}
        </div>
        <div class="card water">
          <div class="card-head"><h3>${icon('drop', 'blue')} Νερό</h3><span class="muted">${DB.water[k] || 0}/${DB.settings.waterGoal} ποτήρια</span></div>
          <div class="stepper"><button class="icon-btn" data-action="water-step" data-n="-1" data-date="${k}" aria-label="Λιγότερο">${icon('minus')}</button><b>${DB.water[k] || 0}</b><button class="icon-btn" data-action="water-step" data-n="1" data-date="${k}" aria-label="Περισσότερο">${icon('plus')}</button></div>
        </div>
        <div class="card tipcard"><h3>${icon('info')} Θυμήσου</h3><p class="muted">Βάλε πρωτεΐνη σε κάθε γεύμα. Δεν χρειάζεται να είσαι τέλειος. Αν τρως σωστά τα περισσότερα γεύματα της εβδομάδας, είσαι μια χαρά.</p></div>
      </div>
    </div>`;
}
function weekAvg(days, t) {
  const logged = days.filter(d => dayFood(d).length);
  if (!logged.length) return '<p class="muted small">Μόλις γράψεις φαγητό, εδώ θα δεις τον μέσο όρο.</p>';
  const avg = logged.reduce((s, d) => s + dayTotals(d).kcal, 0) / logged.length;
  const ap = logged.reduce((s, d) => s + dayTotals(d).p, 0) / logged.length;
  return `<p class="small">Μέσος όρος: <b>${fmt(avg)} kcal</b> · <b>${fmt(ap)} g</b> πρωτεΐνη${t.kcal ? ` <span class="delta ${avg <= t.kcal ? 'down' : 'up'}">${avg <= t.kcal ? 'εντός στόχου' : `+${fmt(avg - t.kcal)} kcal`}</span>` : ''}</p>`;
}

// ---------- προσθήκη φαγητού ----------
function allFoods() { return [...DB.myFoods.map(f => ({ ...f, cat: 'mine' })), ...DEFAULT_FOODS]; }
function recentFoods() {
  const seen = new Map();
  const keys = Object.keys(DB.food).sort().reverse();
  for (const k of keys) for (const f of [...DB.food[k]].reverse()) { const key = f.name; if (!seen.has(key)) seen.set(key, f); if (seen.size >= 8) return [...seen.values()]; }
  return [...seen.values()];
}
function openFoodPicker(date, meal) {
  pick = { date: date || today(), meal: meal || guessMeal(), cat: recentFoods().length ? 'recent' : 'home', q: '', qty: 1 };
  renderPicker(true);
}
function renderPicker(first) {
  const cats = [['recent', 'Πρόσφατα'], ...Object.entries(FOOD_CATS)];
  const q = pick.q.trim().toLowerCase();
  let list = q ? allFoods().filter(f => f.name.toLowerCase().includes(q)) : pick.cat === 'recent' ? recentFoods() : allFoods().filter(f => f.cat === pick.cat);
  const body = `<div class="picker">
    <div class="chips">${Object.entries(MEALS).map(([m, l]) => `<button class="chip ${pick.meal === m ? 'on' : ''}" data-action="pick-meal" data-m="${m}">${l}</button>`).join('')}</div>
    <label class="search">${icon('search')}<input data-field="pick-q" value="${esc(pick.q)}" placeholder="Αναζήτηση τροφίμου…" ${first ? 'autofocus' : ''}></label>
    ${q ? '' : `<div class="seg">${cats.map(([k, l]) => `<button class="${pick.cat === k ? 'on' : ''}" data-action="pick-cat" data-k="${k}">${l}</button>`).join('')}</div>`}
    <div class="qty">Μερίδες <div class="seg small">${[0.5, 1, 1.5, 2].map(v => `<button class="${pick.qty === v ? 'on' : ''}" data-action="pick-qty" data-v="${v}">×${fmt(v, 1)}</button>`).join('')}</div></div>
    <div class="pick-list">${list.length ? list.map(f => `<button class="pick-item" data-action="pick-food" data-id="${esc(f.id || '')}" data-name="${esc(f.name)}">
        <div class="grow"><b>${esc(f.name)}${f.good ? ' <span class="good">καλή επιλογή</span>' : ''}</b><span class="muted small">${esc(f.portion || '1 μερίδα')}</span></div>
        <span class="kcal-tag">${fmt(f.kcal * pick.qty)}</span><span class="p-tag">${fmt(f.p * pick.qty)}g</span>${icon('plus', 'add-ic')}</button>`).join('')
      : `<p class="muted center">${pick.cat === 'mine' && !q ? 'Δεν έχεις φτιάξει ακόμα δικά σου τρόφιμα.' : pick.cat === 'recent' ? 'Ό,τι γράφεις θα εμφανίζεται εδώ για γρήγορη προσθήκη.' : 'Δεν βρέθηκε. Γράψ\' το παρακάτω με τις δικές σου θερμίδες.'}</p>`}</div>
    <details class="custom" ${q && !list.length ? 'open' : ''}><summary>${icon('edit')} Κάτι άλλο: γράψε θερμίδες μόνος σου</summary>
      <form class="form" data-form="custom-food">
        <label>Τι έφαγες<input name="name" required value="${esc(pick.q)}" placeholder="π.χ. Σουβλάκι από την πλατεία"></label>
        <div class="two"><label>Θερμίδες (kcal)<input name="kcal" inputmode="numeric" required></label><label>Πρωτεΐνη (g)<input name="p" inputmode="decimal" placeholder="0"></label></div>
        <label class="check"><input type="checkbox" name="keep" checked> Κράτα το στα «Δικά μου» για την επόμενη φορά</label>
        <button class="btn primary block">${icon('plus')} Πρόσθεσε</button>
      </form></details>
    <p class="muted small">Οι θερμίδες είναι κατά προσέγγιση. Αρκούν για να ξέρεις πού βρίσκεσαι.</p>
  </div>`;
  if (first || !$('#modal').classList.contains('open')) openModal(`Πρόσθεσε φαγητό · ${pick.date === today() ? 'σήμερα' : shortDate(pick.date)}`, body, { wide: true });
  else {
    const b = $('#modal .sheet-body'), sc = $('.pick-list', b)?.scrollTop || 0, focused = document.activeElement && document.activeElement.dataset.field === 'pick-q';
    b.innerHTML = body;
    if (focused) { const i = $('[data-field="pick-q"]', b); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }
    const pl = $('.pick-list', b); if (pl) pl.scrollTop = sc;
  }
}
function addFood(f, qty) {
  const k = pick.date;
  (DB.food[k] = DB.food[k] || []).push({ id: uid(), name: f.name, portion: f.portion || '', kcal: f.kcal, p: f.p || 0, qty, meal: pick.meal });
  save(); render();
  toast(`${icon('check')} ${esc(f.name)} · ${fmt(f.kcal * qty)} kcal`);
}

// ---------- οδηγός ----------
function foodGuide() {
  const t = targets();
  return `<div class="grid guide-grid">
    <div class="card"><h3>Πόσο να τρως: με το χέρι σου</h3><p class="muted small">Σε κάθε κυρίως γεύμα, χωρίς ζυγαριά.</p>
      <div class="hand">${GUIDE.hand.map(([a, b, c]) => `<div><b>${a}</b><span class="hand-v">${b}</span><span class="muted small">${c}</span></div>`).join('')}</div></div>
    <div class="card"><h3>Οι στόχοι σου</h3>${t.ready ? `<div class="stat-row"><div><b>${fmt(t.kcal)}</b><span>kcal / μέρα</span></div><div><b>${fmt(t.p)} g</b><span>πρωτεΐνη / μέρα</span></div></div>
      <p class="muted small">${t.manual ? 'Τους έβαλες μόνος σου.' : `Καις περίπου ${fmt(t.auto.tdee)} kcal τη μέρα. ${GOALS.find(g => g.v === DB.profile.goal).hint}.`}</p>` : '<p class="muted">Βάλε ύψος και κιλά για να βγουν οι στόχοι.</p>'}
      <button class="btn small ghost" data-action="profile-setup">Αλλαγή</button></div>
    <div class="card"><h3>Οι «κρυφές» θερμίδες</h3><p class="muted small">Εκεί πέφτει πρώτα η κοιλιά.</p><ul class="clean">${GUIDE.hidden.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>
    <div class="card"><h3>Σαββατοκύριακο: 1–2 ώρες μαγείρεμα</h3><ol class="clean num">${GUIDE.prep.map(x => `<li>${esc(x)}</li>`).join('')}</ol></div>
    <div class="card"><h3>Μια τυπική μέρα</h3>${GUIDE.day.map(([a, b]) => `<div class="day-line"><b>${a}</b><span>${esc(b)}</span></div>`).join('')}</div>
    <div class="card"><h3>Έξυπνο ντελίβερι</h3><p class="muted small">2–3 φορές την εβδομάδα είναι οκ.</p>
      <div class="set-chips">${DEFAULT_FOODS.filter(f => f.cat === 'out' && f.good).map(f => `<span class="set-chip good-chip">${esc(f.name)} · ${f.kcal}</span>`).join('')}</div>
      <p class="muted small" style="margin-top:12px">Για σπάνια: ${DEFAULT_FOODS.filter(f => f.cat === 'out' && !f.good).map(f => esc(f.name.toLowerCase())).join(', ')}.</p></div>
  </div>`;
}
