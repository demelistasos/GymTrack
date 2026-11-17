'use strict';
// GymTrack · Κομμάτια οθόνης: εικονίδια, ειδοποιήσεις, παράθυρα, δακτύλιοι, γραφήματα

const ICON_PATHS = {
  today: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-6h4v6"/>',
  workout: '<path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11"/>',
  food: '<path d="M7 3v8a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V3M9 13v8M17 3c-2 1.5-3 4-3 7h3v11"/>',
  progress: '<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-7"/>',
  shop: '<path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2"/><circle cx="10" cy="20.5" r="1"/><circle cx="17" cy="20.5" r="1"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  left: '<path d="m15 18-6-6 6-6"/>',
  right: '<path d="m9 18 6-6-6-6"/>',
  down: '<path d="m6 9 6 6 6-6"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>',
  timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2M9.5 2.5h5"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  flame: '<path d="M12 21c-4 0-7-2.7-7-6.6 0-3.1 2-5.2 3.6-6.9.3 1.7 1.2 2.9 2.4 3.4C11 7.7 12.6 5 15 3c0 3.2 4 5.6 4 10.6 0 4.2-3 7.4-7 7.4z"/>',
  drop: '<path d="M12 3s6 6.4 6 11a6 6 0 0 1-12 0c0-4.6 6-11 6-11z"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/>',
  scale: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8.5 9.5a5 5 0 0 1 7 0L12 13z"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  folder: '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5H9l2 2.5h8.5A1.5 1.5 0 0 1 21 9v9.5a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z"/>'
};
const icon = (n, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[n] || ''}</svg>`;

// ---------- ειδοποίηση κάτω κάτω ----------
let toastTimer = null;
function toast(msg, kind = '') {
  const t = $('#toast'); if (!t) return;
  t.className = 'toast show ' + kind; t.innerHTML = msg;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
}

// ---------- παράθυρο ----------
let modalOnClose = null;
function openModal(title, body, { wide = false, onClose = null } = {}) {
  const m = $('#modal');
  m.innerHTML = `<div class="sheet ${wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="sheet-head"><h2>${title}</h2><button class="icon-btn" data-action="modal-close" aria-label="Κλείσιμο">${icon('x')}</button></div>
    <div class="sheet-body">${body}</div></div>`;
  m.classList.add('open'); modalOnClose = onClose;
  const f = m.querySelector('[autofocus]'); if (f) setTimeout(() => f.focus(), 30);
}
function closeModal() {
  const m = $('#modal'); if (!m.classList.contains('open')) return;
  m.classList.remove('open'); m.innerHTML = '';
  const cb = modalOnClose; modalOnClose = null; if (cb) cb();
}
// ερώτηση επιβεβαίωσης μέσα στην εφαρμογή
function confirmBox(title, text, okLabel, onOk, danger = true) {
  openModal(title, `<p class="muted">${text}</p><div class="row end gap"><button class="btn ghost" data-action="modal-close">Άκυρο</button><button class="btn ${danger ? 'danger' : 'primary'}" data-action="confirm-ok">${okLabel}</button></div>`);
  pendingConfirm = onOk;
}
let pendingConfirm = null;

// ---------- δακτύλιος προόδου ----------
function ring(value, max, { size = 132, stroke = 12, color = 'var(--accent)', label = '', sub = '' } = {}) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  const frac = max ? Math.min(value / max, 1) : 0;
  const over = max && value > max;
  return `<div class="ring" style="width:${size}px;height:${size}px">
    <svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="var(--track)" stroke-width="${stroke}" fill="none"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="${over ? 'var(--warn)' : color}" stroke-width="${stroke}" fill="none"
        stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - frac)}" transform="rotate(-90 ${size / 2} ${size / 2})"/>
    </svg>
    <div class="ring-in"><b>${label}</b><span>${sub}</span></div></div>`;
}
function bar(value, max, color = 'var(--accent)') {
  const f = max ? Math.min(value / max, 1) : 0;
  return `<div class="bar"><i style="width:${f * 100}%;background:${max && value > max ? 'var(--warn)' : color}"></i></div>`;
}

// ---------- γράφημα γραμμής (SVG) ----------
// points: [{x: 'YYYY-MM-DD', y: number}], επιστρέφει SVG που προσαρμόζεται στο πλάτος
function lineChart(points, { color = 'var(--accent)', unit = '', height = 180, dec = 1, target = null } = {}) {
  if (points.length < 2) return `<div class="chart-empty">${points.length ? 'Χρειάζεται τουλάχιστον μία ακόμα μέτρηση για γράφημα.' : 'Δεν υπάρχουν ακόμα μετρήσεις.'}</div>`;
  const W = 640, H = height, L = 44, R = 14, T = 14, B = 26;
  const xs = points.map(p => parseKey(p.x).getTime()), ys = points.map(p => p.y);
  let lo = Math.min(...ys, target ?? Infinity), hi = Math.max(...ys, target ?? -Infinity);
  if (hi - lo < 1) { hi += 0.5; lo -= 0.5; }
  const padY = (hi - lo) * 0.15; lo -= padY; hi += padY;
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const X = t => L + (x1 === x0 ? 0.5 : (t - x0) / (x1 - x0)) * (W - L - R);
  const Y = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${X(xs[i]).toFixed(1)},${Y(p.y).toFixed(1)}`).join('');
  const area = `${path}L${X(xs[xs.length - 1]).toFixed(1)},${H - B}L${X(xs[0]).toFixed(1)},${H - B}Z`;
  const ticks = [lo + (hi - lo) * 0.15, (lo + hi) / 2, hi - (hi - lo) * 0.15];
  const id = 'g' + uid();
  const labelsX = [0, Math.floor((points.length - 1) / 2), points.length - 1].filter((v, i, a) => a.indexOf(v) === i);
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img">
    <defs><linearGradient id="${id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".28"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
    ${ticks.map(v => `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" class="grid"/><text x="${L - 8}" y="${Y(v) + 4}" text-anchor="end" class="axis">${fmt(v, dec)}</text>`).join('')}
    ${target != null ? `<line x1="${L}" x2="${W - R}" y1="${Y(target)}" y2="${Y(target)}" class="target"/>` : ''}
    <path d="${area}" fill="url(#${id})"/>
    <path d="${path}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
    ${points.map((p, i) => `<circle cx="${X(xs[i])}" cy="${Y(p.y)}" r="3.5" fill="var(--surface)" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke"><title>${shortDate(p.x)}: ${fmt(p.y, dec)} ${unit}</title></circle>`).join('')}
    ${labelsX.map(i => `<text x="${X(xs[i])}" y="${H - 6}" text-anchor="${i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}" class="axis">${shortDate(points[i].x)}</text>`).join('')}
  </svg>`;
}
// μπάρες (π.χ. προπονήσεις ανά εβδομάδα)
// mode 'min': ο στόχος είναι ελάχιστο (π.χ. προπονήσεις), 'max': ανώτατο (π.χ. θερμίδες)
function barChart(items, { max = null, color = 'var(--accent)', goal = null, mode = 'min' } = {}) {
  const m = max || Math.max(1, ...items.map(i => i.v), goal || 0) * 1.12;
  const col = v => !v ? 'var(--muted-2)' : mode === 'max' ? (goal && v > goal * 1.05 ? 'var(--warn)' : color) : (goal && v >= goal ? color : 'var(--muted-2)');
  return `<div class="bars">${items.map(i => `<div class="bars-col" title="${esc(i.title || '')}">
    <div class="bars-track">${goal ? `<span class="bars-goal" style="bottom:${goal / m * 100}%"></span>` : ''}<i style="height:${i.v / m * 100}%;background:${col(i.v)}"></i></div>
    <span class="bars-v">${i.v ? fmt(i.v) : ''}</span><span class="bars-l">${esc(i.label)}</span></div>`).join('')}</div>`;
}
