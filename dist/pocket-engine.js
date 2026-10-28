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
    aline:{parts:[],primed:false,bubbles:['a','b','c'],pressure:0,level:0,zero:false,teamInserted:false,checks:[]},
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
const assembled=s=>PART_IDS.every(id=>s.aline.parts.includes(id));
const levelled=s=>Math.abs(s.aline.level-50)<=4;
const monitoringReady=s=>s.aline.teamInserted&&s.aline.zero&&s.aline.primed&&!s.aline.bubbles.length&&s.aline.pressure===300&&levelled(s)&&LINE_CHECKS.every(id=>s.aline.checks.includes(id));
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
  if(action==='part'){
    const blocked=supportFirst(s);if(blocked)return blocked;
    if(!PART_IDS.includes(value))return reject(s,'That component does not belong in this ordered setup.');
    if(s.aline.parts.includes(value))return repeat(s,'That component is already in the setup.');
    s.aline.parts.push(value);return done(s,'part:'+value,`${s.aline.parts.length}/6 components placed.`,'part');
  }
  if(action==='prime'){
    const blocked=supportFirst(s);if(blocked)return blocked;
    if(!assembled(s))return reject(s,'Place all six setup components first.');
    if(s.aline.primed)return repeat(s,'Disconnected circuit already primed. Remove the visible air.');
    s.aline.primed=true;return done(s,'prime','Prime off the patient. Clear all three air pockets.','prime');
  }
  if(action==='bubble'){
    if(!s.aline.primed)return reject(s,'Prime the disconnected circuit before clearing its air pockets.');
    if(!['a','b','c'].includes(value))return reject(s,'Choose a visible air pocket.');
    if(!s.aline.bubbles.includes(value))return repeat(s,'That air pocket is already cleared.');
    s.aline.bubbles=s.aline.bubbles.filter(id=>id!==value);
    return done(s,'bubble:'+value,s.aline.bubbles.length?'Air pocket cleared. Check the rest.':'Air cleared. Pressurize this case’s bag.','bubble');
  }
  if(action==='pressure'){
    if(!s.aline.primed||s.aline.bubbles.length)return reject(s,'Prime and clear all air from the disconnected circuit first.');
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
  if(action==='zero'){
    if(!s.aline.primed||s.aline.bubbles.length||s.aline.pressure!==300||!levelled(s))return reject(s,'Clear air, reach this case’s bag pressure, and level before zeroing.');
    if(s.aline.zero)return repeat(s,'Zero checked; restore the prescribed closed monitoring state.');
    s.aline.zero=true;return done(s,'zero','Zero checked. Restore closed monitoring state and assist the trained inserter.','zero');
  }
  if(action==='insert-team'){
    if(!s.aline.zero||!levelled(s)||s.aline.pressure!==300||s.aline.bubbles.length)return reject(s,'Finish the safe setup before handing it to the trained inserter.');
    if(s.aline.teamInserted)return repeat(s,'The trained team has placed the line. Check tracing, site and distal perfusion.');
    s.aline.teamInserted=true;return done(s,'team-insertion','Trained team places the ordered A-line. Check waveform, site and distal perfusion.','waveform');
  }
  if(action==='line-check'){
    if(!s.aline.teamInserted)return reject(s,'The trained inserter places the line before post-insertion checks.');
    if(!LINE_CHECKS.includes(value))return reject(s,'Check the waveform, insertion site and distal perfusion.');
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
  if(!assembled(s))return objective('Build the A-line setup','Ongoing BP and IV-site monitoring continue while you prepare.','aline','part',s.aline.parts.length,6);
  if(!s.aline.primed)return objective('Prime off the patient','Keep the training circuit disconnected for priming.','aline','prime');
  if(s.aline.bubbles.length)return objective('Clear the air','Clear all three visible air pockets.','aline','bubble',3-s.aline.bubbles.length,3);
  if(s.aline.pressure<300)return objective('Pump the pressure bag','This ordered setup uses a 300 mmHg bag-pressure target.','aline','pressure',s.aline.pressure,300);
  if(!levelled(s))return objective('Align the reference','Move the transducer to the marked right-atrial reference.','aline','level');
  if(!s.aline.zero)return objective('Zero and restore','Zero to atmosphere, then restore the prescribed closed state.','aline','zero');
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
  return value;
}
