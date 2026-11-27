// Μικρές δοκιμές: ενημέρωση εφαρμογής και υπολογισμοί (θερμίδες, πρωτεΐνη, προτάσεις βάρους)
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const assert = require('assert');
const upd = require('../updater');

let failed = 0, passed = 0;
async function t(name, fn) {
  try { await fn(); passed++; console.log('  ✓ ' + name); } catch (e) { failed++; console.log('  ✗ ' + name + '\n    ' + (e && e.stack || e)); }
}
// φορτώνει τα αρχεία της οθόνης που δεν χρειάζονται browser
function loadCore() {
  const ctx = { console, window: {}, document: { querySelector: () => null, addEventListener() {} }, localStorage: { getItem: () => null, setItem() {} } };
  ctx.window.addEventListener = () => {}; ctx.addEventListener = () => {};
  vm.createContext(ctx);
  const src = ['defaults.js', 'core.js'].map(f => fs.readFileSync(path.join(__dirname, '..', 'renderer', 'js', f), 'utf8').replace(/^'use strict';/, '')).join('\n');
  vm.runInContext(src + '\n;this.__x = { freshData, normalize, targets, bmr, suggestion, setDB: d => { DB = d; }, dayTotals, addDays, weekStart, streakWeeks };', ctx, { filename: 'renderer' });
  return ctx.__x;
}

(async () => {
  console.log('Μικρές δοκιμές');
  const C = loadCore();
  await t('θερμίδες και πρωτεΐνη από το προφίλ (Mifflin–St Jeor)', () => {
    const d = C.freshData(); d.profile.height = 178; d.body = [{ date: '2026-01-01', weight: 84 }]; C.setDB(d);
    assert.strictEqual(Math.round(C.bmr({ sex: 'm', weight: 84, height: 178, age: 25 })), 1833);
    const t = C.targets();
    assert.ok(t.ready); assert.strictEqual(t.auto.tdee, 2840); assert.strictEqual(t.kcal, 2440); assert.strictEqual(t.p, 170);
  });
  await t('χωρίς ύψος δεν βγαίνουν στόχοι, με δικούς του στόχους ναι', () => {
    const d = C.freshData(); C.setDB(d);
    assert.strictEqual(C.targets().ready, false);
    d.profile.manual = { kcal: 2200, p: 150 };
    assert.deepStrictEqual([C.targets().kcal, C.targets().p, C.targets().manual], [2200, 150, true]);
  });
  await t('normalize συμπληρώνει ό,τι λείπει και αντέχει χαλασμένα δεδομένα', () => {
    for (const bad of [null, 5, 'x', { food: [], sessions: 'x', program: { exercises: [] } }]) {
      const n = C.normalize(bad);
      assert.ok(Array.isArray(n.sessions) && n.program.exercises.length >= 5 && typeof n.food === 'object' && !Array.isArray(n.food));
    }
  });
  await t('πρόταση βάρους: ανεβαίνει μόνο όταν βγήκαν όλα τα σετ', () => {
    const d = C.freshData(); C.setDB(d);
    const ex = d.program.exercises.find(e => e.id === 'squat');
    d.sessions.push({ id: 'a', date: '2026-01-01', start: 1, end: 2, ex: [{ id: 'squat', kind: 'weight', sets: [1, 2, 3].map(() => ({ kg: 30, reps: 10, done: true })) }] });
    assert.strictEqual(C.suggestion(ex).up, true); assert.strictEqual(C.suggestion(ex).kg, 32.5);
    d.sessions.push({ id: 'b', date: '2026-01-03', start: 3, end: 4, ex: [{ id: 'squat', kind: 'weight', sets: [{ kg: 32.5, reps: 10, done: true }, { kg: 32.5, reps: 8, done: true }, { kg: 32.5, reps: 7, done: true }] }] });
    assert.strictEqual(C.suggestion(ex).up, false); assert.strictEqual(C.suggestion(ex).kg, 32.5);
  });
  await t('σύνολα ημέρας με μερίδες', () => {
    const d = C.freshData(); C.setDB(d);
    d.food['2026-01-01'] = [{ kcal: 250, p: 46, qty: 1.5 }, { kcal: 100, p: 0 }];
    const tt = C.dayTotals('2026-01-01'); assert.strictEqual(tt.kcal, 475); assert.strictEqual(tt.p, 69);
  });
  await t('ημερομηνίες: η εβδομάδα ξεκινάει Δευτέρα, αλλαγή μήνα', () => {
    assert.strictEqual(C.weekStart('2026-11-22'), '2026-11-16'); // Κυριακή → Δευτέρα
    assert.strictEqual(C.addDays('2026-02-28', 1), '2026-03-01');
  });

  console.log('Ενημέρωση εφαρμογής');
  await t('pickAssets βρίσκει το σωστό zip και τα αποτυπώματα', () => {
    const rel = { assets: [{ name: 'GymTrack-Windows-0.1.9.zip', browser_download_url: 'w', size: 1 }, { name: 'GymTrack-Mac-0.1.9.zip', browser_download_url: 'm', size: 2 }, { name: 'SHA256SUMS.txt', browser_download_url: 's' }] };
    assert.strictEqual(upd.pickAssets(rel, 'win32', '0.1.9').zipUrl, 'w');
    assert.strictEqual(upd.pickAssets(rel, 'darwin', '0.1.9').zipUrl, 'm');
    assert.strictEqual(upd.pickAssets({ assets: rel.assets.slice(0, 2) }, 'win32', '0.1.9'), null);
  });
  await t('parseSums διαβάζει το SHA256SUMS.txt', () => {
    const h = 'a'.repeat(64);
    assert.deepStrictEqual(upd.parseSums(`${h}  GymTrack-Mac-0.1.9.zip\n${'b'.repeat(64)} *GymTrack-Windows-0.1.9.zip\r\n`), { 'GymTrack-Mac-0.1.9.zip': h, 'GymTrack-Windows-0.1.9.zip': 'b'.repeat(64) });
  });
  await t('installTarget: Program Files και Mac', () => {
    assert.strictEqual(upd.installTarget('C:\\Program Files\\GymTrack\\GymTrack.exe', 'win32').reason, 'programfiles');
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ff-'));
    const app = path.join(dir, 'GymTrack.app', 'Contents', 'MacOS'); fs.mkdirSync(app, { recursive: true });
    const r = upd.installTarget(path.join(app, 'GymTrack'), 'darwin');
    assert.ok(r.ok); assert.strictEqual(r.appPath, path.join(dir, 'GymTrack.app'));
  });
  await t('helperScript: σωστή σύνταξη bash με ελληνικά', () => {
    const m = upd.helperScript('darwin', { pid: 42, appPath: "/Applications/Gym'Track.app", newPath: '/tmp/n/GymTrack.app', workDir: '/tmp/n', exeName: 'GymTrack', logFile: '/tmp/l' });
    const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'ff-')), 's.sh'); fs.writeFileSync(f, m.content);
    const r = require('child_process').spawnSync('bash', ['-n', f]); assert.strictEqual(r.status, 0, 'σύνταξη bash: ' + r.stderr);
  });
  await t('finishUpdate: βάζει τη νέα έκδοση, αλλιώς μένει η παλιά', async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ff-'));
    const app = path.join(dir, 'GymTrack πρόγραμμα'), nw = path.join(dir, 'tmp', 'x');
    fs.mkdirSync(app, { recursive: true }); fs.writeFileSync(path.join(app, 'GymTrack.exe'), 'old');
    fs.mkdirSync(nw, { recursive: true }); fs.writeFileSync(path.join(nw, 'GymTrack.exe'), 'new');
    let launched = null;
    const r = await upd.finishUpdate({ pid: 1, appPath: app, newPath: nw, exeName: 'GymTrack.exe' }, { isAlive: () => false, launch: p => { launched = p; }, wait: 2 });
    assert.ok(r.ok); assert.strictEqual(fs.readFileSync(path.join(app, 'GymTrack.exe'), 'utf8'), 'new'); assert.strictEqual(launched, path.join(app, 'GymTrack.exe'));
    const r2 = await upd.finishUpdate({ pid: 1, appPath: app, newPath: path.join(dir, 'δεν-υπάρχει'), exeName: 'GymTrack.exe' }, { isAlive: () => false, launch: () => {}, wait: 1 });
    assert.ok(!r2.ok); assert.strictEqual(fs.readFileSync(path.join(app, 'GymTrack.exe'), 'utf8'), 'new');
  });
  console.log(`\n${passed} πέρασαν, ${failed} απέτυχαν`);
  process.exit(failed ? 1 : 0);
})();
