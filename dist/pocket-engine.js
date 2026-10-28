// Fictional, bounded bedside episode. This module never reads older game saves.
export const POCKET_VERSION = 1;
export const POCKET_SAVE_KEY = 'shift-icu-pocket-v1';
export const POCKET_RECHECK_SECONDS = 20;
export const POCKET_ORDER = Object.freeze({
  patient: 'Evelyn Reed · SIM-078',
  drug: 'Norepinephrine',
  concentration: '16 mcg/mL',
  preparation: '4 mg / 250 mL D5W · pharmacy premix',
  route: 'Systemic IV · prescribed patent upper-limb PIV',
  pump: 'Locked to the active patient prescription',
  mapTarget: 65,
  note: 'This case verifies setup, not dose calculation or independent titration.'
});
export const POCKET_ASSESS = Object.freeze([
  {id:'mental', name:'Mental state', finding:'New drowsiness. She answers slowly and needs repeated prompting.'},
  {id:'breathing', name:'Airway + breathing', finding:'Short spoken answer; air movement present. RR 26, SpO₂ 94%. Keep reassessing airway/breathing.'},
  {id:'perfusion', name:'Perfusion', finding:'Cool, mottled hands; weak pulse. Previous-hour urine: 18 mL.'},
  {id:'pressure', name:'Validate pressure', finding:'Correct cuff and repeat/manual check confirm MAP 54; HR 118.'}
]);
export const POCKET_PARTS = Object.freeze([
  {id:'transducer',name:'Transducer'},
  {id:'pressure-bag',name:'Pressure bag'},
  {id:'saline',name:'Prescribed sterile saline'},
  {id:'tubing',name:'Closed pressure tubing'},
  {id:'cable',name:'Cable + holder'},
  {id:'sterile-kit',name:'Sterile assist kit'}
]);
export const POCKET_FIT = Object.freeze(['saline','wrap','tubing','cable']);
export const POCKET_PRIME_PATH = Object.freeze(['bag','transducer','waste']);
const ASSESS_IDS=POCKET_ASSESS.map(x=>x.id), PART_IDS=POCKET_PARTS.map(x=>x.id);
const TRACE_IDS=['bag','pump','access'], LINE_CHECKS=['waveform','site','perfusion'];
const PHASES=['assess','support','aline','aline-check','waiting','recheck','handoff','complete'];
function random(seed){let n=Number(seed)>>>0;return()=>{n+=0x6D2B79F5;let t=Math.imul(n^n>>>15,1|n);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}
function shuffle(items,rng){const out=[...items];for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}return out;}

export function createPocketRun({seed=Date.now(),pressure='calm'}={}){
  const rng=random(seed);
  return {
    version:POCKET_VERSION,seed:Number(seed)>>>0,pressure:pressure==='brisk'?'brisk':'calm',
    phase:'assess',paused:false,finished:false,secondsPlayed:0,
    patient:{id:'SIM-078',name:'Evelyn Reed',age:78,MAP:54,HR:118,SpO2:94,RR:26,UO:18,uoInterval:'previous hour',status:'critical',
      context:'Suspected septic shock. Antibiotics/cultures and initial fluid/responsiveness review already completed; reassessment continues.',
      alineReason:'Cuff readings are inconsistent during ongoing support; the team orders an A-line here.'},
    assess:[],help:false,
    med:{order:false,label:false,line:[],pump:false,started:false},
    aline:{setupVersion:2,parts:[],fit:[],path:[],primed:false,primeStage:'vent',flow:0,capped:false,stopcock:'waste',bubbles:['a','b','c'],pressure:0,level:0,zero:false,teamInserted:false,checks:[]},
    recheck:{left:0,ready:false,done:false},
    variation:{parts:shuffle(PART_IDS,rng),labels:shuffle(['match','wrong-patient','wrong-concentration'],rng),traceBend:Math.floor(rng()*2)},
    feedback:'Pressure is low. Check the patient and bring in bedside help.',history:[]
  };
}
function sync(s){
  if(s.finished)s.phase='complete';
  else if(s.assess.length<ASSESS_IDS.length||!s.help)s.phase='assess';
  else if(!s.med.started)s.phase='support';
  else if(!s.aline.teamInserted)s.phase='aline';
  else if(!monitoringReady(s))s.phase='aline-check';
  else if(!s.recheck.done)s.phase=s.recheck.ready?'recheck':'waiting';
  else s.phase='handoff';
}
function reply(s,text,ok=true,event='feedback',changed=false){s.feedback=text;return{ok,text,event,changed,phase:s.phase};}
function done(s,id,text,event=id){
  sync(s);s.history.push({id,at:Math.round(s.secondsPlayed),text});
  if(s.history.length>150)s.history.splice(0,s.history.length-150);
  return reply(s,text,true,event,true);
}
const reject=(s,text)=>reply(s,text,false,'retry',false);
const repeat=(s,text)=>reply(s,text,true,'repeat',false);
const assessed=s=>ASSESS_IDS.every(id=>s.assess.includes(id));
const assembled=s=>POCKET_FIT.every(id=>s.aline.fit.includes(id));
const pathTraced=s=>POCKET_PRIME_PATH.every((id,i)=>s.aline.path[i]===id);
const cleared=s=>s.aline.primed&&s.aline.primeStage==='done'&&!s.aline.bubbles.length;
const prepReady=s=>assembled(s)&&pathTraced(s)&&cleared(s)&&s.aline.pressure===300&&levelled(s);
const levelled=s=>Math.abs(s.aline.level-50)<=4;
const monitoringReady=s=>s.aline.teamInserted&&s.aline.zero&&s.aline.stopcock==='monitor'&&s.aline.capped&&prepReady(s)&&LINE_CHECKS.every(id=>s.aline.checks.includes(id));
function supportFirst(s){return s.med.started?null:reject(s,'Start the needed prescribed support; do not wait for an A-line.');}

export function pocketAction(s,action,value){
  if(s.finished)return reject(s,'Episode complete. Replay for another setup.');
  if(action==='help'){
    if(s.help)return repeat(s,'Bedside help is here. Report any new deterioration immediately.');
    s.help=true;return done(s,'help','Help called. Keep assessing while the team comes.','help');
  }
  if(action==='assess'){
    const finding=POCKET_ASSESS.find(x=>x.id===value);if(!finding)return reject(s,'Choose a patient assessment hotspot.');
    if(s.recheck.done)return repeat(s,value==='mental'?'Latest recheck: answers more readily; ongoing support is still needed.':value==='breathing'?'Keep checking airway/breathing. RR 26 / SpO₂ 94% remain the last shown values.':value==='pressure'?'Latest obtained check: MAP 66, HR 106 during prescribed support.':'Prior-hour urine stays 18 mL. Continue perfusion, site and output checks.');
    if(s.assess.includes(value))return repeat(s,finding.finding);
    s.assess.push(value);return done(s,'assess:'+value,finding.finding,'assess');
  }
  if(action==='order'){
    if(s.med.order)return repeat(s,'Patient/allergy and active norepinephrine order already checked.');
    s.med.order=true;return done(s,'order','Patient/allergy + active case order checked. Match the premix label.','order');
  }
  if(action==='label'){
    if(!s.med.order)return reject(s,'Check this patient and the active prescription first.');
    if(value!=='match')return reject(s,value==='wrong-patient'?'Wrong patient. Match SIM-078 and the active prescription.':'Match norepinephrine 16 mcg/mL, premix D5W and systemic IV route.');
    if(s.med.label)return repeat(s,'Correct patient-labelled premix already matched.');
    s.med.label=true;return done(s,'label','Correct patient, drug, concentration, premix and systemic IV route.','label');
  }
  if(action==='trace'){
    if(!s.med.order||!s.med.label)return reject(s,'Match the order and patient-labelled bag before tracing the line.');
    if(value==='arterial')return reject(s,'Never connect norepinephrine to arterial monitoring tubing. Trace the systemic IV.');
    if(!TRACE_IDS.includes(value))return reject(s,'Trace bag → pump → prescribed IV access.');
    if(s.med.line.includes(value))return repeat(s,'That line checkpoint is already verified.');
    if(value!==TRACE_IDS[s.med.line.length])return reject(s,'Keep the trace continuous: bag → pump → prescribed IV access.');
    s.med.line.push(value);
    return done(s,'trace:'+value,value==='access'?'Patent prescribed PIV checked: no pain/swelling; monitor the site closely.':value==='pump'?'Correct pump channel traced. Continue to the prescribed IV access.':'Patient-labelled bag traced. Follow it to the pump.','trace');
  }
  if(action==='pump'){
    if(!s.med.order||!s.med.label||s.med.line.length!==TRACE_IDS.length)return reject(s,'Finish the patient, label and continuous systemic IV trace first.');
    if(value!=='match')return reject(s,'Match the pump to the active prescription. No unprescribed titration.');
    if(s.med.pump)return repeat(s,'Ordered pump setting already checked.');
    s.med.pump=true;return done(s,'pump','Pump matches the active patient prescription; the dose stays locked.','pump');
  }
  if(action==='start-support'){
    if(s.med.started)return repeat(s,'Prescribed support continues. Keep checking patient, rhythm, BP and IV site.');
    if(!s.help||!assessed(s))return reject(s,'Check the patient and call bedside help before starting this case’s support.');
    if(!s.med.order||!s.med.label||s.med.line.length!==TRACE_IDS.length||!s.med.pump)return reject(s,'Verify order, patient/label, prescribed IV line and pump first.');
    s.med.started=true;s.recheck.left=POCKET_RECHECK_SECONDS;s.recheck.ready=false;
    return done(s,'support','Ordered support started; watch patient, rhythm, BP and IV site. Prep the A-line.','support');
  }
  if(action==='fit'){
    const blocked=supportFirst(s);if(blocked)return blocked;
    if(!POCKET_FIT.includes(value))return reject(s,'These connectors do not fit. Follow the matching physical shapes.');
    if(s.aline.fit.includes(value))return repeat(s,'That connection is already secure.');
    const next=POCKET_FIT.find(id=>!s.aline.fit.includes(id));
    if(value!==next)return reject(s,next==='saline'?'Slide the prepared saline bag into the open sleeve first.':next==='wrap'?'Close the sleeve around the bag before connecting the circuit.':next==='tubing'?'Seat the fluid connector before connecting the monitor cable.':'Seat the keyed monitor cable.');
    s.aline.fit.push(value);
    const parts={saline:['saline','pressure-bag'],wrap:[],tubing:['transducer','tubing'],cable:['cable','sterile-kit']}[value];
    for(const id of parts)if(!s.aline.parts.includes(id))s.aline.parts.push(id);
    const text={saline:'Prepared saline bag seated in the sleeve.',wrap:'Sleeve closed. Keep it unpressurized while de-airing.',tubing:'Compatible fluid connector seated. Circuit remains off the patient.',cable:'Keyed monitor cable seated. Sterile assist kit stays packaged for the trained team.'}[value];
    return done(s,'fit:'+value,text,'fit');
  }
  if(action==='part'||action==='bubble')return reject(s,'Use the physical setup and fluid path. Air must move out with flow to waste.');
  if(action==='prime-trace'){
    const blocked=supportFirst(s);if(blocked)return blocked;
    if(!assembled(s))return reject(s,'Fit the bag, sleeve, fluid connector and monitor cable first.');
    if(s.aline.path.includes(value))return repeat(s,'That part of the fluid path is already traced.');
    if(value!==POCKET_PRIME_PATH[s.aline.path.length])return reject(s,'Trace continuously: saline bag → transducer → waste. The patient stays disconnected.');
    s.aline.path.push(value);
    return done(s,'prime-trace:'+value,value==='waste'?'Path ends at waste, off the patient. Prime the transducer and vent first.':'Fluid path traced. Follow it toward waste.','prime-trace');
  }
  if(action==='prime'){
    const blocked=supportFirst(s);if(blocked)return blocked;
    if(!assembled(s)||!pathTraced(s))return reject(s,'Fit the setup and trace its disconnected fluid path to waste first.');
    if(s.aline.primed)return repeat(s,'Priming is underway. Finish the vent, then the remaining tubing.');
    if(s.aline.teamInserted||s.aline.stopcock!=='waste'||s.aline.pressure!==0)return reject(s,'Priming requires an unpressurized circuit off the patient.');
    s.aline.primed=true;return done(s,'prime','Prime the transducer and vent to waste first; then the remaining tubing.','prime');
  }
  if(action==='flush'||action==='flush-tap'){
    const blocked=supportFirst(s);if(blocked)return blocked;
    if(s.paused)return reject(s,'Paused. Resume before moving fluid.');
    if(!assembled(s)||!pathTraced(s)||!s.aline.primed)return reject(s,'Fit and trace the circuit, then start priming off the patient.');
    if(s.aline.teamInserted||s.aline.stopcock!=='waste'||s.aline.pressure!==0)return reject(s,'This de-airing activity only runs unpressurized and off the patient.');
    if(s.aline.primeStage==='done')return repeat(s,'Both paths are clear. Replace the vented caps before pressurizing.');
    const elapsed=Number(value);
    if(action==='flush'&&(value===null||value===''||!Number.isFinite(elapsed)||elapsed<=0))return reject(s,'Hold to move fluid; release to stop.');
    const increment=action==='flush-tap'?34:Math.min(.25,elapsed)*50;
    s.aline.flow=Math.min(100,s.aline.flow+increment);
    if(s.aline.primeStage==='vent'&&s.aline.flow>=100){
      s.aline.primeStage='tubing';s.aline.flow=0;
      return done(s,'prime-vent','Transducer and vent are clear. Now prime the remaining tubing to waste.','prime-stage');
    }
    if(s.aline.primeStage==='tubing'){
      const remaining=[34,67,100].filter(threshold=>s.aline.flow<threshold).length;
      // Preserve which bubbles were already cleared in an older saved layout.
      s.aline.bubbles=s.aline.bubbles.slice(Math.max(0,s.aline.bubbles.length-remaining));
      if(s.aline.flow>=100){s.aline.primeStage='done';return done(s,'prime-tubing','Fluid has displaced the remaining air to waste. Replace the vented caps.','prime-stage');}
    }
    // Continuous flow is saved without filling the clinical history on every animation frame.
    return reply(s,s.aline.primeStage==='vent'?'Fluid is displacing air through the transducer vent.':'Fluid is carrying the remaining air out to waste.',true,'flow',true);
  }
  if(action==='cap'){
    if(!cleared(s))return reject(s,'Clear the transducer vent and the remaining tubing before replacing caps.');
    if(s.aline.capped)return repeat(s,'Nonvented caps are already secure.');
    if(s.aline.stopcock!=='waste'||s.aline.teamInserted)return reject(s,'Use the stopcock control to restore closed monitoring.');
    s.aline.capped=true;return done(s,'cap','Vented caps replaced with nonvented caps. Now pressurize this prepared setup.','cap');
  }
  if(action==='pressure'){
    if(!assembled(s)||!pathTraced(s)||!cleared(s)||!s.aline.capped)return reject(s,'Prime both paths off the patient, clear all air and replace the vented caps first.');
    if(s.aline.pressure===300)return repeat(s,'This setup’s prescribed pressure target is met.');
    s.aline.pressure=Math.min(300,s.aline.pressure+100);
    return done(s,'pressure',s.aline.pressure===300?'300 mmHg: this setup’s target met. Align the reference level.':`${s.aline.pressure} mmHg · this setup’s target is 300.`,'pressure');
  }
  if(action==='level'){
    if(!s.aline.parts.includes('transducer'))return reject(s,'Place the transducer first.');
    const n=Number(value);if(value===null||value===''||!Number.isFinite(n))return reject(s,'Move the transducer to the marked reference.');
    const next=Math.max(0,Math.min(100,n));if(next===s.aline.level)return repeat(s,levelled(s)?'Right-atrial reference aligned.':'Slide the transducer to the reference.');
    s.aline.level=next;return done(s,'level',levelled(s)?'Right-atrial reference aligned.':'Slide the transducer to the reference.','level');
  }
  if(action==='stopcock'){
    if(!['air','monitor'].includes(value))return reject(s,'Choose the labeled air-reference or closed-monitoring route.');
    if(!prepReady(s))return reject(s,'Complete priming, cap replacement, pressure and leveling before the reference step.');
    if(value===s.aline.stopcock)return repeat(s,value==='air'?'Patient port isolated; reference open to air.':'Closed monitoring restored; air port capped.');
    if(value==='monitor'&&!s.aline.zero)return reject(s,'Zero with the patient port isolated and reference open to air first.');
    s.aline.stopcock=value;s.aline.capped=value==='monitor';
    if(value==='air')s.aline.zero=false;
    return done(s,'stopcock:'+value,value==='air'?'Patient port isolated; reference open to air. Ready to zero.':'Air port closed and capped. Patient-to-transducer monitoring route restored.','stopcock');
  }
  if(action==='zero'){
    if(!prepReady(s)||s.aline.stopcock!=='air')return reject(s,'Clear both paths, pressurize, level, and isolate the patient port with the reference open to air before zeroing.');
    if(s.aline.zero)return repeat(s,'Zero checked; restore the prescribed closed monitoring state.');
    s.aline.zero=true;return done(s,'zero','Zero checked. Restore the closed, capped monitoring route. Zeroing does not change perfusion.','zero');
  }
  if(action==='insert-team'){
    if(!prepReady(s)||!s.aline.zero||s.aline.stopcock!=='monitor'||!s.aline.capped)return reject(s,'Complete the reference step and restore closed, capped monitoring before handing off to the trained inserter.');
    if(s.aline.teamInserted)return repeat(s,'The trained team has placed the line. Check tracing, site and distal perfusion.');
    s.aline.teamInserted=true;return done(s,'team-insertion','Trained team places the ordered A-line. Check waveform, site and distal perfusion.','waveform');
  }
  if(action==='line-check'){
    if(!s.aline.teamInserted)return reject(s,'The trained inserter places the line before post-insertion checks.');
    if(!LINE_CHECKS.includes(value))return reject(s,'Check the waveform, insertion site and distal perfusion.');
    if(value==='waveform'&&(!prepReady(s)||!s.aline.zero||s.aline.stopcock!=='monitor'||!s.aline.capped))return reject(s,'Restore a leveled, zeroed and closed monitoring circuit before reviewing the arterial waveform.');
    if(s.aline.checks.includes(value))return repeat(s,'That post-insertion check is already recorded.');
    s.aline.checks.push(value);
    const text=value==='waveform'?'Waveform reviewed against the patient/cuff context. Setup itself did not raise MAP.':value==='site'?'Insertion site and securement checked; no new bleeding in this scripted scene.':'Distal circulation checked and remains present in this scripted scene.';
    return done(s,'line-check:'+value,text,'line-check');
  }
  if(action==='skip'){
    if(!s.med.started)return reject(s,'Start the needed prescribed support; no response interval has begun.');
    if(s.recheck.done)return repeat(s,'The follow-up is already obtained.');
    if(s.recheck.ready)return repeat(s,'Recheck is ready now. Obtain the bedside findings.');
    s.recheck.left=0;s.recheck.ready=true;return done(s,'time-jump','Time jump: five compressed case minutes later. Reassess the patient.','time-jump');
  }
  if(action==='recheck'){
    if(!s.med.started)return reject(s,'Obtain the initial checks and start the prescribed support first.');
    if(s.recheck.done)return repeat(s,'Follow-up recorded: MAP 66; ongoing support and monitoring are still needed.');
    if(!s.recheck.ready)return reject(s,'Response interval still running. Check sooner for any new deterioration.');
    s.recheck.done=true;s.patient.MAP=66;s.patient.HR=106;s.patient.status='supported';
    return done(s,'recheck','Scripted recheck: MAP 66, answers more readily. Prior-hour urine stays 18 mL.','response');
  }
  if(action==='handoff'){
    if(!s.med.started||!s.recheck.done||!monitoringReady(s))return reject(s,'Obtain the patient recheck and complete the ordered monitoring checks first.');
    if(value!=='continue')return reject(s,'A better MAP is not resolved shock. Keep support, site checks and team review in handoff.');
    s.finished=true;return done(s,'handoff','Supported, not cured. Ongoing monitoring and the pending team plan handed off.','complete');
  }
  return reject(s,'Choose the next available bedside action.');
}

export function advancePocket(s,seconds){
  if(s.paused||s.finished)return false;
  const dt=Math.max(0,Math.min(Number(seconds)||0,2));if(!dt)return false;
  s.secondsPlayed+=dt;
  const before=s.phase,ready=s.recheck.ready;
  if(s.med.started&&!s.recheck.done){s.recheck.left=Math.max(0,s.recheck.left-dt);if(s.recheck.left===0)s.recheck.ready=true;}
  sync(s);return before!==s.phase||ready!==s.recheck.ready;
}
function objective(title,hint,target,task,progress=0,total=1){return{title,hint,target,task,progress,total};}
export function pocketObjective(s){
  if(s.finished)return objective('Episode complete','Support continues; replay a different setup.','patient','replay',1,1);
  if(!assessed(s))return objective('Check your patient','Airway/breathing, mental state, perfusion and pressure. Help is always available.','patient','assess',s.assess.length,ASSESS_IDS.length);
  if(!s.help)return objective('Call bedside help','Report the low pressure and perfusion findings.','patient','help');
  if(!s.med.order)return objective('Check the active order','Verify patient/allergy and this case’s norepinephrine prescription.','pump','order');
  if(!s.med.label)return objective('Match the premix','Patient, norepinephrine, 16 mcg/mL, D5W, systemic IV.','pump','label');
  if(s.med.line.length<3)return objective('Trace the correct line','Bag → pump → prescribed patent IV; never arterial tubing.','pump','trace',s.med.line.length,3);
  if(!s.med.pump)return objective('Verify the pump','Match its locked setting to the active patient prescription.','pump','pump');
  if(!s.med.started)return objective('Start ordered support','The A-line does not have to be ready first.','pump','start-support');
  if(s.recheck.ready&&!s.recheck.done)return objective('Recheck your patient now','Return to the bedside. Your unfinished setup stays ready to resume.','patient','recheck');
  if(!assembled(s))return objective('Fit the A-line setup','Prepared bag → sleeve wrap → fluid connector → monitor cable.','aline','fit',s.aline.fit.length,4);
  if(!pathTraced(s))return objective('Trace the fluid path','Saline bag → transducer → waste. Keep the patient disconnected.','aline','prime-trace',s.aline.path.length,3);
  if(!s.aline.primed)return objective('Prime off the patient','De-air the transducer vent first, then the remaining tubing.','aline','prime');
  if(s.aline.primeStage!=='done')return objective(s.aline.primeStage==='vent'?'Clear the transducer vent':'Clear the remaining tubing','Hold for flow to waste; release to stop. All air must leave before pressure.','aline','flush',s.aline.flow,100);
  if(!s.aline.capped&&s.aline.stopcock==='waste')return objective('Replace vented caps','Secure the nonvented caps before pressurizing this kit.','aline','cap');
  if(s.aline.pressure<300)return objective('Pump the pressure bag','This ordered setup uses a 300 mmHg bag-pressure target.','aline','pressure',s.aline.pressure,300);
  if(!levelled(s))return objective('Align the reference','Move the transducer to the marked right-atrial reference.','aline','level');
  if(!s.aline.zero&&s.aline.stopcock!=='air')return objective('Route the reference to air','Isolate the patient port; open the transducer reference to air.','aline','stopcock');
  if(!s.aline.zero)return objective('Zero the reference','Patient port isolated. Reference open to air.','aline','zero');
  if(s.aline.stopcock!=='monitor'||!s.aline.capped)return objective('Restore closed monitoring','Close and cap the air port; restore the patient-to-transducer route.','aline','restore');
  if(!s.aline.teamInserted)return objective('Assist the trained inserter','Your completed setup supports the operator; it is not an insertion credential.','aline','insert-team');
  if(!monitoringReady(s))return objective('Check the new line','Waveform, insertion site and distal perfusion.','aline','line-check',s.aline.checks.length,3);
  if(!s.recheck.done)return objective(s.recheck.ready?'Reassess the patient':'Keep monitoring',s.recheck.ready?'Obtain the follow-up; a waveform alone does not show recovery.':`Recheck in ${Math.ceil(s.recheck.left)} game seconds, or use the explicit time jump.`,'patient',s.recheck.ready?'recheck':'wait');
  return objective('Hand off ongoing support','A better MAP is not resolved shock. Keep the pending plan visible.','patient','handoff');
}
export function pocketSummary(s){
  return {complete:s.finished,seconds:Math.round(s.secondsPlayed),
    supportStarted:s.med.started,lineReady:monitoringReady(s),reassessed:s.recheck.done,
    lesson:'The A-line improves monitoring; it does not treat shock or replace patient reassessment.',
    pending:'Continue prescribed support, BP/rhythm/IV-site and distal-perfusion checks, output trend and team review.'};
}
export function restorePocketRun(value){
  if(!value||value.version!==POCKET_VERSION||!PHASES.includes(value.phase)||!value.patient||!value.med||!value.aline||!value.recheck||!Array.isArray(value.history))return null;
  if(!Array.isArray(value.assess)||!Array.isArray(value.med.line)||!Array.isArray(value.aline.parts)||!Array.isArray(value.aline.bubbles)||!Array.isArray(value.aline.checks))return null;
  if(!Number.isFinite(value.secondsPlayed)||!Number.isFinite(value.recheck.left)||!Number.isFinite(value.patient.MAP))return null;
  const a=value.aline;
  if(a.setupVersion===undefined){
    // v0.6 saves keep every accepted task; only the newly visible closure may remain.
    const downstream=a.primed||a.pressure>0||a.zero||a.teamInserted;
    a.fit=downstream?[...POCKET_FIT]:[
      ...(a.parts.includes('saline')&&a.parts.includes('pressure-bag')?['saline','wrap']:[]),
      ...(a.parts.includes('tubing')&&a.parts.includes('transducer')?['tubing']:[]),
      ...(a.parts.includes('cable')?['cable']:[])
    ];
    a.path=downstream?[...POCKET_PRIME_PATH]:[];
    a.primeStage=a.primed?(a.bubbles.length?'tubing':'done'):'vent';
    a.flow=a.primed?(a.bubbles.length?Math.min(99,(3-a.bubbles.length)*34):100):0;
    a.stopcock=a.teamInserted?'monitor':a.zero?'air':'waste';
    a.capped=a.teamInserted||(!a.zero&&a.pressure>0);
    a.setupVersion=2;
  }
  if(a.setupVersion!==2||!Array.isArray(a.fit)||!Array.isArray(a.path)||!Number.isFinite(a.flow)||a.flow<0||a.flow>100||!['vent','tubing','done'].includes(a.primeStage)||!['waste','air','monitor'].includes(a.stopcock)||typeof a.capped!=='boolean')return null;
  if(a.fit.some(id=>!POCKET_FIT.includes(id))||new Set(a.fit).size!==a.fit.length||a.path.some((id,i)=>id!==POCKET_PRIME_PATH[i]))return null;
  return value;
}
