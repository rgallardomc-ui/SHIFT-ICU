import {FLOOR_PODS, SHIFT_LEVELS, SUPPLIES, PROCEDURES, ADMISSIONS, NOTE_FIELDS, DRUG_ROLES} from './shift-data.js';
import {createShift, restoreShift, patientAt, profileOf, clockAt, openTasks, advanceShift, packSupplies, returnSupplies, checkProcedure, receiveAdmissionReport, installAdmissionSupply, acceptAdmission, recordNote, performCare, endShift, shiftSummary, exportShift, SIM_MINUTES_PER_SECOND} from './shift-engine.js';
import {roomGeometry, routeBetween, moveNurse, nearestTarget, interactionTargets, drawFloor} from './shift-map.js';
import {CLINICAL_SOURCES} from './sources.js';

const STORE = 'shift-icu-floor-v3';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const button = (action, text, attrs = '', style = 'secondary') => `<button class="${style}" data-shift="${action}" ${attrs}>${text}</button>`;
const when = (shift, t) => t.priority === 'urgent' && t.kind !== 'reassess' ? 'NOW' : t.due < shift.elapsed ? `Overdue · ${clockAt(t.due)}` : `Due ${clockAt(t.due)}`;
const pendingKind = (p, kind) => p.tasks.find(t => t.kind === kind && !t.done);

export function createShiftGame({app, onExit}) {
  const controller = new AbortController(), signal = controller.signal;
  let shift = null, pod = 'delta', mode = 'coached', level = 1, frame = 0, previous = 0, clockBudget = 0;
  let path = [], destination = null, autoInteract = false, camera = null, keys = new Set(), pointerDirections = new Map();
  let canvas = null, currentView = null, speech = null, lastHud = 0, lastControls = 0, lastSave = 0, storageOkay = true, destroyed = false;
  let vault = {active: null, history: []};
  try {
    const saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    if (saved) vault = {active: restoreShift(saved.active), history: Array.isArray(saved.history) ? saved.history.filter(restoreShift).slice(-10) : []};
  } catch { storageOkay = false; }
  const dialog = document.createElement('dialog');
  dialog.className = 'shift-dialog';
  dialog.innerHTML = '<button class="modal-close" data-shift="close" aria-label="Close workspace">×</button><div id="shiftModalBody"></div>';
  document.body.append(dialog);

  function save() {
    if (shift) vault.active = shift;
    try { localStorage.setItem(STORE, JSON.stringify(vault)); storageOkay = true; }
    catch { storageOkay = false; }
    const status = document.getElementById('shiftSaveStatus');
    if (status) status.textContent = storageOkay ? 'Saved in this browser' : 'Storage unavailable · export your journal';
  }
  function stopSpeech() {
    const old = speech; speech = null;
    try { old?.abort(); } catch {}
  }
  function release() { keys.clear(); pointerDirections.clear(); }
  function stopWalking() { release(); path = []; destination = null; autoInteract = false; }
  function closeDialog() { stopSpeech(); currentView = null; dialog.close(); release(); previous = performance.now(); }
  function modal(html, view = null) {
    stopWalking(); stopSpeech(); currentView = view;
    document.getElementById('shiftModalBody').innerHTML = '<div id="shiftModalUnitAlert" class="floor-live-unit" role="status" aria-live="polite"></div>' + html;
    if (!dialog.open) dialog.showModal();
    updateReadingStatus();
  }
  function feedback(text) {
    if (shift) shift.feedback = text;
    const el = document.getElementById('shiftFeedback'); if (el) el.textContent = text;
    const response = document.getElementById('shiftModalResponse'); if (response) {response.textContent = text; response.hidden = !text;}
  }
  function responseBox(text = '') { return `<p id="shiftModalResponse" class="floor-response" role="status" aria-live="polite" ${text ? '' : 'hidden'}>${esc(text)}</p>`; }
  function showResult(result, rerender) {
    save(); updateHud(true);
    if (rerender) rerender(result.text);
    else {
      feedback(result.text);
      const response = document.getElementById('shiftModalResponse'); if (response) {response.hidden = false; response.classList.toggle('safety', !!result.safety);}
    }
  }
  function download() {
    if (!shift) return;
    const url = URL.createObjectURL(new Blob([exportShift(shift)], {type: 'text/plain'}));
    const a = document.createElement('a'); a.href = url; a.download = `SHIFT_ICU_${shift.pod}_${shift.seed}_journal.txt`; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function setup() {
    cancelAnimationFrame(frame); canvas = null; closeDialog();
    document.body.classList.remove('floor-mode');
    const saved = vault.active;
    app.innerHTML = `<section class="shift-intro"><p class="eyebrow">CLOCK IN / FLOOR SHIFT</p><h1>Your patients.<br>Your floor.<br><em>Your next move.</em></h1><p>Walk the unit, receive report, prepare the room and keep up with the care. A new assignment changes the rooms, patient mix and timing.</p>${saved ? `<div class="floor-resume"><strong>${FLOOR_PODS[saved.pod].name} · ${clockAt(saved.elapsed)} · ${saved.patients.length} patient${saved.patients.length === 1 ? '' : 's'}</strong>${button('resume', saved.ended ? 'Review last debrief' : 'Resume my shift', '', 'primary')}</div>` : ''}<div class="floor-pod-choices">${Object.entries(FLOOR_PODS).map(([id, p]) => `<button class="floor-pod-choice ${pod === id ? 'selected' : ''}" data-shift="choose-pod" data-pod="${id}" aria-pressed="${pod === id}" style="--pod:${p.color}"><b>${p.name}</b><span>${p.specialty}</span></button>`).join('')}</div><div class="floor-setup-fields"><label>Shift<select id="floorLevel">${SHIFT_LEVELS.map(l => `<option value="${l.id}" ${level === l.id ? 'selected' : ''}>${l.id}. ${l.name}</option>`).join('')}</select></label><label>Support<select id="floorMode"><option value="coached" ${mode === 'coached' ? 'selected' : ''}>Coached · reading pauses the clock</option><option value="independent" ${mode === 'independent' ? 'selected' : ''}>Independent · clock runs in workspaces</option></select></label></div><p class="floor-level-description">${esc(SHIFT_LEVELS.find(l => l.id === level).description)}</p><div class="buttons">${button('new', 'Receive my assignment →', '', 'primary')}${button('exit', 'Hospital / focused cases', '', 'quiet')}</div><div class="floor-expectations"><span>⌂ 12 rooms to explore</span><span>↔ Keyboard, tap-to-walk or touch pad</span><span>◷ 1 real minute = 30 simulated minutes</span></div><details class="floor-explainer"><summary>Before you clock in</summary><p>Nursing actions also advance a small amount of simulated time. Pause whenever needed. Independent play adds scheduling pressure; time alone never authorizes unsafe care. Alpha’s later shift can have three stable patients; the high-acuity ICU shifts use one or two.</p><p>The floor cases use fictional orders and scripted responses. SLED is a generic workflow until the exact machine is confirmed. Invasive procedures and specialist device changes remain assigned to the trained clinical team. No delegation system is included.</p><p>Your existing focused-case notes are preserved separately. Starting a new floor shift keeps up to ten earlier floor shifts in this browser. ${storageOkay ? 'Progress saves automatically.' : 'Storage is unavailable; export before leaving.'}</p></details>${vault.history.length ? `<details class="floor-explainer"><summary>Earlier shifts (${vault.history.length})</summary><div class="floor-history">${vault.history.map((s, i) => button('history', `${FLOOR_PODS[s.pod].name} · ${clockAt(s.elapsed)} · seed ${s.seed}`, `data-index="${i}"`)).join('')}</div></details>` : ''}</section>`;
  }
  function newAssignment() {
    if (vault.active) vault.history = [...vault.history, JSON.parse(JSON.stringify(vault.active))].slice(-10);
    const seed = globalThis.crypto?.getRandomValues ? crypto.getRandomValues(new Uint32Array(1))[0] : Date.now();
    shift = createShift({pod, mode, level, seed}); save(); mount();
  }
  function mount() {
    closeDialog(); document.body.classList.add('floor-mode');
    const p = FLOOR_PODS[shift.pod];
    app.innerHTML = `<section class="floor-game" style="--pod:${p.color}"><header class="floor-heading"><div><p class="eyebrow">${p.specialty} / ${SHIFT_LEVELS.find(l => l.id === shift.level).name}</p><h1>${p.name}<span> · Night shift</span></h1></div><div class="floor-clock"><b id="shiftClock">${clockAt(shift.elapsed)}</b><span id="shiftReadingStatus"></span></div></header><div class="floor-toolbar">${button('go-station', 'Report / charts')}${button('go-supply', 'Supplies')}${button('go-charge', 'Charge nurse')}${button('pause', shift.paused ? 'Resume clock' : 'Pause', 'id="shiftPause"')}${button('end-prompt', 'Handoff / finish', '', 'quiet')}</div><div id="shiftAlert" class="floor-alert" aria-live="polite"></div><div class="floor-layout"><div class="floor-play"><div class="floor-viewport"><canvas id="shiftFloorCanvas" tabindex="0" role="img" aria-label="Walkable twelve-room ICU floor. Tap to walk or use arrows or W A S D. Use the room and destination buttons for accessible navigation." aria-describedby="floorMovementHint"></canvas><span class="floor-map-caption">${p.name.toUpperCase()} / ROOMS 01–12</span><span id="floorPauseCover" class="floor-paused" hidden>PAUSED</span></div><div class="floor-controls"><div class="floor-pad" aria-label="Nurse movement"><button data-floor-dir="up" aria-label="Walk up">▲</button><button data-floor-dir="left" aria-label="Walk left">◀</button><button data-floor-dir="down" aria-label="Walk down">▼</button><button data-floor-dir="right" aria-label="Walk right">▶</button></div><div class="floor-interact-wrap"><button id="shiftInteract" class="primary" data-shift="interact">Walk toward a bedside or computer</button><span id="floorMovementHint">Tap to walk · arrows / WASD · E or space to interact</span></div></div><p id="shiftFeedback" class="floor-feedback" role="status" aria-live="polite">${esc(shift.feedback)}</p><div class="floor-cart"><b>YOUR CART</b><span id="shiftInventory"></span>${button('export', 'Export journal', '', 'quiet')}<span id="shiftSaveStatus"></span></div></div><aside class="floor-board"><div class="floor-board-heading"><h2>Your assignment</h2><span id="shiftProgress"></span></div><div id="shiftPatients"></div><div id="shiftAdmission"></div><h3>Coming due</h3><div id="shiftDue"></div><p class="helper">Urgent calls are available from your radio. Patient checks happen at the bedside; charts and notes are at computers.</p></aside></div></section>`;
    canvas = document.getElementById('shiftFloorCanvas');
    canvas.addEventListener('click', mapClick, {signal});
    previous = performance.now(); lastHud = 0; clockBudget = 0;
    cancelAnimationFrame(frame); updateHud(true); frame = requestAnimationFrame(tick);
    window.scrollTo(0, 0);
    if (shift.ended) debrief();
  }
  function updateReadingStatus() {
    const el = document.getElementById('shiftReadingStatus');
    if (!el || !shift) return;
    el.textContent = shift.paused ? 'CLOCK PAUSED' : currentView?.kind === 'procedure' ? 'EQUIPMENT DRILL · FLOOR PAUSED' : dialog.open && shift.mode === 'coached' ? 'READING PAUSE' : 'COMPRESSED SHIFT TIME';
  }
  function updateHud(force = false) {
    if (!shift || !canvas) return;
    if (!force && performance.now() - lastControls < 120) return;
    lastControls = performance.now();
    document.getElementById('shiftClock').textContent = clockAt(shift.elapsed);
    updateReadingStatus();
    const pauseButton = document.getElementById('shiftPause'); pauseButton.textContent = shift.paused ? 'Resume clock' : 'Pause'; pauseButton.setAttribute('aria-pressed', String(shift.paused));
    document.getElementById('floorPauseCover').hidden = !shift.paused;
    const near = nearestTarget(shift), interact = document.getElementById('shiftInteract');
    interact.textContent = near ? `${near.label} →` : path.length ? 'Walking · tap here to stop' : 'Walk toward a bedside or computer';
    if (!force && performance.now() - lastHud < 1800) return;
    lastHud = performance.now();
    const changed = shift.patients.filter(p => p.stage === 'changed');
    const alerts = document.getElementById('shiftAlert');
    const setHTML = (el, html) => {if (el && el.innerHTML !== html) el.innerHTML = html;};
    const alertHTML = changed.length ? changed.map(p => `<div><b>ROOM ${p.room}</b> ${esc(profileOf(p).event)} ${button('radio', p.notified ? 'Contact team again' : 'Call clinical team', `data-room="${p.room}"`, 'alert-action')}</div>`).join('') : '';
    setHTML(alerts, alertHTML);
    alerts.hidden = !changed.length;
    setHTML(document.getElementById('shiftPatients'), shift.patients.map(p => {
      const m = profileOf(p), due = p.tasks.filter(t => !t.done && t.due <= shift.elapsed + 15).length;
      return `<article class="floor-patient-card ${p.stage === 'changed' ? 'changed' : ''}"><div><b>ROOM ${String(p.room).padStart(2, '0')}</b><span>${p.stage === 'changed' ? 'NEW CHANGE' : p.stage === 'treated' ? 'REASSESSMENT PENDING' : p.stage === 'reviewed' ? 'CONTINUE THE PLAN' : 'ASSIGNED'}</span></div><h3>${esc(m.label)}</h3><p>${due ? `${due} task${due === 1 ? '' : 's'} due / coming up` : 'Continue the ordered schedule'}</p><div class="buttons">${button('go-bed', 'Bedside →', `data-room="${p.room}"`)}${button('go-computer', 'Computer', `data-room="${p.room}"`, 'quiet')}</div></article>`;
    }).join(''));
    const a = shift.admission;
    setHTML(document.getElementById('shiftAdmission'), a && !a.accepted ? `<article class="floor-admission-card"><span class="badge">${a.announced ? 'INCOMING ADMISSION' : 'RECEIVING BED RESERVED'}</span><h3>Room ${a.room}</h3><p>${a.announced ? esc(ADMISSIONS[shift.pod].name) : 'Charge will bring the receiving report shortly.'}</p>${a.announced ? button('go-admission', 'Prepare room →') : ''}</article>` : '');
    const due = openTasks(shift).filter(t => t.kind !== 'handoff').slice(0, 6);
    setHTML(document.getElementById('shiftDue'), due.map(t => `<button class="floor-due ${t.due < shift.elapsed ? 'late' : ''}" data-shift="go-task" data-room="${t.room}" data-task="${t.kind}"><span>R${t.room} · ${when(shift, t)}</span>${esc(t.title)}</button>`).join('') || '<p class="helper">Current tasks complete. Continue reassessment and prepare handoff.</p>');
    const summary = shiftSummary(shift);
    document.getElementById('shiftProgress').textContent = `${summary.completed} task${summary.completed === 1 ? '' : 's'} done`;
    document.getElementById('shiftInventory').textContent = Object.entries(shift.inventory).filter(([, n]) => n > 0).map(([id, n]) => `${supplyName(id)}${n > 1 ? ` ×${n}` : ''}`).join(' · ') || 'Empty · visit supplies';
    document.getElementById('shiftFeedback').textContent = shift.feedback;
    document.getElementById('shiftSaveStatus').textContent = storageOkay ? 'Saved in this browser' : 'Storage unavailable · export your journal';
    if (dialog.open) {
      document.querySelectorAll('[data-live-vitals]').forEach(el => {
        const p = patientAt(shift, el.dataset.liveVitals); if (p) setHTML(el, vitalHTML(p));
      });
      setHTML(document.getElementById('shiftModalUnitAlert'), alertHTML + (a?.announced && !a.accepted ? `<div>Charge: admission report for room ${a.room} is available at the station.</div>` : ''));
      if (currentView?.tab === 'labs') {
        const p = patientAt(shift, currentView.room), el = dialog.querySelector('[data-lab-status]');
        if (p && el) el.textContent = labStatus(p);
      }
    }
  }
  function supplyName(id) {
    return SUPPLIES.find(s => s.id === id)?.name || Object.values(PROCEDURES).find(p => p.item === id)?.name || id;
  }
  function goTo(kind, room, shouldOpen = true, tab = null) {
    if (!shift || shift.ended) return;
    if (dialog.open) closeDialog();
    const target = interactionTargets(shift).find(t => t.kind === kind && (!room || t.room === Number(room)));
    if (!target) return;
    release(); path = routeBetween(shift.player, target); destination = {...target, tab}; autoInteract = shouldOpen;
    feedback(path.length ? `Walking to ${target.label}. You can steer with the pad or arrows to change course.` : 'That route is blocked. Walk toward the open doorway.');
  }
  function mapClick(event) {
    if (!shift || shift.paused || shift.ended || !camera || dialog.open) return;
    const box = canvas.getBoundingClientRect();
    const target = {x: (event.clientX - box.left) / camera.scale + camera.x, y: (event.clientY - box.top) / camera.scale + camera.y};
    release(); path = routeBetween(shift.player, target); destination = null; autoInteract = false;
  }
  function interact(target = null) {
    if (path.length && !target) {stopWalking(); feedback('Stopped. Walk toward the highlighted bedside, room computer, station or supplies.'); return;}
    const near = target || nearestTarget(shift);
    if (!near) {feedback('Walk closer to a highlighted bedside, room computer, charge nurse or supply area.'); return;}
    stopWalking();
    if (near.kind === 'station' || near.kind === 'charge') station(near.kind);
    if (near.kind === 'supply') supplies();
    if (near.kind === 'admission') admission();
    if (near.kind === 'bed') patientWorkspace(near.room, 'bed', near.tab || 'assessment');
    if (near.kind === 'computer') patientWorkspace(near.room, 'computer', near.tab || 'orders');
  }
  function tick(ts) {
    if (destroyed || !canvas) return;
    const dt = Math.max(0, Math.min((ts - previous) / 1000, 0.05)); previous = ts;
    const anyDialog = !!document.querySelector('dialog[open]');
    if (anyDialog) release();
    if (!shift.paused && !shift.ended && !anyDialog && !document.hidden) {
      const held = new Set([...keys, ...pointerDirections.values()]);
      let dx = Number(held.has('right')) - Number(held.has('left')), dy = Number(held.has('down')) - Number(held.has('up'));
      if (dx || dy) {path = []; destination = null; autoInteract = false; moveNurse(shift.player, dx, dy, dt);}
      else if (path.length) {
        const point = path[0], distance = Math.hypot(point.x - shift.player.x, point.y - shift.player.y);
        if (distance < 6) {shift.player.x = point.x; shift.player.y = point.y; path.shift();}
        else moveNurse(shift.player, point.x - shift.player.x, point.y - shift.player.y, Math.min(dt, distance / 235));
        if (!path.length && autoInteract && destination) {
          const target = destination; destination = null; autoInteract = false;
          if (Math.hypot(target.x - shift.player.x, target.y - shift.player.y) <= 82) interact(target);
        }
      }
    }
    const readingPause = anyDialog && shift.mode === 'coached' || currentView?.kind === 'procedure';
    if (!shift.paused && !shift.ended && !document.hidden && !readingPause) {
      clockBudget += dt;
      if (clockBudget >= 1) {advanceShift(shift, clockBudget * SIM_MINUTES_PER_SECOND); clockBudget = 0;}
    }
    if (currentView?.kind === 'procedure' && currentView.deadline) {
      const left = Math.max(0, Math.ceil((currentView.deadline - ts) / 1000));
      const timer = document.getElementById('shiftDrillTimer');
      if (timer) timer.textContent = left ? `${left}s · optional practice timer` : 'Timer finished · keep checking carefully';
      if (!left) currentView.timedOut = true;
    }
    camera = drawFloor(canvas, shift, path, ts); updateHud();
    if (ts - lastSave > 5000) {save(); lastSave = ts;}
    frame = requestAnimationFrame(tick);
  }

  function station(kind = 'station', message = '') {
    modal(`<p class="eyebrow">${kind === 'charge' ? 'CHARGE NURSE' : 'NURSING STATION'}</p><h2>${kind === 'charge' ? 'Here’s your assignment.' : 'Report and patient charts.'}</h2><p>${esc(FLOOR_PODS[shift.pod].brief)} You handle the nursing care. Contact the clinical team promptly when a patient changes.</p>${responseBox(message)}<div class="floor-station-patients">${shift.patients.map(p => `<article><h3>Room ${p.room} · ${esc(profileOf(p).label)}</h3><p>${esc(profileOf(p).report)}</p><div class="buttons">${button('care', p.reportRead ? 'Report received ✓' : 'Receive report', `data-room="${p.room}" data-care="report"`)}${button('chart-open', 'Open chart', `data-room="${p.room}"`)}</div></article>`).join('')}</div>${shift.admission?.announced && !shift.admission.accepted ? `<section class="floor-callout"><h3>${esc(ADMISSIONS[shift.pod].name)} · Room ${shift.admission.room}</h3><p>${esc(ADMISSIONS[shift.pod].brief)}</p>${button('admission-report', shift.admission.reportRead ? 'Review receiving plan' : 'Receive admission report / orders')}</section>` : ''}<details class="floor-explainer"><summary>Equipment practice with charge</summary><p>Practice preparing for the operator. There is no delegation mechanic.</p><div class="buttons">${Object.entries(PROCEDURES).map(([id, p]) => button('procedure', p.name, `data-procedure="${id}" data-practice="true"`)).join('')}</div></details><p class="helper">${shift.mode === 'coached' ? 'The clock pauses while you read in coached mode.' : 'The independent clock continues here. Use Pause whenever you need it.'}</p>`, {kind});
  }
  function supplies(message = '') {
    modal(`<p class="eyebrow">SUPPLY ROOM</p><h2>Pack for the work ahead.</h2><p>Your cart holds eight packs. Bring what the assignment / orders require. A room’s care pack stays there; specimen packs are used per collection.</p>${responseBox(message)}<fieldset class="floor-supply-list"><legend>Select supplies</legend>${SUPPLIES.map(s => `<label><input type="checkbox" name="floor-supply" value="${s.id}"><span><b>${s.name}</b><small>${s.detail}</small></span></label>`).join('')}</fieldset><div class="buttons">${button('pack', 'Pack selected supplies', '', 'primary')}${button('return', 'Return unused packs', '', 'quiet')}</div><section class="floor-procedure-section"><h3>Prepare a procedure tray</h3><p>The equipment check tests preparation and scope. A correct tray does not perform the insertion.</p><div class="buttons">${Object.entries(PROCEDURES).map(([id, p]) => button('procedure', p.name, `data-procedure="${id}"`)).join('')}</div></section>`, {kind: 'supply'});
  }
  function procedure(kind, practice = false, message = '', selected = [], prior = null) {
    const p = PROCEDURES[kind]; if (!p) return;
    const view = prior || {kind: 'procedure', procedure: kind, practice, deadline: null, timedOut: false};
    modal(`<p class="eyebrow">${practice ? 'PRACTICE WITH CHARGE' : 'PREPARE A TRAY'}</p><h2>${p.name}</h2><p>${p.order}</p><div class="floor-drill-clock"><b id="shiftDrillTimer">${view.deadline ? 'Practice timer running' : 'Untimed equipment check'}</b>${!view.deadline ? button('start-drill', `Start optional ${p.seconds}s timer`, '', 'quiet') : ''}</div><p class="helper">The floor clock pauses for this drill. Completing it carefully matters more than the timer.</p>${responseBox(message)}<fieldset class="floor-supply-list"><legend>What belongs in this setup?</legend>${p.options.map(([id, label]) => `<label><input type="checkbox" name="floor-procedure" value="${id}" ${selected.includes(id) ? 'checked' : ''}><span>${esc(label)}</span></label>`).join('')}</fieldset><div class="buttons">${button('check-procedure', practice ? 'Check my preparation' : 'Check and pack tray', '', 'primary')}${button('close', 'Back to the floor', '', 'quiet')}</div>`, view);
  }
  function admission(message = '') {
    const a = shift.admission;
    if (!a || a.accepted) return;
    const info = ADMISSIONS[shift.pod];
    const items = [...info.items, ...(info.procedure ? [PROCEDURES[info.procedure].item] : [])];
    modal(`<p class="eyebrow">ROOM ${a.room} / RECEIVING BED</p><h2>${info.name}</h2><p>${esc(info.brief)}</p>${responseBox(message)}${!a.announced || !a.reportRead ? `<div class="floor-callout"><p>${a.announced ? 'Receive the incoming report and active receiving orders at the nursing station first.' : 'The receiving report has not arrived yet. Charge will contact you.'}</p>${button('go-station', 'Walk to the station')}</div>` : `<div class="floor-admission-checks">${items.map(id => `<div><span>${a.installed[id] ? '✓' : '□'}</span><b>${esc(supplyName(id))}</b>${a.installed[id] ? '<small>Prepared</small>' : button('install', 'Set up', `data-item="${id}"`)}</div>`).join('')}</div><fieldset class="floor-supply-list"><legend>Confirm the receiving handoff</legend><label><input type="checkbox" name="arrival-check" value="identity"><span>Verify two patient identifiers and allergy information with the receiving team.</span></label><label><input type="checkbox" name="arrival-check" value="support"><span>Verify functioning monitoring, airway / ventilation readiness and the prescribed infusion / device setup with the team.</span></label><label><input type="checkbox" name="arrival-check" value="handoff"><span>Receive the clinical handoff, active orders and outstanding diagnostics / admission screening requirements.</span></label></fieldset><p class="helper">Admission swabs, blood-bank identification and other screening follow the actual patient orders and local policy. No unidentified medication or facility-specific band is assumed.</p>${button('accept', 'Confirm readiness / receive the patient', '', 'primary')}`}`, {kind: 'admission'});
  }

  function vitalHTML(p) {
    const units = {MAP: 'mmHg', ICP: 'mmHg', SBP: 'mmHg', SpO2: '%', UO: 'mL / prior interval', HR: 'beats/min', RR: 'breaths/min'};
    return Object.entries(p.current).map(([key, value]) => `<span><small>${key === 'UO' ? 'LAST MEASURED UO' : key}</small><b>${value}</b><small>${units[key] || ''}</small></span>`).join('') + (p.current.ICP !== undefined ? `<span><small>CPP</small><b>${p.current.MAP - p.current.ICP}</b><small>mmHg · MAP − ICP</small></span>` : '');
  }
  function labStatus(p) {
    return p.sample ? `Collected ${clockAt(p.sample.collectedAt)}; result expected ${clockAt(p.sample.readyAt)}.` : p.labResult ? `Collected ${clockAt(p.labResult.collectedAt)}, resulted ${clockAt(p.labResult.at)}: ${p.labResult.text}` : `No new result. ${pendingKind(p, 'labs') ? `Next ordered collection ${clockAt(pendingKind(p, 'labs').due)}.` : ''}`;
  }
  function sourceLinks(model) {
    return model.sources.map(id => CLINICAL_SOURCES.find(s => s.id === id)).filter(Boolean).map(s => `<a href="${s.url}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a>`).join('<br>');
  }
  function patientWorkspace(room, kind, tab = kind === 'bed' ? 'assessment' : 'orders', message = '') {
    const p = patientAt(shift, room); if (!p) return;
    const model = profileOf(p), tabs = kind === 'bed' ? [['assessment', 'Patient'], ['device', 'Device / access'], ['care', 'Nursing care']] : [['orders', 'Orders'], ['worklist', 'Worklist'], ['mar', 'MAR / infusions'], ['labs', 'Labs'], ['history', 'History / diagnostics'], ['flowsheet', 'Flowsheet'], ['notes', 'SBAR']];
    modal(`<p class="eyebrow">ROOM ${p.room} / ${kind === 'bed' ? 'BEDSIDE' : 'PATIENT COMPUTER'}</p><h2>${esc(model.label)}</h2><div class="floor-vitals" data-live-vitals="${p.room}">${vitalHTML(p)}</div>${p.eventFired && !p.reassessed ? `<div class="floor-callout urgent"><b>New change</b><p>${esc(model.event)}</p>${button('care', 'Call clinical team now', `data-room="${p.room}" data-care="notify"`, 'primary')}</div>` : ''}<nav class="floor-tabs" aria-label="Patient workspace">${tabs.map(([id, label]) => `<button data-shift="patient-tab" data-tab="${id}" aria-current="${tab === id ? 'page' : 'false'}" class="${tab === id ? 'active' : ''}">${label}</button>`).join('')}</nav>${responseBox(message)}${patientContent(p, model, kind, tab)}<div class="floor-workspace-footer">${button(kind === 'bed' ? 'go-computer' : 'go-bed', kind === 'bed' ? 'Walk to room computer →' : 'Walk to bedside →', `data-room="${p.room}"`, 'quiet')}${button('close', 'Return to the floor', '', 'quiet')}</div>`, {kind, room: p.room, tab});
  }
  function patientContent(p, model, kind, tab) {
    const attrs = `data-room="${p.room}"`;
    if (tab === 'assessment') return `<p>${esc(model.report)}</p><p class="helper">The monitor shows current scripted readings. Obtain your exam; prior findings and urine measurements are not automatically a new assessment.</p><div class="buttons">${button('care', p.stage === 'treated' ? `Reassess response${p.followupAt > shift.elapsed ? ` · due ${clockAt(p.followupAt)}` : ''}` : p.assessed ? 'Repeat bedside assessment' : 'Assess the patient', `${attrs} data-care="assess"`, 'primary')}${button('care', 'Call / clarify with clinical team', `${attrs} data-care="notify"`)}</div>${p.observations.length ? `<section class="floor-observed"><h3>Obtained, awaiting chart review</h3>${p.observations.filter(o => o.kind.includes('assessment')).slice(-2).map(o => `<p><b>${clockAt(o.at)}</b> ${esc(o.text)}</p>`).join('') || '<p>Device / care findings are waiting in the flowsheet workspace.</p>'}</section>` : ''}<p class="helper">${esc(model.risks)}</p>`;
    if (tab === 'device') return `<div class="floor-device-panel"><div class="floor-device-icon" aria-hidden="true">${model.icon === 'evd' ? '┆' : model.icon === 'dialysis' ? '▤' : model.icon === 'heart' ? '♥' : model.icon === 'vent' ? '≋' : '▥'}</div><div><span class="badge">SCHEMATIC / CASE EQUIPMENT</span><h3>${model.icon === 'dialysis' ? 'SLED · prescription and tolerance' : model.icon === 'evd' ? 'EVD · patient, reference and prescribed state' : model.icon === 'heart' ? 'Cardiac monitoring, drains and access' : model.icon === 'vent' ? 'Ventilator and airway' : 'Monitor, access and support'}</h3><p>${esc(model.device)}</p></div></div>${button('care', 'Perform device / access check', `${attrs} data-care="device"`, 'primary')}${model.procedure ? `<section class="floor-callout"><h3>Ordered assistance setup</h3><p>${esc(PROCEDURES[model.procedure].order)}</p>${button('care', p.procedureReady ? 'Preparation complete ✓' : 'Place the prepared tray / verify readiness', `${attrs} data-care="procedure"`)}</section>` : ''}${model.icon === 'dialysis' ? '<p class="helper">SLED is the modality, not a unique machine model. This panel does not reproduce manufacturer buttons, circuit connections or facility permissions.</p>' : ''}<details class="floor-explainer"><summary>Clinical basis and case limits</summary><p>${sourceLinks(model) || 'General case-specific assessment / escalation exercise; local educator review remains pending.'}</p><p>Current case orders and scope govern the actions. Source checking does not establish facility approval.</p></details>`;
    if (tab === 'care') return `<section class="floor-care-section"><h3>${p.eventFired ? 'Choose your response' : 'Continue the ordered plan'}</h3>${p.eventFired ? `<p>Connect the current patient and device findings with the active orders.</p><fieldset class="floor-choices"><legend>What will you do?</legend>${model.choices.map(([id, label]) => `<label><input type="radio" name="floor-response" value="${id}"><span>${esc(label)}</span></label>`).join('')}</fieldset>${button('respond', p.planDone ? 'Response underway · review the plan' : 'Act within this case’s orders', attrs, 'primary')}` : '<p>Receive report, assess, check the devices and verify the chart. New changes appear during the shift; the room title does not disclose them.</p>'}</section><section class="floor-care-section"><h3>Measured urine / fluid balance</h3><p>Collection reading for the interval being closed: <strong>${p.current.UO} mL</strong>, ${p.profile === 'sled-rounds' ? 'amber' : 'yellow'} urine. Inspect the collection system, tubing and ordered intake / net balance. ${pendingKind(p, 'round') ? `Next record ${clockAt(pendingKind(p, 'round').due)}.` : ''}</p><div class="floor-inline-fields"><label>Measured volume (mL)<input id="floorUrine" type="number" min="0" step="1" inputmode="decimal"></label><label>Observed appearance<select id="floorUrineAppearance"><option value="">Choose</option><option value="yellow">Yellow</option><option value="amber">Amber</option><option value="abnormal">Abnormal / blood or dark</option></select></label></div>${button('urine', 'Measure / record the interval', attrs)}</section><section class="floor-care-section"><h3>Skin and positioning</h3><p>Assess tolerance, lines / airway, pressure areas and the active positioning order. ${p.turnHold ? `Clinical hold: reassess by ${clockAt(p.turnHold.reassessAt)}; full turn remains pending.` : ''}</p><div class="buttons">${button('care', 'Reposition + skin / line checks', `${attrs} data-care="turn"`)}${button('hold-turn', 'Instability: document a hold / reassessment plan', attrs, 'quiet')}</div></section>${model.tof ? tofForm(p,model) : ''}<section class="floor-care-section"><h3>Ordered observations and labs</h3><div class="buttons">${model.frequentDrain || model.frequentCheck ? button('care', model.frequentDrain ? 'Drain / perfusion check' : model.icon === 'dialysis' ? 'SLED tolerance / net removal check' : 'Bleeding / perfusion / airway check', `${attrs} data-care="close-check"`) : ''}${button('care', 'Collect due ordered sample', `${attrs} data-care="labs"`)}</div><p class="helper">Bring a specimen pack and verify collection timing. Do not wait for lab results before urgent assessment or notification.</p></section>`;
    if (tab === 'orders') return `<section class="floor-chart-section"><h3>Active / conditional orders</h3><p>${esc(model.orders)}</p><p>${esc(model.routine)}</p>${button('care', p.ordersRead ? 'Orders reviewed ✓' : 'Verify active orders and timing', `${attrs} data-care="orders"`, 'primary')}</section><p class="helper">Use the worklist and flowsheet to record obtained care with its performed time. This is a fictional training chart organized around your Expanse workflow.</p>`;
    if (tab === 'mar') return `<section class="floor-chart-section"><h3>MAR / infusion reconciliation</h3><p>${esc(model.med.order)}</p><fieldset class="floor-choices"><legend>Complete the medication safety check</legend>${model.med.choices.map(([id, label]) => `<label><input type="radio" name="floor-med" value="${id}"><span>${esc(label)}</span></label>`).join('')}</fieldset>${button('meds', 'Verify the medication / infusion check', attrs)}</section><details class="floor-explainer"><summary>Medication roles · different purposes, patient-specific orders</summary><div class="table-wrap"><table><thead><tr><th>Medication</th><th>Purpose</th><th>What to verify</th></tr></thead><tbody>${DRUG_ROLES.map(([drug,role,checks])=>`<tr><td>${esc(drug)}</td><td>${esc(role)}</td><td>${esc(checks)}</td></tr>`).join('')}</tbody></table></div><p>This reference is not an order set. The drug, indication, concentration, dose / rate, goal and authority must be present in the actual case prescription before use.</p></details>`;
    if (tab === 'worklist') return `<h3>Patient worklist</h3><p>Obtain the assessment at the bedside, then record the actual performed time. Pending work is not automatically charted as done.</p>${p.tasks.filter(t=>!t.done).map(t=>`<article class="floor-flow-entry"><b>${when(shift,t)}</b><p>${esc(t.title)}</p></article>`).join('')}<div class="buttons">${button('patient-tab','Open observation documentation','data-tab="flowsheet"')}${button('go-bed','Go to bedside',attrs)}</div>`;
    if (tab === 'labs') return `<p class="helper">Baseline values from the incoming chart. Reference intervals shown belong to the fictional case laboratory; interpret trends and collection timing.</p><div class="table-wrap"><table><thead><tr><th>Test</th><th>Baseline</th><th>Case reference</th></tr></thead><tbody>${model.labs.map(([name, value, unit, range]) => `<tr><td>${esc(name)}</td><td>${esc(value)} ${esc(unit)}</td><td>${esc(range)} ${esc(unit)}</td></tr>`).join('')}</tbody></table></div><div class="floor-callout"><h3>Collection / result status</h3><p data-lab-status>${esc(labStatus(p))}</p></div><p class="helper">A baseline sample is not evidence of a later change. The game keeps the specimen and result timestamps distinct.</p>`;
    if (tab === 'history') return `<h3>Chief concern / admission context</h3><p>${esc(model.report)}</p><h3>History and diagnostic review</h3><p>${esc(model.history)}</p><p>Review the current provider / specialist plan, diagnostic reports and unresolved studies. A requested scan or ECG is not a completed diagnostic result.</p><h3>Team / event timeline</h3><div class="floor-timeline">${shift.log.filter(e => e.room === p.room && ['change', 'care', 'lab', 'admission'].includes(e.kind)).slice(-12).map(e => `<p><b>${e.time}</b> ${esc(e.text)}</p>`).join('') || '<p>No new patient events recorded.</p>'}</div>`;
    if (tab === 'flowsheet') return `<h3>Obtained observations waiting to be charted (${p.observations.length})</h3>${p.observations.map(o => `<article class="floor-flow-entry"><b>${clockAt(o.at)} · ${esc(o.kind)}</b><p>${esc(o.text)}</p></article>`).join('') || '<p>No obtained observations waiting.</p>'}${button('care', 'Review / record obtained observations', `${attrs} data-care="chart"`, 'primary')}<h3 style="margin-top:24px">Recorded entries (${p.flowsheet.length})</h3>${p.flowsheet.slice(-12).reverse().map(o => `<article class="floor-flow-entry"><b>Assessed ${clockAt(o.at)} · charted ${clockAt(o.chartedAt)}</b><p>${esc(o.text)}</p></article>`).join('') || '<p class="helper">No recorded entries yet. Record the actual assessment time; do not backfill an exam you did not obtain.</p>'}`;
    if (tab === 'notes') return `<p>Write what you assessed, did, communicated and reassessed. Hand off unresolved concerns and next due care. Use fictional details only.</p><div class="floor-note-fields">${NOTE_FIELDS.map(([id, label]) => `<div><div class="floor-note-label"><label for="floor-note-${p.room}-${id}">${label}</label>${button('mic', 'Mic', `${attrs} data-field="${id}" aria-label="Dictate ${esc(label)}"`, 'quiet')}</div><textarea id="floor-note-${p.room}-${id}" data-shift-note="${id}" data-room="${p.room}" rows="3">${esc(p.note[id])}</textarea></div>`).join('')}</div><p class="helper">This checks field completeness, not clinical truth or competency. Game events and observations are kept separately in the journal.</p><div class="buttons">${button('care', 'Review / complete handoff fields', `${attrs} data-care="handoff"`, 'primary')}${button('export', 'Export shift journal')}</div>`;
    return '';
  }

  function tofForm(p, model) {
    return `<section class="floor-care-section"><h3>Train-of-four / clinical documentation</h3><p>Observed case reading: <b>${p.reassessed ? model.tof.followup : model.tof.baseline}/4</b>, left ulnar site, established stimulus <b>${model.tof.current} mA</b>. Record the observed site / current / count and clinical context. This example does not establish a universal current, target or titration rule.</p><div class="floor-inline-fields"><label>Observed stimulation site<select id="floorTofSite"><option value="">Choose</option><option value="left-ulnar">Left ulnar / adductor pollicis</option><option value="right-ulnar">Right ulnar / adductor pollicis</option></select></label><label>Established stimulus (mA)<input id="floorTofCurrent" type="number" inputmode="numeric"></label><label>Observed twitches (out of 4)<input id="floorTofTwitches" type="number" min="0" max="4" inputmode="numeric"></label><label>Clinical interpretation<select id="floorTofContext"><option value="">Choose</option><option value="blockade-only">Blockade finding; separately assess the prescribed analgesia / sedation / ventilation plan</option><option value="sedated">This proves the patient is unconscious and pain-free</option></select></label></div>${button('tof-record','Record observed TOF / clinical context',`data-room="${p.room}"`)}<p class="helper">Paralysis can mask movement. A twitch count or an unresponsive-looking patient cannot establish comfort, awareness or extubation readiness.</p></section>`;
  }
  function endPrompt() {
    const summary = shiftSummary(shift);
    modal(`<p class="eyebrow">HANDOFF / END SHIFT</p><h2>What does the next nurse need?</h2><p>${shift.elapsed < shift.duration ? 'You can end early for a practice debrief. Unfinished work stays visible.' : 'The clock is paused at the scheduled handoff.'} There are ${summary.pending.length} pending tasks and ${summary.uncharted} obtained observations waiting to be charted.</p><p>Complete the patient SBARs at a computer. An improved monitor number does not erase an unresolved clinical concern.</p><div class="buttons">${button('go-station', 'Walk to charts', '', 'primary')}${button('end', 'End and review this shift')}${button('export', 'Export journal')}</div>`, {kind: 'end'});
  }
  function debrief() {
    const summary = shiftSummary(shift);
    modal(`<p class="eyebrow">${FLOOR_PODS[shift.pod].name} / SHIFT DEBRIEF</p><h2>The work between the alarms.</h2><p>${clockAt(shift.elapsed)} · ${shift.endedEarly ? 'Practice ended early' : 'Scheduled handoff'} · assignment seed ${shift.seed}</p><div class="floor-debrief-stats"><div><b>${summary.reassessed}/${shift.patients.length}</b><span>changes reassessed</span></div><div><b>${summary.handoffs}/${shift.patients.length}</b><span>handoff fields reviewed</span></div><div><b>${summary.pending.length}</b><span>pending care tasks</span></div></div><p>${summary.missedWindows} overdue scheduling windows · ${summary.safetyStops} unsafe choices intercepted · ${summary.uncharted} uncharted observations. These are game feedback, not a validated competency grade or a mortality prediction.</p>${summary.admissionPending ? '<div class="floor-callout">The admission was not accepted. The receiving setup / handoff remains incomplete; transport retained care.</div>' : ''}${summary.unresolved.length ? `<div class="floor-callout urgent">Response reassessment remains incomplete in room(s) ${summary.unresolved.join(', ')}. Do not hand these off as resolved.</div>` : ''}<h3>Patients and continuing concerns</h3>${shift.patients.map(p => `<article class="floor-flow-entry"><h3>Room ${p.room} · ${esc(profileOf(p).label)}</h3><p>${esc(p.reassessed ? profileOf(p).afterExam : p.eventFired ? profileOf(p).changeExam : 'The later patient change was not reached during this practice segment.')}</p><p class="helper">${sourceLinks(profileOf(p))}</p></article>`).join('')}<details class="floor-explainer"><summary>Pending / overdue care (${summary.pending.length})</summary>${summary.pending.map(t => `<p>R${t.room} · ${esc(t.title)} · ${clockAt(t.due)}</p>`).join('')}</details><div class="buttons">${button('setup', 'Choose the next shift →', '', 'primary')}${button('export', 'Export journal')}${button('exit', 'Hospital', '', 'quiet')}</div>`, {kind: 'debrief'});
  }

  function dictate(room, field) {
    if (speech) {stopSpeech(); feedback('Dictation stopped. Check the transcription.'); return;}
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const target = dialog.querySelector(`[data-shift-note="${field}"]`);
    if (!Recognition) {feedback('Use your phone keyboard microphone or type; this browser does not expose speech recognition.'); target?.focus(); return;}
    const owner = shift.id, rec = new Recognition();
    rec.lang = 'en-US'; rec.interimResults = false; rec.continuous = false;
    rec.onresult = event => {
      if (speech !== rec || shift.id !== owner || currentView?.room !== room || currentView?.tab !== 'notes' || !target?.isConnected) return;
      const text = Array.from(event.results).map(r => r[0].transcript).join(' ');
      target.value = [target.value, text].filter(Boolean).join(' ');
      recordNote(shift, room, field, target.value); save(); feedback('Dictation added. Review it before handoff.');
    };
    rec.onerror = () => {if (speech === rec) {speech = null; feedback('Microphone unavailable. Use keyboard dictation or type.');}};
    rec.onend = () => {if (speech === rec) speech = null;};
    try {speech = rec; rec.start(); feedback('Listening for this note field. Use fictional details only.');}
    catch {speech = null; feedback('Microphone could not start. Type or use your keyboard microphone.');}
  }

  document.addEventListener('click', event => {
    const b = event.target.closest('[data-shift]');
    if (!b || !(app.contains(b) || dialog.contains(b))) return;
    const action = b.dataset.shift, room = Number(b.dataset.room);
    if (action === 'exit') {destroy(); onExit(); return;}
    if (action === 'close') {closeDialog(); return;}
    if (action === 'choose-pod') {pod = b.dataset.pod; setup(); return;}
    if (action === 'new') {newAssignment(); return;}
    if (action === 'resume') {shift = vault.active; if (shift) {pod = shift.pod; if (!shift.ended && shift.elapsed < shift.duration) shift.paused = false; mount();} return;}
    if (action === 'history') {shift = vault.history[Number(b.dataset.index)]; if (shift) {shift = JSON.parse(JSON.stringify(shift)); shift.paused = true; mount();} return;}
    if (action === 'setup') {save(); setup(); return;}
    if (!shift) return;
    if (action === 'go-station') return goTo('station');
    if (action === 'go-supply') return goTo('supply');
    if (action === 'go-charge') return goTo('charge');
    if (action === 'go-bed') return goTo('bed', room);
    if (action === 'go-computer') return goTo('computer', room);
    if (action === 'go-admission') return goTo('admission');
    if (action === 'go-task') {
      const kind = b.dataset.task;
      if (kind === 'urgent-call') {showResult(performCare(shift, room, 'notify')); return;}
      if (kind === 'report') return goTo('station');
      const tabs = {orders:'orders', meds:'mar', chart:'flowsheet', handoff:'notes', assess:'assessment', neuro:'assessment', reassess:'assessment', device:'device', procedure:'device'};
      return goTo(['orders','meds','chart','handoff'].includes(kind) ? 'computer' : 'bed', room, true, tabs[kind] || 'care');
    }
    if (action === 'pause') {shift.paused = !shift.paused; stopWalking(); save(); updateHud(true); return;}
    if (action === 'interact') {if (!shift.paused) interact(); else feedback('Resume the clock / floor to move and interact.'); return;}
    if (action === 'radio') {showResult(performCare(shift, room, 'notify')); return;}
    if (action === 'chart-open') return patientWorkspace(room, 'computer', 'orders');
    if (action === 'patient-tab') return patientWorkspace(currentView.room, currentView.kind, b.dataset.tab);
    if (action === 'pack') return showResult(packSupplies(shift, [...dialog.querySelectorAll('[name="floor-supply"]:checked')].map(e => e.value)), supplies);
    if (action === 'return') return showResult(returnSupplies(shift), supplies);
    if (action === 'procedure') return procedure(b.dataset.procedure, b.dataset.practice === 'true');
    if (action === 'start-drill') {currentView.deadline = performance.now() + PROCEDURES[currentView.procedure].seconds * 1000; b.hidden = true; return;}
    if (action === 'check-procedure') {
      const view = {...currentView}, picked = [...dialog.querySelectorAll('[name="floor-procedure"]:checked')].map(e => e.value);
      const result = checkProcedure(shift, view.procedure, picked, view);
      showResult(result, text => result.ok ? (view.practice ? station('charge', text) : supplies(text)) : procedure(view.procedure, view.practice, text, picked, view)); return;
    }
    if (action === 'admission-report') return showResult(receiveAdmissionReport(shift), text => station('station', text));
    if (action === 'install') return showResult(installAdmissionSupply(shift, b.dataset.item), admission);
    if (action === 'accept') {
      const result = acceptAdmission(shift, [...dialog.querySelectorAll('[name="arrival-check"]:checked')].map(e => e.value));
      return showResult(result, text => result.ok ? patientWorkspace(shift.admission.room, 'bed', 'assessment', text) : admission(text));
    }
    if (action === 'care' || action === 'respond' || action === 'meds' || action === 'urine' || action === 'hold-turn') {
      const care = action === 'care' ? b.dataset.care : action === 'meds' ? 'meds' : action === 'urine' ? 'round' : action === 'hold-turn' ? 'hold-turn' : 'respond';
      const value = care === 'respond' ? dialog.querySelector('[name="floor-response"]:checked')?.value : care === 'meds' ? dialog.querySelector('[name="floor-med"]:checked')?.value : care === 'round' ? {volume: dialog.querySelector('#floorUrine')?.value, appearance: dialog.querySelector('#floorUrineAppearance')?.value} : care === 'hold-turn' ? 'instability' : undefined;
      const view = {...currentView};
      return showResult(performCare(shift, room, care, value), text => ['bed', 'computer'].includes(view.kind) ? patientWorkspace(room, view.kind, view.tab, text) : station(view.kind, text));
    }
    if (action === 'tof-record') {const view={...currentView};const value={site:dialog.querySelector('#floorTofSite')?.value,current:dialog.querySelector('#floorTofCurrent')?.value,twitches:dialog.querySelector('#floorTofTwitches')?.value,context:dialog.querySelector('#floorTofContext')?.value};return showResult(performCare(shift,room,'tof',value),text=>patientWorkspace(room,view.kind,view.tab,text));}
    if (action === 'mic') return dictate(room, b.dataset.field);
    if (action === 'export') return download();
    if (action === 'end-prompt') return shift.ended ? debrief() : endPrompt();
    if (action === 'end') {endShift(shift); save(); updateHud(true); debrief();}
  }, {signal});
  document.addEventListener('change', event => {
    if (event.target.id === 'floorLevel') {level = Number(event.target.value); setup();}
    if (event.target.id === 'floorMode') mode = event.target.value;
  }, {signal});
  document.addEventListener('input', event => {
    if (!shift || !event.target.dataset.shiftNote) return;
    recordNote(shift, Number(event.target.dataset.room), event.target.dataset.shiftNote, event.target.value); save();
  }, {signal});
  dialog.addEventListener('cancel', () => {stopSpeech(); currentView = null; release();}, {signal});
  dialog.addEventListener('click', event => {if (event.target === dialog) closeDialog();}, {signal});
  document.addEventListener('keydown', event => {
    if (!shift || !canvas || shift.paused || shift.ended || document.querySelector('dialog[open]') || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable) return;
    const directions = {ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right'};
    if (directions[event.key]) {event.preventDefault(); keys.add(directions[event.key]);}
    if (['e', 'E', ' ', 'Enter'].includes(event.key) && !event.repeat && event.target.tagName !== 'BUTTON') {event.preventDefault(); interact();}
  }, {signal});
  document.addEventListener('keyup', event => {
    const names = {ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right'};
    if (names[event.key]) keys.delete(names[event.key]);
  }, {signal});
  document.addEventListener('pointerdown', event => {
    const b = event.target.closest('[data-floor-dir]');
    if (!b || !shift || shift.paused || shift.ended || dialog.open) return;
    event.preventDefault(); path = []; destination = null; autoInteract = false;
    pointerDirections.set(event.pointerId, b.dataset.floorDir); b.setPointerCapture?.(event.pointerId);
  }, {signal});
  for (const eventName of ['pointerup', 'pointercancel', 'lostpointercapture']) document.addEventListener(eventName, event => {pointerDirections.delete(event.pointerId);}, {signal});
  const suspend = () => {stopWalking(); stopSpeech(); if (shift && !shift.ended) {shift.paused = true; save(); updateHud(true);}};
  window.addEventListener('blur', suspend, {signal});
  window.addEventListener('pagehide', suspend, {signal});
  document.addEventListener('visibilitychange', () => {if (document.hidden) suspend();}, {signal});
  function destroy() {
    if (destroyed) return;
    save(); destroyed = true; stopWalking(); stopSpeech(); cancelAnimationFrame(frame); controller.abort(); dialog.remove();
    document.body.classList.remove('floor-mode');
  }
  return {start(initialPod = 'delta') {pod = FLOOR_PODS[initialPod] ? initialPod : 'delta'; setup();}, destroy};
}
