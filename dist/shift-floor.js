import {FLOOR_PODS, SHIFT_LEVELS, SUPPLIES, PROCEDURES, ADMISSIONS, NOTE_FIELDS, DRUG_ROLES} from './shift-data.js?v=0.4.1';
import {createShift, restoreShift, patientAt, profileOf, clockAt, openTasks, advanceShift, packSupplies, returnSupplies, checkProcedure, receiveAdmissionReport, installAdmissionSupply, acceptAdmission, recordNote, performCare, endShift, shiftSummary, exportShift, SIM_MINUTES_PER_SECOND} from './shift-engine.js?v=0.4.1';
import {roomGeometry, routeBetween, moveNurse, followRoute, nearestTarget, interactionTargets, drawFloor, walkAllowed} from './shift-map.js?v=0.4.1';
import {CLINICAL_SOURCES} from './sources.js?v=0.4.1';

import {ensureArcade, award, activateBoost, updateArcade, answerPhone, bedsideClues, revealClue, packOne, removeOne, assessIV, chooseAccessPlan, pickFlush, startIV, ivStep, startALine, alineStep, requestPurge, collectPurge, deliverPurge, missionFor, ALINE_PARTS, identityFor} from './shift-arcade.js?v=0.4.1';

const STORE = 'shift-icu-floor-v3';
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const button = (action, text, attrs = '', style = 'secondary') => `<button class="${style}" data-shift="${action}" ${attrs}>${text}</button>`;
const when = (shift, t) => t.priority === 'urgent' && t.kind !== 'reassess' ? 'NOW' : t.due < shift.elapsed ? `Overdue · ${clockAt(t.due)}` : `Due ${clockAt(t.due)}`;
const pendingKind = (p, kind) => p.tasks.find(t => t.kind === kind && !t.done);

export function createShiftGame({app, onExit}) {
  const controller = new AbortController(), signal = controller.signal;
  let shift = null, pod = 'delta', mode = 'coached', level = 2, frame = 0, previous = 0, clockBudget = 0;
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
    app.innerHTML = `<section class="shift-intro"><p class="eyebrow">CLOCK IN / FLOOR SHIFT</p><h1>Your patients.<br>Your floor.<br><em>Your next move.</em></h1><p>Spot clues. Fill your gray bin. Beat the next interruption. Charge has the report; your iMobile has the surprises.</p>${saved ? `<div class="floor-resume"><strong>${FLOOR_PODS[saved.pod].name} · ${clockAt(saved.elapsed)} · ${saved.patients.length} patient${saved.patients.length === 1 ? '' : 's'}</strong>${button('resume', saved.ended ? 'Review last debrief' : 'Resume my shift', '', 'primary')}</div>` : ''}<div class="floor-pod-choices">${Object.entries(FLOOR_PODS).map(([id, p]) => `<button class="floor-pod-choice ${pod === id ? 'selected' : ''}" data-shift="choose-pod" data-pod="${id}" aria-pressed="${pod === id}" style="--pod:${p.color}"><b>${p.name}</b><span>${p.specialty}</span></button>`).join('')}</div><div class="floor-setup-fields"><label>Shift<select id="floorLevel">${SHIFT_LEVELS.map(l => `<option value="${l.id}" ${level === l.id ? 'selected' : ''}>${l.id}. ${l.name}</option>`).join('')}</select></label><label>Support<select id="floorMode"><option value="coached" ${mode === 'coached' ? 'selected' : ''}>Coached · reading pauses the clock</option><option value="independent" ${mode === 'independent' ? 'selected' : ''}>Independent · clock runs in workspaces</option></select></label></div><p class="floor-level-description">${esc(SHIFT_LEVELS.find(l => l.id === level).description)}</p><div class="buttons">${button('new', 'Receive my assignment →', '', 'primary')}${button('exit', 'Hospital / focused cases', '', 'quiet')}</div><div class="floor-expectations"><span>⌂ 12 rooms to explore</span><span>↔ Keyboard, tap-to-walk or touch pad</span><span>◷ 1 real minute = 30 simulated minutes</span></div><details class="floor-explainer"><summary>Before you clock in</summary><p>Nursing actions also advance a small amount of simulated time. Pause whenever needed. Independent play adds scheduling pressure; time alone never authorizes unsafe care. Alpha’s later shift can have three stable patients; the high-acuity ICU shifts use one or two.</p><p>The floor cases use fictional orders and scripted responses. SLED is a generic workflow until the exact machine is confirmed. Invasive procedures and specialist device changes remain assigned to the trained clinical team. No delegation system is included.</p><p>Your existing focused-case notes are preserved separately. Starting a new floor shift keeps up to ten earlier floor shifts in this browser. ${storageOkay ? 'Progress saves automatically.' : 'Storage is unavailable; export before leaving.'}</p></details>${vault.history.length ? `<details class="floor-explainer"><summary>Earlier shifts (${vault.history.length})</summary><div class="floor-history">${vault.history.map((s, i) => button('history', `${FLOOR_PODS[s.pod].name} · ${clockAt(s.elapsed)} · seed ${s.seed}`, `data-index="${i}"`)).join('')}</div></details>` : ''}</section>`;
  }
  function newAssignment() {
    if (vault.active) vault.history = [...vault.history, JSON.parse(JSON.stringify(vault.active))].slice(-10);
    const seed = globalThis.crypto?.getRandomValues ? crypto.getRandomValues(new Uint32Array(1))[0] : Date.now();
    shift = createShift({pod, mode, level, seed}); ensureArcade(shift,{fresh:true}); save(); mount();
  }
  function mount() {
    closeDialog(); ensureArcade(shift); if(!walkAllowed(shift.player.x,shift.player.y))shift.player={x:1000,y:580}; document.body.classList.add('floor-mode');
    const p = FLOOR_PODS[shift.pod];
    app.innerHTML = `<section class="floor-game" style="--pod:${p.color}"><header class="floor-heading"><div><p class="eyebrow">${p.specialty} / ${SHIFT_LEVELS.find(l => l.id === shift.level).name}</p><h1>${p.name}<span> · Night shift</span></h1></div><div class="floor-clock"><b id="shiftClock">${clockAt(shift.elapsed)}</b><span id="shiftReadingStatus"></span></div></header><div class="floor-toolbar">${button('go-station', 'Report / charts')}${button('go-supply', 'Supplies')}${button('go-charge', 'Charge nurse')}${button('pause', shift.paused ? 'Resume clock' : 'Pause', 'id="shiftPause"')}${button('end-prompt', 'Handoff / finish', '', 'quiet')}</div><section id="arcadeMission" class="arcade-mission" aria-label="Current objective"></section><div class="arcade-tools">${button('phone-open','☎ iMobile','id="arcadePhone"')}${button('boost','⚡ Celsius ×3','id="arcadeBoost"')}<span id="arcadeETA" class="arcade-eta" hidden></span><span class="arcade-power-note">Three arcade sprint boosts per shift</span></div><div id="arcadePop" class="arcade-pop" role="status" hidden></div><div id="shiftAlert" class="floor-alert" aria-live="polite"></div><div class="floor-layout"><div class="floor-play"><div class="floor-viewport"><canvas id="shiftFloorCanvas" tabindex="0" role="img" aria-label="Walkable twelve-room ICU floor. Tap to walk or use arrows or W A S D. Use the room and destination buttons for accessible navigation." aria-describedby="floorMovementHint"></canvas><span class="floor-map-caption">${p.name.toUpperCase()} / ROOMS 01–12</span><span id="floorPauseCover" class="floor-paused" hidden>PAUSED</span></div><div class="floor-controls"><div class="floor-pad" aria-label="Nurse movement"><button data-floor-dir="up" aria-label="Walk up">▲</button><button data-floor-dir="left" aria-label="Walk left">◀</button><button data-floor-dir="down" aria-label="Walk down">▼</button><button data-floor-dir="right" aria-label="Walk right">▶</button></div><div class="floor-interact-wrap"><button id="shiftInteract" class="primary" data-shift="interact">Walk toward a bedside or computer</button><span id="floorMovementHint">Tap to walk · arrows / WASD · E or space to interact</span></div></div><p id="shiftFeedback" class="floor-feedback" role="status" aria-live="polite">${esc(shift.feedback)}</p><div class="floor-cart"><b>GRAY BIN</b><span id="shiftInventory"></span>${button('export', 'Export journal', '', 'quiet')}<span id="shiftSaveStatus"></span></div></div><aside class="floor-board"><div class="floor-board-heading"><h2>Your assignment</h2><span id="shiftProgress"></span></div><div id="shiftPatients"></div><div id="shiftAdmission"></div><details class="floor-explainer"><summary>Clinical worklist / due care</summary><div id="shiftDue"></div></details><p class="helper">Urgent calls are available from your radio. Patient checks happen at the bedside; charts and notes are at computers.</p></aside></div></section>`;
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
    updateReadingStatus(); arcadeHUD();
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
      if(currentView?.kind==='arcade-pyxis'&&currentView.pharmacyState!==(shift.arcade.pharmacy?.state||'none'))arcadePyxis('Pharmacy update: your pickup drawer is ready.');
      if (currentView?.tab === 'labs') {
        const p = patientAt(shift, currentView.room), el = dialog.querySelector('[data-lab-status]');
        if (p && el) el.textContent = labStatus(p);
      }
    }
  }
  function supplyName(id) {
    return ({'iv-kit':'Peripheral IV kit',flush:'Patient-labelled saline flush','purge-bag':'Pharmacy-labelled purge bag'})[id] || SUPPLIES.find(s => s.id === id)?.name || Object.values(PROCEDURES).find(p => p.item === id)?.name || id;
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
    if (near.kind === 'station' || near.kind === 'charge') arcadeStation(near.kind);
    if (near.kind === 'supply') arcadeSupply();
    if (near.kind === 'pyxis') arcadePyxis();
    if (near.kind === 'admission') admission();
    if (near.kind === 'bed') near.tab ? patientWorkspace(near.room,'bed',near.tab) : arcadeBed(near.room);
    if (near.kind === 'computer') near.tab ? patientWorkspace(near.room,'computer',near.tab) : arcadeComputer(near.room);
  }
  function tick(ts) {
    if (destroyed || !canvas) return;
    const realDt = Math.max(0, Math.min((ts - previous) / 1000, 2)); const dt=realDt; previous = ts;
    const speed=shift.arcade?.boostLeft>0?1.75:1;
    const stepMove=(dx,dy,budget=dt)=>{for(let left=budget;left>0.0001;){const step=Math.min(left,0.025);moveNurse(shift.player,dx,dy,step,speed);left-=step;}};
    const anyDialog = !!document.querySelector('dialog[open]');
    if (anyDialog) release();
    if (!shift.paused && !shift.ended && !anyDialog && !document.hidden) {
      const held = new Set([...keys, ...pointerDirections.values()]);
      let dx = Number(held.has('right')) - Number(held.has('left')), dy = Number(held.has('down')) - Number(held.has('up'));
      if (dx || dy) {path = []; destination = null; autoInteract = false; stepMove(dx,dy);}
      else if (path.length) {
        followRoute(shift.player, path, dt, speed);
        if (!path.length && autoInteract && destination) {
          const target = destination; destination = null; autoInteract = false;
          if (Math.hypot(target.x - shift.player.x, target.y - shift.player.y) <= 82) interact(target);
        }
      }
    }
    const readingPause = anyDialog && shift.mode === 'coached' || currentView?.kind === 'procedure';
    if (!shift.paused && !shift.ended && !document.hidden && !readingPause) {
      clockBudget += realDt;
      if (clockBudget >= 1) {advanceShift(shift, clockBudget * SIM_MINUTES_PER_SECOND); clockBudget = 0;}
    }
    if (currentView?.kind === 'procedure' && currentView.deadline) {
      const left = Math.max(0, Math.ceil((currentView.deadline - ts) / 1000));
      const timer = document.getElementById('shiftDrillTimer');
      if (timer) timer.textContent = left ? `${left}s · optional practice timer` : 'Timer finished · keep checking carefully';
      if (!left) currentView.timedOut = true;
    }
    if(!readingPause&&!document.hidden)updateArcade(shift,realDt);
    camera = drawFloor(canvas, shift, path, ts); updateHud();
    if (ts - lastSave > 5000) {save(); lastSave = ts;}
    frame = requestAnimationFrame(tick);
  }

  function arcadeResult(r, renderAgain = null) {
    feedback(r.text);save();updateHud(true);
    const pop=document.getElementById('arcadePop');
    if(pop){pop.textContent=r.points?`+${r.points}  ${r.text}`:r.text;pop.className=`arcade-pop ${r.ok?'win':'try-again'}`;pop.hidden=false;clearTimeout(pop._timer);pop._timer=setTimeout(()=>{pop.hidden=true;},3500);}
    if(renderAgain)renderAgain(r.text);
    if(r.points){const box=document.getElementById('shiftModalResponse');if(box){box.textContent=`+${r.points} QUEST POINTS · ${r.text}`;box.classList.add('arcade-win');box.hidden=false;}}
  }
  function arcadeHUD(){
    if(!shift?.arcade||!canvas)return;
    const a=ensureArcade(shift),m=missionFor(shift),host=document.getElementById('arcadeMission');
    a.focus={kind:m.kind,room:m.room};
    const html=`<div class="arcade-mission-copy"><span class="arcade-kicker">YOUR NEXT MOVE</span><h2>${esc(m.title)}</h2><p>${esc(m.hint)}</p></div>${button('mission',m.label,'','primary')}<div class="arcade-score"><b>${a.score}</b><span>QUEST POINTS</span></div>`;
    if(host&&host.innerHTML!==html)host.innerHTML=html;
    const phone=document.getElementById('arcadePhone');
    if(phone){const ringing=shift.admission?.announced&&!shift.admission.accepted&&!a.phoneAnswered;phone.classList.toggle('ringing',!!ringing);phone.textContent=ringing?'☎ iMobile · INCOMING!':a.pharmacy?.state==='ready'?'☎ Pharmacy · READY':'☎ iMobile';}
    const boost=document.getElementById('arcadeBoost');
    if(boost){boost.textContent=a.boostLeft>0?`⚡ CELSIUS ${Math.ceil(a.boostLeft)}s`:`⚡ Celsius ×${a.boosts}`;boost.disabled=shift.ended||a.boosts===0&&a.boostLeft===0;}
    const eta=document.getElementById('arcadeETA');
    if(eta){eta.textContent=shift.admission?.reportRead&&!shift.admission.accepted?(a.transportHeld?'Transport holding safely':`Admission ETA ${clockAt(a.arrivalAt||shift.elapsed+30)} · ${Math.max(0,Math.ceil((a.arrivalAt||shift.elapsed)-shift.elapsed))} shift min`):'';eta.hidden=!eta.textContent;}
  }
  function followMission(){
    const m=missionFor(shift);
    if(m.kind==='radio'){arcadeResult(performCare(shift,m.room,'notify'));goTo('bed',m.room);return;}
    if(m.kind==='phone')return arcadePhone();
    goTo(m.kind,m.room);
  }
  function arcadePhone(message=''){
    const a=ensureArcade(shift),incoming=shift.admission,ringing=incoming?.announced&&!incoming.accepted;
    modal(`<p class="eyebrow">☎ iMOBILE</p><h2>${ringing?'Charge is calling.':'Your shift hotline.'}</h2>${responseBox(message)}${ringing?`<div class="arcade-quote">“Got a patient for you. You get the room; we get the wheels.”</div>${incoming.reportRead?`<h3>Room ${incoming.room} · ${esc(ADMISSIONS[shift.pod].name)}</h3><p>${esc(ADMISSIONS[shift.pod].brief)}</p><p class="arcade-ticket">ETA ${clockAt(a.arrivalAt||shift.elapsed+30)}${a.transportHeld?' · Transport holding':''}</p>${button('go-admission','Take me to the receiving room →','','primary')}`:button('answer-phone','Answer + reveal receiving ticket','','primary')}`:'<p>No new admission report. Keep moving; charge will ring you.</p>'}${a.pharmacy?`<div class="floor-callout"><b>Pharmacy</b><p>${a.pharmacy.state==='requested'?`Preparing your purge · ETA ${clockAt(a.pharmacy.readyAt)}`:a.pharmacy.state==='ready'?'Purge bag ready in the Pyxis pickup drawer.':'Purge order collected / handed off.'}</p></div>`:''}${button('close','Back to the floor','','quiet')}`,{kind:'phone'});
  }
  function arcadeStation(kind='station',message=''){
    const a=ensureArcade(shift);
    modal(`<p class="eyebrow">${kind==='charge'?'CHARGE NURSE':'NURSING STATION'}</p><h2>“You’ve got this. Start here.”</h2>${responseBox(message)}<div class="arcade-report-grid">${shift.patients.map(p=>`<article class="arcade-ticket"><span>ROOM ${p.room}</span><h3>${esc(profileOf(p).label)}</h3><p>${esc(profileOf(p).report)}</p><div class="buttons">${button('quick-report',p.reportRead?'Report received ✓':'Hear the short report',`data-room="${p.room}"`,p.reportRead?'secondary':'primary')}${button('chart-open','Full chart',`data-room="${p.room}"`)}${button('go-bed','Go meet your patient →',`data-room="${p.room}"`,'quiet')}</div></article>`).join('')}</div><div class="buttons">${button('mission','Follow my next objective →','','primary')}${button('practice-aline','A-line challenge')}${button('legacy-station','Detailed report / equipment practice','','quiet')}</div><p class="helper">Quest points reward completed game tasks. They are not a clinical grade.</p>`,{kind:'arcade-station'});
  }
  function arcadeBed(room,message=''){
    const p=patientAt(shift,room);if(!p)return;
    const responseReady=p.assessedChange&&p.checkedChange&&p.ordersRead&&(!profileOf(p).tof||p.medChecked&&p.tofBaseline);
    const a=ensureArcade(shift),m=profileOf(p),{phase,cards}=bedsideClues(shift,p),seen=a.clues[`${room}:${phase}`]||[],iv=a.iv?.room===room&&(a.iv.state!=='done'||a.iv.choice==='labs'&&!a.iv.labsDone)?a.iv:null;
    modal(`<p class="eyebrow">ROOM ${room} / ${p.stage==='changed'?'ALARM!':'BEDSIDE QUEST'}</p><h2>${p.stage==='treated'?'Did the response work?':p.stage==='changed'?'Something changed. Find the clues.':'Three clues. One clearer picture.'}</h2><div class="floor-vitals" data-live-vitals="${room}">${vitalHTML(p)}</div>${responseBox(message)}<div class="arcade-clues">${cards.map(c=>`<button class="arcade-clue ${seen.includes(c.id)?'found':''}" data-shift="reveal-clue" data-room="${room}" data-clue="${c.id}"><span>${seen.includes(c.id)?'✓':c.icon}</span><b>${c.title}</b><small>${seen.includes(c.id)?esc(c.text):'Tap to investigate'}</small></button>`).join('')}</div>${p.eventFired&&!p.reassessed?`<div class="arcade-alarm"><b>${esc(m.event)}</b>${button('radio',p.notified?'Team contacted ✓':'Call the clinical team NOW',`data-room="${room}"`,'primary')}</div>${p.planDone?`<p class="arcade-ticket">Response underway. Recheck at ${clockAt(p.followupAt)}. The follow-up does not happen instantly.</p>`:`<h3>${responseReady?'What fits the clues?':'Unlock your response'}</h3>${responseReady?'':'<p class="helper">Find all three current clues and verify active orders. Complete any ordered TOF readiness check below. The urgent call is available now.</p>'}<div class="arcade-response-choices">${m.choices.map(([id,text])=>button('arcade-respond',esc(text),`data-room="${room}" data-choice="${id}" ${responseReady?'':'disabled'}`)).join('')}</div>`}`:''}${iv?`<section class="arcade-ticket"><h3>⌁ ${iv.state==='done'?'IV restored. Ordered labs remain.':'The peripheral IV is out.'}</h3><p>${iv.assessed?'Small ooze controlled. Critical infusion access is intact. Due labs + replacement PIV are on this case ticket.':`${esc(iv.cause||'A peripheral IV has come out.')} Check local bleeding and remaining access before running for supplies.`}</p>${!iv.assessed?button('assess-iv','Check patient + access',`data-room="${room}"`,'primary'):`<div class="buttons">${!iv.choice?button('access-plan','Replace the PIV','data-choice="iv"','primary')+button('access-plan','Due labs first','data-choice="labs"'):iv.state!=='done'?button('iv-open','Start ultrasound IV puzzle','','primary'):''}${iv.choice==='labs'&&!iv.labsDone?button('iv-labs','Collect the due ordered labs',`data-room="${room}"`):''}</div>`}</section>`:''}${m.tof?tofForm(p,m):''}${a.pharmacy?.room===room&&a.pharmacy.state==='collected'?button('purge-deliver','Hand verified bag to device team',`data-room="${room}"`,'primary'):''}<div class="buttons">${button('go-computer','Room computer →',`data-room="${room}"`)}${button('full-bed','Detailed bedside / care',`data-room="${room}"`,'quiet')}${button('close','Back to the floor','','quiet')}</div>`,{kind:'arcade-bed',room});
  }
  function arcadeComputer(room,message=''){
    const p=patientAt(shift,room);if(!p)return;const m=profileOf(p);
    modal(`<p class="eyebrow">ROOM ${room} / COMPUTER</p><h2>Check the plan. Keep the pace.</h2><p class="arcade-patient-id">${esc(identityFor(shift,room))}</p>${responseBox(message)}<div class="arcade-ticket"><span>ACTIVE CASE ORDERS</span><p>${esc(m.orders)}</p>${button('quick-orders',p.ordersRead?'Orders matched ✓':'Match active orders',`data-room="${room}"`,'primary')}</div><h3>MAR / pump check</h3><p>Match this patient, allergy, active order, medication, concentration, route, line and pump.</p><div class="arcade-response-choices">${m.med.choices.map(([id,text])=>button('quick-meds',esc(text),`data-room="${room}" data-choice="${id}"`)).join('')}</div>${p.medChecked?'<p class="arcade-ticket">✓ Active MAR / pump check completed.</p>':''}<div class="buttons">${button('chart-open','Open full chart',`data-room="${room}"`)}${button('open-sbar','SBAR / notes',`data-room="${room}"`)}${button('go-bed','Back to bedside →',`data-room="${room}"`,'quiet')}</div>`,{kind:'arcade-computer',room});
  }
  function binHTML(){
    const items=Object.entries(shift.inventory).filter(([,n])=>n>0),slots=items.flatMap(([id,n])=>Array.from({length:n},()=>id));
    return `<section class="arcade-bin"><div><b>YOUR GRAY BIN</b><span>${slots.length}/8 slots</span></div><div class="arcade-bin-slots">${Array.from({length:8},(_,i)=>`<span class="${slots[i]?'filled':''}" title="${slots[i]?esc(supplyName(slots[i])):'Empty slot'}">${slots[i]?slots[i]==='iv-kit'?'⌁':slots[i]==='flush'?'▰':slots[i]==='purge-bag'?'⚕':'▣':'·'}</span>`).join('')}</div>${items.map(([id,n])=>`<div class="arcade-bin-item"><b>${esc(supplyName(id))} ×${n}</b>${button('bin-return','−',`data-item="${id}" aria-label="Return one ${esc(supplyName(id))}"`,'quiet')}</div>`).join('')||'<p>Pick something from the shelves. Watch it land here.</p>'}</section>`;
  }
  function arcadeSupply(message=''){
    const a=shift.admission,info=ADMISSIONS[shift.pod],needed=a?.reportRead&&!a.accepted?[...info.items,...(info.procedure?[PROCEDURES[info.procedure].item]:[])].filter(id=>!a.installed[id]):[];
    const iv=shift.arcade.iv;if(iv&&iv.state!=='done'&&iv.assessed)needed.push(iv.choice==='labs'&&!iv.labsDone?'labs':'iv-kit');
    modal(`<p class="eyebrow">SUPPLY ROOM / BEHIND THE STATION</p><h2>Grab it. Bin it. Go.</h2>${responseBox(message)}<div class="arcade-shop-layout"><div><div class="arcade-shelf">${[...SUPPLIES,{id:'iv-kit',name:'Peripheral IV kit',detail:'Catheter, tourniquet, antiseptic, extension and dressing.'}].map(s=>`<button class="arcade-stock ${needed.includes(s.id)?'needed':''}" data-shift="bin-add" data-item="${s.id}"><span>${s.id==='iv-kit'?'⌁':s.id==='pump'?'♟':s.id==='labs'?'⚗':'▣'}</span><b>${esc(s.name)}</b><small>${needed.includes(s.id)?'ON YOUR ROOM TICKET':'Tap to add to bin'}</small></button>`).join('')}</div><div class="buttons">${button('pyxis-open','Pyxis / pharmacy pickup →','','primary')}${button('aline-open','Build A-line setup')}${button('procedure','CVC assistance tray','data-procedure="cvc"')}${button('close','Take my bin to the floor →','','quiet')}</div></div>${binHTML()}</div>`,{kind:'arcade-supply'});
  }
  function arcadePyxis(message=''){
    const a=ensureArcade(shift),iv=a.iv,purge=a.pharmacy,imp=shift.patients.find(p=>profileOf(p).icon==='impella');
    modal(`<p class="eyebrow">PYXIS / FICTIONAL MEDICATION PICKUP</p><h2>Right patient. Right label. Drawer opens.</h2>${responseBox(message)}${iv?.assessed&&iv.state!=='done'?`<section class="arcade-ticket"><span>ACTIVE PIV ORDER · ROOM ${iv.room}</span><h3>0.9% sodium chloride flush</h3><p class="arcade-patient-id">${esc(identityFor(shift,iv.room))}</p><p>Pick the intact, patient-labelled prefilled syringe for this case’s PIV patency check. Volume / use follow the prescribed check; no medication bolus is ordered.</p><div class="arcade-response-choices">${button('pyxis-flush',`${esc(identityFor(shift,iv.room))} · ordered flush · intact label`,'data-choice="matched"','primary')}${button('pyxis-flush','Another patient’s syringe','data-choice="wrong-patient"')}${button('pyxis-flush','Different solution / missing label','data-choice="wrong-label"')}</div></section>`:'<p class="helper">No active peripheral-flush pickup ticket.</p>'}${imp?`<section class="arcade-ticket"><span>DEVICE-TEAM ORDER ADDENDUM · ROOM ${imp.room}</span><h3>Pharmacy-prepared Impella purge</h3><p class="arcade-patient-id">${esc(identityFor(shift,imp.room))}</p><p>This side quest adds a confirmed heparin contraindication. Order: sodium bicarbonate 25 mEq/L in D5W, total 500 mL (12.5 mEq total), purge route. Pharmacy compounds it; the trained device team manages connection.</p>${!purge?button('purge-request','Request from pharmacy →','','primary'):purge.state==='requested'?`<div class="arcade-queue"><span class="arcade-spinner">◷</span><b>PHARMACY IS PREPARING IT</b><small>ETA ${clockAt(purge.readyAt)}. Keep working; your phone will update.</small></div>`:purge.state==='ready'?`<h3>Pickup drawer · choose the matching bag</h3><div class="arcade-response-choices">${button('purge-pick',`${esc(identityFor(shift,imp.room))} · 25 mEq/L · D5W · 500 mL · PURGE`,'data-choice="matched"','primary')}${button('purge-pick','25 mEq in 500 mL · D5W','data-choice="wrong-strength"')}${button('purge-pick','25 mEq/L · saline · systemic IV','data-choice="wrong-route"')}</div>`:`<p>✓ ${purge.state==='delivered'?'Verified bag handed to device team.':'Verified bag in your bin. Deliver it to the bedside.'}</p>`}</section>`:''}<div class="buttons">${button('shelf-open','Back to supply shelves')}${button('close','Back to the floor →','','quiet')}</div>${binHTML()}`,{kind:'arcade-pyxis',pharmacyState:purge?.state||'none'});
  }
  function arcadeIV(message=''){
    const a=ensureArcade(shift),v=a.iv?.scan;if(!v)return arcadeBed(a.iv?.room);
    modal(`<p class="eyebrow">ULTRASOUND IV / PHANTOM SPATIAL PUZZLE</p><h2>${v.tip===4?'Finish the line checks.':'Find the vessel. Keep the tip.'}</h2>${responseBox(message)}<div class="arcade-ultrasound ${v.compressed?'compressed':''}"><span class="arcade-scan-label">SCHEMATIC · NOT A CLINICAL IMAGE</span><svg class="arcade-needle-image ${v.visible?'visible':'lost'}" viewBox="0 0 1000 250" preserveAspectRatio="none" role="img" aria-label="Schematic needle tip ${v.visible?'visible':'out of view'}"><line x1="100" y1="55" x2="${100+v.tip*125}" y2="${55+v.tip*22.5}"/><circle cx="${100+v.tip*125}" cy="${55+v.tip*22.5}" r="8"/></svg>${['A','B','C'].map((id,i)=>`<button class="arcade-vessel vessel-${id} ${v.vessel===id?'selected':''}" data-shift="iv-step" data-step="vessel" data-value="${id}" aria-label="Select structure ${id}">${id}</button>`).join('')}<span class="arcade-scan-caption">${v.compressed?'A: remains pulsatile · B: collapses · C: nonvascular pattern':'Use compression to reveal a clue'}</span></div><div class="arcade-puzzle-progress">${[1,2,3,4].map(n=>`<span class="${v.tip>=n?'done':''}">${v.tip>=n?'✓':n}</span>`).join('')}<b>${v.visible?'TIP VISIBLE':'TIP OUT OF VIEW — DO NOT ADVANCE'}</b></div><div class="buttons">${button('iv-step','Compress / inspect','data-step="compress"')}${button('iv-step','Sweep probe · find tip','data-step="track"')}${button('iv-step','Advance one step →','data-step="advance"','primary')}</div>${v.tip===4?`<div class="arcade-check-buttons">${[['site','Site: no pain / swelling'],['patency','Patency checked per order'],['secure','Dressing + securement']].map(([id,text])=>button('iv-step',`${v.checks.includes(id)?'✓ ':''}${text}`,`data-step="check" data-value="${id}"`)).join('')}</div>${button('iv-step','Complete the IV challenge','data-step="finish"','primary')}`:''}<p class="helper">This abstract puzzle teaches image / tip checks. Real cannulation requires training, asepsis, the full procedure and supervised competence.</p>${button('close','Return to floor','','quiet')}`,{kind:'arcade-iv'});
  }
  function arcadeALine(message=''){
    const v=ensureArcade(shift).aline;if(!v)return;
    modal(`<p class="eyebrow">A-LINE / BUILD THE WAVEFORM</p><h2>${v.zeroed?'That’s a beautiful waveform.':'Make the setup work.'}</h2>${responseBox(message)}<div class="arcade-circuit"><div class="arcade-component-row">${ALINE_PARTS.map(([id,name,icon])=>`<button class="arcade-part ${v.parts.includes(id)?'connected':''}" data-shift="aline-step" data-step="part" data-value="${id}"><b>${icon}</b><span>${name}</span>${v.parts.includes(id)?'<i>✓ connected</i>':''}</button>`).join('')}</div><div class="arcade-tubing ${v.primed?'primed':''}"><span>${v.primed?'PRESCRIBED SALINE → CLOSED TRAINING CIRCUIT':'ASSEMBLE FIRST · PRIME OFF THE PATIENT'}</span>${v.primed?v.bubbles.map((id,i)=>button('aline-step','○',`data-step="bubble" data-value="${id}" aria-label="Clear air pocket ${id}" style="left:${25+i*25}%"`,'arcade-bubble')).join(''):''}</div></div><div class="buttons">${button('aline-step','Prime disconnected setup','data-step="prime"','primary')}</div><div class="arcade-pressure"><b>${v.pressure||0}<small>mmHg · this setup target: 300</small></b><div><span style="width:${(v.pressure||0)/3}%"></span></div>${button('aline-step','Pump pressure bag +100','data-step="pump"')}</div><div class="arcade-level"><div class="arcade-ra">RIGHT-ATRIAL REFERENCE</div><div class="arcade-transducer" style="top:${100-v.level}%">▥ TRANSDUCER</div></div><label class="arcade-slider">Move transducer to reference level<input id="arcadeLevel" type="range" min="0" max="100" value="${v.level}" aria-label="Transducer reference level"></label><div class="buttons">${button('aline-step','Zero to atmosphere · restore closed state','data-step="zero"')}${button('aline-step',v.practice?'Complete setup practice':'Pack prepared tray','data-step="finish"','primary')}</div>${v.zeroed?'<div class="arcade-wave"><svg viewBox="0 0 500 70" role="img" aria-label="Schematic arterial waveform unlocked"><path d="M0 55 L30 55 L40 6 L51 30 L60 26 L75 40 L90 48 L130 55 L145 55 L155 6 L166 30 L175 26 L190 40 L205 48 L245 55 L260 55 L270 6 L281 30 L290 26 L305 40 L320 48 L360 55 L375 55 L385 6 L396 30 L405 26 L420 40 L435 48 L500 55"/></svg></div>':''}<details class="floor-explainer"><summary>Setup clue / scope</summary><p>Use the case-prescribed solution, pressure system and actual IFU. Prime away from the patient, remove air, level and zero, then restore the prescribed closed state. The credentialed operator inserts the catheter. Assess site and distal perfusion afterward. This is an abstract setup puzzle, not an insertion or full monitor-use protocol.</p></details>${button('shelf-open','Back to supply shelves','','quiet')}`,{kind:'arcade-aline'});
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
    modal(`<p class="eyebrow">${FLOOR_PODS[shift.pod].name} / SHIFT DEBRIEF</p><h2>Your shift highlights.</h2><div class="arcade-finish"><b>${shift.arcade?.score||0}<small>QUEST POINTS</small></b><span>${shift.arcade?.done.length||0} completed objectives<br>Progress saved. Next shift, new surprises.</span></div>${summary.unresolved.length?`<p class="floor-response">Reassessment is still due in room(s) ${summary.unresolved.join(', ')}. Include that in handoff.</p>`:''}<p>${clockAt(shift.elapsed)} · ${shift.endedEarly ? 'Practice ended early' : 'Scheduled handoff'} · assignment seed ${shift.seed}</p><details class="floor-explainer"><summary>Clinical handoff / task review</summary><div class="floor-debrief-stats"><div><b>${summary.reassessed}/${shift.patients.length}</b><span>changes reassessed</span></div><div><b>${summary.handoffs}/${shift.patients.length}</b><span>handoff fields reviewed</span></div><div><b>${summary.pending.length}</b><span>pending care tasks</span></div></div><p>${summary.missedWindows} overdue scheduling windows · ${summary.safetyStops} unsafe choices intercepted · ${summary.uncharted} uncharted observations. These are game feedback, not a validated competency grade or a mortality prediction.</p>${summary.admissionPending ? '<div class="floor-callout">The admission was not accepted. The receiving setup / handoff remains incomplete; transport retained care.</div>' : ''}${summary.unresolved.length ? `<div class="floor-callout urgent">Response reassessment remains incomplete in room(s) ${summary.unresolved.join(', ')}. Do not hand these off as resolved.</div>` : ''}<h3>Patients and continuing concerns</h3>${shift.patients.map(p => `<article class="floor-flow-entry"><h3>Room ${p.room} · ${esc(profileOf(p).label)}</h3><p>${esc(p.reassessed ? profileOf(p).afterExam : p.eventFired ? profileOf(p).changeExam : 'The later patient change was not reached during this practice segment.')}</p><p class="helper">${sourceLinks(profileOf(p))}</p></article>`).join('')}<details class="floor-explainer"><summary>Pending / overdue care (${summary.pending.length})</summary>${summary.pending.map(t => `<p>R${t.room} · ${esc(t.title)} · ${clockAt(t.due)}</p>`).join('')}</details></details><div class="buttons">${button('setup', 'Choose the next shift →', '', 'primary')}${button('export', 'Export journal')}${button('exit', 'Hospital', '', 'quiet')}</div>`, {kind: 'debrief'});
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
    if(action==='mission')return followMission();
    if(action==='phone-open')return arcadePhone();
    if(action==='answer-phone')return arcadeResult(answerPhone(shift),arcadePhone);
    if(action==='boost'){const r=activateBoost(shift);if(r.ok)closeDialog();return arcadeResult(r);}
    if(action==='quick-report'){const r=performCare(shift,room,'report');if(r.ok)Object.assign(r,award(shift,`report:${room}`,'REPORT LOCKED! Go meet your patient.',20));return arcadeResult(r,text=>arcadeStation('charge',text));}
    if(action==='legacy-station')return station();
    if(action==='quick-orders'){const r=performCare(shift,room,'orders');if(r.ok)Object.assign(r,award(shift,`orders:${room}`,'PLAN MATCHED! Now verify the MAR / pump.',20));return arcadeResult(r,text=>arcadeComputer(room,text));}
    if(action==='quick-meds'){const r=performCare(shift,room,'meds',b.dataset.choice);if(r.ok)Object.assign(r,award(shift,`mar:${room}`,'MAR MATCH! Pump / order check complete.',25));updateArcade(shift);return arcadeResult(r,text=>arcadeComputer(room,text));}
    if(action==='full-bed')return patientWorkspace(room,'bed','assessment');
    if(action==='open-sbar')return patientWorkspace(room,'computer','notes');
    if(action==='reveal-clue')return arcadeResult(revealClue(shift,room,b.dataset.clue),text=>arcadeBed(room,text));
    if(action==='arcade-respond'){const r=performCare(shift,room,'respond',b.dataset.choice);if(r.ok)Object.assign(r,award(shift,`response:${room}`,`RESPONSE STARTED! Reassessment due ${clockAt(patientAt(shift,room).followupAt)}.`,35));return arcadeResult(r,text=>arcadeBed(room,text));}
    if(action==='shelf-open')return arcadeSupply();
    if(action==='pyxis-open')return arcadePyxis();
    if(action==='bin-add')return arcadeResult(packOne(shift,b.dataset.item),arcadeSupply);
    if(action==='bin-return'){const r=removeOne(shift,b.dataset.item);return arcadeResult(r,currentView?.kind==='arcade-pyxis'?arcadePyxis:arcadeSupply);}
    if(action==='assess-iv')return arcadeResult(assessIV(shift),text=>arcadeBed(room,text));
    if(action==='access-plan'){const r=chooseAccessPlan(shift,b.dataset.choice);return arcadeResult(r,text=>arcadeBed(shift.arcade.iv.room,text));}
    if(action==='pyxis-flush')return arcadeResult(pickFlush(shift,b.dataset.choice),arcadePyxis);
    if(action==='iv-open'){const r=startIV(shift);return arcadeResult(r,r.ok?arcadeIV:text=>arcadeBed(shift.arcade.iv.room,text));}
    if(action==='iv-step'){const r=ivStep(shift,b.dataset.step,b.dataset.value);return arcadeResult(r,shift.arcade.iv.state==='done'?text=>arcadeBed(shift.arcade.iv.room,text):arcadeIV);}
    if(action==='iv-labs'){const r=performCare(shift,room,'labs');if(r.ok){shift.arcade.iv.labsDone=true;Object.assign(r,award(shift,'iv-labs',shift.arcade.iv.state==='done'?'ORDERED SAMPLE SENT! Access ticket complete.':'ORDERED SAMPLE SENT! Replacement IV remains pending.',30));}return arcadeResult(r,text=>arcadeBed(room,text));}
    if(action==='aline-open'||action==='practice-aline'){const r=startALine(shift,action==='practice-aline');return arcadeResult(r,arcadeALine);}
    if(action==='aline-step'){const r=alineStep(shift,b.dataset.step,b.dataset.value);return arcadeResult(r,shift.arcade.aline.done?arcadeSupply:arcadeALine);}
    if(action==='purge-request')return arcadeResult(requestPurge(shift),arcadePyxis);
    if(action==='purge-pick')return arcadeResult(collectPurge(shift,b.dataset.choice),arcadePyxis);
    if(action==='purge-deliver')return arcadeResult(deliverPurge(shift,room),text=>arcadeBed(room,text));
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
      showResult(result, text => result.ok ? (view.practice ? arcadeStation('charge', text) : arcadeSupply(text)) : procedure(view.procedure, view.practice, text, picked, view)); return;
    }
    if (action === 'admission-report') return showResult(receiveAdmissionReport(shift), text => station('station', text));
    if(action==='install'){const r=installAdmissionSupply(shift,b.dataset.item);if(r.ok)Object.assign(r,award(shift,`setup:${shift.admission.room}:${b.dataset.item}`,'ROOM UPGRADED! Equipment is now visible at the receiving bed.',20));return arcadeResult(r,admission);}
    if (action === 'accept') {
      const result = acceptAdmission(shift, [...dialog.querySelectorAll('[name="arrival-check"]:checked')].map(e => e.value));
      if(result.ok)Object.assign(result,award(shift,'admitted','PATIENT ARRIVED! Receiving room complete; establish your bedside baseline.',75));
      return arcadeResult(result,text=>result.ok?arcadeBed(shift.admission.room,text):admission(text));
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
    if(shift&&event.target.id==='arcadeLevel'){alineStep(shift,'level',event.target.value);const trans=dialog.querySelector('.arcade-transducer');if(trans)trans.style.top=`${100-Number(event.target.value)}%`;save();return;}
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
