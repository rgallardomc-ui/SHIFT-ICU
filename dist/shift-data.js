// Fictional prescriptions and responses. These are teaching cases, not HCA policy.
export const FLOOR_PODS = {
  alpha: {name: 'Alpha', specialty: 'Step-down / IMC', color: '#e6ba70', brief: 'Receive patients after ICU stabilization, support recovery and catch renewed deterioration.'},
  bravo: {name: 'Bravo', specialty: 'Medical ICU', color: '#76d5ba', brief: 'Balance respiratory support, renal therapy, and the rest of the patient.'},
  charlie: {name: 'Charlie', specialty: 'Neuro ICU', color: '#aaa4ee', brief: 'Know the baseline. Notice the change. Protect the next assessment.'},
  delta: {name: 'Delta', specialty: 'Cardiac ICU', color: '#ed9f86', brief: 'Open hearts, mechanical support, and the changes between rounds.'}
};

export const SHIFT_LEVELS = [
  {id: 1, name: 'First rounds', duration: 240, description: 'Two patients. Four compressed hours. Learn the floor and establish your routine.'},
  {id: 2, name: 'An admission is coming', duration: 240, description: 'One patient, a ringing iMobile and a room to get ready. Follow the objective and learn by doing.'},
  {id: 3, name: 'The whole night', duration: 720, description: 'Twelve compressed hours. Repeated observations, competing changes, and a complete handoff.'}
];

export const SUPPLIES = [
  {id: 'care', name: 'Routine care pack', detail: 'Gloves, skin/offloading aids, draw sheet and oral-care supplies.'},
  {id: 'labs', name: 'Specimen pack', detail: 'Ordered blood tubes, labels and collection supplies; verify the actual order.'},
  {id: 'monitor', name: 'Monitoring set', detail: 'ECG, SpO₂, blood-pressure equipment and temperature probe.'},
  {id: 'airway', name: 'Airway readiness set', detail: 'Working oxygen, suction and bag-mask equipment. RT prepares ordered ventilator support.'},
  {id: 'pump', name: 'IV pole + pumps', detail: 'Power, tubing and pump channels checked against the incoming infusions.'},
  {id: 'resus', name: 'Resuscitation readiness set', detail: 'Checked defibrillator/pads and emergency equipment per the admission plan.'},
  {id: 'drain', name: 'Chest-drain receiving set', detail: 'Ordered collection equipment and secure placement for the surgical team handoff.'},
  {id: 'neuro', name: 'Neuro receiving set', detail: 'Penlight, measurement aids and secure EVD stand; trained staff handle the closed system.'}
];

export const PROCEDURES = {
  aline: {
    name: 'Arterial-line setup', item: 'aline-tray', seconds: 60,
    order: 'Prepare a radial arterial-line setup for the credentialed inserter. Use the prescribed flush solution and the actual system IFU. The RN does not insert the catheter in this case.',
    options: [
      ['transducer', 'Sterile pressure tubing / transducer assembly', true],
      ['flush', 'Prescribed sterile flush solution and pressure bag', true],
      ['cable', 'Compatible monitor cable and transducer holder', true],
      ['insertion', 'Arterial insertion kit and required sterile barriers', true],
      ['skin', 'Ordered antiseptic, allergy check, dressing / securement', true],
      ['open', 'An open, repeatedly disconnected pressure circuit', false],
      ['evd', 'Connect the arterial fast-flush device to an EVD', false],
      ['guess', 'Any flush solution without checking the order', false]
    ],
    check: 'Keep the pressure system closed and sterile. Check for air, the prescribed flush setup, correct reference level / zeroing and a useful waveform according to the IFU and local procedure. Reassess the site and distal perfusion. Preparation is not proof of correct catheter placement.'
  },
  cvc: {
    name: 'Central-line assistance', item: 'cvc-tray', seconds: 60,
    order: 'Prepare to assist a credentialed clinician with a central venous catheter. Confirm patient, indication, site plan, consent / emergency process and time-out. The operator performs insertion.',
    options: [
      ['kit', 'Requested CVC kit, prescribed flush and securement', true],
      ['barrier', 'Cap, mask, sterile gown / gloves and full-body sterile drape', true],
      ['skin', 'Alcohol-based chlorhexidine >0.5%, if appropriate; check allergy and allow drying', true],
      ['ultrasound', 'Ultrasound with sterile probe cover and sterile gel', true],
      ['dressing', 'Sterile dressing, labels and ordered monitoring', true],
      ['small', 'A small drape in place of maximal sterile barriers', false],
      ['wet', 'Proceed while the skin antiseptic is still wet', false],
      ['use', 'Use the catheter before required placement / safety confirmation', false]
    ],
    check: 'Preserve the sterile field and complete the team time-out. The credentialed operator selects the site and inserts the catheter. Follow the required placement / complication assessment and authorization before use; this tray does not authorize insertion or use.'
  }
};

const common = {
  sources: [], acuity: 2, neuro: false,
  routine: 'In this case: hourly perfusion, respiratory, access and intake/output checks. Reposition / skin care every two hours when tolerated, with earlier reassessment after any change.',
  med: {order: 'Compare the active MAR with the patient, allergies, medication, route, dose / concentration, infusion line and pump. Do not add or change a drug without authorization.', choices: [
    ['verify', 'Verify the active order, identifiers, allergy, line and pump; clarify discrepancies.'],
    ['assume', 'Use the previous shift’s pump setting without checking the order.'],
    ['bolus', 'Give an extra fluid or medication bolus because the pressure looks low.']
  ], correct: 'verify'},
  labs: [['Hgb', '10.2', 'g/dL', '12–17'], ['K', '4.2', 'mmol/L', '3.5–5.0'], ['Creatinine', '1.1', 'mg/dL', '0.6–1.3']],
  labAfter: 'The ordered sample is resulted. Compare its timestamp, trend and bedside findings; the clinical issue may still be unresolved.',
  exam: 'At the starting exam: warm distal extremities, palpable distal pulses, intact access dressings and no new visible bleeding. Compare mentation and respiratory support with the report. Inspect skin / pressure areas, pain, urine appearance, collection tubing and the actual measured output; do not assume device readings replace the patient exam.',
  afterExam: 'Repeat the relevant exam, verify the response and communicate the remaining concern. Do not copy the old assessment into the new time point.',
  risks: 'A monitor value alone does not establish the cause. Urgent calls can happen before chart review or a completed routine assessment.'
};
const profile = value => ({...common, ...value});

export const SHIFT_PATIENTS = [
  profile({
    id: 'cabg-receiving', pod: 'delta', label: 'CABG ×3 · returned from OR', icon: 'heart',
    report: '62 years. CABG ×3 today. Intubated after surgery; A-line, central access, temporary pacing wires and mediastinal drains are present. The last drain trend was 35 mL in 30 minutes.',
    history: 'Coronary artery disease and hypertension. No known medication allergy in this fictional chart. Review the operative report, bypass course, last hemoglobin, products received and current support with the OR team.',
    orders: 'This case: MAP goal 65–80 mmHg. Drain / access and hemodynamic checks every 15 minutes for the first hour, then hourly if stable. Call the surgical team immediately for new hypotension, rapidly increasing output, or abrupt cessation with deterioration. CBC / coagulation studies now with a new bleeding concern. No automatic transfusion or fluid bolus.',
    baseline: {HR: 88, MAP: 72, SpO2: 97, RR: 16, UO: 40},
    changed: {HR: 116, MAP: 58, SpO2: 95, RR: 22, UO: 18},
    followup: {HR: 106, MAP: 66, SpO2: 96, RR: 20, UO: 18},
    event: 'The arterial alarm sounds. Drain output has increased to 120 mL over the last 15 minutes.',
    changeExam: 'Cooler extremities, delayed refill, new hypotension. Mediastinal drainage is increasingly sanguineous; assess the dressing, all drainage connections, external tubing and measured trend. Do not infer a single cause or independently manipulate the surgical drains.',
    device: 'A-line pressure must agree with the patient and a reliable pressure assessment. Compare chest-drain output and patency, rhythm, pacing-wire security, ventilator and current infusions.',
    afterDevice: 'Surgical team is evaluating the patient. Drain output remains concerning; no clamp, stripping or invasive manipulation is authorized in this case.',
    choices: [
      ['escalate', 'Call the surgical team now; assess perfusion and drain trend, send the ordered stat studies and prepare ordered treatment.'],
      ['wait', 'Wait for a complete routine assessment and a new CBC before notifying anyone.'],
      ['clamp', 'Clamp the mediastinal drains to stop the apparent bleeding.']
    ], correct: 'escalate',
    response: 'Urgent surgical review requested, current findings communicated and stat sampling requested. Maintain monitoring and prepare treatment only as ordered. A reassessment is due in 10 compressed minutes; the patient has not been “fixed” by the call.',
    afterExam: 'Ten compressed minutes later: MAP 66 and HR 106 during team evaluation. The urine figure is still the previously measured hour, not a new normalized output. Drain output remains 80 mL over the latest 15 minutes. Further treatment / repeat studies remain pending.',
    labs: [['Hgb', '9.6', 'g/dL', '12–17'], ['Platelets', '146', '×10³/µL', '150–400'], ['INR', '1.4', '', '0.8–1.2']],
    labAfter: 'Stat results: Hgb 8.1 g/dL, platelets 112 ×10³/µL, INR 1.7. Connect the trend with drainage and perfusion; products require the active prescription and transfusion checks.',
    sources: ['aha-special'], procedure: 'aline', frequentDrain: true
  }),
  profile({
    id: 'cabg-recovery', pod: 'delta', label: 'CABG · postoperative day one', icon: 'heart', acuity: 1,
    report: '70 years. CABG yesterday; extubated and on 2 L/min nasal oxygen. Up to the chair earlier. Drains remain in place with a small serosanguineous trend. Sinus rhythm at handoff.',
    history: 'Coronary artery disease, type 2 diabetes, sleep apnea. Compare pain / sedation, respiratory effort, surgical sites, fluid balance and the most recent ECG.',
    orders: 'This case: SpO₂ goal 92–96%, MAP at least 65. Hourly respiratory / rhythm / drain checks. New sustained tachyarrhythmia: assess symptoms and pressure, obtain ordered 12-lead ECG, send K / Mg and call the surgical provider. No independently started antiarrhythmic.',
    baseline: {HR: 82, MAP: 76, SpO2: 94, RR: 20, UO: 45},
    changed: {HR: 142, MAP: 68, SpO2: 93, RR: 24, UO: 35},
    followup: {HR: 112, MAP: 72, SpO2: 94, RR: 22, UO: 35},
    event: 'Telemetry alarms for a new sustained irregular tachycardia.',
    changeExam: 'Awake, anxious, feels palpitations. Warm extremities, pulse irregular, MAP 68. Assess chest symptoms, respiratory status, bleeding and actual rhythm; a monitor label is not a complete diagnosis.',
    device: 'Compare monitor and palpated pulse, check electrode contact and obtain the ordered diagnostic ECG. Inspect drains, pacing wires, incisions, access and distal circulation.',
    choices: [
      ['ecg', 'Assess stability, obtain the ordered ECG / electrolytes and promptly report the new rhythm.'],
      ['artifact', 'Assume artifact and silence the alarm without assessing the patient.'],
      ['drug', 'Start an antiarrhythmic infusion without a prescription.']
    ], correct: 'ecg',
    response: 'New rhythm and symptoms reported; ordered ECG / K / Mg requested. The provider owns the treatment decision. Recheck the patient in 10 compressed minutes.',
    afterExam: 'Reassessment: HR 112, MAP 72, still irregular. The patient is more comfortable but the rhythm issue persists. Document the team plan, drain / urine trend and what remains due.',
    labs: [['K', '4.0', 'mmol/L', '3.5–5.0'], ['Mg', '1.9', 'mg/dL', '1.7–2.4'], ['Hgb', '9.8', 'g/dL', '12–17']],
    labAfter: 'Repeat K 3.6 mmol/L, Mg 1.7 mg/dL, Hgb 9.6 g/dL. Replacement, if prescribed, needs the actual drug / dose / route / timing checks.',
    sources: ['aha-rhythm','af-postop','aha-special']
  }),
  profile({
    id: 'impella-rounds', pod: 'delta', label: 'Cardiogenic shock · Impella CP', icon: 'impella',
    report: '58 years. Post-MI cardiogenic shock with femoral Impella CP. P8 / 3.4 L/min at report. Diuresis earlier; current net balance −1.4 L. No suction alarm at handoff.',
    history: 'Recent PCI. Check the ordered anticoagulation / purge plan, bleeding, hemolysis surveillance, native rhythm, support and trends in perfusion and congestion.',
    orders: 'This case: trained RN may reduce from P8 to P7 for suction and promptly call the device team. Assess perfusion, filling / congestion, RV function and external position; the trained operator confirms position / treatment. No independent catheter adjustment, routine fluid bolus or purge change.',
    baseline: {HR: 90, MAP: 70, SpO2: 96, RR: 20, UO: 45},
    changed: {HR: 104, MAP: 58, SpO2: 96, RR: 24, UO: 20},
    followup: {HR: 96, MAP: 66, SpO2: 96, RR: 22, UO: 20},
    event: 'Impella SUCTION alarm; estimated pump flow has fallen to 2.1 L/min.',
    changeExam: 'Cool extremities and reduced perfusion. Lungs currently clear; no new edema. Check the access site, distal pulses, bleeding, fluid history and external catheter mark. These findings suggest a filling concern but do not exclude RV dysfunction or malposition.',
    device: 'CP P8 / 3.4 L/min before the alarm, 2.1 L/min during it. Red Ao is sensed placement pressure, white LV is calculated, green motor current reflects load and pressure difference. Compare all with the patient; pump flow is not total cardiac output.',
    afterDevice: 'After the case-authorized reduction: P7 / 2.8 L/min. The device team is evaluating filling, RV function and position. Do not infer that a quieter alarm establishes the diagnosis.',
    choices: [
      ['support', 'Reduce to P7 under this case order, urgently involve the device team, and reassess perfusion / filling / position.'],
      ['fluid', 'Give a large automatic fluid bolus because one filling-pressure value is low.'],
      ['advance', 'Advance the catheter yourself until the trace changes.']
    ], correct: 'support',
    response: 'P7 selected under the case order; device team called for cause assessment. Recheck patient and signals in 10 compressed minutes. Fluid or catheter treatment requires the reviewed plan.',
    afterExam: 'MAP 66, HR 96, clearer mentation during team review; previous-hour urine remains 20 mL. Recheck congestion, access / distal circulation and current support. Additional orders and repeat urine / hemolysis trends remain due.',
    sources: ['impella-cp']
  }),
  profile({
    id: 'sled-rounds', pod: 'bravo', label: 'AKI · SLED in progress', icon: 'dialysis',
    report: '66 years. AKI with fluid overload. SLED started before handoff through a temporary dialysis catheter. This fictional prescription is eight hours, with initial net UF 150 mL/h and a maximum total net goal of 1.2 L, subject to tolerance.',
    history: 'Pneumonia / septic shock improving. Review congestion, perfusion, current pressor trend, treatment elapsed time, actual net removal, catheter dressing, anticoagulation order and the dialysis RN / nephrology handoff.',
    orders: 'This case: monitor pressure / tolerance every 15 minutes during the early treatment, then per the dialysis plan. If MAP <65 or symptomatic, trained RN holds NET ULTRAFILTRATION and immediately calls dialysis RN / nephrology. This is not an order to stop the blood pump, disconnect the circuit or give albumin. BMP / Mg at the displayed schedule.',
    baseline: {HR: 94, MAP: 72, SpO2: 95, RR: 22, UO: 10},
    changed: {HR: 112, MAP: 58, SpO2: 94, RR: 26, UO: 10},
    followup: {HR: 100, MAP: 67, SpO2: 95, RR: 24, UO: 10},
    event: 'The patient feels light-headed during SLED. Pressure has fallen.',
    changeExam: 'Drowsier but responsive, cooler skin and delayed refill. Bilateral crackles persist. Inspect the catheter / circuit externally and compare actual fluid balance, removal and hemodynamics. Congestion and poor perfusion can coexist.',
    device: 'Generic SLED teaching panel: elapsed time, prescribed net UF and actual cumulative net removal are different quantities. Check access / circuit alarms with the trained dialysis team. No facility model or button sequence is assumed.',
    afterDevice: 'Net UF is on hold under this case order; the blood pump / circuit remain managed by the dialysis team. A new tolerated goal or modality decision is pending.',
    choices: [
      ['hold-uf', 'Hold net UF under the case order, assess perfusion / congestion and immediately contact dialysis RN / nephrology.'],
      ['chase', 'Increase removal to catch up with the original fluid goal.'],
      ['albumin', 'Give “a bottle of albumin” without concentration, grams, volume or an order.']
    ], correct: 'hold-uf',
    response: 'Net UF held under the explicit case order; dialysis RN / nephrology notified. Reassess in 10 compressed minutes. Do not restart or chase the net goal without the updated plan.',
    afterExam: 'MAP 67 and improved alertness, but crackles remain and net UF remains on hold. Urine is still 10 mL in the previously measured hour. Report actual net removal and ongoing congestion; do not label volume status “corrected.”',
    labs: [['K', '5.2', 'mmol/L', '3.5–5.0'], ['Bicarbonate', '19', 'mmol/L', '22–29'], ['Mg', '2.0', 'mg/dL', '1.7–2.4']],
    labAfter: 'Repeat K 4.7 mmol/L, bicarbonate 21 mmol/L, Mg 1.9 mg/dL. Review timing relative to therapy and the nephrology prescription; these results do not determine the next UF goal alone.',
    sources: ['kdigo-aki'], frequentCheck: true
  }),
  profile({
    id: 'vent-recovery', pod: 'bravo', label: 'Pneumonia · ventilated', icon: 'vent', acuity: 1,
    report: '54 years. Intubated for acute hypoxemic respiratory failure, now improving. FiO₂ 0.40 / PEEP 5 cmH₂O at report. Awake to voice, stable pressure and improving secretions. A daily liberation screen is ordered.',
    history: 'Pneumonia; no active seizures. Review sedation / analgesia orders, cough, secretions, gas exchange, respiratory effort and hemodynamics with RT.',
    orders: 'This case: RT / provider perform the readiness screen and an ordered 30-minute SBT if appropriate. RN assesses comfort, consciousness, cough, secretions and tolerance. Do not increase FiO₂ to make a trial appear successful. Extubation requires a separate team assessment / order.',
    baseline: {HR: 86, MAP: 74, SpO2: 95, RR: 20, UO: 45},
    changed: {HR: 92, MAP: 72, SpO2: 94, RR: 22, UO: 40},
    followup: {HR: 90, MAP: 74, SpO2: 95, RR: 22, UO: 40},
    event: 'RT reports a tolerated 30-minute SBT and asks for your bedside findings.',
    changeExam: 'Awake, follows commands, strong cough, manageable secretions. No increased work of breathing, distress or new hypotension during the trial. Assess airway patency / protection as well as the trial data.',
    device: 'Check prescribed ventilator settings, tube security / depth, circuit, suction and alarm history with RT. An SBT tests breathing with minimal support; it does not itself authorize removal of the airway.',
    afterDevice: 'Following the provider assessment and explicit extubation order, RT removes the tube in this scripted team event. RN continues respiratory / airway monitoring on the ordered 3 L/min nasal oxygen.',
    choices: [
      ['review', 'Report tolerance, cough / secretions and airway protection; obtain the provider / RT extubation plan.'],
      ['alone', 'Remove the tube yourself solely because the SpO₂ is acceptable.'],
      ['oxygen', 'Raise FiO₂ during the SBT so the saturation meets the target.']
    ], correct: 'review',
    response: 'Findings communicated. Provider / RT complete the separate extubation assessment and order. Team event is pending; reassess in 10 compressed minutes rather than assuming an immediate successful outcome.',
    afterExam: 'After the ordered team extubation event: awake, strong cough, no stridor, SpO₂ 95% on ordered 3 L/min and RR 22. Continue ordered reassessment; escalate new work of breathing or airway concerns.',
    sources: ['aarc-sbt']
  }),
  profile({
    id: 'evd-rounds', pod: 'charlie', label: 'SAH · EVD', icon: 'evd', neuro: true,
    exam: 'Current baseline: awake, oriented to person / place / month, follows commands in all limbs with symmetric strength. Pupils 3 mm and brisk bilaterally; no new focal deficit. EVD dressing dry, external tubing secure and CSF pale pink. ICP 14 mmHg from the documented ordered measurement, MAP 84 and CPP 70; the prescribed drainage state is restored. Warm distal extremities, palpable pulses, yellow urine, no new visible bleeding.',
    report: '49 years. Subarachnoid hemorrhage, aneurysm treated. EVD at a prescribed 15 cmH₂O relative to the external auditory meatus in this case. Baseline awake, equal pupils and follows commands. Last CSF 8 mL / hour, pale pink.',
    history: 'Review the secured-aneurysm status, neurologic baseline, CSF / ICP trend, sodium / fluid plan and active medications. Do not guess a drug from an abbreviation or change the EVD prescription.',
    orders: 'This case: hourly neurologic checks, CSF volume / appearance and documented ICP / CPP assessment. HOB 30°, neutral head when tolerated. Call neuro team immediately for a new deficit or sustained concerning ICP. A trained RN follows the ordered measurement / movement procedure, verifies reference level and restores prescribed drainage. No flushing, sampling, height change or invasive troubleshooting is authorized here.',
    baseline: {HR: 78, MAP: 84, SpO2: 97, RR: 18, UO: 45, ICP: 14},
    changed: {HR: 64, MAP: 82, SpO2: 96, RR: 20, UO: 35, ICP: 27},
    followup: {HR: 68, MAP: 84, SpO2: 96, RR: 20, UO: 35, ICP: 25},
    event: 'The patient is harder to wake. A pupil looks different from report.',
    changeExam: 'New reduced arousal and a sluggish larger right pupil. ICP 27 mmHg is from a documented measurement using the ordered monitoring configuration, not an unqualified reading during open drainage. MAP 82 gives CPP 55 mmHg. CSF output has fallen to 1 mL over the last measured hour.',
    device: 'Check the ordered 15 cmH₂O reference at the external auditory meatus, tubing / securement, CSF trend and the system’s prescribed measurement / drainage state. ICP measurement and drainage configuration must be identified. Never connect an arterial fast-flush device to the EVD.',
    afterDevice: 'Neuro team is evaluating new findings. The trained RN has verified external leveling and the ordered drainage state; no independent height change or flush occurred. Imaging / further treatment remain pending.',
    choices: [
      ['neuro', 'Urgently call neuro team, reassess airway / pupils / motor findings and verify external setup under the case order.'],
      ['flush', 'Flush the ventricular catheter without an order or established authority.'],
      ['lower', 'Lower the chamber to drain more until the ICP number improves.']
    ], correct: 'neuro',
    response: 'New neurologic findings and ICP / MAP / CPP context urgently reported. Prescribed head position and external system checks maintained; neuro team owns further invasive treatment. Reassess in 10 compressed minutes.',
    afterExam: 'MAP 84, documented ICP 25 and CPP 59. Arousal / pupil abnormality persist; this is not resolution. Repeat and time-stamp the neuro exam, CSF findings and neuro team plan; CT / additional treatment are pending.',
    labs: [['Na', '143', 'mmol/L', '135–145'], ['Glucose', '136', 'mg/dL', '70–140 (case range)'], ['Hgb', '10.6', 'g/dL', '12–17']],
    sources: ['snacc-evd', 'evd-nursing']
  }),
  profile({
    id: 'seizure-airway', pod: 'charlie', label: 'After status epilepticus · ventilated', icon: 'vent', neuro: true,
    exam: 'Baseline exam with the prescribed sedation still active: opens eyes to stimulation, does not reliably follow commands, localizes with both arms and withdraws both legs symmetrically. Pupils 3 mm and reactive. No visible convulsion; EEG interpretation remains with the team. Weak cough and frequent secretions; tube / access secured, no new bleeding. Record sedation and last-dose context rather than inventing an unconfounded exam.',
    report: '41 years. Intubated during status epilepticus because consciousness / airway protection were impaired, not simply for “seizure precautions.” Continuous EEG is in place; no visible convulsions at report.',
    history: 'Review EEG / seizure treatment, active sedation and the confounders of the neuro exam. FiO₂ 0.35, PEEP 5 cmH₂O. An acceptable oxygen saturation does not establish airway protection.',
    orders: 'This case: hourly neuro assessment with sedation context, prescribed seizure therapy and RT / provider liberation assessment. Report poor cough, secretion burden or uncertain airway protection. No independent sedation interruption, antiseizure medication change or extubation.',
    baseline: {HR: 84, MAP: 78, SpO2: 97, RR: 18, UO: 40},
    changed: {HR: 86, MAP: 76, SpO2: 96, RR: 20, UO: 40},
    followup: {HR: 84, MAP: 78, SpO2: 96, RR: 18, UO: 40},
    event: 'The breathing trial was tolerated. The team asks whether the airway is ready.',
    changeExam: 'Not reliably following commands, weak cough and copious secretions despite a tolerated breathing trial. Assess recent sedation, EEG / seizure context and airway protection with the team; do not use one saturation or GCS value alone.',
    device: 'Compare the ventilator / tube, suction needs, EEG connections and the time of sedative / antiseizure doses. Keep the respiratory trial result separate from the extubation decision.',
    choices: [
      ['protect', 'Report poor cough / secretions and uncertain protection; request the team airway assessment and continue ordered support.'],
      ['saturation', 'Extubate because SpO₂ 96% proves readiness.'],
      ['stop', 'Stop all sedatives and antiseizure therapy independently.']
    ], correct: 'protect',
    response: 'Airway concerns and confounders reported. Team defers extubation and continues the ordered support / reassessment plan. No airway or medication change is made independently.',
    afterExam: 'SpO₂ 96%, RR 18 on continued ordered ventilator support. Weak cough / secretion burden and the neuro confounders remain relevant. Continue the hourly exam and team reassessment; a passed SBT has not established extubation readiness.',
    sources: ['aarc-sbt']
  }),
  profile({
    id: 'imc-respiratory', pod: 'alpha', label: 'Pneumonia · oxygen therapy', icon: 'oxygen', acuity: 1,
    report: '68 years. Pneumonia on 2 L/min nasal oxygen. Awake and talking at report. IV antibiotics are prescribed; review the actual MAR, cultures, renal function and allergies before administration.',
    history: 'Hypertension. No chronic hypercapnic respiratory failure in this fictional history. Compare baseline activity, respiratory effort, oxygen requirement and fluid balance.',
    orders: 'This case: oxygen may be increased to 5 L/min nasal cannula to target SpO₂ 92–96%, with prompt reassessment. Call rapid response / RT / provider for new work of breathing, reduced arousal or persistent hypoxemia. Do not wait for the next scheduled round.',
    baseline: {HR: 90, MAP: 78, SpO2: 94, RR: 22, UO: 45},
    changed: {HR: 112, MAP: 70, SpO2: 88, RR: 32, UO: 30},
    followup: {HR: 100, MAP: 74, SpO2: 94, RR: 24, UO: 30},
    event: 'The patient is breathing faster and the SpO₂ alarm sounds.',
    changeExam: 'New accessory-muscle use and shorter phrases. Verify the probe, oxygen connection and patient; assess consciousness, breath sounds, perfusion and new congestion rather than attributing everything to the monitor.',
    device: 'Check nasal oxygen delivery, oximeter quality, prescribed target and IV access. New support requirements may exceed IMC capability and require a reviewed transfer plan.',
    choices: [
      ['respiratory', 'Assess immediately, apply the case-authorized oxygen and call rapid response / RT / provider.'],
      ['round', 'Wait until the next hourly check because the patient is already on oxygen.'],
      ['fluid', 'Give a large unprescribed fluid bolus for the tachycardia.']
    ], correct: 'respiratory',
    response: 'Case-authorized oxygen applied and urgent team assessment requested. Continue direct reassessment; the next scheduled round is not an adequate response to deterioration.',
    afterExam: 'SpO₂ 94% on 5 L/min, RR 24, longer phrases. The higher oxygen requirement and team review remain important; do not equate an improved number with resolved pneumonia or transfer readiness.'
  }),
  profile({
    id: 'imc-telemetry', pod: 'alpha', label: 'Syncope · telemetry observation', icon: 'monitor', acuity: 1,
    report: '57 years. Admitted after syncope. Sinus rhythm at report and no chest pain. Peripheral IV and telemetry; compare the actual ECG, orthostatic / medication history and electrolyte results.',
    history: 'Hypertension. Do not diagnose a rhythm from a single monitor label. New symptoms or instability need immediate bedside assessment and escalation.',
    orders: 'This case: new rhythm / symptoms → bedside perfusion assessment, ordered 12-lead ECG and provider / rapid-response review as indicated. K / Mg with the scheduled collection. No independently started antiarrhythmic or replacement dose.',
    baseline: {HR: 76, MAP: 80, SpO2: 97, RR: 18, UO: 45},
    changed: {HR: 132, MAP: 68, SpO2: 96, RR: 22, UO: 35},
    followup: {HR: 108, MAP: 74, SpO2: 96, RR: 20, UO: 35},
    event: 'New palpitations and an irregular tachycardia on telemetry.',
    changeExam: 'Awake with palpitations; no loss of pulse. Compare pulse, pressure, symptoms, electrode quality and ordered ECG. Reassess immediately for deterioration.',
    device: 'Inspect electrode contact / leads and the waveform; retain a useful strip and obtain the diagnostic ECG under the case order.',
    choices: [
      ['assess', 'Assess stability, obtain the ordered ECG / labs and promptly communicate the change.'],
      ['silence', 'Silence the alarm and continue supplies without checking the patient.'],
      ['treat', 'Choose an IV rhythm drug from the monitor label alone.']
    ], correct: 'assess',
    response: 'Findings and rhythm change reported; ordered diagnostic assessment requested. Keep reassessing, and use rapid response immediately if the patient becomes unstable.',
    afterExam: 'HR 108, MAP 74, awake with less distress. The rhythm concern is still under review. Hand off symptoms, ECG / labs and the plan rather than documenting a definitive diagnosis from the monitor.'
  }),
  profile({
    id: 'rosc-arrival', pod: 'bravo', label: 'Admission · after return of circulation', icon: 'vent',
    report: 'Adult patient arriving after resuscitation with return of spontaneous circulation. Intubated; the transport team retains care until the receiving team and room are ready.',
    history: 'Get the arrest / ROSC timeline, rhythm, airway details, medications / last doses, access, active infusions, initial ECG and diagnostic / temperature-control plan. Early unresponsiveness is not an individual neurologic prognosis.',
    orders: 'This fictional receiving plan: continuous monitoring, confirm airway / ventilation with RT, reliable pressure monitoring, verify active infusions and prompt provider assessment. Obtain the ordered 12-lead ECG and initial labs. Prepare central-line assistance; insertion is by the credentialed team.',
    baseline: {HR: 96, MAP: 70, SpO2: 96, RR: 18, UO: 20},
    changed: {HR: 100, MAP: 64, SpO2: 94, RR: 22, UO: 20},
    followup: {HR: 96, MAP: 70, SpO2: 95, RR: 20, UO: 20},
    event: 'At the receiving check, pressure is lower and the infusion handoff needs clarification.',
    changeExam: 'Assess perfusion, airway / tube security, ventilation, access, actual pump / order match and the last documented doses. Do not infer prognosis from the early neuro exam or make an unprescribed pressor change.',
    device: 'Compare ECG, oxygen / ventilation monitoring, reliable pressure and actual infusion labels / rates with transport and the receiving orders.',
    choices: [
      ['handoff', 'Stay with the patient, clarify infusions with transport / provider and promptly report the pressure / perfusion change.'],
      ['guess', 'Copy the pump rates into the chart without reconciling the active prescriptions.'],
      ['prognosis', 'Predict individual mortality from early unresponsiveness or pressor count.']
    ], correct: 'handoff',
    response: 'Transport / receiving infusion discrepancy and perfusion findings urgently reconciled with the provider. Trained team manages any new support orders; direct nursing reassessment continues.',
    afterExam: 'MAP 70, SpO₂ 95%, verified infusion handoff during team management. Ongoing diagnostic, ventilation and temperature-control plans still need follow-through. This scripted response does not predict outcome.',
    sources: ['aha-post'], procedure: 'cvc'
  }),
  profile({
    id: 'post-sepsis-stepdown', pod: 'alpha', label: 'From Bravo · recovering after sepsis', icon: 'monitor', acuity: 1,
    report: '72 years. Transferred after septic shock stabilized in Bravo. Off pressors and on 2 L/min oxygen at transfer. Antibiotics continue under the active prescription; renal function, cultures, intake and mobility need follow-through.',
    history: 'Pneumonia, heart failure and recent AKI. Read the ICU transfer summary: prior fluids / congestion, last pressor dose, baseline mentation, cultures, antibiotic timing and pending studies. This is a step-down assignment, not an active shock assignment.',
    orders: 'This case: MAP at least 65, SpO₂ 92–96%, scheduled antibiotics / monitoring. New hypotension, reduced arousal or increased support requirement → rapid-response / provider review and reassessment of appropriate level of care. Fluid or pressor therapy needs the specific reviewed prescription; no universal bolus is authorized.',
    baseline: {HR: 86, MAP: 76, SpO2: 94, RR: 20, UO: 40},
    changed: {HR: 110, MAP: 60, SpO2: 91, RR: 28, UO: 20},
    followup: {HR: 102, MAP: 68, SpO2: 94, RR: 24, UO: 20},
    event: 'The recent ICU transfer is sleepier, breathing faster and hypotensive.',
    changeExam: 'New reduced arousal and delayed refill, with persistent bibasilar crackles. Verify pressure / oxygen delivery and assess perfusion, respiratory status, fever, medications, bleeding and fluid balance. Previous improvement does not explain away a new change.',
    device: 'Compare telemetry, reliable pressure, oxygen support, IV access, last antibiotic dose and the ICU transfer / pending-result handoff.',
    choices: [
      ['escalate', 'Assess immediately, call rapid response / provider and communicate the ICU history, perfusion / congestion findings and new support needs.'],
      ['stable', 'Continue routine care because transfer out of ICU proves ongoing stability.'],
      ['pressor', 'Start an unprescribed pressor or give a standard fluid load without assessing congestion / orders.']
    ], correct: 'escalate',
    response: 'Rapid-response / provider review requested, transfer context and current findings communicated. The team reviews treatment and whether the patient needs ICU-level support again. Continue direct reassessment.',
    afterExam: 'MAP 68 and SpO₂ 94% during team review. Increased respiratory effort and the possibility of a higher level of care remain important. Urine remains the previously measured 20 mL; repeat output, support and the receiving plan are pending.',
    sources: ['ssc-sepsis']
  }),
  profile({
    id: 'post-dka-stepdown', pod: 'alpha', label: 'From Bravo · after DKA resolution', icon: 'monitor', acuity: 1,
    report: '32 years. DKA resolved in Bravo and transitioned to a prescribed subcutaneous insulin plan before transfer. Eating again, off the insulin infusion, awake and on room air. The transition / last-dose handoff matters.',
    history: 'Type 1 diabetes. Review documented crisis resolution, last basal / rapid-acting doses, meal plan, glucose / electrolyte schedule and access to insulin / supplies. A single glucose value does not establish resolution or recurrence of DKA.',
    orders: 'This case: check glucose before meals and at bedtime; use only the active basal / mealtime / correction prescriptions. Coordinate mealtime dosing with intake. Missing medication or unclear transition / last dose → clarify promptly with provider / pharmacy. New vomiting, tachypnea or other deterioration → urgent assessment and prescribed diagnostic testing, not glucose alone.',
    baseline: {HR: 82, MAP: 80, SpO2: 98, RR: 18, UO: 45},
    changed: {HR: 86, MAP: 78, SpO2: 98, RR: 18, UO: 45},
    followup: {HR: 84, MAP: 80, SpO2: 98, RR: 18, UO: 45},
    event: 'The meal arrives, but the mealtime insulin / last-dose handoff does not match the MAR.',
    changeExam: 'Awake, hungry, no vomiting or new respiratory distress. Bedside glucose is 226 mg/dL (case premeal reference 70–140). Check the actual meal, active prescription, last doses and transition documentation; do not diagnose a crisis from this glucose alone.',
    device: 'Compare point-of-care glucose timestamp, active MAR, last administered insulin, meal availability and the transfer summary. This patient is not on a ward insulin infusion.',
    choices: [
      ['coordinate', 'Reconcile the transition / last doses, clarify the discrepant mealtime prescription with provider / pharmacy and coordinate insulin with actual intake.'],
      ['infusion', 'Restart the old ICU insulin infusion independently.'],
      ['skip', 'Omit the basal plan because the patient is now out of ICU.']
    ], correct: 'coordinate',
    response: 'Medication / transition discrepancy clarified with provider / pharmacy; the team confirms the current prescribed regimen and intake plan. No guessed or duplicate insulin dose is given. Reassess the patient and the order / administration record.',
    afterExam: 'Patient remains awake and comfortable; the active regimen, last doses and intake plan have been reconciled. Continue the ordered glucose / electrolyte checks. No new glucose or laboratory normalization is invented by this workflow check.',
    labs: [['Glucose', '184', 'mg/dL', '70–140 (case range)'], ['K', '4.0', 'mmol/L', '3.5–5.0'], ['Bicarbonate', '24', 'mmol/L', '22–29']],
    sources: ['dka-consensus']
  }),
  profile({
    id: 'neuro-hemorrhage', pod: 'charlie', label: 'Intracerebral hemorrhage · fall at onset', icon: 'monitor', neuro: true,
    exam: 'Baseline: awake, answers orientation questions, pupils 3 mm and brisk, follows commands. Mild left-arm weakness compared with the right; other limb movement unchanged from report. Speech slightly slowed but understandable. SBP 150, no new headache or vomiting. Access dressing dry, distal perfusion intact, yellow urine. Preserve this documented asymmetry for comparison.',
    report: '76 years. The team has diagnosed a spontaneous intraparenchymal hemorrhage; a fall occurred at symptom onset, without a separate traumatic lesion in this fictional CT report. Admitted to Charlie for close neuro monitoring. Awake with mild left-arm weakness at report. No EVD is present.',
    history: 'Review the actual CT report, baseline exam / last known well, trauma history, anticoagulant exposure / reversal plan and neurosurgical instructions. A fall may be a cause, result or coincident event; do not infer the mechanism from the location alone.',
    orders: 'This fictional case: hourly neuro checks and SBP goal 140–160 mmHg under the displayed provider plan. New deficit / reduced arousal → immediate neuro / rapid-response review, airway assessment and urgent imaging as ordered. BP drugs, reversal and the choice of CT / CTA are provider-directed; no independent medication change.',
    baseline: {HR: 80, MAP: 98, SBP: 150, SpO2: 97, RR: 18, UO: 40},
    changed: {HR: 72, MAP: 110, SBP: 178, SpO2: 95, RR: 22, UO: 35},
    followup: {HR: 76, MAP: 104, SBP: 158, SpO2: 96, RR: 20, UO: 35},
    event: 'Left-arm movement is worse and the patient needs repeated stimulation to answer.',
    changeExam: 'New reduced arousal and worsened focal weakness compared with the documented baseline. Assess airway, pupils / motor response, symptoms, glucose and reliable pressure. Record when last at baseline and promptly escalate; the routine hourly schedule does not justify waiting.',
    device: 'No EVD: compare the actual neuro exam, reliable pressure, oxygen delivery and ordered diagnostic / reversal plan. Do not invent ICP or CPP values without an appropriate measurement.',
    choices: [
      ['neuro', 'Notify neuro / emergency team now, give the change / last baseline and prepare the patient for ordered reassessment / imaging.'],
      ['hour', 'Wait until the next hourly exam before calling.'],
      ['target', 'Give a guessed antihypertensive or anticoagulant reversal dose independently.']
    ], correct: 'neuro',
    response: 'New deficit / arousal change and reliable pressure urgently communicated. Team directs BP / diagnostic treatment; maintain airway and direct neuro reassessment during the response.',
    afterExam: 'SBP 158 during team management; reduced arousal and focal weakness persist. This is not a normal neuro exam or a resolved hemorrhage. Hand off repeat exam time, imaging status and the actual team plan.',
    sources: ['aha-ich']
  }),
  profile({
    id: 'variceal-bleed', pod: 'bravo', label: 'Cirrhosis · upper GI bleeding', icon: 'monitor',
    report: '59 years. Cirrhosis, known esophageal varices and hematemesis. Initial resuscitation / GI assessment started before handoff. Two peripheral IVs; blood-bank workup and endoscopy plan are active.',
    history: 'Review recent bleeding volume / appearance, airway / aspiration risk, mentation, perfusion, measured output, last Hgb / products and current vasoactive / antibiotic prescriptions. A normal-looking early Hgb does not exclude serious blood loss.',
    orders: 'This case: NPO, close hemodynamic / airway monitoring, stat CBC / coagulation / blood-bank testing with new bleeding and immediate critical-care / GI escalation. Verify the prescribed octreotide and antibiotic regimen, and prepare products only under the active blood-bank / transfusion process. GI directs urgent endoscopic management after resuscitation. CT / CTA is selected for a specific diagnostic question, not an automatic replacement for resuscitation / endoscopy.',
    baseline: {HR: 100, MAP: 72, SpO2: 95, RR: 22, UO: 30},
    changed: {HR: 126, MAP: 54, SpO2: 91, RR: 30, UO: 15},
    followup: {HR: 114, MAP: 65, SpO2: 94, RR: 26, UO: 15},
    event: 'Fresh hematemesis, a falling pressure and worsening arousal.',
    changeExam: 'Fresh blood in emesis, cooler skin, reduced arousal and poor perfusion. Assess airway protection / aspiration risk, breathing, access, actual losses and measured urine while calling for immediate help. Do not take an unstable patient to a scan without the team’s stabilization / transport plan.',
    device: 'Check functioning IV access, monitoring, suction / oxygen and resuscitation readiness. Reconcile current vasoactive / antibiotic orders and blood-bank identification with the team; invasive airway / endoscopic procedures require the appropriate operator.',
    choices: [
      ['resuscitate', 'Call critical care / GI now, assess airway and perfusion, verify the active bleeding orders and prepare ordered resuscitation / endoscopy.'],
      ['scan', 'Send the hypotensive patient straight to CTA and delay airway / resuscitation review.'],
      ['hgb', 'Wait for a low Hgb before treating the visible deterioration as urgent.']
    ], correct: 'resuscitate',
    response: 'Critical-care / GI emergency review requested; airway, perfusion, access and bleeding orders communicated. The team directs resuscitation, prescribed drugs / blood products and the endoscopy / diagnostic plan. Immediate safety measures do not wait for the next lab.',
    afterExam: 'MAP 65 during team-directed resuscitation, but the bleeding concern, airway risk and poor prior-hour urine remain. Repeat loss / perfusion assessment and communicate endoscopy / transfusion status. No hemorrhage control is inferred from the pressure alone.',
    labs: [['Hgb', '9.0', 'g/dL', '12–17'], ['Platelets', '84', '×10³/µL', '150–400'], ['INR', '1.8', '', '0.8–1.2']],
    labAfter: 'Stat Hgb 7.2 g/dL, platelets 78 ×10³/µL, INR 1.9. Interpret with ongoing hemorrhage / shock and the team plan; no isolated numerical transfusion threshold replaces that assessment.',
    sources: ['aasld-varices'], frequentCheck: true, procedure: 'cvc'
  }),
  profile({
    id: 'ards-nmba', pod: 'bravo', label: 'ARDS · ventilated', icon: 'vent',
    report: '47 years. ARDS, PaO₂ / FiO₂ 120 with persistent dyssynchrony despite the reviewed ventilation / sedation plan. The critical-care team is considering a short neuromuscular-blockade intervention. No NMBA has yet been given in this case.',
    history: 'Review analgesia, sedation indication / depth, ventilation targets, hemodynamics, current drugs and renal / hepatic context. Fentanyl is an opioid analgesic; propofol and midazolam are sedatives / hypnotics. They are not interchangeable with a pressor or a paralytic.',
    orders: 'This fictional readiness case: maintain the prescribed analgesia / sedation, assess perfusion and clarify new hypotension before any team-directed rocuronium intervention. Rocuronium does not provide analgesia or unconsciousness. Verify adequate ongoing analgesia / sedation, secure ventilatory support, the intended drug / prescription, and the team monitoring plan first. The case’s TOF documentation uses left ulnar stimulation at an established 50 mA; this is an example, not a universal site / current / target.',
    baseline: {HR: 104, MAP: 70, SpO2: 92, RR: 28, UO: 35},
    changed: {HR: 118, MAP: 56, SpO2: 89, RR: 34, UO: 20},
    followup: {HR: 106, MAP: 68, SpO2: 93, RR: 22, UO: 20},
    event: 'Pressure falls while the team is preparing the neuromuscular-blockade plan.',
    changeExam: 'Poorer perfusion, dyssynchrony and hypoxemia. Review pain / sedation assessment before paralysis, current infusions, dose timing, access, reliable pressure and respiratory mechanics with the team. Do not assume low pressure has only one medication cause.',
    device: 'Check tube / ventilator support with RT, infusion labels / pumps against the current order, and nerve-stimulator setup. A TOF twitch count measures peripheral blockade, not pain relief or awareness.',
    choices: [
      ['prepare', 'Urgently report perfusion / respiratory findings; verify the analgesia, sedation, ventilation and NMBA prescription / monitoring plan with the team before proceeding.'],
      ['quiet', 'Give rocuronium first because a motionless patient must be comfortable.'],
      ['pressor', 'Start or change a pressor independently instead of clarifying the active plan.']
    ], correct: 'prepare',
    response: 'Clinical team is reassessing the hypotension / ventilation plan. Readiness checks, baseline TOF and prescribed analgesia / sedation are verified before the scripted specialist-led NMBA event. No autonomous dose or pressor change is made by this button.',
    afterExam: 'After team-directed hemodynamic management and the prescribed short NMBA event: MAP 68 and SpO₂ 93%. The case’s observed TOF is 2/4 at the same left ulnar site / 50 mA. Movement-based RASS cannot establish sedation depth during paralysis. Ongoing prescribed analgesia / sedation, ventilation and the team clinical monitoring plan must continue.',
    med: {order: 'For this readiness exercise, reconcile the prescribed fentanyl analgesia and propofol sedation separately. New hypotension needs immediate patient / infusion assessment and provider review of support / sedation. Midazolam is another sedative option only if specifically prescribed; none of these drugs is an automatic interchangeable “go-to.”', choices: [
      ['verify', 'Verify analgesia and sedation separately, the active orders / pumps and perfusion; clarify the hemodynamic / NMBA plan with the provider.'],
      ['nmba', 'Replace analgesia / sedation with rocuronium.'],
      ['all', 'Collect fentanyl, midazolam, propofol and a pressor and administer them without patient-specific prescriptions.']
    ], correct: 'verify'},
    tof: {site: 'left-ulnar', current: 50, baseline: 4, followup: 2},
    sources: ['sccm-nmba', 'sccm-padis', 'rocuronium-label']
  })
];

export const PATIENT_BY_ID = Object.fromEntries(SHIFT_PATIENTS.map(p => [p.id, p]));
export const ADMISSIONS = {
  delta: {name: 'An open-heart patient is coming', profile: 'cabg-receiving', items: ['monitor', 'airway', 'pump', 'drain'], procedure: 'aline', brief: 'Prepare a monitored receiving bed, oxygen / suction / bag-mask readiness, pump capacity and the ordered drain receiving setup. Confirm the OR handoff and team readiness before transport.'},
  bravo: {name: 'Your resuscitation receiving bed', profile: 'rosc-arrival', items: ['monitor', 'airway', 'pump', 'resus'], procedure: 'cvc', brief: 'A patient with ROSC needs a prepared room. Check monitoring, airway / ventilation readiness with RT, resuscitation equipment and current infusion orders. A credentialed clinician will insert the ordered line.'},
  charlie: {name: 'A neuro admission is coming', profile: 'evd-rounds', items: ['monitor', 'airway', 'pump', 'neuro'], brief: 'Prepare for a documented neuro baseline, ordered monitoring and secure EVD support. The trained neuro team receives and configures the closed drainage system.'},
  alpha: {name: 'A monitored transfer is coming', profile: 'imc-respiratory', items: ['monitor', 'airway', 'pump'], brief: 'Confirm the patient is appropriate for IMC and receive current support / escalation orders. Prepare monitoring, prescribed oxygen, suction readiness and the required IV equipment.'}
};

export const NOTE_FIELDS = [
  ['s', 'Situation · current concern'], ['b', 'Background · diagnosis / support'],
  ['a', 'Assessment · findings and timestamps'], ['r', 'Action / communication · orders and team'],
  ['response', 'Response · reassessment and next due care']
];

export const DRUG_ROLES = [
  ['Fentanyl', 'Opioid analgesia', 'Assess pain, respiratory / hemodynamic effects and the active prescription. It does not automatically replace the required hypnosis / sedation plan.'],
  ['Propofol', 'Sedative / hypnotic', 'Verify the indication, prescribed goal / dose, monitoring and perfusion. It does not provide analgesia.'],
  ['Midazolam (Versed)', 'Benzodiazepine sedative', 'Use only the selected patient-specific prescription. Review accumulation / clinical context, respiratory support and perfusion; it is not an analgesic.'],
  ['Norepinephrine', 'Vasopressor', 'Requires the actual order / titration parameters and access / perfusion monitoring. Support does not replace investigation or treatment of the cause of hypotension.'],
  ['Rocuronium', 'Neuromuscular blocker', 'Paralysis does not establish unconsciousness or pain relief. Verify the intended drug / order, adequate analgesia / sedation, ventilation and the clinical monitoring plan.']
];
