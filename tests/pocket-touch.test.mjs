import test from 'node:test';
import assert from 'node:assert/strict';
import {pocketVector,createTouchState,stepTouch} from '../dist/pocket-touch.js';
const event=(type,pointerId=1,x=100,y=200,extra={})=>({type,pointerId,x,y,width:390,height:500,...extra});
const begin=(x=100,y=200)=>stepTouch(createTouchState(),event('down',1,x,y)).state;

test('floating vector has a neutral deadzone and full movement without faster diagonals',()=>{
  assert.deepEqual(pocketVector(3,4),{x:0,y:0,dx:3,dy:4});
  assert.equal(pocketVector(6,0).x,0);
  assert.ok(pocketVector(24,0).x>0&&pocketVector(24,0).x<1);
  assert.equal(pocketVector(1000,0).x,1);
  const diagonal=pocketVector(1000,1000);
  assert.ok(Math.abs(Math.hypot(diagonal.x,diagonal.y)-1)<1e-9);
  assert.ok(Math.abs(Math.hypot(diagonal.dx,diagonal.dy)-42)<1e-9);
});
test('gesture anchors where the finger starts and clamps the displayed knob to the world',()=>{
  const state=begin(385,490),moved=stepTouch(state,event('move',1,900,900));
  assert.equal(moved.frame.active,true);assert.deepEqual(moved.frame.origin,{u:385/390,v:.98});
  assert.ok(moved.frame.knob.u<=1&&moved.frame.knob.v<=1);
  assert.ok(Math.hypot(moved.frame.x,moved.frame.y)<=1.000000001);
});
test('a tap stops immediately and emits one normalized destination',()=>{
  const moved=stepTouch(begin(),event('move',1,102,202));
  const up=stepTouch(moved.state,event('up',1,103,202));
  assert.equal(up.stopped,true);assert.equal(up.frame.active,false);assert.equal(up.frame.x,0);assert.equal(up.frame.y,0);
  assert.deepEqual(up.tap,{u:103/390,v:202/500});assert.equal(up.state.pointerId,null);
  assert.equal(stepTouch(up.state,event('up')).handled,false);
});
test('a drag that returns near its origin never becomes an accidental tap',()=>{
  const moved=stepTouch(begin(),event('move',1,150,200));
  assert.equal(stepTouch(moved.state,event('up',1,100,200)).tap,null);
  assert.equal(stepTouch(begin(),event('up',1,108,200)).tap,null);
});
test('second fingers cannot steal, move or release the current gesture',()=>{
  const state=begin();
  for(const type of ['down','move','up','cancel']){
    const r=stepTouch(state,event(type,2,200,300,{primary:false}));
    assert.equal(r.handled,false);assert.equal(r.state,state);assert.equal(r.tap,null);
  }
  assert.equal(stepTouch(createTouchState(),event('down',2,200,300,{primary:false})).handled,false);
  assert.equal(stepTouch(state,event('up',1,100,200)).stopped,true);
});
test('cancellation and external release always neutralize and never dispatch a tap',()=>{
  const moved=stepTouch(begin(),event('move',1,145,260));
  for(const type of ['cancel','release']){
    const r=stepTouch(moved.state,type==='release'?{type}:event(type,1,145,260));
    assert.equal(r.stopped,true);assert.equal(r.frame.active,false);assert.equal(r.frame.x,0);assert.equal(r.frame.y,0);
    assert.equal(r.state.pointerId,null);assert.equal(r.tap,null);
  }
  const idle=stepTouch(createTouchState(),{type:'release'});assert.equal(idle.frame.x,0);assert.equal(idle.stopped,true);
});
test('invalid movements and out-of-bounds taps remain finite and bounded',()=>{
  const vector=pocketVector(NaN,Infinity);assert.equal(vector.x,0);assert.equal(vector.y,0);
  assert.equal(stepTouch(createTouchState(),event('down',1,100,200,{width:0})).handled,false);
  const state=begin(0,0),up=stepTouch(state,event('up',1,-2,-2));
  assert.deepEqual(up.tap,{u:0,v:0});
});
