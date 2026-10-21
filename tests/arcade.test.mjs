import test from 'node:test';
import assert from 'node:assert/strict';
import {createShift,advanceShift,performCare,profileOf,restoreShift,endShift,acceptAdmission} from '../dist/shift-engine.js';
import {ensureArcade,award,activateBoost,updateArcade,answerPhone,revealClue,packOne,removeOne,assessIV,chooseAccessPlan,pickFlush,startIV,ivStep,startALine,alineStep,requestPurge,collectPurge,deliverPurge,missionFor,ALINE_PARTS} from '../dist/shift-arcade.js';
import {interactionTargets,routeBetween,walkAllowed,nearestTarget,moveNurse,followRoute} from '../dist/shift-map.js';
function initial(seed=23){const s=createShift({level:2,pod:'delta',seed});ensureArcade(s,{fresh:true});return s;}
function baseline(s){const p=s.patients[0];performCare(s,p.room,'report');for(const id of ['patient','monitor','device'])revealClue(s,p.room,id);performCare(s,p.room,'orders');performCare(s,p.room,'meds',profileOf(p).med.correct);updateArcade(s);return p;}
function impella(){for(let seed=1;seed<100;seed++){const s=initial(seed);if(profileOf(s.patients[0]).icon==='impella')return s;}throw Error('No seeded Impella assignment');}
function lineParts(s,practice=false){startALine(s,practice);for(const[id]of ALINE_PARTS)alineStep(s,'part',id);alineStep(s,'prime');for(const b of ['one','two','three'])alineStep(s,'bubble',b);for(let i=0;i<3;i++)alineStep(s,'pump');alineStep(s,'level',50);alineStep(s,'zero');}

test('legacy saves keep notes and clinical state when arcade objectives are added',()=>{
 const s=createShift({seed:4});s.patients[0].note.s='Keep my authored note';const old=structuredClone(s);
 ensureArcade(s);assert.deepEqual(s.patients,old.patients);assert.equal(s.elapsed,old.elapsed);
 const restored=restoreShift(JSON.parse(JSON.stringify(s)));assert.equal(restored.patients[0].note.s,'Keep my authored note');assert.equal(restored.arcade.boosts,3);
});
test('three speed boosts expire independently of clinical time and cannot be farmed',()=>{
 const s=initial();for(let i=0;i<3;i++){assert.equal(activateBoost(s).ok,true);assert.equal(activateBoost(s).ok,false);updateArcade(s,8);}
 assert.equal(s.arcade.boosts,0);assert.equal(activateBoost(s).ok,false);assert.equal(s.elapsed,0);s.paused=true;assert.equal(activateBoost(s).ok,false);
 const before=s.arcade.score;award(s,'same','Done',20);award(s,'same','Again',20);assert.equal(s.arcade.score,before+20);
});
test('patient clues complete a real assessment, reveal a new objective and award once',()=>{
 const s=initial(),p=s.patients[0];performCare(s,p.room,'report');
 revealClue(s,p.room,'patient');assert.equal(p.assessed,false);revealClue(s,p.room,'monitor');assert.equal(p.assessed,false);
 const r=revealClue(s,p.room,'device');assert.equal(r.points,40);assert.ok(p.assessed&&p.deviceChecked);assert.equal(missionFor(s).kind,'computer');
 const score=s.arcade.score,observations=p.observations.length;revealClue(s,p.room,'device');assert.equal(s.arcade.score,score);assert.equal(p.observations.length,observations);
});
test('a repeated early follow-up clue remains usable when the actual response interval arrives',()=>{
 const s=impella(),p=baseline(s);advanceShift(s,p.eventAt-s.elapsed+1);performCare(s,p.room,'notify');
 for(const id of ['patient','monitor','device'])revealClue(s,p.room,id);
 assert.equal(performCare(s,p.room,'respond',profileOf(p).correct).ok,true);const old={...p.current};
 for(const id of ['patient','monitor','device'])revealClue(s,p.room,id);
 assert.equal(p.reassessed,false);assert.deepEqual(p.current,old);
 advanceShift(s,Math.max(.1,p.followupAt-s.elapsed+.1));revealClue(s,p.room,'patient');assert.equal(p.reassessed,true);assert.deepEqual(p.current,profileOf(p).followup);
});
test('IV access challenge requires assessment, a plan, supplies and actual line checks',()=>{
 const s=initial(),p=baseline(s);assert.equal(s.arcade.iv.room,p.room);assert.equal(startIV(s).ok,false);
 assessIV(s);assert.equal(startIV(s).ok,false);chooseAccessPlan(s,'iv');assert.equal(startIV(s).ok,false);
 packOne(s,'iv-kit');assert.equal(pickFlush(s,'wrong-patient').ok,false);assert.equal(s.inventory.flush,undefined);assert.equal(pickFlush(s,'matched').ok,true);assert.equal(startIV(s).ok,true);
 assert.equal(ivStep(s,'vessel','B').ok,false);ivStep(s,'compress');assert.equal(ivStep(s,'vessel','A').ok,false);ivStep(s,'vessel','B');
 assert.equal(ivStep(s,'advance').ok,false);
 for(let i=0;i<4;i++){ivStep(s,'track');assert.equal(ivStep(s,'advance').ok,true);if(i<3)assert.equal(ivStep(s,'advance').ok,false);}
 assert.equal(ivStep(s,'finish').ok,false);for(const id of ['site','patency','secure'])ivStep(s,'check',id);
 const r=ivStep(s,'finish');assert.equal(r.points,65);assert.equal(s.inventory['iv-kit'],0);assert.equal(s.inventory.flush,0);assert.equal(s.arcade.iv.state,'done');
 const score=s.arcade.score;assert.equal(ivStep(s,'finish').ok,false);assert.equal(s.arcade.score,score);
});
test('labs-first is a real branch: it consumes a specimen pack but does not mark replacement IV complete',()=>{
 const s=initial(),p=baseline(s);assessIV(s);chooseAccessPlan(s,'labs');assert.match(missionFor(s).title,/labs/i);
 packOne(s,'labs');assert.equal(missionFor(s).kind,'bed');assert.equal(performCare(s,p.room,'labs').ok,true);s.arcade.iv.labsDone=true;
 assert.equal(s.inventory.labs,0);assert.equal(s.arcade.iv.state,'noticed');assert.match(missionFor(s).title,/Supply/);
});
test('gray bin capacity covers new supplies, Pyxis pickups and completed procedure trays',()=>{
 const s=initial();baseline(s);assessIV(s);for(let i=0;i<8;i++)assert.equal(packOne(s,'iv-kit').ok,true);
 assert.equal(packOne(s,'care').ok,false);assert.equal(pickFlush(s,'matched').ok,false);
 lineParts(s);assert.equal(alineStep(s,'finish').ok,false);removeOne(s,'iv-kit');assert.equal(alineStep(s,'finish').ok,true);
 assert.equal(Object.values(s.inventory).reduce((a,b)=>a+b,0),8);
});
test('A-line setup rejects incomplete / air-filled / unlevelled zeroing and has no practice inventory reward',()=>{
 const s=initial();startALine(s,true);assert.equal(alineStep(s,'prime').ok,false);assert.equal(alineStep(s,'zero').ok,false);
 for(const[id]of ALINE_PARTS)alineStep(s,'part',id);alineStep(s,'prime');assert.equal(alineStep(s,'zero').ok,false);
 for(const b of ['one','two','three'])alineStep(s,'bubble',b);assert.equal(alineStep(s,'zero').ok,false);for(let i=0;i<3;i++)alineStep(s,'pump');alineStep(s,'level',50);alineStep(s,'zero');assert.equal(alineStep(s,'finish').ok,true);
 assert.equal(s.inventory['aline-tray'],undefined);const score=s.arcade.score;assert.equal(alineStep(s,'finish').ok,false);assert.equal(s.arcade.score,score);
});
test('returning an unused A-line tray permits rebuilding without earning duplicate points',()=>{
 const s=initial();lineParts(s);alineStep(s,'finish');const score=s.arcade.score;removeOne(s,'aline-tray');assert.equal(s.arcade.aline,null);
 lineParts(s);assert.equal(alineStep(s,'finish').ok,true);assert.equal(s.inventory['aline-tray'],1);assert.equal(s.arcade.score,score);
});
test('pharmacy request / queue / matching / correct-room handoff are separate persistent states',()=>{
 const s=impella(),p=s.patients[0];assert.equal(requestPurge(s).ok,false);performCare(s,p.room,'orders');assert.equal(requestPurge(s).ok,true);
 assert.equal(collectPurge(s,'matched').ok,false);advanceShift(s,12);updateArcade(s);assert.equal(s.arcade.pharmacy.state,'ready');
 assert.equal(collectPurge(s,'wrong-strength').ok,false);assert.equal(s.inventory['purge-bag'],undefined);assert.equal(collectPurge(s,'matched').ok,true);
 assert.equal(deliverPurge(s,p.room===1?2:1).ok,false);assert.equal(s.inventory['purge-bag'],1);
 const restored=restoreShift(JSON.parse(JSON.stringify(s)));assert.equal(restored.arcade.pharmacy.state,'collected');assert.equal(deliverPurge(restored,p.room).ok,true);assert.equal(restored.inventory['purge-bag'],0);assert.equal(restored.arcade.pharmacy.state,'delivered');
 const score=restored.arcade.score;deliverPurge(restored,p.room);assert.equal(restored.arcade.score,score);
});
test('returned pharmacy bag can be collected again without a duplicate reward',()=>{
 const s=impella();performCare(s,s.patients[0].room,'orders');requestPurge(s);advanceShift(s,12);updateArcade(s);collectPurge(s,'matched');const score=s.arcade.score;
 removeOne(s,'purge-bag');assert.equal(s.arcade.pharmacy.state,'ready');collectPurge(s,'matched');assert.equal(s.inventory['purge-bag'],1);assert.equal(s.arcade.score,score);
});
test('admission call timing varies and transport deadline never bypasses receiving readiness',()=>{
 const times=new Set();for(let seed=1;seed<8;seed++){
  const s=initial(seed);times.add(s.admission.announcedAt);assert.equal(answerPhone(s).ok,true);assert.equal(s.admission.reportRead,false);
  advanceShift(s,s.admission.announcedAt+.1);answerPhone(s);assert.equal(s.admission.reportRead,true);assert.ok(s.arcade.arrivalAt>s.elapsed);
  advanceShift(s,s.arcade.arrivalAt-s.elapsed+1);updateArcade(s);assert.equal(s.arcade.transportHeld,true);assert.equal(s.admission.accepted,false);assert.equal(acceptAdmission(s,[]).ok,false);
 }assert.ok(times.size>3);
});
test('supply and Pyxis are reachable behind the U station; interaction does not reach through its wall',()=>{
 const s=initial(),targets=interactionTargets(s);for(const kind of ['station','supply','pyxis']){
  const goal=targets.find(t=>t.kind===kind);assert.ok(routeBetween(s.player,goal).length);assert.ok(walkAllowed(goal.x,goal.y));
 }
 const supply=targets.find(t=>t.kind==='supply');assert.ok(supply.y<targets.find(t=>t.kind==='station').y);
 s.player={x:620,y:410};assert.notEqual(nearestTarget(s)?.kind,'supply');
 const base={x:400,y:600},normal={...base},boosted={...base};moveNurse(normal,1,0,.04);moveNurse(boosted,1,0,.04,1.75);assert.ok(Math.abs((boosted.x-base.x)/(normal.x-base.x)-1.75)<.001);
 const wall={x:450,y:480};for(let i=0;i<100;i++)moveNurse(wall,1,0,5,2);assert.ok(wall.x<462);
});
test('ended shifts do not generate supplies, boosts or puzzle progress',()=>{
 const s=initial();baseline(s);assessIV(s);endShift(s);assert.equal(packOne(s,'iv-kit').ok,false);assert.equal(activateBoost(s).ok,false);assert.equal(startIV(s).ok,false);assert.equal(startALine(s).ok,false);assert.equal(removeOne(s,'care').ok,false);
});

test('tap-to-walk speed survives short waypoints and lower frame rates without crossing walls',()=>{
 const route=[{x:430,y:610},{x:430,y:630},{x:450,y:630},{x:470,y:630},{x:490,y:630},{x:510,y:630}];
 const normal={x:410,y:610},smooth={...normal},boosted={...normal};const a=structuredClone(route),b=structuredClone(route),c=structuredClone(route);
 followRoute(normal,a,.25);for(let i=0;i<15;i++)followRoute(smooth,b,1/60);followRoute(boosted,c,.25,1.75);
 assert.ok(Math.hypot(normal.x-smooth.x,normal.y-smooth.y)<.001);assert.ok(boosted.x>normal.x);assert.equal(a.length,b.length);
 const lagged={x:410,y:610},sixty={...lagged};const d=routeBetween(lagged,{x:1100,y:610}),e=structuredClone(d);
 followRoute(lagged,d,1);for(let i=0;i<60;i++)followRoute(sixty,e,1/60);assert.ok(Math.hypot(lagged.x-sixty.x,lagged.y-sixty.y)<.001);
 const wall={x:450,y:480};followRoute(wall,[{x:600,y:480}],.25,2);assert.ok(wall.x<462);assert.ok(walkAllowed(wall.x,wall.y));
});
