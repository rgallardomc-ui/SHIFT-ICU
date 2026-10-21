// Display rules checked against the current CP and 5.5 SmartAssist US IFUs.
// This is a teaching display, not a reconstruction of controller software.
export function deviceDisplay(monitor) {
  if (!monitor) return null;
  const lvAvailable = Number(monitor.p) >= 4;
  return {
    lvAvailable,
    lvText: lvAvailable ? monitor.lv : '— / —',
    lvMessage: lvAvailable
      ? 'Calculated LV estimate; verify the clinical meaning with the patient, position and imaging.'
      : 'Estimated LV is unavailable at P3 and below. Use reliable systemic pressure and the device-team assessment; do not increase support just to reveal a number.',
    aoShape: monitor.pattern === 'deep' ? 'lv' : 'ao',
    lvShape: monitor.pattern === 'shallow' ? 'ao' : monitor.pattern === 'suction' ? 'suction' : 'lv',
    motorShape: ['deep', 'shallow'].includes(monitor.pattern) ? 'flat' : 'motor'
  };
}
