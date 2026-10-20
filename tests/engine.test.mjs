import test from 'node:test';
import assert from 'node:assert/strict';
import {CASES,CASE_BY_ID,PODS} from '../dist/cases.js';
import {newRun,observe,act,finish,metrics,albuminVolume} from '../dist/engine.js';

test('all four pods are distinct and every case points to a real pod',()=>{
 assert.equal(PODS.length,4);assert.equal(new Set(PODS.map(p=>p.id)).size,4);
 assert.equal(CASES.length,6);
 for(const c of CASES){assert(PODS.some(p=>p.id===c.pod));assert.equal(new Set(c.actions.map(a=>a.id)).size,c.actions.length);}
});
for(const c of CASES){
 test(`${c.id}: a complete ordered care path reaches a documented handoff`,()=>{
  const r=newRun(c.id);assert.equal(finish(r).ok,false);
  observe(r,'report');observe(r,'orders');for(const o of c.assessments)observe(r,o.id);
  for(const a of c.actions.filter(a=>!a.unsafe)){const result=act(r,a.id,a.calculation?.expected);assert.equal(result.ok,true,`${a.id}: ${result.text}`);}
  assert.equal(finish(r).ok,false,'a note is needed even after interventions');
  for(const k of Object.keys(r.note))r.note[k]='A meaningful fictional practice sentence.';
  assert.equal(finish(r).ok,true);assert.equal(r.finished,true);assert.equal(metrics(r).done,c.goals.length);
 });
 test(`${c.id}: unsafe shortcuts are intercepted and do not count as care`,()=>{
  const r=newRun(c.id);for(const a of c.actions.filter(a=>a.unsafe)){const before=JSON.stringify(r.vitals);const result=act(r,a.id);assert.equal(result.safety,true);assert(!r.flags[a.id]);assert.equal(JSON.stringify(r.vitals),before);act(r,a.id);}
  assert.equal(r.issues.length,c.actions.filter(a=>a.unsafe).length,'repeat clicks do not duplicate safety count');
 });
}
test('DKA: insulin is blocked before replacement and a verified repeat K',()=>{
 const r=newRun('dka');assert.equal(act(r,'insulin').safety,true);assert(!r.flags.insulin);
 observe(r,'potassium');observe(r,'perfusion');observe(r,'orders');act(r,'notify');
 assert.equal(act(r,'replace').ok,true);assert.equal(act(r,'insulin').safety,true);
 assert.equal(act(r,'kcheck').ok,true);assert.equal(r.labUpdates.K,'3.7');assert.equal(act(r,'insulin').ok,true);
 assert.equal(act(r,'dextrose').ok,true);assert.equal(r.labUpdates.Glucose,'220');assert.equal(r.labUpdates['β-hydroxybutyrate'],'3.2');
 assert.equal(r.finished,false,'lower glucose does not finish a DKA case');
});
test('cardiac: position alarms select P2; suction path uses P7 in this case',()=>{
 for(const id of ['impella-deep','impella-shallow']){const r=newRun(id);assert.equal(act(r,'reduce').ok,true);assert.equal(r.monitor.p,2);}
 const r=newRun('impella-volume');act(r,'reduce');assert.equal(r.monitor.p,7);
});
test('volume case: ordered treatment is not gated on waiting for echo',()=>{
 const r=newRun('impella-volume');for(const id of ['perfusion','filling','orders'])observe(r,id);
 act(r,'reduce');act(r,'notify');assert.equal(act(r,'resolve').ok,true);assert(!r.flags.echo);
});
test('RV case: treatment plan requires team/echo findings; PAPi uses subtraction first',()=>{
 const r=newRun('impella-rv');assert.equal(act(r,'papi',28/22/18).ok,false);assert.equal(act(r,'papi',.33).ok,true);
 assert.equal(act(r,'resolve').ok,false);assert(!r.flags.resolve);
});
test('fluid math rejects missing, nonnumeric and wrong-unit answers',()=>{
 const r=newRun('sepsis');for(const x of [undefined,'','eighty',2.4,1400])assert.equal(act(r,'calc',x).ok,false);
 assert.equal(act(r,'calc',2400).ok,true);
});
test('albumin distinguishes grams, percent and volume',()=>{
 assert.equal(albuminVolume(25,5),500);assert.equal(albuminVolume(25,25),100);assert.equal(albuminVolume(12.5,25),50);assert.equal(albuminVolume(-1,25),null);assert.equal(albuminVolume(25,50),null);
});
test('each prescription prerequisite is reachable and every care objective is represented',()=>{
 for(const c of CASES){const ids=new Set(['report','orders','document',...c.assessments.map(o=>o.id),...c.actions.map(a=>a.id)]);for(const a of c.actions)for(const x of a.requires||[])assert(ids.has(x),`${c.id}: ${x}`);for(const g of c.goals)assert(ids.has(g.id),`${c.id}: missing objective ${g.id}`);}
});
