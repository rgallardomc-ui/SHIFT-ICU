# Pocket touch — implemented; physical-phone check pending

`createPocketTouch({element,onVector,onTap,onStop,radius:42})` attaches only to
the world canvas and returns `release()` / `destroy()`. Mini-game surfaces own
their separate gestures. Root owns UI wiring and publication.

`onVector` receives `{x,y,active,origin:{u,v},knob:{u,v}}`. The origin is the
finger-down position; the displayed knob stays within a 42 CSS-pixel radius.
Origin/knob use normalized 0–1 canvas coordinates. Movement is normalized to a
unit circle, with a 6px neutral deadzone and proportional speed beyond it.

Pointer-up emits neutral movement and `onStop()` synchronously, then emits
`onTap({u,v})` only when the maximum gesture travel stayed below 8px. This order
allows a deliberate tap to start guided walking after the joystick has stopped.
Other fingers never take ownership. Cancel, lost capture, blur, page hiding,
page exit, resize and explicit release neutralize immediately. The adapter
captures the primary pointer, prevents relevant browser pans and restores its
inline touch-action setting when destroyed.

Seven Node tests verify the pure transition/vector logic: deadzone and diagonal
normalization, floating origin/bounds, tap stop, returning drags, second-pointer
isolation, cancellation/release, and invalid inputs. Syntax also passes. These
are not proof of physical iPhone latency, browser chrome behavior or real-finger
comfort; the integrated game still needs those checks.
