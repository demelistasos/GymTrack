// Δοκιμή οθόνης: ανοίγει την εφαρμογή σε browser με ψεύτικα δεδομένα, περνάει από κάθε σελίδα
// και καρτέλα σε 3 μεγέθη και στις δύο εμφανίσεις, και κάνει τις βασικές ενέργειες
// (προπόνηση με σετ, φαγητό, μέτρηση, λίστα, προφίλ). Αποτυγχάνει σε οποιοδήποτε σφάλμα.
// Τοπικά: PLAYWRIGHT=<φάκελος playwright-core> CHROME=<chrome> SHOTS=1 node tests/ui.test.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const { makeFixture } = require('./fixture');

const ROOT = path.join(__dirname, '..', 'renderer');
const SHOTS = process.env.SHOTS ? path.join(__dirname, 'shots') : null;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.png': 'image/png' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html');
  if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(res);
});

let failed = 0, passed = 0;
function check(ok, name) { if (ok) passed++; else { failed++; console.log('  ✗ ' + name); } }
const wait = (page, ms = 40) => page.waitForTimeout(ms);

async function overflow(page) { return page.evaluate(() => { const m = document.querySelector('.main'); return m.scrollWidth - m.clientWidth; }); }
async function shot(page, name) { if (SHOTS) await page.screenshot({ path: path.join(SHOTS, name + '.png'), fullPage: false }); }

(async () => {
  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}/index.html`;
  const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
  const SIZES = [[1440, 900], [900, 700], [390, 844]];
  for (const [w, h] of SIZES) for (const theme of ['dark', 'light']) {
    const tag = `${w}×${h} ${theme === 'dark' ? 'σκούρα' : 'φωτεινή'}`;
    console.log('▶ ' + tag);
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const errors = [];
    page.on('pageerror', e => errors.push('σφάλμα: ' + e.message));
    page.on('console', m => { if (m.type() === 'error' && !/favicon/.test(m.text())) errors.push('console: ' + m.text()); });
    await page.goto(url);
    const fx = makeFixture(); fx.settings.theme = theme;
    await page.evaluate(d => { localStorage.clear(); localStorage.setItem('gymtrack-data', d); }, JSON.stringify(fx));
    await page.reload(); await wait(page, 300);
    const s = `${w}-${theme}`;
    check(await page.$eval('#page', e => e.innerText.length > 50), `${tag}: η αρχική φορτώνει`);
    check(await page.evaluate(() => document.documentElement.dataset.theme) === theme, `${tag}: σωστή εμφάνιση`);
    check(!(await page.$('.setup')), `${tag}: με προφίλ δεν ζητάει στόχους`);
    await shot(page, `${s}-1-today`);
    const pages = await page.$$eval('#nav button', bs => bs.map(b => b.dataset.page));
    check(pages.length === 6, `${tag}: το μενού έχει 6 σελίδες`);
    for (const pg of pages) {
      await page.click(`#nav button[data-page="${pg}"]`); await wait(page);
      const tabs = await page.$$eval('.tabs .tab', ts => ts.map(t => t.dataset.k));
      for (const k of [null, ...tabs]) {
        if (k) { await page.click(`.tabs .tab[data-k="${k}"]`); await wait(page); }
        const over = await overflow(page);
        check(over <= 2, `${tag}: «${pg}${k ? ' / ' + k : ''}» χωράει στο πλάτος (ξεχειλίζει ${over}px)`);
        if (w === 1440 || w === 390) await shot(page, `${s}-p-${pg}${k ? '-' + k : ''}`);
      }
    }
    // --- προπόνηση: ξεκίνημα, κιλά, σετ, ξεκούραση, τέλος ---
    await page.click('#nav button[data-page="workout"]'); await wait(page);
    await page.click('.tabs .tab[data-k="program"]'); await wait(page);
    check(await page.$$eval('.ex-card', e => e.length) === 7, `${tag}: το πρόγραμμα έχει 7 ασκήσεις`);
    check(await page.$('.hint.up') !== null, `${tag}: προτείνει ανέβασμα βάρους`);
    await page.click('[data-action="tip-toggle"] >> nth=1'); await wait(page);
    check(await page.$('.tip') !== null, `${tag}: δείχνει πώς γίνεται η άσκηση`);
    await page.click('.page-head [data-action="workout-start"]'); await wait(page, 80);
    check(await page.$('#elapsed') !== null, `${tag}: ξεκίνησε η προπόνηση`);
    const kg = page.locator('input[data-set="kg"]').first();
    await kg.fill('60,5'); await wait(page);
    await page.click('[data-action="set-done"] >> nth=1'); await wait(page, 1200);
    check(await page.$eval('#rest', e => e.classList.contains('show')), `${tag}: ξεκινάει η ξεκούραση`);
    check(await page.evaluate(() => DB.active.ex[1].sets[0].done && DB.active.ex[1].sets[0].kg === '60,5' && DB.active.ex[1].sets[1].kg === '60,5'), `${tag}: κρατάει τα κιλά και τα περνάει στο επόμενο σετ`);
    check(await overflow(page) <= 2, `${tag}: η προπόνηση χωράει στο πλάτος`);
    await shot(page, `${s}-2-session`);
    await page.click('[data-action="rest-skip"]'); await wait(page);
    await page.click('[data-action="set-add"] >> nth=1'); await wait(page);
    check(await page.evaluate(() => DB.active.ex[1].sets.length === 4), `${tag}: προσθέτει σετ`);
    await page.click('[data-action="workout-finish"]'); await wait(page, 80);
    check(await page.$eval('#modal', m => m.classList.contains('open') && /ολοκληρώθηκε/.test(m.innerText)), `${tag}: σύνοψη στο τέλος`);
    check(await page.evaluate(() => DB.active === null && DB.sessions[DB.sessions.length - 1].ex[1].sets[0].kg === 60.5), `${tag}: η προπόνηση αποθηκεύτηκε`);
    check(await page.$eval('#modal', m => /ρεκόρ/i.test(m.innerText)), `${tag}: δείχνει νέο ρεκόρ`);
    await shot(page, `${s}-3-finish`);
    await page.click('#modal [data-action="modal-close"] >> nth=-1'); await wait(page);
    // --- διατροφή ---
    await page.click('#nav button[data-page="food"]'); await wait(page);
    await page.click('.tabs .tab[data-k="log"]'); await wait(page);
    const before = await page.evaluate(() => dayTotals(today()).kcal);
    await page.click('.page-head [data-action="food-add"]'); await wait(page);
    check(await page.$('.pick-list') !== null, `${tag}: ανοίγει η επιλογή φαγητού`);
    await shot(page, `${s}-4-picker`);
    await page.fill('[data-field="pick-q"]', 'τόνο'); await wait(page);
    check(await page.$$eval('.pick-item', e => e.length) === 1, `${tag}: η αναζήτηση βρίσκει τον τόνο`);
    await page.click('[data-action="pick-qty"][data-v="2"]'); await wait(page);
    await page.click('.pick-item'); await wait(page);
    check(await page.evaluate(b => Math.round(dayTotals(today()).kcal - b), before) === 260, `${tag}: προστέθηκε ο τόνος ×2`);
    await page.click('[data-action="food-add"][data-meal="snack"]'); await wait(page);
    await page.click('.custom summary'); await page.fill('.custom input[name="name"]', 'Κουλούρι Θεσσαλονίκης'); await page.fill('.custom input[name="kcal"]', '280'); await page.fill('.custom input[name="p"]', '8');
    await page.click('.custom button.primary'); await wait(page);
    check(await page.evaluate(() => DB.myFoods.some(f => f.name === 'Κουλούρι Θεσσαλονίκης') && dayFood(today()).some(f => f.meal === 'snack' && f.kcal === 280)), `${tag}: δικό μου φαγητό`);
    await page.click('[data-action="food-day"][data-n="-1"]'); await wait(page);
    check(/Χθες/.test(await page.$eval('.date-nav', e => e.innerText)), `${tag}: πάει στη χθεσινή μέρα`);
    check(await overflow(page) <= 2, `${tag}: η διατροφή χωράει στο πλάτος`);
    // --- μέτρηση ---
    await page.click('#nav button[data-page="progress"]'); await wait(page);
    await page.click('.page-head [data-action="body-add"]'); await wait(page);
    await page.fill('input[name="weight"]', '81,2'); await page.fill('input[name="waist"]', '90');
    await page.click('form[data-form="body"] button.primary'); await wait(page);
    check(await page.evaluate(() => currentWeight() === 81.2), `${tag}: αποθηκεύτηκε η μέτρηση`);
    // --- λίστα ---
    await page.click('#nav button[data-page="shop"]'); await wait(page);
    await page.fill('form[data-form="shop-add"] input', 'Φέτα'); await page.press('form[data-form="shop-add"] input', 'Enter'); await wait(page);
    check(await page.evaluate(() => DB.shop.some(i => i.name === 'Φέτα')), `${tag}: προστέθηκε στη λίστα`);
    await page.click('[data-action="shop-toggle"] >> nth=0'); await wait(page);
    check(await page.$('.shop-row.done') !== null, `${tag}: τσεκάρεται στη λίστα`);
    // --- προφίλ ---
    await page.click('#nav button[data-page="settings"]'); await wait(page);
    await page.click('.page [data-action="profile-setup"]'); await wait(page);
    await page.click('label.opt:has(input[value="keep"])'); await wait(page);
    check(/kcal/.test(await page.$eval('#target-preview', e => e.innerText)), `${tag}: δείχνει τους στόχους πριν την αποθήκευση`);
    await shot(page, `${s}-5-profile`);
    await page.click('form[data-form="profile"] button.primary'); await wait(page);
    check(await page.evaluate(() => DB.profile.goal === 'keep'), `${tag}: αποθηκεύτηκε το προφίλ`);
    // αλλαγή εμφάνισης
    await page.click(`[data-action="theme"][data-v="${theme === 'dark' ? 'light' : 'dark'}"]`); await wait(page);
    check(await page.evaluate(t => document.documentElement.dataset.theme !== t, theme), `${tag}: αλλάζει η εμφάνιση`);
    // αποθηκεύτηκαν όλα;
    await page.waitForTimeout(400); await page.reload(); await wait(page, 300);
    check(await page.evaluate(() => DB.shop.some(i => i.name === 'Φέτα') && DB.profile.goal === 'keep'), `${tag}: τα δεδομένα μένουν μετά το άνοιγμα ξανά`);
    check(!errors.length, `${tag}: χωρίς σφάλματα${errors.length ? ': ' + errors.join(' | ') : ''}`);
    await page.close();
  }
  // πρώτη φορά, χωρίς δεδομένα
  {
    const tag = 'πρώτη φορά';
    console.log('▶ ' + tag);
    const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(url); await page.evaluate(() => localStorage.clear()); await page.reload(); await wait(page, 300);
    check(await page.$('.setup') !== null, `${tag}: ζητάει τα στοιχεία για τους στόχους`);
    await shot(page, 'first-1-today');
    for (const pg of ['workout', 'food', 'progress', 'shop', 'settings', 'today']) { await page.click(`#nav button[data-page="${pg}"]`); await wait(page); }
    await page.click('.setup [data-action="profile-setup"]'); await wait(page);
    await page.fill('input[name="height"]', '178'); await page.fill('input[name="weight"]', '84');
    await page.click('form[data-form="profile"] button.primary'); await wait(page);
    check(await page.$('.setup') === null && await page.evaluate(() => targets().kcal === 2440), `${tag}: μετά το προφίλ βγαίνουν οι στόχοι`);
    await page.click('#nav button[data-page="workout"]'); await wait(page);
    await page.click('[data-action="workout-start"]'); await wait(page);
    await page.click('[data-action="workout-finish"]'); await wait(page);
    check(await page.$eval('#modal', m => /Κανένα σετ/.test(m.innerText)), `${tag}: προειδοποιεί όταν δεν έγινε κανένα σετ`);
    await page.click('[data-action="confirm-ok"]'); await wait(page);
    check(await page.evaluate(() => DB.active === null && DB.sessions.length === 0), `${tag}: κλείνει χωρίς να αποθηκεύσει`);
    await shot(page, 'first-2-today-ready');
    check(!errors.length, `${tag}: χωρίς σφάλματα${errors.length ? ': ' + errors.join(' | ') : ''}`);
    await page.close();
  }
  await browser.close(); server.close();
  console.log(`\n${passed} πέρασαν, ${failed} απέτυχαν`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
