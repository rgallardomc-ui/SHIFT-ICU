# Controller input — implemented, hardware verification pending

`dist/controller-input.js` provides the quick shift's browser input adapter. No
existing save format or clinical engine changes. The exact controller model,
operating system and browser remain unconfirmed; a simulated pad transition test
does not establish real-device compatibility.

## Integration contract

```js
const input = createControllerInput({
  getScope: () => activeRootOrOverlay, // HTMLElement / Document; null yields input
  getMode: () => 'menu',              // 'menu' or 'move'
  keyboard: true,                     // false leaves existing keyboard handlers alone
  maxFrameSeconds: 0.1,               // configurable up to 2s; default 0.1s
  onMove: (x, y, dt) => {},           // normalized vector; dt <= configured cap
  onAction: () => {},                 // world interaction
  onBack: () => {},                   // menu back
  onPause: () => {},                  // Start / P / Escape in world
  onStatus: status => {}             // connection/support/readiness changes
});
```

Returns `destroy()`, `release()`, `focusFirst()` and `focusPrimary()`.
The optional `keyboard` setting defaults to `true`; `keyboard:false` installs no
keyboard listeners while preserving gamepad navigation, for the existing hub.
`maxFrameSeconds` defaults to 0.1 and is bounded between 0.01 and 2 seconds. The
quick shift uses 2 to match its practice clock; its movement engine must retain
collision substeps when consuming that longer frame budget.
`focusPrimary()` prefers a visible enabled `[data-controller-primary]`, then
`[autofocus]`, then the first visible enabled control. Call it after rendering a
menu. The adapter marks the focused element with `data-controller-focus="true"`;
the root UI owns the strong outline CSS. It does not capture native Tab.

`onStatus` receives `{connected, id, mapping, supported, ready, reason}`. A page may
need focus and a controller button press before the browser exposes a connected
pad. Display `reason` when no usable pad is available. A newly exposed controller
must return to neutral before it can activate a screen.

| Input | World | Menus |
|---|---|---|
| Left stick / D-pad | Move | Previous / next control |
| Bottom face button (A / Cross) | Interact | Activate focused control |
| Right face button (B / Circle) | Pause | Back |
| Center-right button (Start / Menu / Options) | Pause | Pause callback |
| Arrows / WASD | Move | Previous / next control |
| E / Enter / Space | Interact | Activate focused control |
| Escape | Pause | Back |
| P | Pause | Pause callback |

Enter/Space on a focused native world button preserves that button's action.
Editable fields keep their native keys. Controls in hidden/inert containers and
disabled controls are omitted. Native scrolling follows focus when necessary.

## Deliberate boundaries and verification

- Only W3C `mapping === 'standard'` pads with the standard control set are used.
  Unknown remote mappings report unsupported and retain keyboard operation.
- Analog deadzone uses entry/exit hysteresis. Menu navigation has a 360 ms initial
  hold delay and 120 ms repeats; confirmation/pause/back are press edges only.
- Blur, hidden page, page exit, mode/scope changes and disconnection release
  movement. A held reconnection button cannot select the next screen.
- Twelve Node checks cover drift/hysteresis, diagonal normalization, held confirm,
  release/reconnect, standard button edges, unknown layouts, pad selection and
  navigation repeat timing. Browser keyboard/focus playtesting and actual gamepad
  testing belong to the integrated build's QA pass.

Primary API references, checked October 28, 2026:

- [W3C Gamepad specification — standard mapping and polling](https://www.w3.org/TR/gamepad/)
- [MDN — Using the Gamepad API](https://developer.mozilla.org/en-US/docs/Web/API/Gamepad_API/Using_the_Gamepad_API)

These sources document the browser API and mapping; they do not certify Rafael's
unidentified controller or make a TV remote equivalent to a gamepad.
