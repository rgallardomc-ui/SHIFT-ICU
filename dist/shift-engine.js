import {FLOOR_PODS, SHIFT_LEVELS, SHIFT_PATIENTS, PATIENT_BY_ID, ADMISSIONS, PROCEDURES, NOTE_FIELDS} from './shift-data.js?v=0.4.1';

export const SHIFT_VERSION = 3;
export const SIM_MINUTES_PER_SECOND = 0.5;
export function seededRandom(seed) {
  let n = Number(seed) >>> 0;
  return () => {
    n += 0x6D2B79F5;
    let t = Math.imul(n ^ n >>> 15, 1 | n);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function shuffled(items, random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function clockAt(minutes = 0) {
  const total = (19 * 60 + Math.floor(minutes)) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
function task(patient, kind, title, due, interval = 0, priority = 'routine') {
  const item = {id: `${patient.room}-${kind}-${patient.taskSerial++}`, room: patient.room, kind, title, due, interval, priority, done: false, lateWindows: 0};
  patient.tasks.push(item);
  return item;
}
function log(shift, text, room = null, kind = 'care') {
  shift.log.push({at: shift.elapsed, time: clockAt(shift.elapsed), room, text, kind});
}
function makePatient(id, room, shift, random, arrived = false) {
  const p = PATIENT_BY_ID[id];
  const patient = {
    profile: id, room, arrived, stage: 'baseline', current: {...p.baseline},
    eventAt: shift.elapsed + 24 + Math.floor(random() * 27), eventFired: false,
    reportRead: false, ordersRead: false, assessed: false, deviceChecked: false,
    assessedChange: false, checkedChange: false, notified: false, planDone: false,
    reassessed: false, followupAt: null, procedureReady: false,
    tasks: [], taskSerial: 0, installed: {}, observations: [], flowsheet: [],
    note: Object.fromEntries(NOTE_FIELDS.map(([key]) => [key, ''])),
    latestClinicalAt: null, noteReviewedAt: null, sample: null, labResult: null,
    medChecked: false, tofBaseline: false,
    lastOutputAt: shift.elapsed, turnHold: null, firstHourEnd: shift.elapsed + 60
  };
  task(patient, 'report', 'Receive report', shift.elapsed + 10);
  task(patient, 'assess', 'Establish the bedside baseline', shift.elapsed + 20);
  task(patient, 'orders', 'Review active orders / diagnostics', shift.elapsed + 25);
  task(patient, 'meds', 'Reconcile MAR / infusion checks', shift.elapsed + 30);
  task(patient, 'device', 'Check devices, access and safety', shift.elapsed + 25);
  task(patient, 'round', 'Measure / record interval urine and fluid balance', shift.elapsed + 60, 60);
  task(patient, 'labs', 'Collect the scheduled ordered labs', shift.elapsed + 60, 120);
  task(patient, 'turn', 'Reposition / skin care if tolerated', shift.elapsed + 60, 120);
  if (p.neuro) task(patient, 'neuro', 'Hourly neuro assessment', shift.elapsed + 60, 60);
  if (p.frequentDrain || p.frequentCheck) task(patient, 'close-check', p.frequentDrain ? 'Drain / perfusion check' : p.icon === 'dialysis' ? 'SLED tolerance / net removal check' : 'Bleeding / perfusion / airway check', shift.elapsed + 15, 15);
  if (p.tof) task(patient, 'tof', 'Obtain / document baseline TOF under the case order', shift.elapsed + 25);
  task(patient, 'handoff', 'Review SBAR and handoff', shift.duration);
  return patient;
}

export function createShift({pod = 'delta', mode = 'coached', level = 1, seed = Date.now()} = {}) {
  if (!FLOOR_PODS[pod]) throw new Error('Unknown pod');
  const selected = SHIFT_LEVELS.find(x => x.id === Number(level)) || SHIFT_LEVELS[0];
  const random = seededRandom(seed);
  const pool = SHIFT_PATIENTS.filter(p => p.pod === pod && p.id !== 'rosc-arrival' && !(selected.id === 2 && p.id === ADMISSIONS[pod].profile));
  const rooms = shuffled(Array.from({length: 12}, (_, i) => i + 1), random);
  let profiles = shuffled(pool, random);
  // A cardiac assignment always includes an open-heart patient, without revealing
  // the later complication. High-acuity assignments remain at two beds.
  if (pod === 'delta' && !profiles.slice(0, 2).some(p => p.id.startsWith('cabg'))) {
    profiles = [pool.find(p => p.id.startsWith('cabg')), ...profiles];
  }
  const count = selected.id === 2 ? 1 : selected.id === 3 && pod === 'alpha' ? 3 : 2;
  const shift = {
    version: SHIFT_VERSION, id: `shift-${pod}-${selected.id}-${Number(seed) >>> 0}`,
    pod, mode: mode === 'independent' ? 'independent' : 'coached', level: selected.id,
    seed: Number(seed) >>> 0, duration: selected.duration, elapsed: 0, paused: false,
    ended: false, endedEarly: false, player: {x: 1000, y: 465}, inventory: {},
    patients: [], log: [], safetyStops: 0, drillAttempts: 0, feedback: '',
    admission: selected.id === 2 ? {room: rooms[count], announcedAt: 20, announced: false, reportRead: false, installed: {}, ready: false, accepted: false, procedureReady: false} : null
  };
  for (let i = 0; i < count; i++) shift.patients.push(makePatient(profiles[i % profiles.length].id, rooms[i], shift, random));
  log(shift, `Assignment received: ${shift.patients.map(p => `room ${p.room}`).join(', ')}. Patient and room mix are generated from this shift seed.`, null, 'report');
  shift.feedback = 'Walk to the charge nurse / station for report. Tap a room card to walk there, then use the highlighted bedside or computer.';
  return shift;
}

export function restoreShift(value) {
  if (!value || value.version !== SHIFT_VERSION || !FLOOR_PODS[value.pod] || !Array.isArray(value.patients)) return null;
  if (!Number.isFinite(value.elapsed) || !Number.isFinite(value.duration) || value.elapsed < 0 || value.elapsed > value.duration) return null;
  if (!value.player || !Number.isFinite(value.player.x) || !Number.isFinite(value.player.y)) return null;
  if (!Array.isArray(value.log) || !value.inventory || typeof value.inventory !== 'object') return null;
  const rooms = new Set();
  for (const p of value.patients) {
    if (!PATIENT_BY_ID[p.profile] || !Number.isInteger(p.room) || p.room < 1 || p.room > 12 || rooms.has(p.room)) return null;
    if (!Array.isArray(p.tasks) || !Array.isArray(p.observations) || !Array.isArray(p.flowsheet) || !p.note || !p.current) return null;
    rooms.add(p.room);
  }
  if (!value.patients.length || value.patients.length > 3) return null;
  return value;
}

export function patientAt(shift, room) { return shift.patients.find(p => p.room === Number(room)); }
export function profileOf(patient) { return PATIENT_BY_ID[patient.profile]; }
export function openTasks(shift) {
  return shift.patients.flatMap(p => p.tasks.filter(t => !t.done)).sort((a, b) =>
    (a.priority === 'urgent' ? -1 : 0) - (b.priority === 'urgent' ? -1 : 0) || a.due - b.due || a.room - b.room);
}
function complete(shift, patient, kind) {
  const items = patient.tasks.filter(t => t.kind === kind && !t.done);
  for (const item of items) {
    item.done = true;
    item.completedAt = shift.elapsed;
    let interval = item.interval;
    if (kind === 'close-check' && shift.elapsed >= patient.firstHourEnd && !patient.eventFired) interval = 60;
    if (interval && shift.elapsed + interval < shift.duration) task(patient, kind, item.title, shift.elapsed + interval, interval);
  }
}
function dueSoon(patient, kind, now) {
  return patient.tasks.find(t => t.kind === kind && !t.done && t.due <= now + 10);
}
function clinical(shift, patient, text) {
  patient.latestClinicalAt = shift.elapsed;
  const handoff = patient.tasks.find(t => t.kind === 'handoff');
  if (handoff && patient.noteReviewedAt !== null && patient.noteReviewedAt <= shift.elapsed) handoff.done = false;
  log(shift, text, patient.room);
}
function observation(shift, patient, kind, text) {
  patient.observations.push({at: shift.elapsed, kind, text, vitals: {...patient.current}});
  if (!patient.tasks.some(t => t.kind === 'chart' && !t.done)) task(patient, 'chart', 'Chart the observations actually obtained', shift.elapsed + 15);
}

export function advanceShift(shift, minutes) {
  if (shift.ended || !Number.isFinite(minutes) || minutes <= 0) return;
  shift.elapsed = Math.min(shift.duration, shift.elapsed + minutes);
  if (shift.admission && !shift.admission.announced && shift.elapsed >= shift.admission.announcedAt) {
    shift.admission.announced = true;
    const info = ADMISSIONS[shift.pod];
    shift.feedback = `Charge nurse: ${info.name}. Prepare room ${shift.admission.room}; transport will wait for a safe receiving handoff.`;
    log(shift, shift.feedback, shift.admission.room, 'admission');
  }
  for (const p of shift.patients) {
    const model = profileOf(p);
    if (!p.eventFired && shift.elapsed >= p.eventAt) {
      p.eventFired = true; p.stage = 'changed'; p.current = {...model.changed};
      p.notified = false; p.assessedChange = false; p.checkedChange = false;
      task(p, 'urgent-call', 'New change: assess / call the appropriate team', shift.elapsed, 0, 'urgent');
      task(p, 'respond', 'Interpret the change and act within orders', shift.elapsed + 15, 0, 'urgent');
      shift.feedback = `Room ${p.room}: ${model.event}`;
      log(shift, model.event, p.room, 'change');
    }
    if (p.sample && shift.elapsed >= p.sample.readyAt) {
      p.labResult = {at: p.sample.readyAt, collectedAt: p.sample.collectedAt, text: p.sample.text};
      p.sample = null;
      log(shift, 'Ordered laboratory result available; review its collection time and trend.', p.room, 'lab');
    }
    for (const t of p.tasks) {
      if (t.done || shift.elapsed <= t.due || t.kind === 'handoff' || t.priority === 'urgent') continue;
      const windows = t.interval ? Math.floor((shift.elapsed - t.due) / t.interval) + 1 : 1;
      if (windows > t.lateWindows) t.lateWindows = windows;
    }
  }
  if (shift.elapsed >= shift.duration) {
    shift.paused = true;
    shift.feedback = 'The scheduled shift is over. Finish a truthful handoff or review the unfinished care in your debrief. The clock is paused.';
  }
}

function reply(shift, text, ok = true, safety = false) {
  shift.feedback = text;
  if (safety) { shift.safetyStops++; log(shift, text, null, 'safety'); }
  return {ok, text, safety};
}
export function packSupplies(shift, ids) {
  if (shift.ended) return reply(shift, 'This shift has ended. Start a new assignment to perform care.', false);
  const allowed = ['care', 'labs', 'monitor', 'airway', 'pump', 'resus', 'drain', 'neuro'];
  const requested = [...new Set(ids)].filter(id => allowed.includes(id));
  if (!requested.length) return reply(shift, 'Choose the supplies you intend to take.', false);
  if (Object.values(shift.inventory).reduce((a, b) => a + b, 0) + requested.length > 8) return reply(shift, 'The cart holds eight packs. Use what you have or return unused packs first.', false);
  for (const id of requested) shift.inventory[id] = (shift.inventory[id] || 0) + 1;
  log(shift, `Packed supplies: ${requested.join(', ')}.`, null, 'supply');
  advanceShift(shift, 2);
  return reply(shift, 'Supplies are on your cart. Take them to the correct room.');
}
export function returnSupplies(shift) {
  if (shift.ended) return reply(shift, 'This shift has ended.', false);
  shift.inventory = {};
  return reply(shift, 'Unused supplies returned to stock. Installed room equipment stays in place.');
}
export function checkProcedure(shift, kind, selection, {practice = false, timedOut = false} = {}) {
  if (shift.ended) return reply(shift, 'This shift has ended. Start another assignment for a drill.', false);
  const procedure = PROCEDURES[kind];
  if (!procedure || !Array.isArray(selection)) return reply(shift, 'Choose a valid setup.', false);
  shift.drillAttempts++;
  const required = procedure.options.filter(x => x[2]).map(x => x[0]);
  const picked = new Set(selection);
  const unknown = [...picked].some(id => !procedure.options.some(x => x[0] === id));
  const wrong = procedure.options.filter(x => !x[2] && picked.has(x[0]));
  const missing = procedure.options.filter(x => x[2] && !picked.has(x[0]));
  if (unknown || wrong.length || missing.length) {
    return reply(shift, `Setup needs revision. ${missing.length ? `Missing: ${missing.map(x => x[1]).join('; ')}. ` : ''}${wrong.length ? `Remove: ${wrong.map(x => x[1]).join('; ')}. ` : ''}${unknown ? 'Unknown equipment selected. ' : ''}Review the order and scope before preparing the tray.`, false, wrong.length > 0 || unknown);
  }
  if (!practice) {
    if (Object.values(shift.inventory).reduce((a, b) => a + b, 0) >= 8) return reply(shift, 'Your cart is full. Return or use a pack before adding the procedure tray.', false);
    shift.inventory[procedure.item] = (shift.inventory[procedure.item] || 0) + 1;
  }
  log(shift, `${procedure.name} ${practice ? 'practice completed' : 'tray prepared'}${timedOut ? ' after the optional timer; no speed bonus' : ''}.`, null, 'procedure');
  return reply(shift, `${practice ? 'Practice complete.' : 'Tray packed.'} ${procedure.check}${timedOut ? ' The timer is a practice prompt, not proof of clinical competence.' : ''}`);
}

export function receiveAdmissionReport(shift) {
  if (shift.ended) return reply(shift, 'This shift has ended.', false);
  if (!shift.admission?.announced || shift.admission.accepted) return reply(shift, 'There is no pending admission.', false);
  shift.admission.reportRead = true;
  log(shift, `Receiving report / orders reviewed for room ${shift.admission.room}.`, shift.admission.room, 'report');
  return reply(shift, ADMISSIONS[shift.pod].brief);
}
export function installAdmissionSupply(shift, id) {
  if (shift.ended) return reply(shift, 'This shift has ended.', false);
  const admission = shift.admission, info = ADMISSIONS[shift.pod];
  if (!admission?.reportRead || admission.accepted) return reply(shift, 'Receive the incoming report / orders first.', false);
  const needed = [...info.items, ...(info.procedure ? [PROCEDURES[info.procedure].item] : [])];
  if (!needed.includes(id)) return reply(shift, 'That item is not in this admission’s room plan.', false);
  if (admission.installed[id]) return reply(shift, 'That receiving setup is already prepared.');
  if (!(shift.inventory[id] > 0)) return reply(shift, 'Get that pack / prepared tray from supplies first.', false);
  shift.inventory[id]--;
  admission.installed[id] = true;
  log(shift, `Receiving setup prepared: ${id}.`, admission.room, 'admission');
  advanceShift(shift, 2);
  return reply(shift, 'Setup prepared. Equipment readiness does not replace patient identification, receiving report or the ordered team checks.');
}
export function acceptAdmission(shift, checks = []) {
  if (shift.ended) return reply(shift, 'This shift has ended.', false);
  const a = shift.admission, info = ADMISSIONS[shift.pod];
  if (!a?.announced || a.accepted) return reply(shift, 'There is no pending admission.', false);
  const needed = [...info.items, ...(info.procedure ? [PROCEDURES[info.procedure].item] : [])];
  if (!a.reportRead || needed.some(id => !a.installed[id])) return reply(shift, 'The receiving report or required room setup is incomplete. Tell charge / transport you are not ready; the transport team retains care.', false);
  if (!['identity', 'support', 'handoff'].every(id => checks.includes(id))) return reply(shift, 'Confirm two identifiers / allergy, functioning support with the team, and the receiving handoff / active orders before accepting.', false);
  if (shift.patients.length >= 2 && profileOf(shift.patients[0]).acuity + profileOf(shift.patients[1]).acuity + PATIENT_BY_ID[info.profile].acuity > 4) return reply(shift, 'This would exceed the assignment capacity used by this scenario. Resolve the receiving assignment with charge; do not accept solely to beat the clock.', false);
  const p = makePatient(info.profile, a.room, shift, seededRandom(shift.seed ^ a.room), true);
  p.reportRead = true; complete(shift, p, 'report');
  p.procedureReady = !!info.procedure;
  shift.patients.push(p); a.accepted = true; a.ready = true;
  log(shift, 'Patient received with identity, support and team handoff checks. Admission screening / blood-bank processes follow the actual orders and local policy; no universal swab or band is assumed.', a.room, 'admission');
  advanceShift(shift, 3);
  return reply(shift, `Patient received in room ${a.room}. Establish your own bedside baseline and reconcile the chart.`);
}

export function recordNote(shift, room, key, value) {
  const p = patientAt(shift, room);
  if (!p || !NOTE_FIELDS.some(([id]) => id === key)) return false;
  p.note[key] = String(value).slice(0, 12000);
  return true;
}
export function noteComplete(patient) { return NOTE_FIELDS.every(([id]) => typeof patient.note[id] === 'string' && patient.note[id].trim().length > 0); }
export function performCare(shift, room, action, value) {
  const p = patientAt(shift, room);
  if (!p || shift.ended) return reply(shift, 'Open an active assigned patient.', false);
  const model = profileOf(p);
  if (shift.elapsed >= shift.duration && !['chart', 'handoff', 'notify', 'report', 'orders'].includes(action)) return reply(shift, 'The scheduled shift clock has finished. Chart obtained findings and hand off the remaining care; unfinished tasks are retained in the debrief.', false);
  let text = '', cost = 2;
  if (action === 'report') {
    p.reportRead = true; complete(shift, p, 'report');
    log(shift, 'Received report and compared the starting patient / support information.', p.room, 'report');
    text = model.report;
  } else if (action === 'orders') {
    p.ordersRead = true; complete(shift, p, 'orders');
    log(shift, 'Reviewed active case orders, conditional permissions and diagnostic / laboratory timing.', p.room, 'orders');
    text = 'Orders reviewed. Conditional actions still require the relevant patient findings and the case-specific authority.';
  } else if (action === 'assess') {
    p.assessed = true; complete(shift, p, 'assess');
    if (p.stage === 'changed' || p.stage === 'treated') p.assessedChange = true;
    if (p.stage === 'treated' && shift.elapsed >= p.followupAt) {
      p.stage = 'reviewed'; p.reassessed = true; p.current = {...model.followup};
      complete(shift, p, 'reassess'); text = model.afterExam;
    } else text = p.stage === 'baseline' ? model.exam : p.stage === 'reviewed' ? model.afterExam : model.changeExam;
    if (model.neuro && dueSoon(p, 'neuro', shift.elapsed)) complete(shift, p, 'neuro');
    observation(shift, p, model.neuro ? 'Neurologic / bedside assessment' : 'Bedside assessment', text);
    clinical(shift, p, `Assessed: ${text}`); cost = 4;
    if (p.stage === 'treated' && shift.elapsed < p.followupAt) text += ` The scheduled response assessment is due at ${clockAt(p.followupAt)}; these are the current findings, not an invented early recovery.`;
  } else if (action === 'device') {
    p.deviceChecked = true;
    if (p.stage !== 'baseline') p.checkedChange = true;
    complete(shift, p, 'device');
    text = p.planDone && p.reassessed ? (model.afterDevice || model.device) : model.device;
    observation(shift, p, 'Device / access / distal circulation check', text);
    clinical(shift, p, `Device and access checked: ${text}`);
  } else if (action === 'notify') {
    text = p.eventFired ? 'Current change urgently communicated to the appropriate clinical team. Continue assessment / ordered care in parallel; the call does not establish a diagnosis or guarantee recovery.' : 'Baseline concerns / plan clarified with the clinical team. A future change will require a new notification.';
    if (p.eventFired) { p.notified = true; complete(shift, p, 'urgent-call'); }
    clinical(shift, p, text); cost = 0;
  } else if (action === 'meds') {
    if (!p.ordersRead) return reply(shift, 'Read this patient’s active MAR / orders before completing the medication check.', false);
    if (!model.med.choices.some(([id]) => id === value)) return reply(shift, 'Select your medication / infusion verification approach first.', false);
    if (value !== model.med.correct) return reply(shift, 'Medication check stopped. Match identifiers, allergy, active order, medication / concentration, route, line and pump; clarify discrepancies instead of guessing or adding an unprescribed treatment.', false, true);
    p.medChecked = true;
    complete(shift, p, 'meds');
    clinical(shift, p, 'Completed the active MAR / allergy / infusion verification exercise; no unprescribed dose or rate change was made.');
    text = 'Medication verification complete for the displayed case orders. This exercise does not authorize medication administration or a rate change.';
  } else if (action === 'respond') {
    if (p.planDone) return reply(shift, 'The initial ordered response is already underway. Reassess the patient and follow the team plan.');
    if (!p.eventFired) return reply(shift, 'No new change has occurred. Continue the current orders and due care.', false);
    if (!model.choices.some(([id]) => id === value)) return reply(shift, 'Choose a response before acting.', false);
    if (value !== model.correct) return reply(shift, 'That choice does not fit the findings / authority in this case. Reassess the patient, use the active conditional order and escalate promptly. No unsafe treatment was performed.', false, true);
    if (!p.assessedChange || !p.checkedChange || !p.ordersRead) return reply(shift, 'Urgent notification is available now. Before this cause-specific action, obtain the current bedside / device findings and verify the active orders.', false);
    if (model.tof && (!p.medChecked || !p.tofBaseline)) return reply(shift, 'Urgent assessment / notification can continue. The planned NMBA event still needs the analgesia / sedation / ventilation readiness check and the case-ordered baseline TOF documentation.', false);
    p.planDone = true; p.notified = true; p.stage = 'treated'; p.followupAt = shift.elapsed + 10;
    complete(shift, p, 'respond'); complete(shift, p, 'urgent-call');
    task(p, 'reassess', 'Repeat the response assessment / ongoing concern', p.followupAt, 0, 'urgent');
    if (model.tof) task(p, 'tof-followup', 'Document the observed post-intervention TOF and clinical context', p.followupAt + 5);
    if (['cabg-receiving', 'cabg-recovery', 'imc-telemetry', 'variceal-bleed'].includes(p.profile)) {
      const labTask = p.tasks.find(t => t.kind === 'labs' && !t.done);
      if (labTask) labTask.due = Math.min(labTask.due, shift.elapsed);
    }
    text = model.response; clinical(shift, p, text);
  } else if (action === 'round') {
    if (!dueSoon(p, 'round', shift.elapsed)) return reply(shift, 'The next measured interval is not due yet. Check the collection interval and due time.', false);
    const n = value && String(value.volume).trim() !== '' ? Number(value.volume) : NaN;
    if (!Number.isFinite(n) || Math.abs(n - p.current.UO) > 0.5 || !['yellow', 'amber', 'abnormal'].includes(value?.appearance)) return reply(shift, 'Use the displayed collection-interval measurement in mL and select the observed appearance. A blank, wrong unit or assumed value is not a measured output.', false);
    if (value.appearance !== (p.profile === 'sled-rounds' ? 'amber' : 'yellow')) return reply(shift, 'Recheck the observed urine appearance in this scenario; do not infer it from the diagnosis.', false);
    text = `Measured interval urine: ${n} mL, ${value.appearance}; checked catheter / tubing, intake and net balance. Interval ${clockAt(p.lastOutputAt)}–${clockAt(shift.elapsed)}. The displayed interval is compressed and not a predicted physiologic rate.`;
    p.lastOutputAt = shift.elapsed; complete(shift, p, 'round');
    observation(shift, p, 'Fluid / output assessment', text); clinical(shift, p, text); cost = 3;
  } else if (action === 'labs') {
    if (!p.ordersRead) return reply(shift, 'Verify the specific laboratory order and collection time first.', false);
    if (p.sample) return reply(shift, `A sample is already processing; its result is due at ${clockAt(p.sample.readyAt)}.`, false);
    if (!dueSoon(p, 'labs', shift.elapsed)) return reply(shift, 'That scheduled collection is not due yet. Review the order rather than collecting an arbitrary repeat.', false);
    if (!(shift.inventory.labs > 0)) return reply(shift, 'Bring an ordered specimen pack from supplies. Check identifiers, labels and collection requirements.', false);
    shift.inventory.labs--;
    p.sample = {collectedAt: shift.elapsed, readyAt: shift.elapsed + 20, text: p.eventFired ? model.labAfter : 'Baseline ordered results available. Compare the baseline values, clinical findings and prescribed follow-up; this pre-change sample cannot establish the cause of a later event.'};
    complete(shift, p, 'labs');
    text = `Ordered sample collected with identity / labeling checks. Results take 20 compressed minutes (${clockAt(p.sample.readyAt)}); urgent assessment and escalation do not wait for them.`;
    clinical(shift, p, text); cost = 3;
  } else if (action === 'turn') {
    if (!dueSoon(p, 'turn', shift.elapsed)) return reply(shift, 'The next routine repositioning window is not due yet; earlier skin / comfort assessment remains appropriate.', false);
    if (p.stage === 'changed' || p.stage === 'treated') return reply(shift, 'There is active instability / a response under review. Assess tolerance and use the documented hold / reassessment option; do not turn just to clear a timer.', false);
    if (!p.installed.care) {
      if (!(shift.inventory.care > 0)) return reply(shift, 'Bring a routine care pack for this room’s skin / positioning care.', false);
      shift.inventory.care--; p.installed.care = true;
    }
    text = `Repositioned with tolerance, skin / heels, airway and line checks.${model.icon === 'evd' ? ' Verified the ordered EVD movement plan, external reference level and return to the prescribed drainage state with trained staff; no independent height change.' : ''}`;
    p.turnHold = null; complete(shift, p, 'turn');
    observation(shift, p, 'Position / skin assessment', text); clinical(shift, p, text); cost = 5;
  } else if (action === 'hold-turn') {
    if (!dueSoon(p, 'turn', shift.elapsed)) return reply(shift, 'There is no due repositioning task to defer.', false);
    if (!['changed', 'treated'].includes(p.stage) || value !== 'instability') return reply(shift, 'A timer or convenience alone is not a clinical reason to omit care. Assess tolerance and document the actual reason / alternative plan.', false, true);
    if (p.turnHold && shift.elapsed < p.turnHold.reassessAt) return reply(shift, `The hold still needs review at ${clockAt(p.turnHold.reassessAt)}; repeating the button does not extend it.`, false);
    p.turnHold = {at: shift.elapsed, reassessAt: shift.elapsed + 15, reason: 'Active instability; team notified, tolerable pressure relief and line protection considered. Full repositioning remains pending.'};
    p.notified = true; complete(shift, p, 'urgent-call');
    clinical(shift, p, p.turnHold.reason);
    text = `Clinical hold documented. Full repositioning is not marked complete; reassess tolerance by ${clockAt(p.turnHold.reassessAt)}.`;
  } else if (action === 'close-check') {
    if (!dueSoon(p, 'close-check', shift.elapsed)) return reply(shift, 'The next close observation is not due yet.', false);
    text = p.stage === 'baseline' ? model.report : p.reassessed ? model.afterExam : model.changeExam;
    complete(shift, p, 'close-check'); observation(shift, p, 'Ordered close observation', text);
    clinical(shift, p, `Completed the ordered close observation: ${text}`);
  } else if (action === 'chart') {
    if (!p.observations.length) return reply(shift, 'Obtain and time-stamp the actual bedside findings before charting.', false);
    for (const o of p.observations) p.flowsheet.push({...o, chartedAt: shift.elapsed});
    const count = p.observations.length;
    p.observations = []; complete(shift, p, 'chart');
    log(shift, `Reviewed and recorded ${count} obtained observation(s) in the fictional flowsheet, with assessment / charting times kept distinct.`, p.room, 'documentation');
    text = 'Obtained observations recorded. No assessment or treatment was invented; review the structured entries and write your own SBAR.'; cost = 1;
  } else if (action === 'tof') {
    if (!model.tof || !p.ordersRead) return reply(shift, 'Review the case’s actual TOF / NMBA monitoring order first.', false);
    if (p.planDone && !p.reassessed) return reply(shift, 'Perform the scheduled patient / respiratory / perfusion response assessment first; TOF does not replace it.', false);
    const expected = p.reassessed ? model.tof.followup : model.tof.baseline;
    if (value?.site !== model.tof.site || String(value?.current ?? '').trim() === '' || Number(value.current) !== model.tof.current || String(value?.twitches ?? '').trim() === '' || Number(value.twitches) !== expected || value?.context !== 'blockade-only') return reply(shift, 'Record the observed site, established stimulus current and twitch count, plus the clinical context. TOF measures blockade; it does not prove adequate analgesia / unconsciousness or readiness for extubation.', false);
    if (!p.reassessed) p.tofBaseline = true;
    complete(shift, p, p.reassessed ? 'tof-followup' : 'tof');
    text = `${p.reassessed ? 'Post-intervention' : 'Baseline'} TOF documented: ${expected}/4 at left ulnar site, ${model.tof.current} mA established for this case. Recorded with patient / ventilator assessment and the prescribed analgesia / sedation monitoring plan; no dose change or awareness inference from twitch count.`;
    observation(shift, p, 'TOF / clinical monitoring context', text); clinical(shift, p, text);
  } else if (action === 'handoff') {
    if (!noteComplete(p)) return reply(shift, 'Each SBAR / response field needs content. This checks completeness only; it does not establish clinical accuracy.', false);
    if (p.observations.length) return reply(shift, 'Review and record the observations still waiting in the flowsheet first.', false);
    p.noteReviewedAt = shift.elapsed; complete(shift, p, 'handoff');
    log(shift, 'SBAR / response fields reviewed for completeness. Clinical accuracy is not graded; pending care and unresolved concerns must be handed off truthfully.', p.room, 'documentation');
    text = 'Handoff fields complete. Further care or new findings will require another handoff review.'; cost = 0;
  } else if (action === 'procedure') {
    if (!model.procedure || !p.ordersRead) return reply(shift, 'There is no reviewed line-preparation order for this patient.', false);
    if (p.procedureReady) return reply(shift, 'This room’s ordered assistance setup is already prepared.');
    const item = PROCEDURES[model.procedure].item;
    if (!(shift.inventory[item] > 0)) return reply(shift, 'Prepare the correct tray in supplies first.', false);
    shift.inventory[item]--; p.procedureReady = true;
    text = PROCEDURES[model.procedure].check;
    clinical(shift, p, `Prepared ordered assistance setup. ${text}`);
  } else return reply(shift, 'Choose an available nursing task.', false);
  advanceShift(shift, cost);
  return reply(shift, text);
}

export function endShift(shift) {
  if (shift.ended) return shiftSummary(shift);
  shift.endedEarly = shift.elapsed < shift.duration;
  shift.ended = true; shift.paused = true;
  log(shift, 'Shift ended for debrief. Pending / overdue work is retained, not marked as completed.', null, 'handoff');
  return shiftSummary(shift);
}
export function shiftSummary(shift) {
  const all = shift.patients.flatMap(p => p.tasks);
  const pending = openTasks(shift);
  return {
    completed: all.filter(t => t.done).length, pending,
    missedWindows: all.reduce((sum, t) => sum + t.lateWindows, 0),
    safetyStops: shift.safetyStops,
    reassessed: shift.patients.filter(p => p.reassessed).length,
    handoffs: shift.patients.filter(p => p.tasks.some(t => t.kind === 'handoff' && t.done)).length,
    uncharted: shift.patients.reduce((sum, p) => sum + p.observations.length, 0),
    admissionPending: !!shift.admission && !shift.admission.accepted,
    unresolved: shift.patients.filter(p => p.eventFired && !p.reassessed).map(p => p.room)
  };
}
export function exportShift(shift) {
  return [
    'SHIFT: ICU — FICTIONAL SHIFT JOURNAL', 'Created by Rafael Gallardo, RN',
    `${FLOOR_PODS[shift.pod].name} · seed ${shift.seed} · ${clockAt(shift.elapsed)} · ${shift.ended ? 'ended' : 'in progress'}`,
    'Scripted learning simulation. Notes are checked for completeness only; no clinical validation or competency certification.',
    ...shift.patients.map(p => `\nROOM ${p.room} · ${profileOf(p).label}\n${NOTE_FIELDS.map(([id, label]) => `${label}\n${p.note[id]}`).join('\n\n')}\n\nRECORDED FLOWSHEET\n${p.flowsheet.map(o => `${clockAt(o.at)} (charted ${clockAt(o.chartedAt)}): ${o.kind}\n${o.text}`).join('\n')}\nUncharted obtained observations: ${p.observations.length}`),
    ...(shift.arcade ? [`\nARCADE QUEST POINTS: ${shift.arcade.score} · ${shift.arcade.done.length} objectives. Game score, not a clinical competency grade.`] : []),
    '\nGAME EVENT TIMELINE',
    ...shift.log.map(e => `${e.time}${e.room ? ` · R${e.room}` : ''} · ${e.text}`),
    '\nPENDING CARE', ...openTasks(shift).map(t => `R${t.room} · ${t.title} · due ${clockAt(t.due)}`)
  ].join('\n');
}
