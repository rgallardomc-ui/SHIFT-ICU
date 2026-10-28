import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMovement, directionFor, repeatDirection, createPadState, chooseGamepad, readPadFrame} from '../dist/controller-input.js';

function pad({id = 'Test standard pad', index = 0, mapping = 'standard', axes = [0, 0], down = [], values = {}} = {}) {
  return {id, index, connected: true, mapping, axes, buttons: Array.from({length: 17}, (_, i) => ({pressed: down.includes(i), value: values[i] ?? (down.includes(i) ? 1 : 0)}))};
}
function ready() {return readPadFrame(pad()).state;}

test('movement rejects invalid input, respects a deadzone and does not make diagonals faster', () => {
  assert.deepEqual(normalizeMovement(NaN, Infinity), {x: 0, y: 0});
  assert.deepEqual(normalizeMovement(.1, .1, .2), {x: 0, y: 0});
  const diagonal = normalizeMovement(1, 1);
  assert.ok(Math.abs(Math.hypot(diagonal.x, diagonal.y) - 1) < .000001);
  assert.deepEqual(normalizeMovement(.4, 0), {x: .4, y: 0});
});

test('stick drift stays neutral and hysteresis prevents flickering near the threshold', () => {
  let frame = readPadFrame(pad({axes: [.2, 0]}));
  assert.equal(frame.status.ready, true); assert.deepEqual(frame.move, {x: 0, y: 0});
  frame = readPadFrame(pad({axes: [.3, 0]}), frame.state, 100);
  assert.equal(frame.move.x, .3);
  frame = readPadFrame(pad({axes: [.2, 0]}), frame.state, 110);
  assert.equal(frame.move.x, .2);
  frame = readPadFrame(pad({axes: [.15, 0]}), frame.state, 120);
  assert.deepEqual(frame.move, {x: 0, y: 0});
});

test('a held connection/activation press cannot confirm before release', () => {
  let frame = readPadFrame(pad({down: [0]}));
  assert.equal(frame.status.ready, false); assert.equal(frame.events.action, false);
  frame = readPadFrame(pad({down: [0]}), frame.state, 1000);
  assert.equal(frame.events.action, false);
  frame = readPadFrame(pad(), frame.state, 1100);
  assert.equal(frame.status.ready, true);
  frame = readPadFrame(pad({down: [0]}), frame.state, 1200);
  assert.equal(frame.events.action, true);
  for (let now = 1210; now < 4000; now += 100) {
    frame = readPadFrame(pad({down: [0]}), frame.state, now);
    assert.equal(frame.events.action, false, 'holding confirm must not select a rerendered next screen');
  }
});

test('each fresh confirm press fires once and standard back/start have separate edges', () => {
  let frame = readPadFrame(pad({down: [0]}), ready(), 10);
  assert.deepEqual(frame.events, {action: true, back: false, pause: false});
  frame = readPadFrame(pad(), frame.state, 20);
  frame = readPadFrame(pad({down: [1]}), frame.state, 30);
  assert.deepEqual(frame.events, {action: false, back: true, pause: false});
  frame = readPadFrame(pad({down: [1, 9]}), frame.state, 40);
  assert.deepEqual(frame.events, {action: false, back: false, pause: true});
  frame = readPadFrame(pad(), frame.state, 50);
  frame = readPadFrame(pad({down: [0]}), frame.state, 60);
  assert.equal(frame.events.action, true);
});

test('disconnect and reconnect release movement and suppress held pause until neutral', () => {
  let frame = readPadFrame(pad({down: [9], axes: [1, 0]}), ready(), 20);
  assert.equal(frame.events.pause, true); assert.equal(frame.move.x, 1);
  frame = readPadFrame(null, frame.state, 30);
  assert.equal(frame.status.connected, false); assert.deepEqual(frame.move, {x: 0, y: 0});
  frame = readPadFrame(pad({down: [9], axes: [1, 0]}), frame.state, 40);
  assert.equal(frame.status.ready, false); assert.equal(frame.events.pause, false); assert.equal(frame.move.x, 0);
  frame = readPadFrame(pad(), frame.state, 50);
  frame = readPadFrame(pad({down: [9]}), frame.state, 60);
  assert.equal(frame.events.pause, true);
});

test('explicit release state also gates held input after focus or mode changes', () => {
  const released = createPadState();
  let frame = readPadFrame(pad({axes: [0, 1], down: [0]}), released, 100);
  assert.equal(frame.navigation, ''); assert.equal(frame.events.action, false);
  frame = readPadFrame(pad(), frame.state, 110);
  frame = readPadFrame(pad({axes: [0, 1]}), frame.state, 120);
  assert.equal(frame.navigation, 'down'); assert.equal(frame.move.y, 1);
});

test('unknown remote mappings and incomplete standard layouts never produce guessed actions', () => {
  const unknown = pad({mapping: '', axes: [1, 1], down: [0, 1, 9, 15]});
  const frame = readPadFrame(unknown, ready(), 100);
  assert.equal(frame.status.connected, true); assert.equal(frame.status.supported, false);
  assert.deepEqual(frame.events, {action: false, back: false, pause: false});
  assert.deepEqual(frame.move, {x: 0, y: 0}); assert.equal(frame.navigation, '');
  assert.equal(readPadFrame({...pad(), buttons: []}).status.supported, false);
});

test('pad selection handles null entries and prefers a known standard mapping', () => {
  const remote = pad({id: 'TV remote', mapping: ''}), standard = pad({index: 2});
  assert.equal(chooseGamepad([null, remote, null, standard]), standard);
  assert.equal(chooseGamepad([null, remote]), remote);
  assert.equal(chooseGamepad([null, {...standard, connected: false}]), null);
});

test('D-pad overrides the stick and diagonal movement stays normalized', () => {
  const frame = readPadFrame(pad({axes: [-1, 0], down: [12, 15]}), ready(), 100);
  assert.ok(frame.move.x > 0 && frame.move.y < 0);
  assert.ok(Math.abs(Math.hypot(frame.move.x, frame.move.y) - 1) < .000001);
  const opposite = readPadFrame(pad({axes: [1, 0], down: [14, 15]}), frame.state, 120);
  assert.deepEqual(opposite.move, {x: 0, y: 0});
});

test('menu navigation repeats after a readable delay without flooding after a stalled frame', () => {
  let state = repeatDirection({}, 'down', 100);
  assert.equal(state.fire, true);
  state = repeatDirection(state, 'down', 459); assert.equal(state.fire, false);
  state = repeatDirection(state, 'down', 460); assert.equal(state.fire, true);
  state = repeatDirection(state, 'down', 579); assert.equal(state.fire, false);
  state = repeatDirection(state, 'down', 580); assert.equal(state.fire, true);
  state = repeatDirection(state, 'down', 10000); assert.equal(state.fire, true);
  state = repeatDirection(state, 'down', 10001); assert.equal(state.fire, false);
  state = repeatDirection(state, '', 10002); assert.equal(state.fire, false);
  state = repeatDirection(state, 'up', 10003); assert.equal(state.fire, true);
});

test('a newly selected controller cannot inherit the previous controller button state', () => {
  let frame = readPadFrame(pad({down: [0]}), ready(), 20);
  assert.equal(frame.events.action, true);
  frame = readPadFrame(pad({id: 'Second standard pad', index: 1, down: [0]}), frame.state, 30);
  assert.equal(frame.status.ready, false); assert.equal(frame.events.action, false);
  frame = readPadFrame(pad({id: 'Second standard pad', index: 1}), frame.state, 40);
  frame = readPadFrame(pad({id: 'Second standard pad', index: 1, down: [0]}), frame.state, 50);
  assert.equal(frame.events.action, true);
});

test('direction choice is deterministic for diagonals and neutral input', () => {
  assert.equal(directionFor(0, 0), ''); assert.equal(directionFor(-1, .5), 'left');
  assert.equal(directionFor(.5, 1), 'down'); assert.equal(directionFor(1, -1), 'up');
});
