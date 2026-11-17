'use strict';
// GymTrack · Ενημέρωση εφαρμογής (πάντα με ερώτηση, ποτέ αυτόματα)

let updInfo = null, updLater = false;
function updBanner(html, cls) {
  const b = $('#update-banner'); if (!b) return;
  if (!html) { b.className = 'update-banner hidden'; b.innerHTML = ''; return; }
  b.className = 'update-banner' + (cls ? ' ' + cls : ''); b.innerHTML = html;
}
const UPD_WHY = {
  programfiles: 'Το GymTrack είναι στον φάκελο «Program Files», όπου δεν μπορεί να γράψει μόνο του. Μετέφερέ το π.χ. στα Έγγραφα και η επόμενη ενημέρωση θα γίνει με ένα κλικ.',
  readonly: 'Ο φάκελος του GymTrack δεν επιτρέπει αλλαγές, οπότε η ενημέρωση γίνεται με το χέρι.',
  translocated: 'Το Mac τρέχει το GymTrack από προσωρινή θέση. Βάλ\' το στις Εφαρμογές και άνοιξέ το από εκεί.',
  noassets: 'Η νέα έκδοση δεν έχει ακόμα αρχεία για αυτόματη ενημέρωση.',
  datainside: 'Τα δεδομένα σου είναι μέσα στον φάκελο του προγράμματος, οπότε η αυτόματη ενημέρωση δεν γίνεται. Βάλε το πρόγραμμα σε άλλον φάκελο ή άλλαξε τον φάκελο των δεδομένων από τις Ρυθμίσεις.'
};
function showUpdate(s) {
  const m = $('#upd-msg');
  if (s.status === 'manual') {
    updInfo = s;
    if (m) m.innerHTML = `Υπάρχει νέα έκδοση <b>${esc(s.version)}</b>. ${s.canAuto ? '<button class="btn small primary" data-action="update-now">Ενημέρωση τώρα</button>' : ''}`;
    if (updLater) return;
    if (s.canAuto) updBanner(`${icon('bolt')}<span class="grow">Υπάρχει νέα έκδοση <b>${esc(s.version)}</b> του GymTrack.</span><button class="btn small primary" data-action="update-now">Ενημέρωση τώρα</button><button class="btn small ghost" data-action="update-later">Αργότερα</button>`);
    else {
      const how = s.platform === 'darwin' ? 'Κατέβασε το zip και βάλε το νέο GymTrack στις Εφαρμογές στη θέση του παλιού.' : 'Κλείσε το GymTrack, κατέβασε το zip και βάλε τον νέο φάκελο στη θέση του παλιού.';
      updBanner(`${icon('bolt')}<span class="grow">Υπάρχει νέα έκδοση ${esc(s.version)}. ${how} Τα δεδομένα σου δεν χάνονται. ${UPD_WHY[s.reason] ? esc(UPD_WHY[s.reason]) : ''}</span><a class="btn small" href="${esc(s.url)}" target="_blank" rel="noreferrer">Κατέβασμα</a><button class="icon-btn sm" data-action="update-later" aria-label="Κλείσιμο">${icon('x')}</button>`);
    }
    return;
  }
  const msg = {
    checking: 'Έλεγχος…', latest: 'Έχεις την πιο νέα έκδοση ✓', error: 'Δεν έγινε έλεγχος (ίσως δεν υπάρχει internet).',
    downloading: `Κατεβαίνει η έκδοση ${esc(s.version)}…`, progress: `Κατεβαίνει η έκδοση ${esc(s.version)}… <b>${s.percent || 0}%</b>`,
    verifying: 'Έλεγχος ότι το αρχείο κατέβηκε σωστά…', installing: 'Ετοιμάζεται η νέα έκδοση…', restarting: 'Το GymTrack κλείνει και ξανανοίγει στη νέα έκδοση…'
  }[s.status];
  if (['downloading', 'progress', 'verifying', 'installing', 'restarting'].includes(s.status)) {
    updBanner(`${icon('timer')}<span class="grow">${msg} Μην κλείσεις τον υπολογιστή.</span>${s.status === 'progress' ? `<span class="upd-bar"><i style="width:${s.percent || 0}%"></i></span>` : ''}`);
    if (m) m.innerHTML = msg;
    return;
  }
  if (s.status === 'install-error') {
    updBanner(`${icon('info')}<span class="grow">Η ενημέρωση δεν έγινε: ${esc(s.message)}. Η τωρινή έκδοση συνεχίζει κανονικά.</span><button class="btn small" data-action="update-now">Ξανά</button>${s.url ? `<a class="btn small ghost" href="${esc(s.url)}" target="_blank" rel="noreferrer">Με το χέρι</a>` : ''}`, 'bad');
    if (m) m.textContent = 'Η ενημέρωση δεν έγινε.';
    return;
  }
  if (m && msg) m.innerHTML = msg;
}
if (window.gymtrack) window.gymtrack.onUpdate(showUpdate);

function askUpdate() {
  if (!updInfo || !updInfo.canAuto) return;
  confirmBox(`Ενημέρωση στην έκδοση ${esc(updInfo.version)}`,
    'Το GymTrack θα κατεβάσει τη νέα έκδοση, θα κλείσει και θα ξανανοίξει μόνο του σε λίγα δευτερόλεπτα. Τα δεδομένα σου δεν αλλάζουν, και πριν από την ενημέρωση κρατιέται αντίγραφο. Αν κάτι δεν πάει καλά, μένει η τωρινή έκδοση.',
    'Ενημέρωση τώρα', async () => {
      try { await persist(); } catch { /* τίποτα */ }
      updBanner(`${icon('timer')}<span class="grow">Ξεκινάει η ενημέρωση…</span>`);
      const r = await window.gymtrack.installUpdate();
      if (r && !r.ok && r.error) toast(r.error, 'bad');
    }, false);
}
async function checkJustUpdated() {
  if (!window.gymtrack || !window.gymtrack.justUpdated) return;
  const r = await window.gymtrack.justUpdated();
  if (r && r.to) toast(`${icon('check')} Το GymTrack ενημερώθηκε στην έκδοση ${esc(r.to)}.`);
  else if (r && r.failed) updBanner(`${icon('info')}<span class="grow">Η τελευταία ενημέρωση δεν ολοκληρώθηκε και έμεινε η προηγούμενη έκδοση. Τα δεδομένα σου είναι εντάξει.</span><button class="icon-btn sm" data-action="update-later" aria-label="Κλείσιμο">${icon('x')}</button>`, 'bad');
}
