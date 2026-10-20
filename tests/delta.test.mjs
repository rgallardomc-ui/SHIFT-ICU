import test from 'node:test';
import assert from 'node:assert/strict';
import {CASE_BY_ID} from '../dist/cases.js';
import {newRun, observe, act, albuminVolume} from '../dist/engine.js';
import {deviceDisplay} from '../dist/device.js';

const assess = r => {
  observe(r, 'report');
  observe(r, 'orders');
  for (const o of CASE_BY_ID[r.id].assessments) observe(r, o.id);
};

for (const id of ['impella-hemolysis', 'impella-purge']) {
  test(`${id}: urgent escalation does not wait for routine observations`, () => {
    const r = newRun(id);
    assert.equal(act(r, 'notify').ok, true);
    assert.equal(r.flags.report, undefined);
    assert.equal(r.flags.orders, undefined);
    assert.equal(r.minutes, 19 * 60);
    if (id === 'impella-hemolysis') assert.equal(act(r, 'team').ok, true, 'urgent team review is also available');
  });

  test(`${id}: a mistaken hypothesis cannot unlock cause-specific treatment`, () => {
    const r = newRun(id);
    assess(r);
    act(r, 'notify');
    if (id === 'impella-hemolysis') act(r, 'collect');
    const choice = CASE_BY_ID[id].actions.find(a => a.id === 'interpret').reasoning;
    const snapshot = JSON.stringify({vitals:r.vitals, monitor:r.monitor, minutes:r.minutes});
    assert.equal(act(r, 'interpret').ok, false);
    assert.equal(act(r, 'interpret', 'not-an-option').ok, false);
    for (const wrong of choice.options.filter(o => o.id !== choice.expected)) {
      assert.equal(act(r, 'interpret', wrong.id).ok, false);
      assert.equal(r.flags.interpret, undefined);
      assert.equal(JSON.stringify({vitals:r.vitals, monitor:r.monitor, minutes:r.minutes}), snapshot);
    }
    assert.equal(act(r, 'interpret', choice.expected).ok, true);
  });
}

test('hemolysis: new urine alone cannot satisfy the combined-evidence interpretation', () => {
  const r = newRun('impella-hemolysis');
  observe(r, 'urine');
  assert.equal(act(r, 'interpret', 'hemolysis').ok, false);
  assert.equal(act(r, 'plan').ok, false);
  assert.equal(r.labUpdates['Plasma-free Hgb'], undefined);
});

test('hemolysis: the first response does not invent normalized urine or follow-up labs', () => {
  const r = newRun('impella-hemolysis');
  assess(r);
  for (const a of CASE_BY_ID[r.id].actions.filter(a => !a.unsafe)) {
    assert.equal(act(r, a.id, a.reasoning?.expected).ok, true, a.id);
  }
  assert.equal(r.vitals.MAP, 69);
  assert.equal(r.vitals.UO, 18, 'urine is still the previous hourly measurement');
  assert.equal(r.labUpdates['Plasma-free Hgb'], '72', 'no two-hour laboratory result has occurred');
  assert.match(r.latestResponse.text, /still red-brown/);
  assert.match(r.latestResponse.text, /two hours/);
});

test('purge: continued pump flow does not resolve the purge alarm or permit an unprepared exchange', () => {
  const r = newRun('impella-purge');
  assert.equal(r.monitor.flow, 3.5);
  assert.equal(act(r, 'backup').ok, false);
  assess(r);
  act(r, 'notify');
  act(r, 'disc');
  assert.match(r.alarm, /BACKUP NEEDED/);
  assert.equal(r.monitor.purgeFlow, '—');
  assert.equal(act(r, 'backup').ok, false, 'the pump/purge distinction still needs interpretation');
  act(r, 'interpret', 'purge');
  assert.equal(act(r, 'backup').ok, true);
  assert.equal(r.monitor.purgeFlow, 10);
  assert.equal(r.monitor.flow, 3.5);
  assert.equal(act(r, 'reassess').ok, true);
});

test('CP and 5.5: LV estimates disappear at P3 and below and return after restored support', () => {
  for (const id of ['impella-volume', 'impella-shallow', 'impella-deep']) {
    const r = newRun(id);
    for (const p of [0, 1, 2, 3]) {
      r.monitor.p = p;
      const display = deviceDisplay(r.monitor);
      assert.equal(display.lvAvailable, false);
      assert.equal(display.lvText, '— / —');
    }
    r.monitor.p = 4;
    assert.equal(deviceDisplay(r.monitor).lvAvailable, true);
  }
  const r = newRun('impella-shallow');
  act(r, 'reduce');
  assert.equal(deviceDisplay(r.monitor).lvAvailable, false);
  assess(r);
  act(r, 'notify'); act(r, 'echo'); act(r, 'resolve'); act(r, 'reassess');
  assert.equal(deviceDisplay(r.monitor).lvAvailable, true);
  assert.equal(r.monitor.p, 7);
});

test('responses survive saving and do not disappear from the action timeline', () => {
  const r = newRun('impella-purge');
  act(r, 'notify');
  const restored = JSON.parse(JSON.stringify(r));
  assert.match(restored.latestResponse.text, /backup equipment is ready/);
  assert.equal(restored.history.at(-1).detail, restored.latestResponse.text);
  assert.equal(restored.latestResponse.time, '19:00');
});

test('albumin arithmetic refuses non-finite doses', () => {
  for (const dose of [Infinity, -Infinity, NaN]) assert.equal(albuminVolume(dose, 25), null);
});
