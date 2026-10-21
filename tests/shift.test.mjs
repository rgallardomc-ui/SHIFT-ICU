import test from 'node:test';
import assert from 'node:assert/strict';
import {SHIFT_PATIENTS, FLOOR_PODS, ADMISSIONS, PROCEDURES, NOTE_FIELDS} from '../dist/shift-data.js';
import {CLINICAL_SOURCES} from '../dist/sources.js';
import {createShift, restoreShift, advanceShift, performCare, packSupplies, returnSupplies, checkProcedure, receiveAdmissionReport, installAdmissionSupply, acceptAdmission, recordNote, endShift, exportShift, shiftSummary, clockAt} from '../dist/shift-engine.js';
import {roomGeometry, walkAllowed, routeBetween, moveNurse, interactionTargets} from '../dist/shift-map.js';

const correctEquipment = kind => PROCEDURES[kind].options.filter(o => o[2]).map(o => o[0]);
function admit(shift) {
  advanceShift(shift, 21);
  assert.equal(receiveAdmissionReport(shift).ok, true);
  const incoming = ADMISSIONS[shift.pod];
  assert.equal(packSupplies(shift, incoming.items).ok, true);
  if (incoming.procedure) assert.equal(checkProcedure(shift, incoming.procedure, correctEquipment(incoming.procedure)).ok, true);
  for (const id of [...incoming.items, ...(incoming.procedure ? [PROCEDURES[incoming.procedure].item] : [])]) assert.equal(installAdmissionSupply(shift, id).ok, true);
  assert.equal(acceptAdmission(shift, ['identity', 'support', 'handoff']).ok, true);
  return shift.patients.at(-1);
}
function caseState(id) {
  const model = SHIFT_PATIENTS.find(p => p.id === id);
  if (id === 'rosc-arrival') {
    const shift = createShift({pod: 'bravo', level: 2, seed: 97});
    return {shift, patient: admit(shift), model};
  }
  for (let seed = 1; seed < 300; seed++) {
    const shift = createShift({pod: model.pod, seed});
    const patient = shift.patients.find(p => p.profile === id);
    if (patient) return {shift, patient, model};
  }
  throw Error(`No assignment contains ${id}`);
}
function baseline(shift, patient, model) {
  for (const action of ['report', 'orders', 'assess', 'device']) assert.equal(performCare(shift, patient.room, action).ok, true, action);
  assert.equal(performCare(shift, patient.room, 'meds', model.med.correct).ok, true);
  if (model.tof) assert.equal(performCare(shift, patient.room, 'tof', {site:model.tof.site, current:model.tof.current, twitches:model.tof.baseline, context:'blockade-only'}).ok, true);
}
function change(shift, patient) {
  if (!patient.eventFired) advanceShift(shift, patient.eventAt - shift.elapsed + 0.1);
  assert.equal(patient.stage, 'changed');
}

test('assignment seeds reproduce patient / room mix and vary across seeds', () => {
  assert.deepEqual(createShift({seed:36}), createShift({seed:36}));
  const combinations = new Set();
  for (const pod of Object.keys(FLOOR_PODS)) for (let seed=1; seed<=50; seed++) {
    const shift=createShift({pod,seed});
    assert.equal(new Set(shift.patients.map(p=>p.room)).size,shift.patients.length);
    assert.ok(shift.patients.every(p=>p.room>=1&&p.room<=12));
    assert.ok(shift.patients.every(p=>SHIFT_PATIENTS.find(m=>m.id===p.profile).pod===pod));
    assert.equal(shift.patients.length,2);
    combinations.add(shift.patients.map(p=>`${p.room}:${p.profile}`).join('|'));
    if (pod==='delta') assert.ok(shift.patients.some(p=>p.profile.startsWith('cabg')));
  }
  assert.ok(combinations.size>100);
});
test('step-down and high-acuity assignments retain different scopes and loads', () => {
  for(let seed=1;seed<=30;seed++) {
    const alpha=createShift({pod:'alpha',level:3,seed});
    assert.equal(alpha.patients.length,3);
    assert.equal(new Set(alpha.patients.map(p=>p.profile)).size,3);
    assert.ok(alpha.patients.every(p=>SHIFT_PATIENTS.find(m=>m.id===p.profile).acuity===1));
    assert.ok(alpha.patients.every(p=>!['vent','evd','dialysis','impella'].includes(SHIFT_PATIENTS.find(m=>m.id===p.profile).icon)));
    for(const pod of ['bravo','charlie','delta']) assert.equal(createShift({pod,level:3,seed}).patients.length,2);
  }
  assert.ok(SHIFT_PATIENTS.filter(p=>p.pod==='alpha').some(p=>p.id==='post-sepsis-stepdown'));
  assert.ok(SHIFT_PATIENTS.filter(p=>p.pod==='alpha').some(p=>p.id==='post-dka-stepdown'));
});

for(const model of SHIFT_PATIENTS) test(`${model.id}: reasoning, ordered response, timed reassessment and truthful handoff are reachable`, () => {
  const {shift,patient}=caseState(model.id);
  baseline(shift,patient,model);
  change(shift,patient);
  // Notification is never gated by completing an assessment or the chart.
  assert.equal(performCare(shift,patient.room,'notify').ok,true);
  const old={...patient.current};
  const noEvidence=performCare(shift,patient.room,'respond',model.correct);
  assert.equal(noEvidence.ok,false);
  assert.equal(patient.planDone,false);
  assert.equal(performCare(shift,patient.room,'assess').ok,true);
  assert.equal(performCare(shift,patient.room,'device').ok,true);
  const wrong=model.choices.find(([id])=>id!==model.correct)[0];
  assert.equal(performCare(shift,patient.room,'respond',wrong).safety,true);
  assert.equal(patient.planDone,false);
  assert.deepEqual(patient.current,old);
  assert.equal(performCare(shift,patient.room,'respond',model.correct).ok,true);
  assert.equal(patient.planDone,true);
  assert.equal(patient.reassessed,false);
  assert.deepEqual(patient.current,old,'a plan does not instantly normalize the patient');
  assert.equal(performCare(shift,patient.room,'assess').ok,true);
  assert.equal(patient.reassessed,false,'an early exam is useful but not the scheduled response exam');
  advanceShift(shift,Math.max(0.1,patient.followupAt-shift.elapsed+0.1));
  assert.equal(performCare(shift,patient.room,'assess').ok,true);
  assert.equal(patient.reassessed,true);
  assert.deepEqual(patient.current,model.followup);
  if(model.tof) assert.equal(performCare(shift,patient.room,'tof',{site:model.tof.site,current:model.tof.current,twitches:model.tof.followup,context:'blockade-only'}).ok,true);
  assert.equal(performCare(shift,patient.room,'chart').ok,true);
  assert.ok(patient.flowsheet.length>=3);
  assert.equal(performCare(shift,patient.room,'handoff').ok,false);
  for(const [key]of NOTE_FIELDS) recordNote(shift,patient.room,key,`Fictional ${key}: actual findings / response and pending review.`);
  assert.equal(performCare(shift,patient.room,'handoff').ok,true);
  assert.ok(patient.tasks.find(t=>t.kind==='handoff').done);
  assert.match(exportShift(shift),/completeness only/);
  assert.match(exportShift(shift),/PENDING CARE/);
});

test('urgent notification works before report, chart review or routine examinations', () => {
  const {shift,patient}=caseState('evd-rounds');
  change(shift,patient);
  assert.equal(performCare(shift,patient.room,'notify').ok,true);
  assert.equal(patient.reportRead,false);
  assert.equal(patient.ordersRead,false);
  assert.equal(patient.assessed,false);
  assert.equal(patient.notified,true);
});
test('blank reasoning / medication selections do not count as unsafe choices',()=>{
  const {shift,patient}=caseState('cabg-receiving');
  performCare(shift,patient.room,'orders');
  assert.equal(performCare(shift,patient.room,'meds').ok,false);
  change(shift,patient);
  assert.equal(performCare(shift,patient.room,'respond').ok,false);
  assert.equal(shift.safetyStops,0);
});

for(const pod of Object.keys(FLOOR_PODS)) test(`${pod}: admission needs actual room supplies and receiving checks`,()=>{
  const shift=createShift({pod,level:2,seed:418});
  assert.equal(shift.patients.length,1);
  assert.equal(acceptAdmission(shift,['identity','support','handoff']).ok,false);
  assert.equal(installAdmissionSupply(shift,'monitor').ok,false);
  advanceShift(shift,21); receiveAdmissionReport(shift);
  const info=ADMISSIONS[pod];
  assert.equal(installAdmissionSupply(shift,info.items[0]).ok,false);
  packSupplies(shift,info.items);
  if(info.procedure) checkProcedure(shift,info.procedure,correctEquipment(info.procedure));
  for(const id of [...info.items,...(info.procedure?[PROCEDURES[info.procedure].item]:[])]) assert.equal(installAdmissionSupply(shift,id).ok,true);
  assert.equal(acceptAdmission(shift,['identity','support']).ok,false);
  assert.equal(shift.patients.length,1);
  assert.equal(acceptAdmission(shift,['identity','support','handoff']).ok,true);
  assert.equal(shift.patients.length,2);
  assert.equal(shift.patients.at(-1).profile,info.profile);
  assert.notEqual(shift.patients[0].room,shift.patients[1].room);
  assert.equal(acceptAdmission(shift,['identity','support','handoff']).ok,false);
});
test('procedure trays require the complete safe set; practice cannot create inventory',()=>{
  const shift=createShift({seed:12});
  for(const kind of Object.keys(PROCEDURES)) {
    const correct=correctEquipment(kind), unsafe=PROCEDURES[kind].options.find(o=>!o[2])[0];
    assert.equal(checkProcedure(shift,kind,correct.slice(1)).ok,false);
    assert.equal(checkProcedure(shift,kind,[...correct,unsafe]).safety,true);
    assert.equal(shift.inventory[PROCEDURES[kind].item]||0,0);
    assert.equal(checkProcedure(shift,kind,correct,{practice:true}).ok,true);
    assert.equal(shift.inventory[PROCEDURES[kind].item]||0,0);
    assert.equal(checkProcedure(shift,kind,correct,{timedOut:true}).ok,true);
    assert.equal(shift.inventory[PROCEDURES[kind].item],1);
  }
});
test('the cart capacity cannot be bypassed by repeated packs or trays',()=>{
  const shift=createShift({seed:89});
  const ids=['care','labs','monitor','airway','pump','resus','drain','neuro'];
  assert.equal(packSupplies(shift,ids).ok,true);
  assert.equal(packSupplies(shift,['care']).ok,false);
  assert.equal(checkProcedure(shift,'aline',correctEquipment('aline')).ok,false);
  returnSupplies(shift);
  assert.deepEqual(shift.inventory,{});
});
test('hourly neuro checks recur from their actual assessment time; missed windows remain visible',()=>{
  const {shift,patient}=caseState('evd-rounds');
  advanceShift(shift,135);
  const missed=patient.tasks.find(t=>t.kind==='neuro');
  assert.equal(missed.lateWindows,2);
  const actual=shift.elapsed;
  performCare(shift,patient.room,'assess');
  assert.equal(missed.completedAt,actual);
  assert.equal(patient.tasks.find(t=>t.kind==='neuro'&&!t.done).due,actual+60);
  const count=patient.tasks.filter(t=>t.kind==='neuro').length;
  performCare(shift,patient.room,'assess');
  assert.equal(patient.tasks.filter(t=>t.kind==='neuro').length,count);
  assert.ok(shiftSummary(shift).missedWindows>=2);
});
test('a turn hold records an actual clinical reason without completing or silently extending care',()=>{
  const {shift,patient}=caseState('cabg-receiving');
  advanceShift(shift,61);
  const turn=patient.tasks.find(t=>t.kind==='turn'&&!t.done);
  assert.equal(performCare(shift,patient.room,'turn').ok,false);
  assert.equal(performCare(shift,patient.room,'hold-turn','convenience').ok,false);
  assert.equal(performCare(shift,patient.room,'hold-turn','instability').ok,true);
  const recheck=patient.turnHold.reassessAt;
  assert.equal(turn.done,false);
  assert.equal(performCare(shift,patient.room,'hold-turn','instability').ok,false);
  assert.equal(patient.turnHold.reassessAt,recheck);
});
test('urine documentation uses an observed interval / appearance and rejects blank or non-finite values',()=>{
  const {shift,patient}=caseState('sled-rounds');
  advanceShift(shift,61);
  for(const volume of ['',Infinity,'not a number',patient.current.UO+15]) assert.equal(performCare(shift,patient.room,'round',{volume,appearance:'amber'}).ok,false);
  assert.equal(performCare(shift,patient.room,'round',{volume:patient.current.UO,appearance:'yellow'}).ok,false);
  assert.equal(performCare(shift,patient.room,'round',{volume:patient.current.UO,appearance:'amber'}).ok,true);
  assert.match(patient.observations.at(-1).text,/Measured interval urine/);
});
test('a pre-change laboratory sample cannot become a post-change result or return immediately',()=>{
  const {shift,patient}=caseState('cabg-receiving');
  performCare(shift,patient.room,'orders'); packSupplies(shift,['labs']);
  // Collection is allowed within the displayed ten-minute window. Defer the
  // scripted change only in this test fixture to exercise sample chronology.
  patient.eventAt=70;
  advanceShift(shift,50-shift.elapsed);
  assert.equal(performCare(shift,patient.room,'labs').ok,true);
  assert.equal(patient.labResult,null);
  assert.equal(performCare(shift,patient.room,'labs').ok,false);
  advanceShift(shift,20);
  assert.equal(patient.eventFired,true);
  assert.match(patient.labResult.text,/pre-change sample/);
  assert.ok(patient.labResult.at>=patient.labResult.collectedAt+20);
});
test('NMB readiness and TOF documentation cannot substitute for analgesia / sedation or clinical reassessment',()=>{
  const {shift,patient,model}=caseState('ards-nmba');
  performCare(shift,patient.room,'orders'); change(shift,patient);
  performCare(shift,patient.room,'assess');performCare(shift,patient.room,'device');
  assert.equal(performCare(shift,patient.room,'respond',model.correct).ok,false);
  performCare(shift,patient.room,'meds',model.med.correct);
  assert.equal(performCare(shift,patient.room,'tof',{site:'left-ulnar',current:50,twitches:4,context:'sedated'}).ok,false);
  assert.equal(patient.tofBaseline,false);
  assert.equal(performCare(shift,patient.room,'tof',{site:'left-ulnar',current:50,twitches:4,context:'blockade-only'}).ok,true);
  assert.equal(performCare(shift,patient.room,'respond',model.correct).ok,true);
  assert.equal(performCare(shift,patient.room,'tof',{site:'left-ulnar',current:50,twitches:2,context:'blockade-only'}).ok,false);
  advanceShift(shift,10);performCare(shift,patient.room,'assess');
  assert.equal(performCare(shift,patient.room,'tof',{site:'right-ulnar',current:50,twitches:2,context:'blockade-only'}).ok,false);
  assert.equal(performCare(shift,patient.room,'tof',{site:'left-ulnar',current:50,twitches:2,context:'blockade-only'}).ok,true);
});
test('an unresolved hemorrhage / SLED event never silently reduces close observations to hourly',()=>{
  for(const id of ['cabg-receiving','variceal-bleed','sled-rounds']){
    const {shift,patient}=caseState(id);
    advanceShift(shift,100);
    performCare(shift,patient.room,'close-check');
    assert.equal(patient.tasks.find(t=>t.kind==='close-check'&&!t.done).due,100+15);
  }
});
test('the scheduled clock preserves pending work and prevents care at frozen timestamps',()=>{
  const shift=createShift({seed:24});
  advanceShift(shift,Infinity);assert.equal(shift.elapsed,0);
  advanceShift(shift,-20);assert.equal(shift.elapsed,0);
  advanceShift(shift,10000);assert.equal(shift.elapsed,shift.duration);
  assert.equal(shift.paused,true);
  assert.equal(performCare(shift,shift.patients[0].room,'assess').ok,false);
  assert.ok(endShift(shift).pending.length>0);
  const old=shift.elapsed;advanceShift(shift,20);assert.equal(shift.elapsed,old);
  assert.equal(performCare(shift,shift.patients[0].room,'chart').ok,false);
  assert.equal(packSupplies(shift,['care']).ok,false);
});
test('saving / restoring preserves notes, measurements, pending tasks and event chronology',()=>{
  const {shift,patient}=caseState('evd-rounds');
  performCare(shift,patient.room,'assess');
  recordNote(shift,patient.room,'s','Fictional current concern.');
  const restored=restoreShift(JSON.parse(JSON.stringify(shift)));
  assert.deepEqual(restored,shift);
  assert.equal(restoreShift({...shift,version:1}),null);
  assert.equal(restoreShift({...shift,elapsed:NaN}),null);
  const bad=JSON.parse(JSON.stringify(shift));bad.patients[1].room=bad.patients[0].room;
  assert.equal(restoreShift(bad),null);
});
test('new care invalidates an old handoff review while preserving the authored note',()=>{
  const {shift,patient}=caseState('cabg-recovery');
  for(const [key]of NOTE_FIELDS)recordNote(shift,patient.room,key,'Fictional reviewed field.');
  assert.equal(performCare(shift,patient.room,'handoff').ok,true);
  performCare(shift,patient.room,'assess');
  assert.equal(patient.tasks.find(t=>t.kind==='handoff').done,false);
  assert.equal(patient.note.s,'Fictional reviewed field.');
  assert.equal(performCare(shift,patient.room,'handoff').ok,false);
});
test('every patient source ID resolves and case options / vitals are internally valid',()=>{
  const sources=new Set(CLINICAL_SOURCES.map(s=>s.id));
  for(const p of SHIFT_PATIENTS){
    assert.ok(p.choices.some(([id])=>id===p.correct),p.id);
    assert.ok(p.med.choices.some(([id])=>id===p.med.correct),p.id);
    assert.ok(p.sources.every(id=>sources.has(id)),p.id);
    for(const state of ['baseline','changed','followup'])assert.ok(Object.values(p[state]).every(Number.isFinite),p.id);
    if(p.neuro)assert.ok(p.exam.length>150,p.id);
  }
  assert.equal(clockAt(720),'07:00');
});
test('every bed, computer and shared destination has a walkable route without crossing walls',()=>{
  const start=createShift({seed:22}).player;
  const goals=[{x:235,y:425},{x:700,y:540},{x:1100,y:420}];
  for(let room=1;room<=12;room++)goals.push(roomGeometry(room).bed,roomGeometry(room).computer);
  for(const goal of goals){
    const route=routeBetween(start,goal);assert.ok(route.length,JSON.stringify(goal));
    for(let i=0;i<route.length;i++){
      const point=route[i];assert.ok(walkAllowed(point.x,point.y));
      if(i){const prev=route[i-1];assert.ok(walkAllowed((prev.x+point.x)/2,(prev.y+point.y)/2),'route cannot cross a wall');}
    }
    assert.ok(Math.hypot(route.at(-1).x-goal.x,route.at(-1).y-goal.y)<30);
  }
});
test('movement follows valid routes, normalizes diagonals and cannot tunnel through a wall',()=>{
  const route=routeBetween({x:1000,y:465},roomGeometry(12).computer),player={x:1000,y:465};
  for(const point of route){
    let attempts=0;
    while(Math.hypot(point.x-player.x,point.y-player.y)>1&&attempts++<100){const distance=Math.hypot(point.x-player.x,point.y-player.y);moveNurse(player,point.x-player.x,point.y-player.y,Math.min(0.016,distance/235));}
    assert.ok(attempts<100,'movement must reach the route point');
  }
  const before={x:400,y:400},diagonal={...before};moveNurse(diagonal,1,1,0.04);
  assert.ok(Math.hypot(diagonal.x-before.x,diagonal.y-before.y)<=235*0.04+0.001);
  const atWall={x:450,y:480};for(let i=0;i<100;i++)moveNurse(atWall,1,0,5);
  assert.ok(atWall.x<470-8);
  const targets=interactionTargets(createShift({seed:22}));
  assert.ok(targets.some(t=>t.kind==='supply')&&targets.some(t=>t.kind==='computer'));
});
