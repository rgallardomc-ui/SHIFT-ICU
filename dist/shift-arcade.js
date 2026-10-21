import {ADMISSIONS, PROCEDURES, SUPPLIES} from './shift-data.js?v=0.4.0';
import {patientAt, profileOf, performCare, packSupplies, checkProcedure, receiveAdmissionReport, advanceShift, clockAt} from './shift-engine.js?v=0.4.0';

export const BIN_EXTRAS = [
  {id:'iv-kit',name:'Peripheral IV kit',icon:'⌁',detail:'Catheter, tourniquet, antiseptic, extension and dressing.'},
  {id:'flush',name:'Ordered saline flush',icon:'▰',detail:'Collect the patient-labelled flush from Pyxis.'}
];
export function identityFor(s,room){const first=['Jordan','Casey','Alex','Morgan','Taylor','Sam'];const last=['Reed','Patel','Rivera','Chen','Brooks','Lee'];return `${first[Number(room)%6]} ${last[(s.seed+Number(room))%6]} · MRN SIM-${String(s.seed%10000).padStart(4,'0')}-${room}`;}
export const ALINE_PARTS = [
  ['transducer','Transducer + closed tubing','▥'],['bag','Pressure bag','◉'],['saline','Prescribed sterile saline','▱'],
  ['cable','Monitor cable + holder','⌁'],['sterile','Insertion kit + sterile barriers','▣'],['dressing','Antiseptic + securement','✚']
];
const sentence = (s,n=150) => String(s).split(/(?<=[.!?])\s/)[0].slice(0,n);
const count = s => Object.values(s.inventory).reduce((a,b)=>a+Math.max(0,Number(b)||0),0);
const result = (text,ok=true,extra={})=>({text,ok,...extra});
function log(s,text,room=null){s.log.push({at:s.elapsed,time:clockAt(s.elapsed),room,kind:'arcade',text});s.feedback=text;}
function active(s){return !s.ended && s.elapsed<s.duration;}
function observed(s,p,text){p.observations.push({at:s.elapsed,kind:'Access / safety observation',text,vitals:{...p.current}});p.latestClinicalAt=s.elapsed;const h=p.tasks.find(t=>t.kind==='handoff');if(h)h.done=false;}
export function ensureArcade(s,{fresh=false}={}){
  if(!s.arcade||typeof s.arcade!=='object'||Array.isArray(s.arcade)){
    s.arcade={version:1,enabled:true,score:0,done:[],boosts:3,boostLeft:0,clues:{},phoneAnswered:false,iv:null,pharmacy:null,aline:null,feedbackSerial:0};
    if(s.admission&&!s.admission.announced&&fresh)s.admission.announcedAt=10+(s.seed%13);
    if(fresh)for(const p of s.patients)p.eventAt=65+(s.seed+p.room*11)%36;
  }
  const a=s.arcade;
  a.done=Array.isArray(a.done)?a.done:[];a.clues=a.clues&&typeof a.clues==='object'&&!Array.isArray(a.clues)?a.clues:{};a.score=Number.isFinite(a.score)?a.score:0;a.boosts=Number.isInteger(a.boosts)?Math.max(0,Math.min(3,a.boosts)):3;a.boostLeft=Number.isFinite(a.boostLeft)?a.boostLeft:0;
  return a;
}
export function award(s,key,text,points=25){
  const a=ensureArcade(s);if(a.done.includes(key))return result('Already completed. Pick your next objective.',true,{repeat:true});
  a.done.push(key);a.score+=points;a.feedbackSerial++;log(s,text);return result(text,true,{points,effect:'success'});
}
export function activateBoost(s){
  const a=ensureArcade(s);if(!active(s)||s.paused)return result('Resume your shift first.',false);
  if(a.boostLeft>0)return result('Still in Celsius mode!',false);
  if(a.boosts<1)return result('Three boosts used. Your legs are the fourth can.',false);
  a.boosts--;a.boostLeft=8;log(s,'CELSIUS MODE! Eight seconds of arcade sprint. Clinical timers stay the same.');return result(s.feedback,true,{effect:'boost'});
}
export function updateArcade(s,seconds=0){
  const a=ensureArcade(s);if(!active(s)||s.paused)return;
  a.boostLeft=Math.max(0,a.boostLeft-Math.max(0,seconds));
  const p=s.patients[0];
  if(!a.iv&&p?.assessed&&p.ordersRead&&p.medChecked&&p.stage==='baseline'){
    a.iv={room:p.room,state:'noticed',assessed:false,choice:null,scan:null,cause:profileOf(p).tof||['vent'].includes(profileOf(p).icon)||p.profile==='cabg-receiving'?'A peripheral catheter was dislodged during care.':'The patient is confused and a peripheral IV has come out.'};
    log(s,`R${p.room}: ${a.iv.cause} Check the patient and access first.`,p.room);
  }
  if(s.admission?.announced&&!s.admission.accepted&&a.arrivalAt&&s.elapsed>=a.arrivalAt&&!a.transportHeld){
    a.transportHeld=true;log(s,'Transport: we are holding safely until you confirm the room and receiving checks. Call us back when ready.',s.admission.room);
  }
  if(a.pharmacy?.state==='requested'&&s.elapsed>=a.pharmacy.readyAt){a.pharmacy.state='ready';log(s,'Pharmacy: your labelled purge bag is ready for pickup at the supply-room Pyxis.');}
}
export function answerPhone(s){
  const a=ensureArcade(s);if(!active(s))return result('This shift is finished.',false);
  if(!s.admission?.announced||s.admission.accepted)return result(a.pharmacy?.state==='ready'?'Pharmacy: your purge bag is ready in the pickup drawer.':'Charge: no new admission call yet. Keep moving; I will ring you.',true);
  const r=receiveAdmissionReport(s);if(!r.ok)return r;
  if(!a.phoneAnswered){a.phoneAnswered=true;a.arrivalAt=s.elapsed+25+(s.seed%11);award(s,'phone','REPORT RECEIVED! Your room-preparation ticket is live.',20);}
  return result(`Room ${s.admission.room}: ${ADMISSIONS[s.pod].name}. ETA ${clockAt(a.arrivalAt)}.`,true,{effect:'phone'});
}
export function bedsideClues(s,p){
  const phase=p.reassessed?'reviewed':p.stage==='treated'?'followup':p.eventFired?'change':'baseline';
  return {phase,cards:[
    {id:'patient',icon:'☺',title:'Look at your patient',text:sentence(p.reassessed?profileOf(p).afterExam:p.eventFired?profileOf(p).changeExam:profileOf(p).exam)},
    {id:'monitor',icon:'♥',title:'Check the monitor',text:Object.entries(p.current).filter(([k])=>k!=='UO').map(([k,v])=>`${k} ${v}`).join(' · ')},
    {id:'device',icon:'⌁',title:'Inspect device + access',text:sentence(p.reassessed?profileOf(p).afterDevice||profileOf(p).device:profileOf(p).device,180)}
  ]};
}
export function revealClue(s,room,id){
  const a=ensureArcade(s),p=patientAt(s,room);if(!active(s)||!p)return result('Choose an active patient.',false);
  const {phase,cards}=bedsideClues(s,p),card=cards.find(c=>c.id===id);if(!card)return result('Choose a clue.',false);
  const key=`${room}:${phase}`,seen=a.clues[key]??=[];
  if(seen.includes(id)){
    if(phase==='followup'&&seen.length===3&&s.elapsed>=p.followupAt){const r=performCare(s,room,'assess');if(!r.ok)return r;performCare(s,room,'device');return award(s,`clues:${key}`,'RECHECK COMPLETE! Scripted follow-up now shown.',40);}
    return result(card.text,true,{repeat:true});
  }
  seen.push(id);log(s,`R${room} clue: ${card.text}`,room);
  if(seen.length===3){
    const assessment=performCare(s,room,'assess');if(!assessment.ok)return assessment;
    performCare(s,room,'device');
    return award(s,`clues:${key}`,p.stage==='reviewed'?'RECHECK COMPLETE! The monitor and patient now show the scripted follow-up.':p.eventFired?'CLUES CONNECTED! Choose your response.':'BASELINE LOCKED! Now check the patient computer.',40);
  }
  return result(card.text,true,{effect:'clue'});
}
export function packOne(s,id){
  if(!active(s))return result('This shift is finished.',false);
  if(id==='flush')return result('Get this patient-labelled item from Pyxis.',false);
  if(id==='iv-kit'){
    if(count(s)>=8)return result('Gray bin full: eight slots. Unload or return something.',false);
    s.inventory[id]=(s.inventory[id]||0)+1;advanceShift(s,1);log(s,'IV kit dropped into your gray bin.');
    return result('CLUNK! IV kit in the bin.',true,{effect:'pack'});
  }
  const r=packSupplies(s,[id]);if(r.ok)r.text=`CLUNK! ${SUPPLIES.find(x=>x.id===id)?.name||id} added to the bin.`;return {...r,effect:r.ok?'pack':undefined};
}
export function removeOne(s,id){
  if(!active(s))return result('This shift is finished.',false);
  if(!(s.inventory[id]>0))return result('That slot is empty.',false);
  s.inventory[id]--;if(id==='purge-bag'&&s.arcade?.pharmacy?.state==='collected')s.arcade.pharmacy.state='ready';if(id==='aline-tray'&&s.arcade)s.arcade.aline=null;log(s,'One unused item returned.');return result('Item returned. Space made.',true,{effect:'pack'});
}
export function assessIV(s){
  const a=ensureArcade(s),event=a.iv,p=event&&patientAt(s,event.room);if(!active(s)||!p||event.state==='done')return result('No peripheral-access event is pending.',false);
  event.assessed=true;
  if(!event.at){event.at=s.elapsed;observed(s,p,'Dislodged PIV site assessed; local pressure / dressing applied and small ooze controlled. Dedicated critical-infusion access remains intact. Assessed comfort / causes of distress and ongoing access needs.');}
  return result('Small ooze controlled. Critical infusion access is intact. New case orders: obtain the due labs and replace this PIV for ongoing therapy.');
}
export function chooseAccessPlan(s,choice){
  const a=ensureArcade(s),e=a.iv;if(!active(s)||!e?.assessed)return result('Assess bleeding, the patient and remaining access first.',false);
  if(!['iv','labs'].includes(choice))return result('Choose a plan.',false);
  e.choice=choice;
  if(choice==='labs'){
    const p=patientAt(s,e.room);p.ordersRead=true;const t=p.tasks.find(t=>t.kind==='labs'&&!t.done);if(t)t.due=s.elapsed;
    return result('Labs first is possible: current critical access is intact. Bring a specimen pack; replacement IV remains on your ticket.');
  }
  return result('Replacement IV selected. Bring an IV kit and collect the ordered flush from Pyxis.');
}
export function pickFlush(s,choice){
  const a=ensureArcade(s),e=a.iv;if(!active(s)||!e?.assessed)return result('Review the active peripheral-access order first.',false);
  if(choice!=='matched')return result('Drawer stays locked: match this patient, the ordered 0.9% sodium chloride flush and the intact label. No dose or route swap.',false);
  if(s.inventory.flush>0)return result('You already have the ordered flush. Keep that slot for something else.');
  if(count(s)>=8)return result('Bin full. Return one unused item first.',false);
  s.inventory.flush=1;log(s,`Pyxis: ordered, labelled flush collected for R${e.room}.`,e.room);
  return award(s,'flush','PYXIS UNLOCKED! Correct labelled flush in your bin.',20);
}
export function startIV(s){
  const a=ensureArcade(s),e=a.iv;if(!active(s)||!e?.assessed||!e.choice||e.state==='done')return result('Check the patient and select the active access plan first.',false);
  if(!(s.inventory['iv-kit']>0&&s.inventory.flush>0))return result('Your bin needs an IV kit and the patient-labelled flush from Pyxis.',false);
  e.scan??={compressed:false,vessel:null,tip:0,visible:false,checks:[]};return result('PHANTOM IV: compress, identify the vessel, track the tip, then verify the line.');
}
export function ivStep(s,action,value){
  const a=ensureArcade(s),e=a.iv,v=e?.scan;if(!active(s)||!v||e.state==='done')return result('Open the IV puzzle first.',false);
  if(action==='compress'){v.compressed=true;return result('Structure B collapses; A remains pulsatile. Combine compressibility with the rest of the image.');}
  if(action==='vessel'){
    if(!v.compressed)return result('Use compression before choosing your target.',false);
    if(value!=='B')return result('Wrong target for this phantom. Recheck the image; no puncture made.',false);
    v.vessel='B';return result('VEIN FOUND! Now keep the tip in view.');
  }
  if(action==='track'){if(!v.vessel)return result('Identify your vein first.',false);v.visible=true;return result('Tip reacquired. You can advance one step.');}
  if(action==='advance'){
    if(!v.visible)return result('TIP LOST — stop advancing. Reacquire it with the probe.',false);
    if(v.tip>=4)return result('Target reached. Verify the catheter before use.');
    v.tip++;v.visible=false;return result(v.tip===4?'Target reached in the phantom. Check the site, patency and securement.':'Good step. Sweep the probe to find the tip again.',true,{effect:'clue'});
  }
  if(action==='check'){
    if(v.tip!==4)return result('Finish tracking the tip to the phantom target first.',false);
    if(!['site','patency','secure'].includes(value))return result('Choose an available check.',false);
    if(!v.checks.includes(value))v.checks.push(value);return result(`${v.checks.length}/3 line checks confirmed.`);
  }
  if(action==='finish'){
    if(v.tip!==4||v.checks.length!==3||!(s.inventory['iv-kit']>0&&s.inventory.flush>0))return result('Finish the target, line checks and supply verification first.',false);
    s.inventory['iv-kit']--;s.inventory.flush--;e.state='done';const p=patientAt(s,e.room);
    observed(s,p,'Completed the abstract PIV phantom task: tracked tip, checked prescribed patency / site and secured the dressing. This game does not establish procedural competence or replace supervised insertion.');advanceShift(s,5);
    return award(s,'iv','ACCESS RESTORED! Kit used, dressing secured, task cleared.',65);
  }
  return result('Choose a puzzle control.',false);
}
export function startALine(s,practice=false){
  const a=ensureArcade(s);if(!active(s))return result('This shift is finished.',false);
  a.aline??={parts:[],bubbles:['one','two','three'],primed:false,pressure:0,level:0,zeroed:false,done:false,practice};
  if(a.aline.done){if(a.aline.practice===practice)return result('This setup is already complete.');a.aline=null;return startALine(s,practice);}
  return result('Build the setup. Then prime, clear the air, level and zero. The credentialed operator inserts the line.');
}
export function alineStep(s,action,value){
  const a=ensureArcade(s),v=a.aline;if(!active(s)||!v||v.done)return result('Open a new setup first.',false);
  if(action==='part'){
    if(!ALINE_PARTS.some(([id])=>id===value))return result('That does not belong in this setup.',false);
    if(!v.parts.includes(value))v.parts.push(value);return result(`${v.parts.length}/6 components connected.`,true,{effect:'pack'});
  }
  if(action==='prime'){
    if(v.parts.length!==6)return result('Collect all six setup components first.',false);
    v.primed=true;return result('Priming off the patient. Tap the three air pockets to clear the training circuit.');
  }
  if(action==='bubble'){
    if(!v.primed)return result('Prime the disconnected setup first.',false);
    v.bubbles=v.bubbles.filter(id=>id!==value);return result(v.bubbles.length?'Air pocket removed. Keep checking.':'AIR CLEARED! Match the transducer to the right-atrial reference.');
  }
  if(action==='pump'){
    if(!v.primed||v.bubbles.length)return result('Prime and clear the disconnected circuit first.',false);
    v.pressure=Math.min(300,(v.pressure||0)+100);return result(v.pressure===300?'300 mmHg: the pressure-bag target for this fictional setup is met.':`${v.pressure} mmHg · target 300 for this setup.`);
  }
  if(action==='level'){
    if(!Number.isFinite(Number(value)))return result('Choose a reference level.',false);v.level=Number(value);return result(Math.abs(v.level-50)<=3?'Reference level aligned.':'Move the transducer to the marked reference line.');
  }
  if(action==='zero'){
    if(!v.primed||v.bubbles.length||v.pressure!==300||Math.abs(v.level-50)>3)return result('Clear the air, reach this setup’s prescribed 300 mmHg bag pressure, and align the reference before zeroing.',false);
    v.zeroed=true;return result('ZERO SET! Restore the prescribed closed monitoring state and hand off to the operator.');
  }
  if(action==='finish'){
    if(v.parts.length!==6||!v.zeroed)return result('Complete the priming, level and zero steps first.',false);
    const selected=PROCEDURES.aline.options.filter(o=>o[2]).map(o=>o[0]);
    const r=checkProcedure(s,'aline',selected,{practice:v.practice});if(!r.ok)return r;
    v.done=true;return award(s,`aline:${v.practice?'practice':'tray'}`,v.practice?'WAVEFORM UNLOCKED! Setup practice cleared.':'WAVEFORM UNLOCKED! Prepared A-line tray in your bin.',60);
  }
  return result('Choose a setup control.',false);
}
export function requestPurge(s){
  const a=ensureArcade(s),p=s.patients.find(p=>profileOf(p).icon==='impella');
  if(!active(s)||!p)return result('No Impella purge order on this assignment.',false);
  if(!p.ordersRead)return result('Verify this patient’s orders at the computer first.',false);
  if(a.pharmacy)return result(a.pharmacy.state==='requested'?`Pharmacy is preparing it. ETA ${clockAt(a.pharmacy.readyAt)}.`:'The labelled bag is in the Pyxis pickup drawer.');
  a.pharmacy={room:p.room,state:'requested',readyAt:s.elapsed+12};log(s,'New fictional device-team order: documented heparin contraindication; pharmacy to prepare the prescribed bicarbonate / D5W purge. No RN compounding or systemic IV bolus.',p.room);
  return award(s,'pharmacy-request','PHARMACY PINGED! Your purge bag is in the queue.',20);
}
export function collectPurge(s,choice){
  const a=ensureArcade(s),v=a.pharmacy;if(!active(s)||!v)return result('Request the prescribed bag first.',false);
  if(v.state==='collected')return result('Bag already collected; team connection remains separate.');
  if(v.state!=='ready')return result('Pharmacy has not released the bag yet.',false);
  if(choice!=='matched')return result('Label mismatch. Check patient, 25 mEq/L bicarbonate, D5W, total 500 mL and purge route.',false);
  if(count(s)>=8)return result('Your bin is full. Return an unused pack.',false);
  v.state='collected';s.inventory['purge-bag']=1;return award(s,'purge-pickup','RIGHT BAG! Pharmacy-prepared purge collected for the device team.',35);
}
export function deliverPurge(s,room){
  const a=ensureArcade(s),v=a.pharmacy;if(!active(s)||v?.room!==Number(room)||v.state!=='collected'||!(s.inventory['purge-bag']>0))return result('Bring this patient’s pharmacy-labelled purge bag first.',false);
  s.inventory['purge-bag']--;v.state='delivered';const p=patientAt(s,room);observed(s,p,'Matched the pharmacy-labelled purge bag with the active device-team prescription and handed it to the trained device team. No independent purge / systemic anticoagulation change.');
  return award(s,'purge-delivery','DELIVERED! Device team has the verified bag; continue patient and device checks.',35);
}
export function missionFor(s){
  const a=ensureArcade(s),p=s.patients.find(p=>p.eventFired&&!p.reassessed),incoming=s.admission;
  if(p){
    if(!p.notified)return {title:`Room ${p.room} needs you`,hint:'A new alarm is a clue. Call the team; assess in parallel.',kind:'radio',room:p.room,label:'Call clinical team'};
    if(!p.assessedChange||!p.checkedChange)return {title:'Find the three clues',hint:`Room ${p.room}: patient, monitor, device.`,kind:'bed',room:p.room,label:'Go to the patient'};
    if(!p.ordersRead)return {title:'Check the active response order',hint:`Room ${p.room} computer holds the plan.`,kind:'computer',room:p.room,label:'Go to computer'};
    if(!p.planDone)return {title:'Connect the clues and act',hint:'Choose a response that fits the findings and order.',kind:'bed',room:p.room,label:'Choose a response'};
    if(s.elapsed>=p.followupAt)return {title:'Did it work?',hint:`Recheck room ${p.room}. Watch the scripted follow-up change.`,kind:'bed',room:p.room,label:'Reassess'};
  }
  if(incoming?.announced&&!incoming.accepted&&!a.phoneAnswered)return {title:'Your iMobile is ringing',hint:'Incoming report. Answer to reveal the room ticket and ETA.',kind:'phone',label:'Answer iMobile'};
  const unreported=s.patients.find(p=>!p.reportRead);if(unreported)return {title:'Get your assignment',hint:'Charge has the short version. No chart marathon required.',kind:'charge',label:'Talk to charge'};
  const unassessed=s.patients.find(p=>!p.assessed);if(unassessed)return {title:`Meet your patient in room ${unassessed.room}`,hint:'Tap three clues at the bedside to establish your baseline.',kind:'bed',room:unassessed.room,label:'Go to bedside'};
  const unchecked=s.patients.find(p=>!p.ordersRead||!p.medChecked);if(unchecked)return {title:'Check the plan, then get moving',hint:`Room ${unchecked.room}: match the active orders / MAR.`,kind:'computer',room:unchecked.room,label:'Go to computer'};
  const iv=a.iv;
  if(iv?.assessed&&iv.choice==='labs'&&!iv.labsDone){
    if(!(s.inventory.labs>0))return {title:'Ordered labs still need collecting',hint:'Bring a specimen pack. The pending sample stays on your ticket.',kind:'supply',label:'Get specimen pack'};
    return {title:'Send the ordered sample',hint:`Room ${iv.room}: verify identifiers and collection order.`,kind:'bed',room:iv.room,label:'Collect ordered labs'};
  }
  if(iv&&iv.state!=='done'){
    if(!iv.assessed)return {title:`A PIV came out in room ${iv.room}`,hint:'Patient first. Check bleeding and the remaining access.',kind:'bed',room:iv.room,label:'Check the patient'};
    if(!iv.choice)return {title:'Pick your access plan',hint:'Replacement IV or due labs first? Use the case clues.',kind:'bed',room:iv.room,label:'Choose a plan'};
    if(iv.choice==='labs'&&!iv.labsDone&&!(s.inventory.labs>0))return {title:'Ordered labs first',hint:'Put a specimen pack into your gray bin.',kind:'supply',label:'Get specimen pack'};
    if(iv.choice==='labs'&&s.inventory.labs>0&&!iv.labsDone)return {title:'Collect the ordered sample',hint:'Critical access is intact. Replacement PIV stays on your ticket.',kind:'bed',room:iv.room,label:'Draw ordered labs'};
    if(!(s.inventory['iv-kit']>0))return {title:'Supply run!',hint:'Put an IV kit into your gray bin.',kind:'supply',label:'Go to supplies'};
    if(!(s.inventory.flush>0))return {title:'Pyxis pit stop',hint:'Match the patient-labelled saline flush.',kind:'pyxis',label:'Go to Pyxis'};
    return {title:'Ultrasound IV challenge',hint:`Room ${iv.room}: find the vessel and keep the tip in view.`,kind:'bed',room:iv.room,label:'Restore access'};
  }
  if(incoming?.reportRead&&!incoming.accepted){
    const info=ADMISSIONS[s.pod],ids=[...info.items,...(info.procedure?[PROCEDURES[info.procedure].item]:[])];
    const missing=ids.find(id=>!incoming.installed[id]&&!(s.inventory[id]>0));
    if(missing)return {title:missing==='aline-tray'?'Build the A-line setup':'Fill the receiving-room bin',hint:missing==='aline-tray'?'Transducer, pressure bag, saline… make the waveform happen.':`Next: ${SUPPLIES.find(x=>x.id===missing)?.name||missing}.`,kind:'supply',label:'Supply run'};
    return {title:`Set up room ${incoming.room}`,hint:'Unload your bin and confirm the receiving checks.',kind:'admission',room:incoming.room,label:'Prepare room'};
  }
  if(p?.stage==='treated')return {title:'Response underway',hint:`Reassessment due ${clockAt(p.followupAt)}. Use the interval to prepare supplies.`,kind:'supply',label:'Restock your bin'};
  const imp=s.patients.find(p=>profileOf(p).icon==='impella');
  if(imp&&a.pharmacy?.state!=='delivered')return {title:!a.pharmacy?'Pharmacy side quest':a.pharmacy.state==='requested'?'Pharmacy is preparing your bag':a.pharmacy.state==='ready'?'Your purge bag is ready':'Deliver the verified bag',hint:!a.pharmacy?'Check the new heparin-contraindication order and request the prescribed purge.':a.pharmacy.state==='requested'?`Pickup ETA ${clockAt(a.pharmacy.readyAt)}. Do another task while you wait.`:'Match the patient, label and route.',kind:a.pharmacy?.state==='collected'?'bed':'pyxis',room:imp.room,label:a.pharmacy?.state==='collected'?'Deliver to patient':'Open Pyxis'};
  return {title:'Keep your streak going',hint:'Explore another bedside, try an equipment puzzle, or chart your obtained findings.',kind:'station',label:'Station / charts'};
}
