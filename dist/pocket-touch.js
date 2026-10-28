// Floating world movement. Intervention gestures belong to their own surfaces.
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const number=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;

export function pocketVector(dx=0,dy=0,{radius=42,deadzone=6}={}) {
  dx=number(dx);dy=number(dy);radius=Math.max(8,number(radius,42));
  deadzone=clamp(number(deadzone,6),0,radius-1);
  const distance=Math.hypot(dx,dy),direction=distance?{x:dx/distance,y:dy/distance}:{x:0,y:0};
  const magnitude=clamp((distance-deadzone)/(radius-deadzone),0,1),knobDistance=Math.min(distance,radius);
  return {x:direction.x*magnitude,y:direction.y*magnitude,dx:direction.x*knobDistance,dy:direction.y*knobDistance};
}

export const createTouchState=()=>({pointerId:null,origin:null,point:null,maxTravel:0});
const uv=(point,width,height)=>({u:clamp(point.x/width,0,1),v:clamp(point.y/height,0,1)});
const neutral=(origin={u:0,v:0})=>({x:0,y:0,active:false,origin:{...origin},knob:{...origin}});

// Coordinates are CSS pixels relative to the canvas. No DOM or clocks are read.
export function stepTouch(previous=createTouchState(),event={},options={}) {
  const ignored={state:previous,frame:null,tap:null,stopped:false,handled:false};
  const width=number(event.width,previous.origin?.width||1),height=number(event.height,previous.origin?.height||1);
  if(event.type==='release') {
    const anchor=previous.origin?uv(previous.origin,previous.origin.width,previous.origin.height):undefined;
    return {state:createTouchState(),frame:neutral(anchor),tap:null,stopped:true,handled:true};
  }
  if(event.type==='down') {
    if(previous.pointerId!==null||event.primary===false||event.pointerId===null||event.pointerId===undefined||width<=0||height<=0)return ignored;
    const point={x:clamp(number(event.x),0,width),y:clamp(number(event.y),0,height)};
    const state={pointerId:event.pointerId,origin:{...point,width,height},point,maxTravel:0};
    const origin=uv(point,width,height);
    return {state,frame:{...neutral(origin),active:true},tap:null,stopped:false,handled:true};
  }
  if(previous.pointerId===null||event.pointerId!==previous.pointerId)return ignored;
  if(!['move','up','cancel'].includes(event.type))return ignored;
  const point={x:number(event.x,previous.point.x),y:number(event.y,previous.point.y)};
  const dx=point.x-previous.origin.x,dy=point.y-previous.origin.y;
  const maxTravel=Math.max(previous.maxTravel,Math.hypot(dx,dy));
  const origin=uv(previous.origin,width,height);
  if(event.type==='up'||event.type==='cancel') {
    const tap=event.type==='up'&&maxTravel<Math.max(0,number(options.tapDistance,8))?uv(point,width,height):null;
    return {state:createTouchState(),frame:neutral(origin),tap,stopped:true,handled:true};
  }
  const vector=pocketVector(dx,dy,options);
  return {state:{...previous,point,maxTravel},frame:{x:vector.x,y:vector.y,active:true,origin,
    knob:uv({x:previous.origin.x+vector.dx,y:previous.origin.y+vector.dy},width,height)},tap:null,stopped:false,handled:true};
}

export function createPocketTouch({element,onVector=()=>{},onTap=()=>{},onStop=()=>{},radius=42}={}) {
  if(!element?.addEventListener)throw new Error('Pocket touch requires the world canvas.');
  const doc=element.ownerDocument||globalThis.document,win=doc?.defaultView||globalThis.window;
  const controller=new AbortController(),signal=controller.signal,priorTouchAction=element.style.touchAction;
  let state=createTouchState(),destroyed=false;
  element.style.touchAction='none';

  function dropCapture(pointerId) {
    if(pointerId===null)return;
    try{if(element.hasPointerCapture?.(pointerId))element.releasePointerCapture(pointerId);}catch{}
  }
  function dispatch(result,reason) {
    if(!result.handled)return;
    onVector(result.frame);
    if(result.stopped)onStop(reason);
    // Neutral/stop first: a tap may deliberately start guided walking afterward.
    if(result.tap&&!destroyed)onTap(result.tap);
  }
  function eventData(event,type) {
    const rect=element.getBoundingClientRect();
    return {type,pointerId:event.pointerId,primary:event.isPrimary!==false,x:event.clientX-rect.left,y:event.clientY-rect.top,width:rect.width,height:rect.height};
  }
  function down(event) {
    if(destroyed||event.button>0)return;
    const result=stepTouch(state,eventData(event,'down'),{radius});
    if(!result.handled)return;
    event.preventDefault();state=result.state;
    try{element.setPointerCapture?.(event.pointerId);}catch{}
    dispatch(result,'down');
  }
  function handle(event,type) {
    if(destroyed||event.pointerId!==state.pointerId)return;
    const pointerId=state.pointerId,result=stepTouch(state,eventData(event,type),{radius});
    if(!result.handled)return;
    if(event.cancelable)event.preventDefault();state=result.state;
    if(result.stopped)dropCapture(pointerId);
    dispatch(result,type);
  }
  function release(reason='release') {
    const pointerId=state.pointerId,result=stepTouch(state,{type:'release'});
    state=result.state;dropCapture(pointerId);dispatch(result,reason);
  }
  element.addEventListener('pointerdown',down,{signal,passive:false});
  doc.addEventListener('pointermove',event=>handle(event,'move'),{signal,passive:false});
  doc.addEventListener('pointerup',event=>handle(event,'up'),{signal,passive:false});
  doc.addEventListener('pointercancel',event=>handle(event,'cancel'),{signal,passive:false});
  element.addEventListener('lostpointercapture',event=>{if(event.pointerId===state.pointerId)release('capture-lost');},{signal});
  win.addEventListener('blur',()=>release('blur'),{signal});
  win.addEventListener('pagehide',()=>release('pagehide'),{signal});
  win.addEventListener('resize',()=>release('resize'),{signal});
  doc.addEventListener('visibilitychange',()=>{if(doc.hidden)release('hidden');},{signal});
  return {release,destroy(){if(destroyed)return;destroyed=true;controller.abort();release('destroy');if(element.style.touchAction==='none')element.style.touchAction=priorTouchAction;}};
}
