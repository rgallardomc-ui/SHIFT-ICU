import {createControllerInput} from './controller-input.js?v=0.5.0';
import {QUICK_CASE,createQuickShift,quickAction,advanceQuickShift,retryQuickShift,quickObjective,quickSummary,restoreQuickShift,quickLayout,quickRoute,quickWalkAllowed,moveQuickNurse} from './quick-engine.js?v=0.5.0';

const STORE='shift-icu-quick-v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const btn=(id,text,{primary=false,extra='',kind=''}={})=>`<button data-q="${id}" ${primary?'data-controller-primary':''} class="${primary?'primary':kind||'secondary'}" ${extra}>${text}</button>`;
const duration=n=>`${Math.floor(n/60)}:${String(Math.floor(n%60)).padStart(2,'0')}`;

export function createQuickGame({app,onExit}) {
  const events=new AbortController(),signal=events.signal;
  let s=createQuickShift(),view='intro',context='',message='',safety=false,frame=0,previous=0,input=null,destroyed=false,route=[],routeTarget=null,held=new Map(),lastSave=0,status=null;
  let root,canvas,panel,resumeAvailable=null;
  try{resumeAvailable=restoreQuickShift(JSON.parse(localStorage.getItem(STORE)||'null'));}catch{}
  const save=()=>{if(s.phase==='intro'&&resumeAvailable&&!['intro','finished','retry'].includes(resumeAvailable.phase))return;try{localStorage.setItem(STORE,JSON.stringify(s));}catch{}};
  const foreignDialog=()=>document.querySelector('dialog[open]');
  function menu() {return !!view||!!foreignDialog()||s.paused||['finished','retry'].includes(s.phase);}
  function mount() {
    app.innerHTML=`<section class="quick-game" aria-label="Short playable shift"><header class="quick-title"><div><p class="eyebrow">DELTA / ONE COMPLETE SHIFT</p><h1>Rhythm on the night shift<span>.</span></h1></div><span class="quick-session">3–5 min target<br><b>One patient · no typing</b></span></header><section class="quick-objective" aria-label="Current objective"><div><span id="quickBeat">YOUR NEXT MOVE</span><h2 id="quickGoal"></h2><p id="quickHint"></p></div><button data-q="go" class="primary" id="quickGo">Follow objective →</button></section><div class="quick-progress" aria-label="Shift progress">${['Meet','Assess','Coordinate','Recheck','Handoff'].map((x,i)=>`<span id="quickStep${i}"><b>${i+1}</b>${x}</span>`).join('')}</div><div class="quick-arena-wrap"><canvas id="quickArena" width="960" height="520" tabindex="0" aria-label="Compact ward. Move with left stick, D-pad or arrows. Interact with A, Cross, E or Enter." role="img"></canvas><div class="quick-world-label"><span id="quickCarry"></span><span id="quickPressure"></span></div><section id="quickPanel" class="quick-panel" aria-label="Shift actions" hidden></section></div><div id="quickFeedback" class="quick-feedback" role="status" aria-live="polite"></div><div class="quick-toolbar">${btn('interact','Interact · A / × / E',{primary:true})}${btn('call','Call team')}${btn('pause','Pause · Start / P')}${btn('exit','Hospital',{kind:'quiet'})}</div><div class="quick-touch" aria-label="Touch movement"><button data-qdir="up" aria-label="Move nurse up">▲</button><button data-qdir="left" aria-label="Move nurse left">◀</button><button data-qdir="down" aria-label="Move nurse down">▼</button><button data-qdir="right" aria-label="Move nurse right">▶</button></div><div class="quick-input"><b id="quickInputStatus">Keyboard ready · connect a standard gamepad</b><span>Move: left stick / D-pad / arrows · Confirm: A / × / Enter · Back: B / ○ / Esc · Pause: Start / P</span></div><p class="quick-scope">Fictional adaptation of the existing CABG case. Decisions pause the practice clock. Movement and time are compressed; this is not a clinical protocol.</p></section>`;
    root=app.querySelector('.quick-game');canvas=app.querySelector('#quickArena');panel=app.querySelector('#quickPanel');
    input=createControllerInput({maxFrameSeconds:2,getScope:()=>destroyed?null:foreignDialog()|| (menu()?panel:root),getMode:()=>menu()?'menu':'move',
      onMove:(x,y,dt)=>{if(menu()||document.hidden)return;if(x||y){route=[];routeTarget=null;moveQuickNurse(s,x,y,dt);}},
      onAction:interact,onBack:()=>{const d=foreignDialog();if(d){d.close();if(view)input.focusPrimary();else canvas.focus({preventScroll:true});}else back();},onPause:pause,onStatus:next=>{
        const disconnected=status?.connected&&!next.connected;status=next;updateStatus();
        if(disconnected&&!['intro','finished','retry'].includes(s.phase)){s.paused=true;show('pause');s.feedback='Controller disconnected. Shift paused; reconnect or use the keyboard.';hud();}
      }});
    renderPanel();hud();previous=performance.now();frame=requestAnimationFrame(tick);
  }
  function updateStatus(){
    const el=app.querySelector('#quickInputStatus');if(!el||!status)return;
    el.textContent=status.connected?(status.supported?`${status.ready?'Connected':'Release buttons'} · ${status.id}`:`Unmapped controller · use keyboard · ${status.id}`):status.reason;
  }
  function hud() {
    if(!root)return;const objective=quickObjective(s),f=s.flags;
    app.querySelector('#quickGoal').textContent=objective.title;app.querySelector('#quickHint').textContent=objective.hint;
    app.querySelector('#quickBeat').textContent=s.phase==='finished'?'SHIFT HANDED OFF':s.paused?'PAUSED · TAKE YOUR TIME':'YOUR NEXT MOVE';
    const go=app.querySelector('#quickGo');go.textContent=objective.target==='radio'?'Open radio →':'Follow objective →';go.disabled=menu();
    const done=[f.baseline,f.assessed,f.called&&f.ecg&&f.labs,f.rechecked,s.phase==='finished'];
    done.forEach((x,i)=>{const el=app.querySelector(`#quickStep${i}`);el.classList.toggle('done',!!x);el.classList.toggle('current',!x&&(i===0||done[i-1]));});
    app.querySelector('#quickCarry').textContent=s.carry?'ECG CART WITH YOU':s.flags.ecg?'ECG SENT FOR REVIEW':'DELTA · ROOM 06';
    app.querySelector('#quickPressure').textContent=s.paused?'PAUSED':s.phase==='waiting'?`${menu()?'Recheck paused':'Recheck in'} ${Math.ceil(s.waitLeft)}s · game time`:s.pressure==='focused'?`Practice clock ${duration(s.practiceLeft)}`:'CALM · NO DEADLINE';
    root.querySelectorAll('.quick-toolbar button').forEach(b=>{b.disabled=menu();});
    const feedback=app.querySelector('#quickFeedback');if(feedback.textContent!==s.feedback)feedback.textContent=s.feedback;
    feedback.classList.toggle('safety',safety);updateStatus();
  }
  function show(next,where='',text='',isSafety=false) {
    route=[];routeTarget=null;held.clear();view=next;context=where;message=text;safety=isSafety;renderPanel();hud();save();
  }
  function closePanel(){view='';context='';message='';panel.hidden=true;panel.innerHTML='';input.release();canvas.focus({preventScroll:true});hud();save();}
  function response(text,ok=true) {return `<p class="quick-response ${ok?'':'safety'}" role="status">${esc(text)}</p>`;}
  function renderPanel() {
    if(!panel)return;
    if(s.phase==='finished')view='finished';if(s.phase==='retry')view='retry';
    panel.hidden=!view;if(!view)return;
    let html='';
    if(view==='intro')html=`<p class="eyebrow">YOUR FIRST SHORT SHIFT</p><h2>Hear the alarm.<br>Connect the picture.</h2><p>70-year-old, CABG yesterday. Awake on 2 L/min oxygen. A new rhythm will need your attention.</p><div class="quick-order"><b>This case’s plan</b><p>Assess the patient and signal. Promptly call the surgical team. Arrange the prescribed 12-lead ECG and K/Mg, then reassess and hand off.</p></div><p class="quick-help">Move with your stick or arrows. Press A / × / Enter to interact. Follow objective offers guided walking.</p><div class="quick-choices">${resumeAvailable&&!['intro','finished','retry'].includes(resumeAvailable.phase)?btn('resume','Resume short shift',{primary:true}):''}${btn('start',resumeAvailable?'Start fresh →':'Start shift →',{primary:!resumeAvailable})}${btn('pressure',`Pressure: ${s.pressure==='relaxed'?'Calm · no deadline':'Practice clock · 4 minutes'}`)}${btn('exit','Back to hospital',{kind:'quiet'})}</div><small>Primary input: standard-mapped gamepad or keyboard. Your exact controller/browser still needs a hands-on check.</small>`;
    if(view==='pause')html=`<p class="eyebrow">PAUSED</p><h2>You set the pace.</h2><p>The practice clock and patient beat are paused. No absence penalties.</p><div class="quick-choices">${btn('resume-pause','Resume shift',{primary:true})}${btn('restart','Restart this short shift')}${btn('exit','Back to hospital',{kind:'quiet'})}</div>`;
    if(view==='feedback')html=`<p class="eyebrow">${safety?'SAFETY STOP / TRY AGAIN':'ACTION → RESULT'}</p><h2>${safety?'Keep the concern open.':context==='baseline'?'A new rhythm alarm.':context==='reassess'?'Better rate. Still irregular.':'That changed your plan.'}</h2>${response(message,!safety)}<div class="quick-choices">${btn(safety?'context':'continue',safety?'Retry this choice':'Continue →',{primary:true})}${!safety&&s.phase==='waiting'?btn('skip','Jump to reassessment'):''}</div>`;
    if(view==='context')html=contextHTML(context);
    if(view==='retry')html=`<p class="eyebrow">OPTIONAL PRACTICE CLOCK</p><h2>Take another run.</h2><p>No patient outcome is predicted by this game timer.</p><p>At the alarm: check the patient, call for help and coordinate the prescribed diagnostics. The clock never changes your clinical authority.</p><div class="quick-choices">${btn('checkpoint','Retry from the alarm',{primary:true})}${btn('calm-checkpoint','Retry without a clock')}${btn('exit','Hospital',{kind:'quiet'})}</div>`;
    if(view==='finished'){
      const sum=quickSummary(s);html=`<p class="eyebrow">SHIFT HANDED OFF</p><h2>You kept the picture together.</h2><div class="quick-finish-marks"><span>✓ Patient checked</span><span>✓ Team called</span><span>✓ Diagnostics coordinated</span><span>✓ Response rechecked</span></div><p>${esc(sum.lesson)}</p><div class="quick-order"><b>What stays with the team</b><p>${esc(sum.pending)}</p></div><p class="quick-help">Your route: ${sum.route}. ${duration(sum.seconds)} active session · no speed grade.</p><div class="quick-choices">${btn('replay','Replay · switch the layout',{primary:true})}${btn('same-replay','Same shift · same layout')}${btn('exit','Hospital',{kind:'quiet'})}</div>`;
    }
    panel.innerHTML=`<div class="quick-panel-content">${html}</div>`;input?.focusPrimary();
  }
  function contextHTML(where) {
    const title=where==='patient'?'ROOM 6 / AT THE BEDSIDE':where==='equipment'?'EQUIPMENT BAY':where==='station'?'NURSING STATION':'RADIO / AVAILABLE ANYWHERE';
    let content='',actions=[];
    if(where==='patient') {
      if(s.phase==='baseline'){content='<h2>Meet your patient.</h2><p>Sinus rhythm at report. HR 82 · MAP 76 · SpO₂ 94%. Check the starting patient, pulse and monitor together.</p>';actions=[btn('baseline','Check patient + monitor',{primary:true})];}
      else if(!s.flags.assessed){content='<h2>“My heart is racing.”</h2><p>Telemetry alarms for a new sustained irregular rhythm. Assess the patient and signal; call early for help.</p>';actions=[btn('assess','Assess patient + signal',{primary:true}),btn('call','Call the team now')];}
      else if(!s.flags.called){content='<h2>Report the new change.</h2><p>Awake, palpitations, irregular pulse. HR 142 · MAP 68 · SpO₂ 93%. Assess stability in context; a rate alone is not a diagnosis.</p>';actions=[btn('call','Call surgical team',{primary:true})];}
      else if(!s.firstTask){content='<h2>Pick your first move.</h2><p>Both tasks are prescribed and stay on the plan. The team is already notified.</p>';actions=[btn('plan-ecg','Bring ECG cart first',{primary:true}),btn('plan-labs','Send K/Mg request first')];}
      else if(s.carry){content='<h2>Cart at the bedside.</h2><p>Obtain the prescribed 12-lead and send it for clinician review. This simplified action does not diagnose AF.</p>';actions=[btn('ecg','Obtain + send ordered ECG',{primary:true})];}
      else if(s.phase==='recheck'){content='<h2>Check the patient again.</h2><p>Ten compressed case minutes later. Obtain the follow-up before assuming the call changed anything.</p>';actions=[btn('reassess','Reassess patient + monitor',{primary:true})];}
      else if(s.phase==='waiting'){content=`<h2>Stay with the patient.</h2><p>Telemetry continues. The ${Math.ceil(s.waitLeft)}-second countdown is paused while this panel is open. Return to the floor to let it run, or jump forward ten compressed case minutes. Call sooner for a new deterioration.</p>`;actions=[btn('skip','Time jump to reassessment',{primary:true}),btn('call','Update the team')];}
      else {content=`<h2>${s.phase==='handoff'?'The rhythm concern remains.':'Keep the plan moving.'}</h2><p>${esc(s.phase==='handoff'?QUICK_CASE.afterExam:'Continue monitoring. Your objective shows the next available task.')}</p>`;actions=[btn('go','Follow next objective',{primary:true})];}
    }
    if(where==='equipment') {content='<h2>One cart. Next stop: bedside.</h2><p>Pick up the ECG cart for the prescribed diagnostic check.</p>';actions=[btn('take-ecg',s.carry?'Cart already with you':'Take ECG cart',{primary:true}),btn('go','Follow next objective')];}
    if(where==='station') {
      if(s.phase==='handoff'){content='<h2>What stays in the handoff?</h2><p>Follow-up: HR 112 · MAP 72, more comfortable, still irregular. ECG sent; K/Mg collection/results and the team plan remain pending.</p>';actions=[btn('handoff','Continue monitoring + hand off pending plan',{primary:true}),btn('resolved','Mark rhythm resolved / stop monitoring')];}
      else if(s.phase==='waiting'||s.phase==='recheck'){content='<h2>Get your handoff ready.</h2><p>Use the findings you actually obtained. Keep the ECG review, K/Mg request and continuing rhythm concern visible.</p>';actions=[btn('prepare',s.flags.prepared?'Handoff prepared ✓':'Prepare short handoff',{primary:true}),...(s.phase==='waiting'?[btn('skip','Time jump to reassessment')]:[btn('go','Return for reassessment')])];}
      else {content='<h2>Send the ordered request.</h2><p>Request the prescribed K/Mg collection. This does not create a specimen, a result or an order for replacement medicine.</p>';actions=[btn('labs',s.flags.labs?'K/Mg request already sent':'Send prescribed K/Mg request',{primary:true}),btn('call','Call / update surgical team')];}
    }
    if(where==='radio'){content='<h2>Bring in the team.</h2><p>Urgent communication is available anywhere. A checklist never blocks this call.</p>';actions=[btn('call',s.flags.called?'Update surgical team':'Call surgical team',{primary:true}),btn('go','Walk to next objective')];}
    return `<p class="eyebrow">${title}</p>${content}<div class="quick-choices">${actions.join('')}${btn('back','Back to floor',{kind:'quiet'})}</div>`;
  }
  function act(id,value) {
    const r=quickAction(s,id,value);
    if(r.ok&&['plan','call','take-ecg','ecg','labs','prepare','skip'].includes(id)){safety=false;closePanel();return;}
    show('feedback',id,r.text,!r.ok);if(r.complete){view='finished';renderPanel();}hud();save();
  }
  function nearest(){const items=quickLayout(s.variant);return ['patient','equipment','station'].map(id=>({id,...items[id],distance:Math.hypot(items[id].x-s.player.x,items[id].y-s.player.y)})).filter(x=>x.distance<110).sort((a,b)=>a.distance-b.distance)[0];}
  function interact(){if(menu())return;show('context',nearest()?.id||'radio');}
  function go(){
    const objective=quickObjective(s);if(objective.target==='radio'){show('context','radio');return;}
    const target=quickLayout(s.variant)[objective.target];route=quickRoute(s,target);routeTarget=objective.target;
    view='';panel.hidden=true;panel.innerHTML='';held.clear();input.release();canvas.focus({preventScroll:true});s.feedback=`Walking to ${target.label}. Steer to change course; Interact opens a local action.`;hud();
  }
  function pause(){
    if(foreignDialog()){foreignDialog().close();return;}
    if(s.phase==='intro'||s.phase==='finished'||s.phase==='retry')return;
    if(view==='pause'){s.paused=false;closePanel();return;}
    s.paused=true;show('pause');
  }
  function back(){if(view==='pause'){s.paused=false;closePanel();}else if(view==='intro'||view==='finished')exit();else if(view)closePanel();else pause();}
  function exit(){save();destroy();onExit();}
  function restart(same=false){const old=s;s=createQuickShift({seed:old.seed+1,pressure:old.pressure,variant:same?old.variant:1-old.variant});resumeAvailable=null;view='intro';message='';safety=false;route=[];routeTarget=null;renderPanel();hud();save();}
  rootClick();
  function rootClick(){app.addEventListener('click',event=>{
    const b=event.target.closest('[data-q]');if(!b||!root?.contains(b))return;const action=b.dataset.q;
    if(action==='exit')return exit();if(action==='pause')return pause();if(action==='back')return back();
    if(action==='go')return go();if(action==='interact')return interact();
    if(action==='resume-pause'){s.paused=false;return closePanel();}
    if(action==='pressure'){s.pressure=s.pressure==='relaxed'?'focused':'relaxed';renderPanel();hud();return;}
    if(action==='start'){quickAction(s,'start');return closePanel();}
    if(action==='resume'){s=structuredClone(resumeAvailable);s.paused=false;resumeAvailable=null;return closePanel();}
    if(action==='restart')return restart(true);if(action==='replay')return restart(false);if(action==='same-replay')return restart(true);
    if(action==='checkpoint'||action==='calm-checkpoint'){s=retryQuickShift(s,{calm:action==='calm-checkpoint'});return closePanel();}
    if(action==='continue')return closePanel();
    if(action==='context'){view='context';context=s.phase==='handoff'?'station':nearest()?.id||'radio';renderPanel();return;}
    if(action==='plan-ecg'||action==='plan-labs')return act('plan',action==='plan-ecg'?'ecg':'labs');
    if(action==='resolved')return act('handoff','resolved');if(action==='handoff')return act('handoff','continue');
    act(action);
  },{signal});}
  app.addEventListener('pointerdown',event=>{const b=event.target.closest('[data-qdir]');if(!b||menu())return;event.preventDefault();held.set(event.pointerId,b.dataset.qdir);b.setPointerCapture?.(event.pointerId);route=[];routeTarget=null;},{signal});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])document.addEventListener(name,event=>held.delete(event.pointerId),{signal});
  const suspend=()=>{held.clear();route=[];routeTarget=null;if(!['intro','finished','retry'].includes(s.phase)){s.paused=true;show('pause');}save();};
  window.addEventListener('blur',suspend,{signal});window.addEventListener('pagehide',suspend,{signal});document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();},{signal});
  function tick(ts){
    if(destroyed)return;const dt=Math.max(0,Math.min((ts-previous)/1000,2));previous=ts;
    if(!document.hidden){
      const changed=advanceQuickShift(s,dt,{reading:menu()});
      if(changed&&s.phase==='retry'){view='retry';renderPanel();}
      if(!menu()){
        const directions=new Set(held.values()),dx=Number(directions.has('right'))-Number(directions.has('left')),dy=Number(directions.has('down'))-Number(directions.has('up'));
        if(dx||dy)moveQuickNurse(s,dx,dy,Math.min(dt,.1));
        else if(route.length){for(let left=dt;left>.0001&&route.length;){const p=route[0],d=Math.hypot(p.x-s.player.x,p.y-s.player.y);if(d<.05){route.shift();continue;}const step=Math.min(left,.02,d/215);moveQuickNurse(s,(p.x-s.player.x)/d,(p.y-s.player.y)/d,step);left-=step;}
          if(!route.length&&routeTarget){const at=routeTarget;routeTarget=null;show('context',at);}
        }
      }
      hud();draw(ts);
      if(ts-lastSave>3000){save();lastSave=ts;}
    }
    frame=requestAnimationFrame(tick);
  }
  function draw(ts){
    const ctx=canvas.getContext('2d');if(!ctx)return;
    const {patient,equipment}=quickLayout(s.variant),goal=quickObjective(s),near=nearest();
    ctx.imageSmoothingEnabled=false;const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),w,h);};
    const text=(t,x,y,size=14,color='#dfebe6')=>{ctx.fillStyle=color;ctx.font=`bold ${size}px monospace`;ctx.fillText(t,x,y);};
    rect(0,0,960,520,'#203b46');for(let x=0;x<960;x+=40)for(let y=0;y<520;y+=40)rect(x+1,y+1,38,38,(x+y)%80?'#28454f':'#2d4a53');
    rect(patient.x-143,35,285,255,'#344e57');rect(patient.x-143,35,285,7,'#f3ad93');rect(equipment.x-143,35,285,255,'#2a4552');rect(equipment.x-143,35,285,7,'#b6abf1');
    text('ROOM 06',patient.x-125,62,16,'#f7bda3');text('ECG EQUIPMENT',equipment.x-125,62,14,'#d0c4ff');
    rect(patient.x-95,85,100,80,'#b0bcb8');rect(patient.x-88,92,85,66,'#e8ecdf');rect(patient.x-82,96,20,56,'#f4f0df');rect(patient.x-55,92,50,66,'#81d7c4');rect(patient.x-79,112,20,24,'#d1a27c');rect(patient.x-80,108,21,7,'#443630');
    const alarm=s.flags.baseline&&!s.flags.rechecked;rect(patient.x+28,80,95,70,'#789090');rect(patient.x+34,86,83,56,'#071c23');
    ctx.strokeStyle=alarm?'#ffb49c':'#9ce4cb';ctx.lineWidth=2;ctx.beginPath();for(let x=0;x<74;x++){const y=alarm?Math.sin(x*.62)*5+(x%17<3?-13:0):x%24<3?-16:0;ctx.lineTo(patient.x+39+x,112+y);}ctx.stroke();
    text(`HR ${s.current.HR}`,patient.x+40,135,10);text(alarm?'NEW IRREGULAR RHYTHM':s.flags.rechecked?'STILL IRREGULAR':'BASELINE',patient.x-115,270,12,alarm?'#ffd49d':'#bae8dc');
    rect(equipment.x-92,85,182,50,'#7c969b');for(let i=0;i<4;i++)rect(equipment.x-80+i*41,92,30,28,['#e5cf98','#87d4c3','#b0a5e2','#e2aa96'][i]);
    if(!s.carry&&!s.flags.ecg){rect(equipment.x-15,172,45,26,'#91a8ae');rect(equipment.x-10,176,35,13,'#112b35');rect(equipment.x-10,199,6,8,'#091c24');rect(equipment.x+19,199,6,8,'#091c24');}
    rect(340,330,280,18,'#99b7ba');rect(340,330,18,65,'#99b7ba');rect(602,330,18,65,'#99b7ba');text('NURSING STATION',397,376,15);text('K/Mg REQUEST · HANDOFF',381,398,11,'#a6d8cc');
    const target=goal.target==='radio'?null:quickLayout(s.variant)[goal.target];
    if(target){ctx.strokeStyle='#f6d38f';ctx.lineWidth=3;ctx.setLineDash([7,5]);ctx.beginPath();ctx.ellipse(target.x,target.y+12,56,23,0,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);text('NEXT',target.x-18,target.y+49,12,'#ffe2a4');}
    if(route.length){ctx.fillStyle='#ffe1a4';for(let i=0;i<route.length;i+=3)ctx.fillRect(route[i].x-2,route[i].y-2,4,4);}
    const x=s.player.x,y=s.player.y;rect(x-15,y+18,32,7,'#0a202866');rect(x-7,y-23,18,8,'#423634');rect(x-7,y-15,18,15,'#d6a77f');rect(x-12,y,27,20,'#b3a5ed');rect(x-3,y,10,6,'#7971b4');rect(x-17,y+1,5,13,'#d6a77f');rect(x+15,y+1,5,13,'#d6a77f');rect(x-9,y+19,8,9,'#10252e');rect(x+7,y+19,8,9,'#10252e');rect(x+7,y+4,5,7,'#f6efdf');
    if(s.carry){rect(x+28,y+1,37,23,'#9bb1b6');rect(x+33,y+4,27,12,'#132e36');rect(x+31,y+24,5,5,'#091c24');rect(x+56,y+24,5,5,'#091c24');}
    if(near&&!menu()){rect(250,466,460,33,'#0e2632');text(`${near.label} · A / × / E TO INTERACT`,270,488,14,'#e9e9d8');}
    if(s.paused){rect(0,0,960,520,'#0b1b2377');}
  }
  function destroy(){if(destroyed)return;save();destroyed=true;events.abort();input?.destroy();cancelAnimationFrame(frame);held.clear();route=[];}
  mount();return {destroy};
}
