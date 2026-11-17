// Ψεύτικα δεδομένα δοκιμής (ΠΟΤΕ πραγματικά): 6 εβδομάδες προπονήσεων, φαγητά, μετρήσεις
function key(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
function makeFixture(now = new Date()) {
  const day = n => { const d = new Date(now); d.setDate(d.getDate() - n); return d; };
  const ids = ['warmup', 'squat', 'chest', 'row', 'shoulder', 'pulldown', 'plank'];
  const kinds = { warmup: 'cardio', plank: 'time' };
  const sessions = [];
  for (let n = 42, i = 0; n > 0; n -= n % 7 === 0 ? 3 : 2, i++) {
    const d = day(n), start = d.setHours(18, 0, 0, 0);
    sessions.push({ id: 's' + i, date: key(new Date(start)), start, end: start + 52 * 60000, ex: ids.map(id => ({
      id, name: id, kind: kinds[id] || 'weight', target: { sets: 3, reps: 10 },
      sets: [0, 1, 2].map(() => ({ kg: kinds[id] ? null : 20 + i * 1.5, reps: kinds[id] ? 25 : 10, done: true }))
    })) });
  }
  const food = {};
  for (let n = 0; n < 9; n++) food[key(day(n))] = [
    { id: 'a' + n, name: 'Στραγγιστό γιαούρτι 2%', portion: '200 g', kcal: 150, p: 20, qty: 1, meal: 'breakfast' },
    { id: 'b' + n, name: 'Κοτόπουλο ψητό (στήθος)', portion: '150 g', kcal: 250, p: 46, qty: 1.5, meal: 'lunch' },
    { id: 'c' + n, name: 'Ένα πολύ πολύ μεγάλο όνομα φαγητού για να δούμε ότι χωράει σωστά στην οθόνη χωρίς πρόβλημα', portion: '1 μερίδα', kcal: 900, p: 30, qty: 1, meal: 'dinner' }
  ];
  const body = [6, 5, 4, 3, 2, 1, 0].map((w, i) => ({ date: key(day(w * 7)), weight: 86 - i * 0.6, waist: 96 - i * 0.8 }));
  return {
    version: 1,
    profile: { name: 'Νίκο', sex: 'm', age: 25, height: 178, activity: 1.55, goal: 'cut', manual: null },
    sessions, food, water: { [key(now)]: 5 }, body, myFoods: [{ id: 'm1', name: 'Σουβλάκι πλατείας', kcal: 420, p: 22, portion: '1 μερίδα' }],
    settings: { theme: 'dark', waterGoal: 8 }
  };
}
module.exports = { makeFixture };
