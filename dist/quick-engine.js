import {PATIENT_BY_ID} from './shift-data.js?v=0.5.0';

// A bounded adaptation of an existing case, with no effect on the floor save.
export const QUICK_CASE = PATIENT_BY_ID['cabg-recovery'];
export const QUICK_VERSION = 1;
export const RECHECK_SECONDS = 45;
const PHASES = ['intro','baseline','change','response','waiting','recheck','handoff','finished','retry'];
export function createQuickShift({seed=Date.now(),pressure='relaxed',variant}={}) {
  return {version:QUICK_VERSION,seed:Number(seed)>>>0,variant:variant===0||variant===1?variant:(Number(seed)>>>0)%2,
    pressure:pressure==='focused'?'focused':'relaxed',phase:'intro',paused:false,secondsPlayed:0,worldSeconds:0,
    practiceLeft:240,waitLeft:0,attempts:0,safetyStops:0,firstTask:null,carry:false,
    flags:{baseline:false,assessed:false,called:false,ecg:false,labs:false,prepared:false,rechecked:false},
    current:{...QUICK_CASE.baseline},player:{x:480,y:415},feedback:'One patient. One change. You decide the next move.',history:[]};
}
const result = (s,text,ok=true,extra={}) => {s.feedback=text;return {ok,text,...extra};};
function event(s,id,text) {s.history.push({id,at:Math.round(s.secondsPlayed),text});}
function coordinate(s) {
  if(s.flags.assessed&&s.flags.called&&s.flags.ecg&&s.flags.labs) {
    s.phase='waiting';s.waitLeft=RECHECK_SECONDS;
  }
}
export function quickAction(s,id,value) {
  if(s.phase==='finished'||s.phase==='retry')return result(s,'Replay or retry to start another attempt.',false);
  if(id==='start'&&s.phase==='intro') {
    s.phase='baseline';event(s,id,'Existing CABG case started.');
    return result(s,'Meet your patient in room 6. Check the starting patient and monitor together.');
  }
  if(s.phase==='intro')return result(s,'Start the short shift first.',false);
  if(id==='baseline') {
    if(s.flags.baseline)return result(s,'Your starting assessment is already recorded.');
    s.flags.baseline=true;s.phase='change';s.current={...QUICK_CASE.changed};
    event(s,id,'Baseline HR 82 / MAP 76 obtained; a new sustained irregular tachycardia then alarms.');
    return result(s,'Baseline recorded. Now the rhythm changes: “My heart is racing.” Check the patient, not just the alarm.',true,{alarm:true});
  }
  if(id==='call') {
    if(!s.flags.baseline)return result(s,'Routine report acknowledged. Meet the patient; there is no new alarm yet.');
    if(s.flags.called)return result(s,'The team has your update. Call again for any deterioration; continue the current plan.');
    s.flags.called=true;event(s,id,'Surgical team notified of the new rhythm and available findings.');coordinate(s);
    return result(s,s.flags.assessed?'Team notified: symptoms and current observations reported. The call brings help; it does not treat the rhythm.':'Urgent call placed while you assess. Tell the team your bedside findings as you obtain them.');
  }
  if(id==='assess') {
    if(!s.flags.baseline)return result(s,'Obtain the starting assessment first.',false);
    if(s.flags.assessed)return result(s,'The patient remains monitored. Reassess sooner and contact the team for a new change.');
    s.flags.assessed=true;s.phase='response';event(s,id,'Patient, pulse, pressure, breathing, perfusion and monitor signal checked.');coordinate(s);
    return result(s,'Awake, anxious, palpitations; warm extremities, irregular pulse, MAP 68, SpO₂ 93%. Patient and signal checked. These numbers alone do not identify the rhythm or prove stability.');
  }
  if(id==='plan') {
    if(!s.flags.assessed||!s.flags.called)return result(s,'Assess the change and notify the team. The urgent call is always available.',false);
    if(!['ecg','labs'].includes(value))return result(s,'Choose which prescribed coordination task to do first.',false);
    if(!s.firstTask){s.firstTask=value;event(s,id,`${value==='ecg'?'ECG cart':'K/Mg request'} chosen first; both are required.`);}
    return result(s,value==='ecg'?'ECG first. Pick up the cart, then bring it to the bedside. The K/Mg request stays on your plan.':'K/Mg request first. Use the station. The ECG cart stays on your plan.');
  }
  if(id==='take-ecg') {
    if(!s.flags.assessed)return result(s,'Check the symptomatic patient before leaving for the cart. You can call the team now.',false);
    if(s.flags.ecg)return result(s,'The ordered ECG has already been sent for review.');
    s.carry=true;if(!s.firstTask)s.firstTask='ecg';event(s,id,'ECG cart collected.');
    return result(s,'Cart with you. Bring it to room 6; the patient remains on telemetry.');
  }
  if(id==='ecg') {
    if(!s.carry||!s.flags.assessed)return result(s,'Bring the ECG cart to the assessed patient first.',false);
    if(s.flags.ecg)return result(s,'The ECG is already with the clinician for review.');
    s.flags.ecg=true;s.carry=false;event(s,id,'Ordered 12-lead obtained and sent for clinician review; diagnosis pending.');coordinate(s);
    return result(s,'Ordered 12-lead obtained and sent for clinician review. The monitor label is not the diagnosis.');
  }
  if(id==='labs') {
    if(!s.flags.assessed)return result(s,'Assess the patient first. An urgent team call can happen in parallel.',false);
    if(s.flags.labs)return result(s,'The prescribed K/Mg request is already sent; collection and results remain pending.');
    s.flags.labs=true;if(!s.firstTask)s.firstTask='labs';event(s,id,'Prescribed K/Mg request sent; collection/results pending.');coordinate(s);
    return result(s,'Prescribed K/Mg request sent. Collection and results are pending; no replacement medicine has been given.');
  }
  if(id==='prepare') {
    if(!['waiting','recheck','handoff'].includes(s.phase))return result(s,'Finish the immediate assessment and coordination first.',false);
    s.flags.prepared=true;event(s,id,'Handoff prepared from the observed findings and pending plan.');
    return result(s,'Handoff ready: new irregular rhythm, bedside findings, ECG sent, K/Mg pending, team review and continued monitoring.');
  }
  if(id==='skip') {
    if(s.phase!=='waiting')return result(s,'No compressed reassessment interval is running.',false);
    s.waitLeft=0;s.phase='recheck';event(s,id,'Time jump: ten compressed case minutes later.');
    return result(s,'Time jump: ten compressed case minutes later. Go to the patient to obtain the follow-up; it is not recorded automatically.');
  }
  if(id==='reassess') {
    if(s.phase!=='recheck')return result(s,'The displayed compressed interval has not finished. Continue monitoring; call sooner for deterioration.',false);
    s.flags.rechecked=true;s.current={...QUICK_CASE.followup};s.phase='handoff';
    event(s,id,'Follow-up HR 112 / MAP 72 obtained; the rhythm remains irregular.');
    return result(s,'HR 112 / MAP 72, more comfortable, still irregular. The rate is lower; the rhythm issue is not resolved. Hand off the pending plan.');
  }
  if(id==='handoff') {
    if(s.phase!=='handoff'||!s.flags.rechecked)return result(s,'Obtain the follow-up assessment before finishing.',false);
    if(value!=='continue') {s.safetyStops++;event(s,'safety','A resolved-rhythm handoff was stopped.');return result(s,'Keep this concern open. A lower rate does not mean the rhythm is resolved. Retry the handoff with continued monitoring and the pending team/diagnostic plan.',false,{safety:true});}
    s.phase='finished';event(s,id,'Persistent irregular rhythm and pending plan handed off.');
    return result(s,'Shift handed off. The patient remains monitored and the rhythm concern stays with the team.',true,{complete:true});
  }
  return result(s,'That action is not available in this beat.',false);
}
export function advanceQuickShift(s,seconds,{reading=false}={}) {
  const dt=Math.max(0,Math.min(Number(seconds)||0,2));
  if(s.paused||['intro','finished','retry'].includes(s.phase))return false;
  s.secondsPlayed+=dt;if(reading)return false;s.worldSeconds+=dt;
  const phase=s.phase;
  if(s.phase==='waiting') {s.waitLeft=Math.max(0,s.waitLeft-dt);if(s.waitLeft===0){s.phase='recheck';s.feedback='Recheck due. Return to the patient; obtain the follow-up rather than assuming a response.';}}
  if(s.pressure==='focused'&&['change','response'].includes(s.phase)) {
    s.practiceLeft=Math.max(0,s.practiceLeft-dt);
    if(!s.practiceLeft){s.phase='retry';s.feedback='Practice clock ended. No patient outcome is predicted. Retry from the alarm, or remove the timer.';event(s,'retry','Optional practice clock ended.');}
  }
  return s.phase!==phase;
}
export function retryQuickShift(s,{calm=false}={}) {
  const next=createQuickShift({seed:s.seed,variant:s.variant,pressure:calm?'relaxed':s.pressure});
  quickAction(next,'start');quickAction(next,'baseline');next.attempts=s.attempts+1;next.player={x:650,y:290};
  next.feedback='Back at the alarm. Check the patient, call for help and coordinate the prescribed work.';return next;
}
export function quickObjective(s) {
  if(s.phase==='intro')return {title:'One patient. One complete shift.',hint:'Start at the bedside. Actions and findings guide the rest.',target:'patient'};
  if(s.phase==='baseline')return {title:'Meet your patient',hint:'Room 6 · check the starting patient and monitor.',target:'patient'};
  if(!s.flags.assessed)return {title:'A new rhythm alarm',hint:'Check the patient, pulse, pressure, breathing and signal. Urgent call is available.',target:'patient'};
  if(!s.flags.called)return {title:'Bring in the team',hint:'Report the new irregular rhythm and symptoms. Use Interact anywhere to call.',target:'radio'};
  if(!s.firstTask)return {title:'Choose your first task',hint:'ECG cart or K/Mg request first? Both stay on the plan.',target:'patient'};
  if(s.phase==='response'||s.phase==='change') {
    if(s.firstTask==='labs'&&!s.flags.labs)return {title:'Send the prescribed K/Mg request',hint:'Use the station. This requests collection; it does not create a result.',target:'station'};
    if(!s.flags.ecg)return s.carry?{title:'Bring the ECG to the bedside',hint:'The cart is with you. Room 6 is the next stop.',target:'patient'}:{title:'Pick up the ECG cart',hint:'Equipment bay · the ordered ECG helps the team identify the rhythm.',target:'equipment'};
    return {title:'Send the prescribed K/Mg request',hint:'Use the station; keep collection/results pending in handoff.',target:'station'};
  }
  if(s.phase==='waiting')return s.flags.prepared?{title:'Stay with your patient',hint:`Recheck in ${Math.ceil(s.waitLeft)} game seconds · an explicit time jump is also available.`,target:'patient'}:{title:'Prepare the handoff while monitoring continues',hint:'Use the station, then return to the patient. Choices pause the practice clock.',target:'station'};
  if(s.phase==='recheck')return {title:'Did the picture change?',hint:'Obtain the bedside follow-up. A call is not a cure.',target:'patient'};
  if(s.phase==='handoff')return {title:'Hand off the continuing concern',hint:'Use the station. Include the irregular rhythm and pending plan.',target:'station'};
  return {title:s.phase==='finished'?'Shift complete':'Quick retry',hint:s.feedback,target:'station'};
}
export function quickSummary(s) {
  return {complete:s.phase==='finished',seconds:Math.round(s.secondsPlayed),checks:['assessed','called','ecg','labs','rechecked'].filter(id=>s.flags[id]).length,
    route:s.firstTask==='labs'?'K/Mg request first':'ECG first',safetyStops:s.safetyStops,
    lesson:'A lower rate is not a resolved rhythm. Reassessment and an honest handoff keep the pending concern visible.',
    pending:'Still irregular · clinician ECG review · K/Mg collection/results · ongoing monitoring and team plan.'};
}
export function restoreQuickShift(value) {
  if(!value||value.version!==QUICK_VERSION||!PHASES.includes(value.phase)||!value.flags||!value.player||!Number.isFinite(value.player.x)||!Number.isFinite(value.player.y)||!Array.isArray(value.history))return null;
  if(!Number.isFinite(value.secondsPlayed)||!Number.isFinite(value.waitLeft)||!Number.isFinite(value.practiceLeft)||!value.current)return null;
  return value;
}

export const QUICK_WORLD={width:960,height:520};
export function quickLayout(variant=0) {
  const patientX=variant?190:770,equipmentX=variant?770:190;
  return {patient:{x:patientX,y:220,label:'Room 6 · patient'},equipment:{x:equipmentX,y:220,label:'ECG equipment bay'},station:{x:480,y:420,label:'Nursing station'},
    walls:[{x:patientX-95,y:70,w:100,h:110},{x:equipmentX-95,y:70,w:190,h:65},{x:340,y:330,w:280,h:18},{x:340,y:330,w:18,h:65},{x:602,y:330,w:18,h:65}]};
}
export function quickWalkAllowed(x,y,variant=0) {
  return Number.isFinite(x)&&Number.isFinite(y)&&x>=20&&y>=25&&x<=940&&y<=500&&!quickLayout(variant).walls.some(w=>x>w.x-12&&x<w.x+w.w+12&&y>w.y-12&&y<w.y+w.h+12);
}
export function moveQuickNurse(s,dx,dy,seconds) {
  const n=Math.max(1,Math.hypot(dx,dy)),dt=Math.max(0,Math.min(Number(seconds)||0,2));
  for(let left=dt;left>.00001;){const step=Math.min(left,.02),x=s.player.x+dx/n*215*step,y=s.player.y+dy/n*215*step;
    if(quickWalkAllowed(x,s.player.y,s.variant))s.player.x=x;
    if(quickWalkAllowed(s.player.x,y,s.variant))s.player.y=y;
    left-=step;
  }
}
export function quickRoute(s,target) {
  const cols=48,rows=26,key=(x,y)=>y*cols+x;
  const cell=p=>{
    const x=Math.max(1,Math.min(46,Math.floor(p.x/20))),y=Math.max(1,Math.min(24,Math.floor(p.y/20)));
    if(quickWalkAllowed(x*20+10,y*20+10,s.variant))return {x,y};
    let best=null;for(let cy=Math.max(1,y-2);cy<=Math.min(24,y+2);cy++)for(let cx=Math.max(1,x-2);cx<=Math.min(46,x+2);cx++){
      if(!quickWalkAllowed(cx*20+10,cy*20+10,s.variant))continue;
      const distance=Math.hypot(cx*20+10-p.x,cy*20+10-p.y);if(!best||distance<best.distance)best={x:cx,y:cy,distance};
    }
    return best||{x,y};
  };
  const a=cell(s.player),b=cell(target),from=key(a.x,a.y),to=key(b.x,b.y),queue=[from],previous=new Map([[from,null]]);
  for(let i=0;i<queue.length&&!previous.has(to);i++)for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){
    const at=queue[i],x=at%cols+dx,y=Math.floor(at/cols)+dy,id=key(x,y);
    if(x<1||x>46||y<1||y>24||previous.has(id)||!quickWalkAllowed(x*20+10,y*20+10,s.variant))continue;
    previous.set(id,at);queue.push(id);
  }
  if(!previous.has(to))return [];
  const path=[];for(let at=to;at!==null;at=previous.get(at))path.push({x:(at%cols)*20+10,y:Math.floor(at/cols)*20+10});
  return path.reverse();
}
