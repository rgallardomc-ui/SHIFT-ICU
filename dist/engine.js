import {CASE_BY_ID} from './cases.js';
export function newRun(id,mode='coached') {
 const c=CASE_BY_ID[id]; if(!c)throw new Error('Unknown case');
 return {id,mode,flags:{},minutes:19*60,history:[],issues:[],vitals:{...c.vitals},monitor:c.monitor?{...c.monitor}:null,alarm:c.alarm,labUpdates:{},note:{s:'',b:'',a:'',r:'',response:''},finished:false};
}
export function time(run){return `${String(Math.floor(run.minutes/60)%24).padStart(2,'0')}:${String(run.minutes%60).padStart(2,'0')}`;}
export function addEvent(run,text,kind='info'){run.history.push({time:time(run),text,kind});}
export function observe(run,id){
 const c=CASE_BY_ID[run.id];
 if(id!=='report'&&id!=='orders'&&!c.assessments.some(x=>x.id===id))return {ok:false,text:'Unknown assessment.'};
 if(!run.flags[id]){run.flags[id]=true;addEvent(run,id==='report'?'Baseline report received.':id==='orders'?'Orders and due labs reconciled.':c.assessments.find(x=>x.id===id).title+'.');}
 return {ok:true};
}
export function act(run,id,answer){
 const c=CASE_BY_ID[run.id], a=c.actions.find(x=>x.id===id);
 if(!a)return {ok:false,text:'Action unavailable.'};
 if(run.finished)return {ok:false,text:'This case is complete. Replay to make a new set of decisions.'};
 if(run.flags[id])return {ok:false,text:'Already completed. Review the timeline for the response.'};
 const danger=a.unsafe||(a.criticalGate&&!run.flags[a.criticalGate]);
 if(danger){const text=a.criticalFeedback||a.feedback;if(!run.issues.some(x=>x.id===id))run.issues.push({id,text});addEvent(run,'Safety stop: '+a.label,'unsafe');return {ok:false,safety:true,text};}
 const missing=(a.requires||[]).filter(x=>!run.flags[x]);
 if(missing.length)return {ok:false,missing,text:'Needed first: '+missing.map(x=>c.goals.find(y=>y.id===x)?.label||x).join('; ')+'. Urgent assessment and escalation can happen in parallel.'};
 if(a.calculation){const n=Number(answer);if(answer===''||answer===undefined||!Number.isFinite(n)||Math.abs(n-a.calculation.expected)>a.calculation.tolerance)return {ok:false,text:'Recheck units and arithmetic. '+a.calculation.formula+'. This has not delayed urgent bedside care.'};}
 run.flags[id]=true;run.minutes+=a.minutes||0;
 if(a.effect){if(a.effect.vitals)Object.assign(run.vitals,a.effect.vitals);if(a.effect.monitor)Object.assign(run.monitor,a.effect.monitor);if(a.effect.labUpdates)Object.assign(run.labUpdates,a.effect.labUpdates);if(a.effect.alarm)run.alarm=a.effect.alarm;}
 addEvent(run,a.label,'action');return {ok:true,text:a.feedback};
}
export function noteCompleteness(note){return ['s','b','a','r','response'].filter(k=>(note[k]||'').trim().split(/\s+/).filter(Boolean).length>=4);}
export function remaining(run){return CASE_BY_ID[run.id].goals.filter(g=>!run.flags[g.id]);}
export function finish(run){
 const missing=remaining(run).filter(g=>g.id!=='document');
 if(missing.length)return {ok:false,text:'Finish the remaining care tasks before completing the handoff: '+missing.map(x=>x.label).join('; ')};
 const complete=noteCompleteness(run.note);
 if(complete.length<5)return {ok:false,text:'Complete all five handoff fields with a brief meaningful sentence. The checklist checks completeness only; it cannot judge clinical accuracy.'};
 run.flags.document=true;run.finished=true;addEvent(run,'Documentation and handoff submitted.','complete');return {ok:true};
}
export function metrics(run){const c=CASE_BY_ID[run.id];return {done:c.goals.filter(x=>run.flags[x.id]).length,total:c.goals.length,safetyStops:run.issues.length};}
export function albuminVolume(grams,percent){if(!(grams>0)||![5,25].includes(percent))return null;return grams/(percent/100);}
