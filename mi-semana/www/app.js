/* Mi Semana — agenda semanal rápida */
(() => {
  'use strict';

  const STORE_KEY = 'misemana.tasks.v1';
  const DAY_LETTERS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  const DAY_NAMES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const DAY_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
    'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  // Un color por día de la semana (índice = getDay(), 0 = domingo)
  const DAY_COLORS = ['#E03131', '#5B5BF0', '#D6336C', '#E8590C', '#0CA678', '#1C7ED6', '#9C36B5'];

  // ---------- Fechas ----------
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const toDate = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const addDays = (s, n) => { const d = toDate(s); d.setDate(d.getDate() + n); return ymd(d); };
  const todayStr = () => ymd(new Date());
  const weekday = (s) => toDate(s).getDay();
  const mondayOf = (s) => addDays(s, -((weekday(s) + 6) % 7));
  const diffDays = (a, b) => Math.round((toDate(b) - toDate(a)) / 86400000);

  function relLabel(s) {
    const d = diffDays(todayStr(), s);
    if (d === 0) return 'Hoy';
    if (d === 1) return 'Mañana';
    if (d === 2) return 'Pasado mañana';
    if (d === -1) return 'Ayer';
    return cap(DAY_NAMES[weekday(s)]);
  }
  const longDate = (s) => { const d = toDate(s); return `${DAY_NAMES[d.getDay()]}, ${d.getDate()} de ${MONTHS[d.getMonth()]}`; };
  const shortDate = (s) => { const d = toDate(s); return `${DAY_SHORT[d.getDay()]} ${d.getDate()}`; };
  const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);

  // ---------- Estado ----------
  let tasks = load();
  let today = todayStr();
  let selected = today;
  let view = 'day';
  let editingId = null;
  let undoSnapshot = null;
  let toastTimer = null;
  let lastAddedId = null;

  function load() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch { return []; }
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(tasks)); } catch { /* sin almacenamiento */ }
  }
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  // ---------- Analizador de frases rápidas ----------
  const L = '[\\p{L}\\d]';
  const B0 = `(?<!${L})`;
  const B1 = `(?!${L})`;
  const rx = (src) => new RegExp(B0 + src + B1, 'iu');
  const NUM_WORDS = { un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10 };
  const WEEKDAYS_RX = { lunes: 1, martes: 2, 'mi[eé]rcoles': 3, jueves: 4, viernes: 5, 's[aá]bado': 6, domingo: 0 };
  const strip = (t) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  function parseQuick(input) {
    let text = ' ' + input.trim() + ' ';
    let date = null;
    let time = null;
    const base = todayStr();
    const take = (m) => { text = text.slice(0, m.index) + ' ' + text.slice(m.index + m[0].length); };

    // --- Hora ---
    const timeRules = [
      { re: rx('(?:a|sobre|hacia|para)\\s+las?\\s+(\\d{1,2})(?:[:.h](\\d{2}))?(?:\\s*(?:h|hs|horas?))?(?:\\s+(?:de|por)\\s+la\\s+(ma[ñn]ana|tarde|noche)|\\s*(am|pm))?'), guess: true },
      { re: rx('(\\d{1,2}):(\\d{2})(?:\\s+(?:de|por)\\s+la\\s+(ma[ñn]ana|tarde|noche)|\\s*(am|pm))?'), guess: false },
      { re: rx('(\\d{1,2})\\s*(?:h|hs)(?:\\s+(?:de|por)\\s+la\\s+(ma[ñn]ana|tarde|noche))?'), guess: false, noMin: true },
    ];
    for (const r of timeRules) {
      const m = text.match(r.re);
      if (!m) continue;
      let h = +m[1];
      const min = r.noMin ? 0 : +(m[2] || 0);
      const q = strip((r.noMin ? m[2] : (m[3] || m[4])) || '');
      if ((q === 'tarde' || q === 'noche' || q === 'pm') && h < 12) h += 12;
      else if ((q === 'manana' || q === 'am' || q === 'noche') && h === 12) h = 0;
      else if (!q && r.guess && h >= 1 && h <= 7) h += 12; // "a las 5" → 17:00
      if (h < 24 && min < 60) { time = `${pad(h)}:${pad(min)}`; take(m); }
      break;
    }

    // --- Día ---
    const dateRules = [
      [rx('pasado\\s+ma[ñn]ana'), () => addDays(base, 2)],
      [new RegExp(`(?<!la\\s)${B0}ma[ñn]ana${B1}`, 'iu'), () => addDays(base, 1)],
      [rx('hoy'), () => base],
      [rx('(?:la\\s+)?(?:semana\\s+que\\s+viene|pr[oó]xima\\s+semana)'), () => addDays(base, 7)],
      [rx('(?:dentro\\s+de|en)\\s+(\\d{1,2}|un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\\s+(d[ií]as?|semanas?)'), (m) => {
        const n = NUM_WORDS[strip(m[1])] || +m[1];
        return addDays(base, strip(m[2]).startsWith('semana') ? n * 7 : n);
      }],
      [rx('(?:el\\s+)?(?:d[ií]a\\s+)?(\\d{1,2})[/-](\\d{1,2})(?:[/-](\\d{2,4}))?'), (m) => {
        const now = toDate(base);
        let y = m[3] ? +m[3] : now.getFullYear();
        if (y < 100) y += 2000;
        const d = new Date(y, +m[2] - 1, +m[1]);
        if (d.getMonth() !== +m[2] - 1) return null;
        if (!m[3] && ymd(d) < base) d.setFullYear(y + 1);
        return ymd(d);
      }],
      [rx(`(?:el\\s+)?(?:d[ií]a\\s+)?(\\d{1,2})\\s+de\\s+(${MONTHS.join('|')}|setiembre)`), (m) => {
        const now = toDate(base);
        const mon = strip(m[2]) === 'setiembre' ? 8 : MONTHS.indexOf(strip(m[2]));
        const d = new Date(now.getFullYear(), mon, +m[1]);
        if (d.getMonth() !== mon) return null;
        if (ymd(d) < base) d.setFullYear(now.getFullYear() + 1);
        return ymd(d);
      }],
      [rx(`(?:el\\s+|este\\s+|el\\s+pr[oó]ximo\\s+|pr[oó]ximo\\s+)?(${Object.keys(WEEKDAYS_RX).join('|')})(?:\\s+que\\s+viene)?`), (m) => {
        const target = WEEKDAYS_RX[Object.keys(WEEKDAYS_RX).find((k) => new RegExp(`^${k}$`, 'iu').test(m[1]))];
        let delta = (target - weekday(base) + 7) % 7;
        const isThis = /^este\s/i.test(m[0].trim());
        if (delta === 0 && !isThis) delta = 7;
        return addDays(base, delta);
      }],
      [rx('(?:el\\s+)?d[ií]a\\s+(\\d{1,2})'), (m) => {
        const now = toDate(base);
        const d = new Date(now.getFullYear(), now.getMonth(), +m[1]);
        if (d.getDate() !== +m[1]) return null;
        if (ymd(d) < base) d.setMonth(d.getMonth() + 1);
        return ymd(d);
      }],
    ];
    for (const [re, fn] of dateRules) {
      const m = text.match(re);
      if (!m) continue;
      const res = fn(m);
      if (res) { date = res; take(m); break; }
    }

    // --- Limpieza del texto ---
    text = text.replace(/\s+/g, ' ').trim()
      .replace(/^[,.;:\-–\s]+|[,.;:\-–\s]+$/g, '')
      .replace(/\s+([,.;:])/g, '$1')
      .replace(/^(?:el|la|a|de|que|y)\s+/i, '')
      .replace(/\s+(?:el|la|a|de|que|y|para)$/i, '')
      .trim();
    return { text: cap(text), date, time };
  }

  // ---------- Emoji automático según la tarea ----------
  const EMOJI_RULES = [
    [/medic|doctor|dentista|hospital|ambulatorio|analisis|cita medica|pediatra|fisio/, '🩺'],
    [/pastilla|medicamento|farmacia|receta/, '💊'],
    [/compra|super|mercado|mercadona|lidl|carrefour|tienda/, '🛒'],
    [/llama|telefono|movil/, '📞'],
    [/gym|gimnasio|entrena|correr|deporte|futbol|padel|yoga|nadar|piscina/, '💪'],
    [/estudi|examen|clase|deberes|universidad|insti|trabajo de|practica|tarea/, '📚'],
    [/reunion|oficina|jefe|curro|trabajo|proyecto|presentacion/, '💼'],
    [/cumple|fiesta|celebra/, '🎂'],
    [/regalo/, '🎁'],
    [/paga|factura|banco|recibo|transferencia|hacienda|alquiler/, '💳'],
    [/limpia|lava|colada|ropa|plancha|barrer|fregar|basura/, '🧹'],
    [/cena|comida|comer|almuerzo|desayuno|restaurante|cocinar/, '🍽️'],
    [/cafe/, '☕'],
    [/correo|email|mail|escribir a/, '📧'],
    [/whatsapp|mensaje|escribe/, '💬'],
    [/coche|taller|gasolina|itv|moto/, '🚗'],
    [/bus|autobus|tren|metro/, '🚌'],
    [/perro|gato|veterinario|mascota/, '🐾'],
    [/viaje|vuelo|avion|maleta|aeropuerto|hotel/, '✈️'],
    [/leer|libro|biblioteca/, '📖'],
    [/pelu|corte de pelo|barberia/, '✂️'],
    [/peli|cine|serie/, '🎬'],
    [/musica|concierto|guitarra|piano/, '🎵'],
    [/amig|quedar|quedada/, '🙌'],
    [/mama|papa|familia|abuel|herman/, '❤️'],
    [/casa|arreglar|bricolaje|mudanza/, '🏠'],
    [/planta|jardin|regar/, '🪴'],
    [/dormir|siesta|descansar/, '😴'],
    [/paquete|envio|correos|amazon|devolver|devolucion/, '📦'],
  ];
  function emojiFor(text) {
    const t = strip(text);
    for (const [re, e] of EMOJI_RULES) if (re.test(t)) return e;
    return '📌';
  }

  // ---------- Utilidades de UI ----------
  const $ = (id) => document.getElementById(id);
  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function haptic(kind = 'LIGHT') {
    try {
      const H = window.Capacitor?.Plugins?.Haptics;
      if (H) { H.impact({ style: kind }); return; }
      navigator.vibrate?.(kind === 'HEAVY' ? 25 : 10);
    } catch { /* sin vibración */ }
  }

  function setAccent(color) {
    document.documentElement.style.setProperty('--accent', color);
    document.querySelector('meta[name="theme-color"]').setAttribute('content', color);
  }

  const sortTasks = (a, b) => {
    if (a.time && b.time) return a.time.localeCompare(b.time);
    if (a.time) return -1;
    if (b.time) return 1;
    return a.created - b.created;
  };

  // ---------- Render ----------
  function render() {
    save();
    scheduleSoon();
    setAccent(DAY_COLORS[weekday(selected)]);
    const sd = toDate(selected);
    $('monthLabel').textContent = `${MONTHS[sd.getMonth()]} ${sd.getFullYear()}`;
    $('todayBtn').style.visibility = selected === today ? 'hidden' : 'visible';
    $('viewToggle').textContent = view === 'day' ? '▦' : '☰';
    $('viewToggle').setAttribute('aria-label', view === 'day' ? 'Ver semana' : 'Ver día');
    renderStrip();
    $('dayView').hidden = view !== 'day';
    $('weekView').hidden = view !== 'week';
    if (view === 'day') renderDay(); else renderWeek();
    updatePreview();
  }

  function renderStrip() {
    const mon = mondayOf(selected);
    let html = '';
    for (let i = 0; i < 7; i++) {
      const d = addDays(mon, i);
      const list = tasks.filter((t) => t.date === d);
      const pending = list.filter((t) => !t.done).length;
      const dots = list.slice(0, 4).map((t) => `<i class="dot${t.done ? ' done' : ''}"></i>`).join('');
      const late = d < today && pending > 0;
      html += `<button class="day-chip${d === selected ? ' selected' : ''}${d === today ? ' today' : ''}" data-date="${d}" aria-label="${longDate(d)}">
        ${late ? '<i class="late"></i>' : ''}
        <span class="dn">${DAY_LETTERS[weekday(d)]}</span>
        <span class="dd">${toDate(d).getDate()}</span>
        <span class="dots">${dots}</span>
      </button>`;
    }
    $('weekStrip').innerHTML = html;
  }

  function taskHTML(t, opts = {}) {
    const later = opts.overdue ? 'Hoy ↩' : 'Mañana ⏭';
    const tags = [];
    if (t.time) tags.push(`<span class="tag time">🕒 ${t.time}</span>`);
    if (opts.overdue) tags.push(`<span class="tag late">${relLabel(t.date) === 'Ayer' ? 'Ayer' : shortDate(t.date)}</span>`);
    if (t.moved > 0) tags.push(`<span class="tag moved">↻ aplazada ${t.moved === 1 ? '1 vez' : t.moved + ' veces'}</span>`);
    return `<li class="task-wrap${t.id === lastAddedId ? ' is-new' : ''}" data-id="${t.id}" data-overdue="${opts.overdue ? 1 : 0}">
      <div class="swipe-bg"><span class="l">✓ Hecho</span><span class="r">${opts.overdue ? 'A hoy ↩' : 'A mañana ⏭'}</span></div>
      <div class="task${t.done ? ' done' : ''}">
        <button class="check" data-act="toggle" aria-label="${t.done ? 'Marcar pendiente' : 'Marcar hecha'}">${t.done ? '✓' : ''}</button>
        <div class="emoji">${t.emoji || emojiFor(t.text)}</div>
        <div class="body" data-act="edit">
          <p class="text">${esc(t.text)}</p>
          ${tags.length ? `<div class="meta">${tags.join('')}</div>` : ''}
        </div>
        <button class="later-btn" data-act="later">${later}</button>
      </div>
    </li>`;
  }

  function ring(done, total) {
    const r = 23, c = 2 * Math.PI * r;
    const pct = total ? done / total : 0;
    return `<svg class="ring" viewBox="0 0 54 54" aria-hidden="true">
      <circle class="bg" cx="27" cy="27" r="${r}"/>
      <circle class="fg" cx="27" cy="27" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct)}" transform="rotate(-90 27 27)"/>
      <text x="27" y="31.5" text-anchor="middle">${total ? Math.round(pct * 100) + '%' : '—'}</text>
    </svg>`;
  }

  function renderDay() {
    const list = tasks.filter((t) => t.date === selected);
    const pending = list.filter((t) => !t.done).sort(sortTasks);
    const done = list.filter((t) => t.done).sort((a, b) => (a.doneAt || 0) - (b.doneAt || 0));
    const rel = relLabel(selected);
    const isName = rel.toLowerCase() === DAY_NAMES[weekday(selected)];
    const sub = isName ? `${toDate(selected).getDate()} de ${MONTHS[toDate(selected).getMonth()]}` : longDate(selected);
    const count = list.length
      ? (pending.length ? `${pending.length} pendiente${pending.length > 1 ? 's' : ''}` : 'todo hecho ✨')
      : 'sin tareas';
    $('dayHead').innerHTML = `${ring(done.length, list.length)}
      <div><h2 class="day-title">${rel}</h2><p class="day-sub">${cap(sub)} · ${count}</p></div>`;

    // Atrasadas (solo en "hoy")
    const overdue = selected === today ? tasks.filter((t) => !t.done && t.date < today).sort((a, b) => a.date.localeCompare(b.date) || sortTasks(a, b)) : [];
    $('overdueBox').innerHTML = overdue.length ? `<div class="overdue">
        <div class="overdue-head"><strong>⏰ ${overdue.length} sin hacer de días anteriores</strong>
        <button data-act="allToday">Todo a hoy</button></div>
        <ul class="tasks">${overdue.map((t) => taskHTML(t, { overdue: true })).join('')}</ul>
      </div>` : '';

    $('taskList').innerHTML = pending.map((t) => taskHTML(t)).join('');

    const empty = $('emptyState');
    if (!pending.length) {
      empty.hidden = false;
      empty.innerHTML = list.length
        ? '<span class="big">🎉</span><strong>¡Todo hecho!</strong>Disfruta del resto del día'
        : `<span class="big">${['🌴', '☀️', '🌈', '🍃', '⛱️', '🧘', '🌙'][weekday(selected)]}</span><strong>Día libre</strong>Escribe abajo lo que tengas que hacer`;
    } else empty.hidden = true;

    $('doneBox').innerHTML = done.length
      ? `<div class="section-title"><span>Hechas · ${done.length}</span></div><ul class="tasks">${done.map((t) => taskHTML(t)).join('')}</ul>`
      : '';

    $('swipeHint').hidden = !(pending.length || overdue.length);
  }

  function renderWeek() {
    const mon = mondayOf(selected);
    let html = '<div class="week-grid">';
    for (let i = 0; i < 7; i++) {
      const d = addDays(mon, i);
      const list = tasks.filter((t) => t.date === d).sort((a, b) => (a.done - b.done) || sortTasks(a, b));
      const doneN = list.filter((t) => t.done).length;
      const shown = list.slice(0, 6);
      html += `<button class="week-card${d === today ? ' is-today' : ''}" data-date="${d}" style="--day:${DAY_COLORS[weekday(d)]}">
        <div class="week-card-head"><strong>${relLabel(d) === cap(DAY_NAMES[weekday(d)]) ? DAY_NAMES[weekday(d)] : relLabel(d) + ' · ' + DAY_NAMES[weekday(d)]} ${toDate(d).getDate()}</strong>
        <span>${list.length ? `${doneN}/${list.length}` : ''}</span></div>
        <div class="week-bar"><i style="width:${list.length ? (doneN / list.length) * 100 : 0}%"></i></div>
        ${list.length ? `<ul>${shown.map((t) => `<li class="${t.done ? 'done' : ''}"><span>${t.emoji || emojiFor(t.text)}</span><span>${esc(t.text)}</span>${t.time ? `<span class="t">${t.time}</span>` : ''}</li>`).join('')}
          ${list.length > shown.length ? `<li><span class="t" style="margin:0">+${list.length - shown.length} más</span></li>` : ''}</ul>`
          : '<div class="none">Nada todavía</div>'}
      </button>`;
    }
    $('weekView').innerHTML = html + '</div>';
  }

  // ---------- Acciones ----------
  function snapshot() { undoSnapshot = JSON.stringify(tasks); }
  const find = (id) => tasks.find((t) => t.id === id);

  function addTask(raw) {
    const p = parseQuick(raw);
    if (!p.text) return false;
    const date = p.date || (selected < today ? today : selected);
    const t = { id: uid(), text: p.text, date, time: p.time, done: false, moved: 0, created: Date.now(), emoji: emojiFor(p.text) };
    tasks.push(t);
    lastAddedId = t.id;
    haptic();
    if (date !== selected) {
      toast(`Añadida a ${relLabel(date).toLowerCase() === DAY_NAMES[weekday(date)] ? 'el ' + longDate(date) : relLabel(date).toLowerCase() + ' (' + shortDate(date) + ')'}`, false);
    }
    selected = date;
    render();
    lastAddedId = null;
    return true;
  }

  function toggle(id) {
    const t = find(id);
    if (!t) return;
    t.done = !t.done;
    t.doneAt = t.done ? Date.now() : null;
    haptic(t.done ? 'MEDIUM' : 'LIGHT');
    render();
  }

  function postpone(id) {
    const t = find(id);
    if (!t) return;
    snapshot();
    const wasOverdue = t.date < today;
    t.date = wasOverdue ? today : addDays(t.date < today ? today : t.date, 1);
    t.moved = (t.moved || 0) + 1;
    haptic('MEDIUM');
    render();
    toast(wasOverdue ? 'Movida a hoy' : `Pasada a ${relLabel(t.date) === cap(DAY_NAMES[weekday(t.date)]) ? 'el ' + DAY_NAMES[weekday(t.date)] : relLabel(t.date).toLowerCase()} ⏭`, true);
  }

  function allToday() {
    snapshot();
    let n = 0;
    tasks.forEach((t) => { if (!t.done && t.date < today) { t.date = today; t.moved = (t.moved || 0) + 1; n++; } });
    haptic('MEDIUM');
    render();
    toast(`${n} tarea${n > 1 ? 's' : ''} movida${n > 1 ? 's' : ''} a hoy`, true);
  }

  function removeTask(id) {
    snapshot();
    tasks = tasks.filter((t) => t.id !== id);
    haptic('HEAVY');
    render();
    toast('Tarea borrada', true);
  }

  function toast(msg, canUndo) {
    $('toastText').textContent = msg;
    $('toastUndo').hidden = !canUndo;
    $('toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $('toast').hidden = true; }, 3500);
  }
  $('toastUndo').addEventListener('click', () => {
    if (!undoSnapshot) return;
    tasks = JSON.parse(undoSnapshot);
    undoSnapshot = null;
    $('toast').hidden = true;
    render();
  });

  // ---------- Hoja de edición ----------
  function openSheet(id) {
    const t = find(id);
    if (!t) return;
    editingId = id;
    $('editText').value = t.text;
    $('editDate').value = t.date;
    $('editTime').value = t.time || '';
    renderChips();
    $('toast').hidden = true;
    $('sheetBackdrop').hidden = false;
    $('sheet').hidden = false;
  }
  function closeSheet() {
    editingId = null;
    $('sheetBackdrop').hidden = true;
    $('sheet').hidden = true;
  }
  function renderChips() {
    const cur = $('editDate').value;
    const opts = [['Hoy', today], ['Mañana', addDays(today, 1)], ['Pasado', addDays(today, 2)]];
    for (let i = 3; i <= 7; i++) { const d = addDays(today, i); opts.push([cap(DAY_SHORT[weekday(d)]) + ' ' + toDate(d).getDate(), d]); }
    $('dayChips').innerHTML = opts.map(([l, d]) => `<button type="button" class="chip${d === cur ? ' on' : ''}" data-date="${d}">${l}</button>`).join('');
  }
  $('dayChips').addEventListener('click', (e) => {
    const b = e.target.closest('.chip');
    if (!b) return;
    $('editDate').value = b.dataset.date;
    renderChips();
    haptic();
  });
  $('editDate').addEventListener('change', renderChips);
  $('sheetBackdrop').addEventListener('click', closeSheet);
  $('saveBtn').addEventListener('click', () => {
    const t = find(editingId);
    if (t) {
      const text = $('editText').value.trim();
      if (text) { t.text = cap(text); t.emoji = emojiFor(t.text); }
      const nd = $('editDate').value || t.date;
      if (nd > t.date && !t.done) t.moved = (t.moved || 0) + 1;
      t.date = nd;
      t.time = $('editTime').value || null;
      selected = t.date;
    }
    closeSheet();
    haptic();
    render();
  });
  $('deleteBtn').addEventListener('click', () => {
    const id = editingId;
    closeSheet();
    removeTask(id);
  });

  // ---------- Entrada rápida ----------
  function updatePreview() {
    const v = $('quickInput').value.trim();
    const box = $('preview');
    if (!v) { box.hidden = true; return; }
    const p = parseQuick(v);
    const date = p.date || (selected < today ? today : selected);
    const parts = [`<span class="tag">📅 ${relLabel(date)} · ${shortDate(date)}</span>`];
    if (p.time) parts.push(`<span class="tag">🕒 ${p.time}</span>`);
    if (p.text) parts.push(`<span class="tag">${emojiFor(p.text)}</span>`);
    box.innerHTML = parts.join('');
    box.hidden = false;
  }
  $('quickInput').addEventListener('input', updatePreview);
  $('composer').addEventListener('submit', (e) => {
    e.preventDefault();
    const inp = $('quickInput');
    if (addTask(inp.value)) {
      inp.value = '';
      updatePreview();
    } else {
      inp.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(6px)' }, { transform: 'translateX(0)' }], { duration: 250 });
    }
    inp.focus();
  });

  // ---------- Navegación ----------
  $('weekStrip').addEventListener('click', (e) => {
    const b = e.target.closest('.day-chip');
    if (!b) return;
    selected = b.dataset.date;
    view = 'day';
    haptic();
    render();
  });
  $('weekView').addEventListener('click', (e) => {
    const b = e.target.closest('.week-card');
    if (!b) return;
    selected = b.dataset.date;
    view = 'day';
    render();
  });
  const shiftWeek = (n) => { selected = addDays(selected, 7 * n); haptic(); render(); };
  $('prevWeek').addEventListener('click', () => shiftWeek(-1));
  $('nextWeek').addEventListener('click', () => shiftWeek(1));
  $('todayBtn').addEventListener('click', () => { selected = today; haptic(); render(); });
  $('viewToggle').addEventListener('click', () => { view = view === 'day' ? 'week' : 'day'; haptic(); render(); window.scrollTo({ top: 0 }); });

  // Deslizar la tira de días para cambiar de semana
  (() => {
    let x0 = null, y0 = null;
    const el = $('weekStrip');
    el.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; y0 = e.touches[0].clientY; }, { passive: true });
    el.addEventListener('touchend', (e) => {
      if (x0 === null) return;
      const dx = e.changedTouches[0].clientX - x0, dy = e.changedTouches[0].clientY - y0;
      x0 = null;
      if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) shiftWeek(dx < 0 ? 1 : -1);
    });
  })();

  // ---------- Clicks y gestos en tareas ----------
  let suppressClick = false;
  $('main').addEventListener('click', (e) => {
    if (suppressClick) { suppressClick = false; return; }
    if (e.target.closest('[data-act="allToday"]')) { allToday(); return; }
    const wrap = e.target.closest('.task-wrap');
    if (!wrap) return;
    const act = e.target.closest('[data-act]')?.dataset.act;
    const id = wrap.dataset.id;
    if (act === 'toggle') toggle(id);
    else if (act === 'later') postpone(id);
    else openSheet(id);
  });

  (() => {
    const THRESHOLD = 90;
    let drag = null;
    const main = $('main');
    main.addEventListener('pointerdown', (e) => {
      const card = e.target.closest('.task');
      if (!card || e.target.closest('button')) return;
      drag = { card, wrap: card.parentElement, x0: e.clientX, y0: e.clientY, dx: 0, active: false, id: e.pointerId };
    });
    main.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
      if (!drag.active) {
        if (Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)) { drag = null; return; }
        if (Math.abs(dx) < 10) return;
        drag.active = true;
        drag.card.classList.add('dragging');
        try { drag.card.setPointerCapture(e.pointerId); } catch { /* ignorar */ }
      }
      const done = drag.card.classList.contains('done');
      drag.dx = done && dx < 0 ? 0 : dx; // las hechas no se aplazan
      drag.card.style.transform = `translateX(${drag.dx}px)`;
      drag.wrap.classList.toggle('dir-right', drag.dx > 0);
      drag.wrap.classList.toggle('dir-left', drag.dx < 0);
      const past = Math.abs(drag.dx) > THRESHOLD;
      if (past !== drag.past) { drag.past = past; if (past) haptic(); }
    });
    const end = (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const { card, wrap, dx, active } = drag;
      drag = null;
      if (!active) return;
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 50);
      card.classList.remove('dragging');
      if (Math.abs(dx) > THRESHOLD) {
        card.classList.add('snap');
        card.style.transform = `translateX(${dx > 0 ? '110%' : '-110%'})`;
        const id = wrap.dataset.id;
        setTimeout(() => (dx > 0 ? toggle(id) : postpone(id)), 180);
      } else {
        card.classList.add('snap');
        card.style.transform = '';
        setTimeout(() => { card.classList.remove('snap'); wrap.classList.remove('dir-left', 'dir-right'); }, 230);
      }
    };
    main.addEventListener('pointerup', end);
    main.addEventListener('pointercancel', end);
  })();

  // ---------- Cambio de día con la app abierta ----------
  function checkNewDay() {
    const now = todayStr();
    if (now !== today) {
      if (selected === today) selected = now;
      today = now;
      render();
    } else {
      scheduleSoon();
    }
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkNewDay(); });
  setInterval(checkNewDay, 60000);

  // ---------- Avisos (notificaciones locales) ----------
  const LN = window.Capacitor?.Plugins?.LocalNotifications;
  const SETTINGS_KEY = 'misemana.notif.v1';
  const NOTIF_TYPES = [
    { key: 'morning', ico: '☀️', title: 'Resumen por la mañana', desc: 'Lo que tienes hoy, nada más despertar', time: '09:00' },
    { key: 'evening', ico: '🌙', title: 'Pendientes por la noche', desc: 'Lo que te queda sin hacer, para pasarlo a mañana', time: '21:00' },
    { key: 'plan', ico: '📋', title: 'Plan de mañana', desc: 'Lo que tienes al día siguiente', time: '21:30' },
  ];
  const DAYS_AHEAD = 14;
  let notif = loadNotif();
  let scheduleTimer = null;

  function loadNotif() {
    const def = Object.fromEntries(NOTIF_TYPES.map((t) => [t.key, { on: true, time: t.time }]));
    try { return { ...def, ...JSON.parse(localStorage.getItem(SETTINGS_KEY)) }; } catch { return def; }
  }
  function saveNotif() {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(notif)); } catch { /* ignorar */ }
  }

  const listText = (list) => {
    const names = list.slice(0, 4).map((t) => `${t.emoji || emojiFor(t.text)} ${t.time ? t.time + ' ' : ''}${t.text}`);
    if (list.length > 4) names.push(`… y ${list.length - 4} más`);
    return names.join('\n');
  };
  const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
  const at = (day, hhmm) => { const d = toDate(day); const [h, m] = hhmm.split(':').map(Number); d.setHours(h, m, 0, 0); return d; };

  // Construye todos los avisos de los próximos días a partir de las tareas actuales
  function buildNotifications() {
    const out = [];
    const now = new Date();
    const now0 = todayStr();
    for (let i = 0; i < DAYS_AHEAD; i++) {
      const day = addDays(now0, i);
      const pending = tasks.filter((t) => !t.done && t.date === day).sort(sortTasks);
      const overdue = i === 0 ? tasks.filter((t) => !t.done && t.date < day) : [];
      const tomorrow = tasks.filter((t) => !t.done && t.date === addDays(day, 1)).sort(sortTasks);
      const push = (kind, base, title, body) => {
        const when = at(day, notif[kind].time);
        if (!notif[kind].on || when <= now) return;
        out.push({ id: base + i, title, body, schedule: { at: when, allowWhileIdle: true }, channelId: 'avisos', extra: { date: kind === 'plan' ? addDays(day, 1) : day } });
      };
      const todayAll = [...overdue, ...pending];
      if (todayAll.length) {
        push('morning', 1000, `☀️ Buenos días · ${plural(pending.length, 'tarea', 'tareas')} hoy`
          + (overdue.length ? ` (+${overdue.length} atrasada${overdue.length > 1 ? 's' : ''})` : ''), listText(todayAll));
      }
      if (pending.length) {
        push('evening', 2000, `🌙 Te ${pending.length === 1 ? 'queda 1 tarea' : 'quedan ' + pending.length + ' tareas'} por hacer`,
          `${listText(pending)}\nToca para hacerlas o pasarlas a mañana ⏭`);
      }
      if (tomorrow.length) {
        push('plan', 3000, `📋 Mañana tienes ${plural(tomorrow.length, 'tarea', 'tareas')}`, listText(tomorrow));
      }
    }
    return out;
  }

  async function reschedule() {
    if (!LN) return;
    try {
      const perm = await LN.checkPermissions();
      if (perm.display !== 'granted') return;
      const pending = await LN.getPending();
      if (pending.notifications.length) await LN.cancel({ notifications: pending.notifications.map((n) => ({ id: n.id })) });
      const list = buildNotifications();
      if (list.length) await LN.schedule({ notifications: list });
    } catch (e) { console.warn('avisos', e); }
  }
  function scheduleSoon() {
    if (!LN) return;
    clearTimeout(scheduleTimer);
    scheduleTimer = setTimeout(reschedule, 800);
  }

  async function ensurePermission() {
    if (!LN) return false;
    try {
      let p = await LN.checkPermissions();
      if (p.display === 'prompt' || p.display === 'prompt-with-rationale') p = await LN.requestPermissions();
      return p.display === 'granted';
    } catch { return false; }
  }

  async function renderNotifSheet() {
    $('notifList').innerHTML = NOTIF_TYPES.map((t) => `
      <div class="notif-row${notif[t.key].on ? '' : ' off'}">
        <span class="ico">${t.ico}</span>
        <div><strong>${t.title}</strong><small>${t.desc}</small></div>
        <label class="switch"><input type="checkbox" id="nf-${t.key}" data-key="${t.key}" ${notif[t.key].on ? 'checked' : ''} aria-label="${t.title}"><i></i></label>
        <input type="time" id="nt-${t.key}" data-key="${t.key}" value="${notif[t.key].time}" aria-label="Hora: ${t.title}">
      </div>`).join('');
    let blocked = false;
    try { blocked = LN && (await LN.checkPermissions()).display === 'denied'; } catch { /* ignorar */ }
    $('notifWarn').hidden = !blocked;
  }
  async function openNotif() {
    await ensurePermission();
    await renderNotifSheet();
    $('toast').hidden = true;
    $('notifBackdrop').hidden = false;
    $('notifSheet').hidden = false;
  }
  function closeNotif() {
    $('notifBackdrop').hidden = true;
    $('notifSheet').hidden = true;
    scheduleSoon();
  }
  $('notifList').addEventListener('change', (e) => {
    const key = e.target.dataset.key;
    if (!key) return;
    if (e.target.type === 'checkbox') notif[key].on = e.target.checked;
    else if (e.target.value) notif[key].time = e.target.value;
    saveNotif();
    e.target.closest('.notif-row').classList.toggle('off', !notif[key].on);
    haptic();
    scheduleSoon();
  });
  $('notifBackdrop').addEventListener('click', closeNotif);
  $('notifDone').addEventListener('click', closeNotif);
  $('notifTest').addEventListener('click', async () => {
    if (!(await ensurePermission())) { $('notifWarn').hidden = false; return; }
    const pend = tasks.filter((t) => !t.done && t.date === today).sort(sortTasks);
    try {
      await LN.schedule({ notifications: [{
        id: 999, channelId: 'avisos',
        title: `☀️ Así se verán tus avisos · ${plural(pend.length, 'tarea', 'tareas')} hoy`,
        body: pend.length ? listText(pend) : 'Hoy no tienes nada pendiente 🌴',
        schedule: { at: new Date(Date.now() + 3000), allowWhileIdle: true }, extra: { date: today },
      }] });
      toast('Te llegará en 3 segundos…', false);
    } catch (e) { toast('No se pudo enviar el aviso', false); }
  });

  if (LN) {
    $('bellBtn').hidden = false;
    $('bellBtn').addEventListener('click', () => { haptic(); openNotif(); });
    (async () => {
      try {
        await LN.createChannel({ id: 'avisos', name: 'Resúmenes y recordatorios', description: 'Resumen de la mañana, pendientes y plan de mañana', importance: 3, visibility: 1 });
      } catch { /* versiones antiguas de Android */ }
      // Al tocar un aviso, abre el día correspondiente
      LN.addListener('localNotificationActionPerformed', (ev) => {
        const d = ev?.notification?.extra?.date;
        if (d) { selected = d; view = 'day'; render(); }
      });
      if (await ensurePermission()) reschedule();
    })();
  }

  // ---------- Integración nativa (Capacitor) ----------
  const App = window.Capacitor?.Plugins?.App;
  if (App?.addListener) {
    App.addListener('backButton', () => {
      if (!$('notifSheet').hidden) closeNotif();
      else if (!$('sheet').hidden) closeSheet();
      else if (view === 'week') { view = 'day'; render(); }
      else if (selected !== today) { selected = today; render(); }
      else App.exitApp();
    });
    App.addListener('resume', checkNewDay);
  }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('sheet').hidden) closeSheet(); });

  // PWA (iPhone / navegador): funciona sin conexión
  if ('serviceWorker' in navigator && !window.Capacitor?.isNativePlatform?.() && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // Primera vez: unas tareas de ejemplo para enseñar cómo funciona
  if (!localStorage.getItem(STORE_KEY + '.seen')) {
    try { localStorage.setItem(STORE_KEY + '.seen', '1'); } catch { /* ignorar */ }
    if (!tasks.length) {
      const mk = (text, date, time) => ({ id: uid(), text, date, time, done: false, moved: 0, created: Date.now(), emoji: emojiFor(text) });
      tasks.push(
        mk('Desliza a la derecha para marcar como hecha', today, null),
        mk('Desliza a la izquierda para pasarla a mañana', today, null),
        mk('Toca una tarea para editarla', today, null),
        mk('Comprar pan', addDays(today, 1), '10:00'),
      );
    }
  }

  window.__parseQuick = parseQuick; // para pruebas
  render();
})();
