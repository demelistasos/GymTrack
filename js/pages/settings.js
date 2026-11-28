'use strict';
// GymTrack · Ρυθμίσεις και προφίλ

let appInfo = null, backupInfo = null;

function pageSettings() {
  const p = DB.profile, t = targets(), w = currentWeight();
  if (isApp() && !appInfo) window.gymtrack.info().then(i => { appInfo = i; if (route === 'settings') render(); });
  if (isApp() && !backupInfo) window.gymtrack.backupStatus().then(s => { backupInfo = s; if (route === 'settings') render(); });
  const b = backupInfo || {};
  const bk = (k, label) => {
    const s = b[k];
    return `<div class="set-line"><div class="grow"><b>${label}</b><span class="muted small">${s ? `${esc(s.dir)}${s.last ? ` · τελευταίο ${new Date(s.last).toLocaleString('el-GR')}` : ''}${s.present ? '' : ' · δεν βρέθηκε τώρα'}` : 'Δεν έχει οριστεί'}</span></div>
      ${s ? `<button class="btn small ghost" data-action="backup-now" data-k="${k}">Τώρα</button><button class="btn small ghost" data-action="backup-remove" data-k="${k}">Αφαίρεση</button>` : `<button class="btn small" data-action="backup-choose" data-k="${k}">Επιλογή φακέλου</button>`}</div>`;
  };
  return `<header class="page-head"><div><p class="eyebrow">Ρυθμίσεις</p><h1>Εσύ και η εφαρμογή</h1></div></header>
    <div class="grid two-col">
      <div class="card"><div class="card-head"><h3>Προφίλ</h3><button class="btn small" data-action="profile-setup">${icon('edit')} Αλλαγή</button></div>
        <div class="kv"><span>Όνομα</span><b>${esc(p.name) || '–'}</b></div>
        <div class="kv"><span>Ηλικία</span><b>${p.age || '–'}</b></div>
        <div class="kv"><span>Ύψος</span><b>${p.height ? p.height + ' cm' : '–'}</b></div>
        <div class="kv"><span>Κιλά (τελευταία μέτρηση)</span><b>${w ? fmt(w, 1) + ' kg' : '–'}</b></div>
        <div class="kv"><span>Κίνηση</span><b>${(ACTIVITY.find(a => a.v === p.activity) || ACTIVITY[1]).label}</b></div>
        <div class="kv"><span>Στόχος</span><b>${(GOALS.find(g => g.v === p.goal) || GOALS[0]).label}</b></div>
      </div>
      <div class="card"><div class="card-head"><h3>Ημερήσιοι στόχοι</h3>${t.manual ? '<span class="pill">δικοί σου</span>' : '<span class="pill accent">αυτόματοι</span>'}</div>
        ${t.ready ? `<div class="stat-row"><div><b>${fmt(t.kcal)}</b><span>kcal</span></div><div><b>${fmt(t.p)} g</b><span>πρωτεΐνη</span></div><div><b>${DB.settings.waterGoal}</b><span>ποτήρια νερό</span></div></div>
          ${t.auto ? `<p class="muted small">Βασικός μεταβολισμός ${fmt(t.auto.bmr)} kcal · με την κίνησή σου καις περίπου ${fmt(t.auto.tdee)} kcal τη μέρα.</p>` : ''}` : '<p class="muted">Συμπλήρωσε ύψος και κιλά.</p>'}
        <p class="muted small">Ξαναϋπολογίζονται μόνοι τους κάθε φορά που γράφεις νέα κιλά.</p>
      </div>
      <div class="card"><h3>Εμφάνιση</h3>
        <div class="seg">${[['dark', 'Σκούρα', 'moon'], ['light', 'Φωτεινή', 'sun']].map(([v, l, i]) => `<button class="${DB.settings.theme === v ? 'on' : ''}" data-action="theme" data-v="${v}">${icon(i)} ${l}</button>`).join('')}</div>
      </div>
      <div class="card"><h3>Τα δεδομένα σου</h3>
        ${isApp() ? `<p class="muted small">Αποθηκεύονται στο <b>${esc(appInfo ? appInfo.path : '…')}</b>. Κάθε μέρα κρατιέται αντίγραφο ασφαλείας.</p>
          <div class="row gap wrap"><button class="btn small ghost" data-action="data-folder">${icon('folder')} Άνοιγμα φακέλου</button><button class="btn small ghost" data-action="data-move">Αλλαγή φακέλου</button>
          <button class="btn small ghost" data-action="data-export">Αντίγραφο σε αρχείο</button><button class="btn small ghost" data-action="data-import">Άνοιγμα αρχείου</button></div>
          ${bk('cloud', 'Αντίγραφο σε OneDrive / Google Drive')}${bk('usb', 'Αντίγραφο σε USB')}`
        : `<p class="muted small">Στο κινητό τα δεδομένα κρατιούνται <b>μόνο σε αυτό το κινητό</b>. Κάνε αντίγραφο μία φορά την εβδομάδα και αποθήκευσέ το στα Αρχεία (iCloud) ή στείλ' το στον εαυτό σου.</p>
          <p class="small">Τελευταίο αντίγραφο: <b>${DB.settings.lastBackup ? esc(shortDate(DB.settings.lastBackup)) : 'κανένα ακόμα'}</b></p>
          <div class="row gap wrap"><button class="btn small primary" data-action="web-export">Αντίγραφο τώρα</button><button class="btn small ghost" data-action="web-import">Επαναφορά από αντίγραφο</button></div>`}
      </div>
      <div class="card"><h3>Έκδοση</h3>
        <p><b>GymTrack ${esc(appInfo ? appInfo.version : isWeb() ? webVersion() : '')}</b>${isWeb() ? ` <span class="muted small">· για κινητό${isStandalone() ? '' : ' (στον browser)'}</span>` : ''}</p>
        <p class="muted small" id="upd-msg"></p>
        ${isApp() ? '<div class="row gap wrap"><button class="btn small ghost" data-action="update-check">Έλεγχος για νέα έκδοση</button><button class="btn small ghost" data-action="update-log">Ημερολόγιο ενημερώσεων</button></div>' : ''}
        ${isWeb() ? '<div class="row gap wrap"><button class="btn small ghost" data-action="screen-report">Έλεγχος οθόνης</button></div>' : ''}
      </div>
      <div class="card danger-zone"><h3>Από την αρχή</h3><p class="muted small">Σβήνει όλες τις προπονήσεις, τα φαγητά και τις μετρήσεις.</p>
        <button class="btn small danger ghost" data-action="reset-all">${icon('trash')} Διαγραφή όλων</button></div>
    </div>`;
}

function openProfile() {
  const p = DB.profile, w = currentWeight(), m = p.manual || {};
  openModal('Το προφίλ σου', `<form class="form" data-form="profile">
    <label>Πώς να σε λέω (για το «Καλημέρα»)<input name="name" value="${esc(p.name)}" placeholder="προαιρετικό, π.χ. Νίκο"></label>
    <div class="three">
      <label>Ηλικία<input name="age" inputmode="numeric" value="${p.age || ''}" required></label>
      <label>Ύψος (cm)<input name="height" inputmode="numeric" value="${p.height || ''}" required autofocus placeholder="π.χ. 178"></label>
      <label>Κιλά<input name="weight" inputmode="decimal" value="${w ? String(w).replace(".", ",") : ''}" required placeholder="π.χ. 82"></label>
    </div>
    <fieldset><legend>Φύλο</legend><div class="seg">${[['m', 'Άντρας'], ['f', 'Γυναίκα']].map(([v, l]) => `<label class="${p.sex === v ? 'on' : ''}"><input type="radio" name="sex" value="${v}" ${p.sex === v ? 'checked' : ''}>${l}</label>`).join('')}</div></fieldset>
    <fieldset><legend>Πόσο κινείσαι μέσα στη μέρα</legend><div class="opts">${ACTIVITY.map(a => `<label class="opt ${p.activity === a.v ? 'on' : ''}"><input type="radio" name="activity" value="${a.v}" ${p.activity === a.v ? 'checked' : ''}><b>${a.label}</b><span>${a.hint}</span></label>`).join('')}</div></fieldset>
    <fieldset><legend>Τι θέλεις να πετύχεις</legend><div class="opts">${GOALS.map(g => `<label class="opt ${p.goal === g.v ? 'on' : ''}"><input type="radio" name="goal" value="${g.v}" ${p.goal === g.v ? 'checked' : ''}><b>${g.label}</b><span>${g.hint}</span></label>`).join('')}</div></fieldset>
    <details ${m.kcal || m.p ? 'open' : ''}><summary>Θέλω να βάλω τους στόχους μόνος μου</summary>
      <div class="two"><label>Θερμίδες / μέρα<input name="mkcal" inputmode="numeric" value="${m.kcal || ''}" placeholder="αυτόματα"></label><label>Πρωτεΐνη / μέρα (g)<input name="mp" inputmode="numeric" value="${m.p || ''}" placeholder="αυτόματα"></label></div>
      <label>Νερό / μέρα (ποτήρια)<input name="water" inputmode="numeric" value="${DB.settings.waterGoal}"></label>
    </details>
    <div class="preview" id="target-preview"></div>
    <div class="row end gap"><button type="button" class="btn ghost" data-action="modal-close">Άκυρο</button><button class="btn primary">Αποθήκευση</button></div>
  </form>`, { wide: true });
  previewTargets($('form[data-form="profile"]'));
}
function readProfileForm(form) {
  const f = new FormData(form);
  return {
    profile: { ...DB.profile, name: String(f.get('name') || '').trim(), age: num(f.get('age')), height: num(f.get('height')), sex: f.get('sex') || 'm',
      activity: num(f.get('activity')) || 1.55, goal: f.get('goal') || 'cut',
      manual: (num(f.get('mkcal')) || num(f.get('mp'))) ? { kcal: num(f.get('mkcal')), p: num(f.get('mp')) } : null },
    weight: num(f.get('weight')), water: num(f.get('water'))
  };
}
function previewTargets(form) {
  const el = $('#target-preview'); if (!el || !form) return;
  const { profile, weight } = readProfileForm(form);
  const t = targets(profile, weight);
  el.innerHTML = t.ready ? `<div class="stat-row"><div><b>${fmt(t.kcal)}</b><span>kcal τη μέρα</span></div><div><b>${fmt(t.p)} g</b><span>πρωτεΐνη τη μέρα</span></div></div>` : '<p class="muted small center">Γράψε ηλικία, ύψος και κιλά για να δεις τους στόχους σου.</p>';
}
function saveProfile(form) {
  const { profile, weight, water } = readProfileForm(form);
  if (profile.height && (profile.height < 120 || profile.height > 230)) { toast('Το ύψος δεν φαίνεται σωστό (σε εκατοστά).', 'bad'); return; }
  if (weight && (weight < 30 || weight > 300)) { toast('Τα κιλά δεν φαίνονται σωστά.', 'bad'); return; }
  DB.profile = profile;
  if (water) DB.settings.waterGoal = Math.min(20, Math.max(1, Math.round(water)));
  if (weight && weight !== currentWeight()) {
    const k = today(), ex = DB.body.find(b => b.date === k);
    if (ex) ex.weight = weight; else DB.body.push({ date: k, weight, waist: null });
  }
  save(); closeModal(); render(); toast(`${icon('check')} Το προφίλ αποθηκεύτηκε`);
}
