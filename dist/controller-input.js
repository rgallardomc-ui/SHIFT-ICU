// Standard Gamepad mapping only. Unknown remotes/controllers are never guessed.
const ENTER_DEADZONE = 0.24;
const EXIT_DEADZONE = 0.17;
const REPEAT_DELAY = 360;
const REPEAT_INTERVAL = 120;

export function normalizeMovement(x = 0, y = 0, deadzone = 0) {
  x = Number.isFinite(x) ? x : 0;
  y = Number.isFinite(y) ? y : 0;
  const length = Math.hypot(x, y);
  if (length <= deadzone) return {x: 0, y: 0};
  const scale = length > 1 ? 1 / length : 1;
  return {x: x * scale, y: y * scale};
}

export function directionFor(x, y) {
  if (!x && !y) return '';
  return Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up');
}

export function repeatDirection(previous = {}, direction = '', now = 0) {
  if (!direction) return {direction: '', nextAt: 0, fire: false};
  if (direction !== previous.direction) return {direction, nextAt: now + REPEAT_DELAY, fire: true};
  if (now >= previous.nextAt) return {direction, nextAt: now + REPEAT_INTERVAL, fire: true};
  return {direction, nextAt: previous.nextAt, fire: false};
}

export function createPadState() {
  return {key: null, armed: false, buttons: [false, false, false], stickActive: false, navigation: {direction: '', nextAt: 0}};
}

const pressed = (pad, index) => !!pad?.buttons?.[index]?.pressed || Number(pad?.buttons?.[index]?.value) > 0.5;

export function chooseGamepad(pads = []) {
  const connected = Array.from(pads).filter(p => p && p.connected !== false);
  return connected.find(p => p.mapping === 'standard') || connected[0] || null;
}

// Pure transition, used by the runtime and tests. All button events are edges.
export function readPadFrame(pad, previous = createPadState(), now = 0) {
  const empty = {move: {x: 0, y: 0}, navigation: '', events: {action: false, back: false, pause: false}};
  if (!pad || pad.connected === false) return {...empty, state: createPadState(), status: {connected: false, id: '', mapping: '', supported: true, ready: false, reason: 'Press a controller button to connect. Keyboard also works.'}};
  const key = `${pad.index ?? 0}:${pad.id || 'Gamepad'}:${pad.mapping || ''}`;
  const supported = pad.mapping === 'standard' && (pad.buttons?.length || 0) >= 16;
  if (!supported) return {...empty, state: {...createPadState(), key}, status: {connected: true, id: pad.id || 'Controller', mapping: pad.mapping || '', supported: false, ready: false, reason: 'Controller layout is not recognized as standard. Use keyboard controls; this remote has not been mapped.'}};
  const same = previous.key === key;
  const state = same ? {...previous, buttons: [...previous.buttons]} : {...createPadState(), key};
  const rawX = Number(pad.axes?.[0]) || 0, rawY = Number(pad.axes?.[1]) || 0;
  const stickLength = Math.hypot(rawX, rawY);
  const stickActive = stickLength > (state.stickActive ? EXIT_DEADZONE : ENTER_DEADZONE);
  const stick = stickActive ? normalizeMovement(rawX, rawY) : {x: 0, y: 0};
  const dpad = [12, 13, 14, 15].some(i => pressed(pad, i));
  const move = dpad ? normalizeMovement(Number(pressed(pad, 15)) - Number(pressed(pad, 14)), Number(pressed(pad, 13)) - Number(pressed(pad, 12))) : stick;
  const buttons = [0, 1, 9].map(i => pressed(pad, i));
  const neutral = !buttons.some(Boolean) && !dpad && !stickActive;
  if (!state.armed && neutral) state.armed = true;
  const ready = state.armed;
  const edges = buttons.map((down, i) => ready && down && !state.buttons[i]);
  const navigation = repeatDirection(state.navigation, ready ? directionFor(move.x, move.y) : '', now);
  state.buttons = buttons;
  state.stickActive = stickActive;
  state.navigation = navigation;
  return {
    state, move: ready ? move : empty.move, navigation: navigation.fire ? navigation.direction : '',
    events: {action: edges[0], back: edges[1], pause: edges[2]},
    status: {connected: true, id: pad.id || 'Gamepad', mapping: 'standard', supported: true, ready, reason: ready ? 'Standard gamepad connected.' : 'Release controller buttons and stick, then press A / Cross.'}
  };
}

const keyDirection = key => ({ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', W: 'up', s: 'down', S: 'down', a: 'left', A: 'left', d: 'right', D: 'right'})[key];
const actionKey = key => ['Enter', ' ', 'Spacebar', 'e', 'E'].includes(key);
const pauseKey = key => ['p', 'P'].includes(key);
const editable = element => !!element && (element.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(element.tagName));

export function createControllerInput({getScope, getMode = () => 'menu', keyboard = true, maxFrameSeconds = 0.1, onMove = () => {}, onAction = () => {}, onBack = () => {}, onPause = () => {}, onStatus = () => {}} = {}) {
  const doc = globalThis.document, win = globalThis.window;
  if (!doc || !win || typeof getScope !== 'function') throw new Error('Controller input requires a browser and getScope().');
  const controller = new AbortController(), signal = controller.signal;
  const frameLimit = Number.isFinite(Number(maxFrameSeconds)) ? Math.max(0.01, Math.min(Number(maxFrameSeconds), 2)) : 0.1;
  const keys = new Set(), directionKeys = new Map();
  let padState = createPadState(), keyboardNavigation = {}, lastMode = getMode(), lastScope = getScope();
  let frame = 0, previousTime = 0, destroyed = false, focused = null, lastStatus = '';

  function visibleControls() {
    const scope = getScope();
    if (!scope) return [];
    const selector = 'button, a[href], input:not([type="hidden"]), select, textarea, [tabindex]';
    const candidates = [...(scope.matches?.(selector) ? [scope] : []), ...scope.querySelectorAll(selector)];
    return candidates.filter(el => !el.disabled && el.getAttribute('aria-disabled') !== 'true' && el.tabIndex >= 0 && !el.closest('[hidden], [inert], [aria-hidden="true"]') && el.getClientRects().length > 0);
  }
  function markFocus(element) {
    if (focused && focused !== element) focused.removeAttribute('data-controller-focus');
    focused = element;
    if (element) element.setAttribute('data-controller-focus', 'true');
  }
  function focus(element) {
    if (!element) return false;
    markFocus(element); element.focus({preventScroll: true}); element.scrollIntoView?.({block: 'nearest', inline: 'nearest'});
    return true;
  }
  function focusFirst() {return focus(visibleControls()[0]);}
  function focusPrimary() {
    const controls = visibleControls();
    return focus(controls.find(el => el.hasAttribute('data-controller-primary')) || controls.find(el => el.hasAttribute('autofocus')) || controls[0]);
  }
  function moveFocus(direction) {
    const controls = visibleControls(); if (!controls.length) return;
    const current = controls.indexOf(doc.activeElement);
    if (current < 0) {focusPrimary(); return;}
    const offset = direction === 'up' || direction === 'left' ? -1 : 1;
    focus(controls[(current + offset + controls.length) % controls.length]);
  }
  function confirm(preferFocused = false) {
    if (getMode() === 'move') {
      const element = doc.activeElement;
      if (preferFocused && element?.matches?.('button, a[href]') && visibleControls().includes(element)) {element.click(); return;}
      onAction(); return;
    }
    const controls = visibleControls();
    const element = controls.includes(doc.activeElement) ? doc.activeElement : controls.find(el => el.hasAttribute('data-controller-primary')) || controls[0];
    if (element) {focus(element); element.click();}
  }
  function release() {
    keys.clear(); directionKeys.clear(); keyboardNavigation = {}; padState = createPadState(); previousTime = 0;
    onMove(0, 0, 0);
  }
  function report(status) {
    const key = JSON.stringify(status);
    if (key !== lastStatus) {lastStatus = key; onStatus(status);}
  }
  function keydown(event) {
    if (destroyed || !getScope() || editable(event.target) || event.altKey || event.ctrlKey || event.metaKey || event.key === 'Tab') return;
    const direction = keyDirection(event.key), isAction = actionKey(event.key), isPause = pauseKey(event.key), isBack = event.key === 'Escape';
    if (!direction && !isAction && !isPause && !isBack) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (event.repeat || keys.has(event.code || event.key)) return;
    keys.add(event.code || event.key);
    if (direction) {
      directionKeys.set(event.code || event.key, direction);
      if (getMode() === 'menu') {moveFocus(direction); keyboardNavigation = {direction, nextAt: performance.now() + REPEAT_DELAY};}
    } else if (isPause) onPause();
    else if (isBack) {if (getMode() === 'move') onPause(); else onBack();}
    else confirm(event.key !== 'e' && event.key !== 'E');
  }
  function keyup(event) {
    keys.delete(event.code || event.key);
    directionKeys.delete(event.code || event.key);
  }
  function tick(now) {
    if (destroyed) return;
    const dt = previousTime ? Math.min(Math.max((now - previousTime) / 1000, 0), frameLimit) : 0;
    previousTime = now;
    const scope = getScope(), mode = getMode();
    if (mode !== lastMode || scope !== lastScope) {release(); lastMode = mode; lastScope = scope;}
    const active = !!scope && !doc.hidden && doc.hasFocus();
    let sample;
    try {
      if (!globalThis.navigator?.getGamepads) sample = {...readPadFrame(null), status: {connected: false, id: '', mapping: '', supported: false, ready: false, reason: 'Gamepad API unavailable here. Keyboard controls are ready.'}};
      else sample = readPadFrame(chooseGamepad(navigator.getGamepads()), padState, now);
    } catch {
      sample = {...readPadFrame(null), status: {connected: false, id: '', mapping: '', supported: false, ready: false, reason: 'The browser is not exposing gamepad input. Focus this page or use the keyboard.'}};
    }
    report(sample.status);
    if (destroyed) return;
    padState = active ? sample.state : createPadState();
    if (active && !editable(doc.activeElement)) {
      const directions = new Set(directionKeys.values());
      const keyboard = normalizeMovement(Number(directions.has('right')) - Number(directions.has('left')), Number(directions.has('down')) - Number(directions.has('up')));
      if (mode === 'move') {
        const combined = normalizeMovement(keyboard.x + sample.move.x, keyboard.y + sample.move.y);
        onMove(combined.x, combined.y, dt);
      } else {
        const direction = directionFor(keyboard.x, keyboard.y);
        keyboardNavigation = repeatDirection(keyboardNavigation, direction, now);
        if (keyboardNavigation.fire) moveFocus(direction);
        else if (!direction && sample.navigation) moveFocus(sample.navigation);
      }
      if (destroyed) return;
      // Pause/back take priority; an accidental chord cannot also confirm.
      if (sample.events.pause) onPause();
      else if (sample.events.back) {if (mode === 'move') onPause(); else onBack();}
      else if (sample.events.action) confirm();
    }
    if (!destroyed) frame = requestAnimationFrame(tick);
  }
  if (keyboard) {
    doc.addEventListener('keydown', keydown, {capture: true, signal});
    doc.addEventListener('keyup', keyup, {capture: true, signal});
  }
  doc.addEventListener('focusin', event => {if (visibleControls().includes(event.target)) markFocus(event.target);}, {signal});
  doc.addEventListener('visibilitychange', () => {if (doc.hidden) release();}, {signal});
  win.addEventListener('blur', release, {signal});
  win.addEventListener('pagehide', release, {signal});
  win.addEventListener('gamepaddisconnected', release, {signal});
  frame = requestAnimationFrame(tick);
  return {release, focusFirst, focusPrimary, destroy() {if (destroyed) return; destroyed = true; cancelAnimationFrame(frame); controller.abort(); release(); markFocus(null);}};
}
