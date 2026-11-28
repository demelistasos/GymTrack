'use strict';
// GymTrack · Λίστα για το σούπερ μάρκετ

function pageShop() {
  const cats = [...new Set(DB.shop.map(i => i.cat || 'Άλλα'))];
  const left = DB.shop.filter(i => !i.done).length;
  return `<header class="page-head"><div><p class="eyebrow">Λίστα</p><h1>Σούπερ μάρκετ</h1></div>
      <span class="muted">${left ? `${left} πράγματα να πάρεις` : 'Τα πήρες όλα'}</span></header>
    <form class="card add-bar" data-form="shop-add">
      <input name="name" placeholder="Πρόσθεσε κάτι στη λίστα…" aria-label="Νέο πράγμα" required>
      <select name="cat" aria-label="Κατηγορία">${[...new Set([...cats, 'Πρωτεΐνη', 'Υδατάνθρακες', 'Φρούτα & λαχανικά', 'Σνακ', 'Άλλα'])].map(c => `<option>${esc(c)}</option>`).join('')}</select>
      <button class="btn primary">${icon('plus')} Πρόσθεσε</button>
    </form>
    <div class="grid two-col shop-grid">${cats.map(c => `<div class="card">
      <h3>${esc(c)}</h3>
      ${DB.shop.filter(i => (i.cat || 'Άλλα') === c).map(i => `<div class="shop-row ${i.done ? 'done' : ''}">
        <button class="check-btn ${i.done ? 'on' : ''}" data-action="shop-toggle" data-id="${i.id}" aria-label="${esc(i.name)}">${icon('check')}</button>
        <span class="grow">${esc(i.name)}</span>
        <button class="icon-btn sm" data-action="shop-del" data-id="${i.id}" aria-label="Αφαίρεση">${icon('x')}</button></div>`).join('')}
    </div>`).join('')}</div>
    <div class="row gap wrap">
      <button class="btn ghost" data-action="shop-reset">Ξεκίνα πάλι (ξε-τσέκαρε όλα)</button>
      ${DB.shop.some(i => i.done) ? '<button class="btn ghost" data-action="shop-clear">Αφαίρεσε όσα πήρα</button>' : ''}
    </div>`;
}
