import test from 'node:test';
import assert from 'node:assert/strict';
import {POCKET_ORDER,POCKET_PARTS,POCKET_FIT,POCKET_PRIME_PATH,POCKET_ASSESS,POCKET_RECHECK_SECONDS,createPocketRun,pocketAction,advancePocket,pocketObjective,pocketSummary,restorePocketRun} from '../dist/pocket-engine.js';
function assessed(){const s=createPocketRun({seed:22});for(const x of POCKET_ASSESS)pocketAction(s,'assess',x.id);pocketAction(s,'help');return s;}
function support(){const s=assessed();pocketAction(s,'order');pocketAction(s,'label','match');for(const id of ['bag','pump','access'])pocketAction(s,'trace',id);pocketAction(s,'pump','match');assert.equal(pocketAction(s,'start-support').ok,true);return s;}
function fitted(s){for(const id of POCKET_FIT)assert.equal(pocketAction(s,'fit',id).ok,true);}
function traced(s){for(const id of POCKET_PRIME_PATH)assert.equal(pocketAction(s,'prime-trace',id).ok,true);}
function deaired(s){fitted(s);traced(s);assert.equal(pocketAction(s,'prime').ok,true);for(let i=0;i<6;i++)pocketAction(s,'flush-tap');assert.equal(s.aline.primeStage,'done');}
function pressurized(s){deaired(s);pocketAction(s,'cap');for(let i=0;i<3;i++)pocketAction(s,'pressure');}
function setup(s){pressurized(s);pocketAction(s,'level',50);pocketAction(s,'stopcock','air');pocketAction(s,'zero');pocketAction(s,'stopcock','monitor');assert.equal(pocketAction(s,'insert-team').ok,true);for(const id of ['waveform','site','perfusion'])pocketAction(s,'line-check',id);}
test('new episode is a specific older adult case with an individualized order and separate state',()=>{const s=createPocketRun();assert.equal(s.patient.age,78);assert.equal(s.patient.MAP,54);assert.equal(POCKET_ORDER.mapTarget,65);assert.equal(POCKET_ORDER.concentration,'16 mcg/mL');assert.match(s.patient.context,/initial fluid\/responsiveness review/);assert.equal('arcade'in s,false);assert.equal(pocketObjective(s).task,'assess');});
test('urgent help is available before assessment or medication checks and never changes pressure',()=>{const s=createPocketRun();assert.equal(pocketAction(s,'help').ok,true);assert.equal(s.help,true);assert.equal(s.assess.length,0);assert.equal(s.patient.MAP,54);const events=s.history.length;pocketAction(s,'help');assert.equal(s.history.length,events);});
test('four assessment hotspots include airway/breathing and reject unknown / duplicate work',()=>{const s=createPocketRun();assert.equal(POCKET_ASSESS.length,4);assert.equal(pocketAction(s,'assess','urine-now').ok,false);for(const x of POCKET_ASSESS)assert.equal(pocketAction(s,'assess',x.id).ok,true);assert.equal(s.assess.length,4);assert.match(POCKET_ASSESS.find(x=>x.id==='breathing').finding,/air movement/);const before=s.history.length;pocketAction(s,'assess','mental');assert.equal(s.assess.length,4);assert.equal(s.history.length,before);assert.equal(pocketObjective(s).task,'help');});
test('vasopressor support is blocked without all assessment domains/help, order, label, IV trace and pump',()=>{const s=createPocketRun();assert.equal(pocketAction(s,'start-support').ok,false);pocketAction(s,'order');assert.equal(pocketAction(s,'label','wrong-patient').ok,false);assert.equal(s.med.label,false);pocketAction(s,'label','match');assert.equal(pocketAction(s,'trace','pump').ok,false);assert.deepEqual(s.med.line,[]);pocketAction(s,'trace','bag');pocketAction(s,'trace','pump');assert.equal(pocketAction(s,'trace','arterial').ok,false);assert.equal(s.med.line.length,2);pocketAction(s,'trace','access');assert.equal(pocketAction(s,'pump','unprescribed').ok,false);pocketAction(s,'pump','match');assert.equal(pocketAction(s,'start-support').ok,false);for(const x of POCKET_ASSESS.filter(x=>x.id!=='breathing'))pocketAction(s,'assess',x.id);pocketAction(s,'help');assert.equal(pocketAction(s,'start-support').ok,false);pocketAction(s,'assess','breathing');assert.equal(pocketAction(s,'start-support').ok,true);});
test('needed support never waits for an A-line and starting it does not invent immediate recovery',()=>{const s=support();assert.equal(s.aline.parts.length,0);assert.equal(s.med.started,true);assert.equal(s.recheck.left,POCKET_RECHECK_SECONDS);assert.equal(s.patient.MAP,54);assert.equal(s.patient.UO,18);assert.equal(pocketObjective(s).task,'fit');});
test('physical setup enforces fitting order and blocks retired word docks / bubble shortcuts',()=>{
  const s=support();assert.equal(pocketAction(s,'prime').ok,false);
  assert.equal(pocketAction(s,'fit','cable').ok,false);assert.deepEqual(s.aline.fit,[]);
  assert.equal(pocketAction(s,'part','transducer').ok,false);
  assert.equal(pocketAction(s,'fit','saline').ok,true);
  assert.equal(pocketAction(s,'fit','tubing').ok,false);
  for(const id of ['wrap','tubing','cable'])assert.equal(pocketAction(s,'fit',id).ok,true);
  assert.equal(pocketAction(s,'prime').ok,false);
  assert.equal(pocketAction(s,'bubble','a').ok,false);
  assert.equal(pocketAction(s,'pressure').ok,false);assert.equal(pocketAction(s,'zero').ok,false);
  assert.deepEqual([...s.aline.parts].sort(),POCKET_PARTS.map(x=>x.id).sort());
});
test('continuous priming requires a complete connected path and clears vent before remaining tubing',()=>{
  const s=support();fitted(s);assert.equal(pocketAction(s,'prime-trace','waste').ok,false);
  assert.equal(pocketAction(s,'flush-tap').ok,false);pocketAction(s,'prime-trace','bag');
  assert.equal(pocketAction(s,'prime').ok,false);pocketAction(s,'prime-trace','transducer');pocketAction(s,'prime-trace','waste');
  assert.equal(pocketAction(s,'prime').ok,true);
  assert.equal(pocketAction(s,'pressure').ok,false);assert.equal(pocketAction(s,'cap').ok,false);
  for(let i=0;i<3;i++)pocketAction(s,'flush-tap');
  assert.equal(s.aline.primeStage,'tubing');assert.equal(s.aline.flow,0);assert.deepEqual(s.aline.bubbles,['a','b','c']);
  pocketAction(s,'flush-tap');assert.deepEqual(s.aline.bubbles,['b','c']);
  pocketAction(s,'flush-tap');assert.deepEqual(s.aline.bubbles,['c']);assert.equal(pocketAction(s,'pressure').ok,false);
  pocketAction(s,'flush-tap');assert.equal(s.aline.primeStage,'done');assert.deepEqual(s.aline.bubbles,[]);
  assert.equal(pocketAction(s,'pressure').ok,false);assert.equal(pocketAction(s,'cap').ok,true);assert.equal(pocketAction(s,'pressure').ok,true);
});
test('zeroing requires air reference with isolated patient; restored capped monitoring gates insertion',()=>{
  const s=support();pressurized(s);
  assert.equal(pocketAction(s,'level',NaN).ok,false);assert.equal(pocketAction(s,'stopcock','air').ok,false);
  pocketAction(s,'level',80);assert.equal(pocketAction(s,'zero').ok,false);
  pocketAction(s,'level',50);assert.equal(pocketAction(s,'zero').ok,false);assert.equal(pocketAction(s,'stopcock','monitor').ok,false);
  assert.equal(pocketAction(s,'stopcock','air').ok,true);assert.equal(s.aline.capped,false);
  assert.equal(pocketAction(s,'zero').ok,true);assert.equal(pocketAction(s,'insert-team').ok,false);
  assert.equal(pocketObjective(s).task,'restore');assert.equal(pocketAction(s,'stopcock','monitor').ok,true);
  assert.equal(s.aline.capped,true);assert.equal(pocketAction(s,'insert-team').ok,true);
  assert.equal(s.patient.MAP,54);assert.equal(s.patient.UO,18);assert.equal(s.phase,'aline-check');
});
test('ready patient reassessment takes priority over unfinished A-line setup and preserves that work',()=>{const s=support();assert.equal(pocketAction(s,'recheck').ok,false);pocketAction(s,'fit','saline');for(let i=0;i<10;i++)advancePocket(s,2);assert.equal(s.recheck.ready,true);assert.deepEqual(s.aline.fit,['saline']);assert.equal(pocketObjective(s).task,'recheck');assert.equal(pocketObjective(s).target,'patient');assert.equal(pocketAction(s,'recheck').ok,true);assert.equal(s.patient.MAP,66);assert.equal(s.patient.UO,18);assert.equal(s.patient.uoInterval,'previous hour');assert.deepEqual(s.aline.fit,['saline']);assert.equal(pocketObjective(s).task,'fit');assert.equal(pocketAction(s,'handoff','continue').ok,false);assert.equal(s.phase,'aline');setup(s);assert.equal(s.phase,'handoff');});
test('a complete monitoring setup cannot replace actual delayed patient reassessment',()=>{const s=support();setup(s);assert.equal(s.phase,'waiting');assert.equal(s.patient.MAP,54);assert.equal(pocketAction(s,'handoff','continue').ok,false);pocketAction(s,'skip');assert.equal(s.phase,'recheck');assert.equal(s.recheck.done,false);assert.equal(s.patient.MAP,54);pocketAction(s,'recheck');assert.equal(s.patient.MAP,66);assert.equal(pocketAction(s,'handoff','resolved').ok,false);assert.equal(s.finished,false);assert.equal(pocketAction(s,'handoff','continue').ok,true);assert.equal(pocketSummary(s).complete,true);assert.match(pocketSummary(s).pending,/Continue prescribed support/);});
test('pause stops the response countdown and explicit time jump does not obtain observations',()=>{const s=support();s.paused=true;advancePocket(s,2);assert.equal(s.recheck.left,POCKET_RECHECK_SECONDS);assert.equal(s.secondsPlayed,0);s.paused=false;advancePocket(s,2);assert.equal(s.recheck.left,POCKET_RECHECK_SECONDS-2);pocketAction(s,'skip');assert.equal(s.recheck.ready,true);assert.equal(s.recheck.done,false);assert.equal(s.patient.MAP,54);assert.match(s.feedback,/Time jump/);});
test('successful repeat gestures cannot create duplicate components, trace points or completion events',()=>{const s=support();for(let i=0;i<4;i++)pocketAction(s,'fit','saline');assert.deepEqual(s.aline.fit,['saline']);assert.equal(s.med.line.length,3);const before=s.history.length;pocketAction(s,'start-support');assert.equal(s.history.length,before);setup(s);pocketAction(s,'skip');pocketAction(s,'recheck');pocketAction(s,'handoff','continue');const ended=structuredClone(s);assert.equal(pocketAction(s,'start-support').ok,false);advancePocket(s,2);assert.deepEqual(s.patient,ended.patient);assert.deepEqual(s.aline,ended.aline);assert.equal(s.history.length,ended.history.length);});
test('replay variations shuffle touch layouts while preserving the clinical prescription and values',()=>{const orders=new Set();for(let seed=1;seed<8;seed++){const s=createPocketRun({seed});orders.add(s.variation.parts.join(','));assert.deepEqual([...s.variation.parts].sort(),POCKET_PARTS.map(x=>x.id).sort());assert.equal(s.patient.MAP,54);assert.equal(s.med.started,false);}assert.ok(orders.size>3);assert.equal(POCKET_ORDER.mapTarget,65);});
test('new save roundtrips and rejects legacy or malformed objects',()=>{const s=support();assert.deepEqual(restorePocketRun(JSON.parse(JSON.stringify(s))),s);assert.equal(restorePocketRun({version:3,patients:[]}),null);assert.equal(restorePocketRun({...s,med:{...s.med,line:null}}),null);assert.equal(restorePocketRun({...s,patient:{...s.patient,MAP:NaN}}),null);});
test('handoff retains valid monitoring alignment and repeat assessments use the latest obtained findings',()=>{const s=support();setup(s);pocketAction(s,'skip');pocketAction(s,'recheck');assert.match(pocketAction(s,'assess','mental').text,/answers more readily/);assert.match(pocketAction(s,'assess','pressure').text,/MAP 66/);pocketAction(s,'level',90);assert.equal(pocketSummary(s).lineReady,false);assert.equal(pocketAction(s,'handoff','continue').ok,false);assert.equal(pocketObjective(s).task,'level');pocketAction(s,'level',50);assert.equal(pocketSummary(s).lineReady,true);assert.equal(pocketAction(s,'handoff','continue').ok,true);});

test('release, cancellation, pause and saved partial flow never manufacture another increment',()=>{
  const s=support();fitted(s);traced(s);pocketAction(s,'prime');
  assert.equal(pocketAction(s,'flush',Infinity).ok,false);assert.equal(pocketAction(s,'flush',0).ok,false);
  assert.equal(pocketAction(s,'flush',.1).ok,true);assert.equal(s.aline.flow,5);
  // A delayed animation callback is clamped; no held gesture creates an unbounded jump.
  pocketAction(s,'flush',20);assert.equal(s.aline.flow,17.5);
  const saved=restorePocketRun(JSON.parse(JSON.stringify(s)));assert.equal(saved.aline.flow,17.5);
  // No flush action after release means normal simulation time has no de-airing effect.
  advancePocket(saved,2);assert.equal(saved.aline.flow,17.5);
  saved.paused=true;assert.equal(pocketAction(saved,'flush',.25).ok,false);assert.equal(pocketAction(saved,'flush-tap').ok,false);
  assert.equal(saved.aline.flow,17.5);saved.paused=false;pocketAction(saved,'flush',.05);assert.equal(saved.aline.flow,20);
});
test('all physical setup actions preserve obtained patient values and cannot substitute for assessment',()=>{
  const s=createPocketRun();assert.equal(pocketAction(s,'fit','saline').ok,false);
  const active=support(),patient=structuredClone(active.patient);setup(active);assert.deepEqual(active.patient,patient);
  assert.equal(pocketAction(active,'recheck').ok,false);assert.equal(pocketAction(active,'handoff','continue').ok,false);
});
test('reopening the reference interrupts monitoring and requires a new zero and closure',()=>{
  const s=support();setup(s);assert.equal(pocketSummary(s).lineReady,true);
  pocketAction(s,'stopcock','air');assert.equal(s.aline.zero,false);assert.equal(pocketSummary(s).lineReady,false);
  assert.equal(pocketAction(s,'stopcock','monitor').ok,false);assert.equal(pocketAction(s,'flush-tap').ok,false);
  pocketAction(s,'zero');pocketAction(s,'stopcock','monitor');assert.equal(pocketSummary(s).lineReady,true);
});
function legacy(s){const old=structuredClone(s);for(const key of ['setupVersion','fit','path','primeStage','flow','capped','stopcock'])delete old.aline[key];return old;}
test('v0.6 partial components and accepted priming are migrated without clearing progress',()=>{
  const old=legacy(support());old.aline.parts=['saline','pressure-bag','transducer'];
  const migrated=restorePocketRun(old);assert.deepEqual(migrated.aline.parts,['saline','pressure-bag','transducer']);assert.deepEqual(migrated.aline.fit,['saline','wrap']);
  assert.equal(pocketObjective(migrated).task,'fit');assert.equal(pocketAction(migrated,'fit','tubing').ok,true);
  const primed=legacy(support());primed.aline.parts=POCKET_PARTS.map(x=>x.id);primed.aline.primed=true;primed.aline.bubbles=['b','c'];
  const restored=restorePocketRun(primed);assert.equal(restored.aline.primeStage,'tubing');assert.equal(restored.aline.flow,34);assert.deepEqual(restored.aline.bubbles,['b','c']);
  pocketAction(restored,'flush-tap');pocketAction(restored,'flush-tap');assert.equal(restored.aline.primeStage,'done');
  const outOfOrder=legacy(support());outOfOrder.aline.parts=POCKET_PARTS.map(x=>x.id);outOfOrder.aline.primed=true;outOfOrder.aline.bubbles=['a','b'];
  const preserved=restorePocketRun(outOfOrder);pocketAction(preserved,'flush-tap');assert.deepEqual(preserved.aline.bubbles,['b']);
});
test('v0.6 zero and completed episodes retain clinical and monitoring progress',()=>{
  const s=support();setup(s);const preInsertion=legacy(s);preInsertion.aline.teamInserted=false;preInsertion.aline.checks=[];
  const restored=restorePocketRun(preInsertion);assert.equal(restored.aline.zero,true);assert.equal(restored.aline.stopcock,'air');
  assert.equal(pocketObjective(restored).task,'restore');pocketAction(restored,'stopcock','monitor');assert.equal(pocketAction(restored,'insert-team').ok,true);
  pocketAction(s,'skip');pocketAction(s,'recheck');pocketAction(s,'handoff','continue');const old=legacy(s),done=restorePocketRun(old);
  assert.equal(done.finished,true);assert.equal(done.aline.stopcock,'monitor');assert.equal(done.aline.capped,true);assert.equal(pocketSummary(done).lineReady,true);assert.equal(pocketObjective(done).task,'replay');
  assert.equal(done.patient.UO,18);assert.deepEqual(done.history,s.history);
});
test('malformed new physical setup state is rejected rather than inferred as completed legacy work',()=>{
  const s=support();assert.equal(restorePocketRun({...s,aline:{...s.aline,fit:null}}),null);
  assert.equal(restorePocketRun({...s,aline:{...s.aline,path:['waste']}}),null);
  assert.equal(restorePocketRun({...s,aline:{...s.aline,flow:Infinity}}),null);
  assert.equal(restorePocketRun({...s,aline:{...s.aline,stopcock:'patient-open'}}),null);
});

test('waveform checks require valid monitoring while site and distal reassessment remain available',()=>{
  const s=support();pressurized(s);pocketAction(s,'level',50);pocketAction(s,'stopcock','air');pocketAction(s,'zero');pocketAction(s,'stopcock','monitor');pocketAction(s,'insert-team');
  pocketAction(s,'stopcock','air');
  assert.equal(pocketAction(s,'line-check','waveform').ok,false);assert.equal(s.aline.checks.includes('waveform'),false);
  assert.equal(pocketAction(s,'line-check','site').ok,true);assert.equal(pocketAction(s,'line-check','perfusion').ok,true);
  pocketAction(s,'zero');pocketAction(s,'stopcock','monitor');pocketAction(s,'level',80);
  assert.equal(pocketAction(s,'line-check','waveform').ok,false);pocketAction(s,'level',50);
  assert.equal(pocketAction(s,'line-check','waveform').ok,true);assert.equal(pocketSummary(s).lineReady,true);
});
