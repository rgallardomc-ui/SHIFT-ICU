import {FLOOR_PODS, PATIENT_BY_ID} from './shift-data.js';

export const WORLD = {width: 1440, height: 900};
const CELL = 20;
const COLS = WORLD.width / CELL, ROWS = WORLD.height / CELL;
export function roomGeometry(number) {
  const i = Number(number) - 1;
  const x = 20 + (i % 6) * 236, y = i < 6 ? 20 : 640;
  return {x, y, width: 220, height: 220, top: i < 6,
    bed: {x: x + 108, y: y + 180}, computer: {x: x + 178, y: y + 179}, device: {x: x + 155, y: y + 100},
    door: {x: x + 110, y: i < 6 ? y + 240 : y - 20}};
}
function barriers() {
  const result = [{x: 470, y: 365, w: 500, h: 140}, {x: 60, y: 350, w: 150, h: 30}, {x: 60, y: 480, w: 150, h: 30}];
  for (let room = 1; room <= 12; room++) {
    const r = roomGeometry(room), doorY = r.top ? r.y + 212 : r.y;
    result.push({x: r.x, y: r.y, w: 8, h: 220}, {x: r.x + 212, y: r.y, w: 8, h: 220});
    result.push({x: r.x, y: r.top ? r.y : r.y + 212, w: 220, h: 8});
    result.push({x: r.x, y: doorY, w: 82, h: 8}, {x: r.x + 146, y: doorY, w: 74, h: 8});
    result.push({x: r.x + 25, y: r.y + 60, w: 78, h: 91}, {x: r.x + 159, y: r.y + 139, w: 40, h: 22});
  }
  return result;
}
const WALLS = barriers();
export function walkAllowed(x, y, radius = 8) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 10 || y < 10 || x > WORLD.width - 10 || y > WORLD.height - 10) return false;
  return !WALLS.some(b => x > b.x - radius && x < b.x + b.w + radius && y > b.y - radius && y < b.y + b.h + radius);
}
function closestCell(point) {
  const col = Math.max(0, Math.min(COLS - 1, Math.floor(point.x / CELL)));
  const row = Math.max(0, Math.min(ROWS - 1, Math.floor(point.y / CELL)));
  for (let radius = 0; radius < 8; radius++) {
    const candidates = [];
    for (let y = Math.max(0, row - radius); y <= Math.min(ROWS - 1, row + radius); y++) {
      for (let x = Math.max(0, col - radius); x <= Math.min(COLS - 1, col + radius); x++) {
        const px = x * CELL + CELL / 2, py = y * CELL + CELL / 2;
        if (walkAllowed(px, py)) candidates.push({x, y, d: Math.hypot(px - point.x, py - point.y)});
      }
    }
    if (candidates.length) return candidates.sort((a, b) => a.d - b.d)[0];
  }
  return null;
}
export function routeBetween(start, goal) {
  const a = closestCell(start), b = closestCell(goal);
  if (!a || !b) return [];
  const key = (x, y) => y * COLS + x;
  const from = key(a.x, a.y), to = key(b.x, b.y);
  const queue = [from], previous = new Map([[from, null]]);
  for (let head = 0; head < queue.length && !previous.has(to); head++) {
    const at = queue[head], x = at % COLS, y = Math.floor(at / COLS);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, id = key(nx, ny);
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || previous.has(id) || !walkAllowed(nx * CELL + 10, ny * CELL + 10)) continue;
      previous.set(id, at); queue.push(id);
    }
  }
  if (!previous.has(to)) return [];
  const route = [];
  for (let at = to; at !== null; at = previous.get(at)) route.push({x: at % COLS * CELL + 10, y: Math.floor(at / COLS) * CELL + 10});
  return route.reverse();
}
export function moveNurse(player, dx, dy, seconds) {
  const dt = Math.max(0, Math.min(Number(seconds) || 0, 0.05));
  const length = Math.hypot(dx, dy) || 1, distance = 235 * dt;
  const nx = player.x + dx / length * distance, ny = player.y + dy / length * distance;
  if (walkAllowed(nx, player.y)) player.x = nx;
  if (walkAllowed(player.x, ny)) player.y = ny;
}
export function interactionTargets(shift) {
  const targets = [
    {kind: 'station', label: 'Nursing station · report / charts', x: 700, y: 540},
    {kind: 'charge', label: 'Talk to charge nurse', x: 1100, y: 420},
    {kind: 'supply', label: 'Supply room · pack your cart', x: 235, y: 425}
  ];
  for (const p of shift.patients) {
    const r = roomGeometry(p.room);
    targets.push({kind: 'bed', room: p.room, label: `Room ${p.room} · bedside`, ...r.bed});
    targets.push({kind: 'computer', room: p.room, label: `Room ${p.room} · computer`, ...r.computer});
  }
  if (shift.admission && !shift.admission.accepted) {
    const r = roomGeometry(shift.admission.room);
    targets.push({kind: 'admission', room: shift.admission.room, label: `Room ${shift.admission.room} · prepare admission`, ...r.bed});
  }
  return targets;
}
export function nearestTarget(shift, range = 82) {
  return interactionTargets(shift).map(t => ({...t, distance: Math.hypot(t.x - shift.player.x, t.y - shift.player.y)})).filter(t => t.distance <= range).sort((a, b) => a.distance - b.distance)[0] || null;
}

export function drawFloor(canvas, shift, path = [], timestamp = 0) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const width = canvas.clientWidth || 900, height = canvas.clientHeight || 500;
  const dpr = Math.min(globalThis.devicePixelRatio || 1, 2);
  if (canvas.width !== Math.round(width * dpr) || canvas.height !== Math.round(height * dpr)) {
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  }
  const scale = width < 600 ? 0.86 : 0.94;
  const viewW = width / scale, viewH = height / scale;
  const camera = {
    x: Math.max(0, Math.min(WORLD.width - viewW, shift.player.x - viewW / 2)),
    y: Math.max(0, Math.min(WORLD.height - viewH, shift.player.y - viewH / 2)), scale
  };
  camera.x = Math.max(0, camera.x); camera.y = Math.max(0, camera.y);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, width, height);
  ctx.scale(scale, scale); ctx.translate(-camera.x, -camera.y); ctx.imageSmoothingEnabled = false;
  const pod = FLOOR_PODS[shift.pod];
  const rect = (x, y, w, h, color) => { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
  const label = (text, x, y, size = 14, color = '#eff3eb') => {ctx.fillStyle = color; ctx.font = `bold ${size}px monospace`; ctx.fillText(text, Math.round(x), Math.round(y));};
  const person = (x, y, color, walking = false) => {
    const foot = walking ? Math.sin(timestamp / 90) * 3 : 0;
    rect(x - 12, y + 15, 27, 6, '#09151b66');
    rect(x - 7, y - 22, 18, 7, '#413633'); rect(x - 7, y - 16, 18, 15, '#d5a27c');
    rect(x - 11, y - 1, 26, 20, color); rect(x - 3, y, 10, 5, '#163a4566');
    rect(x - 15, y + 2, 5, 13, '#d5a27c'); rect(x + 15, y + 2, 5, 13, '#d5a27c');
    rect(x - 8, y + 19, 8, 8 + foot, '#101a2a'); rect(x + 6, y + 19, 8, 8 - foot, '#101a2a');
    rect(x + 7, y + 4, 5, 7, '#eff3df');
  };
  rect(0, 0, WORLD.width, WORLD.height, '#263e47');
  for (let x = 0; x < WORLD.width; x += 40) for (let y = 0; y < WORLD.height; y += 40) rect(x + 1, y + 1, 38, 38, ((x + y) / 40) % 2 ? '#2d454e' : '#304951');
  // A central island with space to walk all the way around it.
  rect(475, 373, 500, 140, '#07172055'); rect(470, 365, 500, 140, '#597976');
  rect(480, 374, 480, 120, '#84a5a0'); rect(492, 387, 456, 94, '#243c47');
  for (const x of [510, 670, 830]) {rect(x, 385, 90, 49, '#63848b'); rect(x + 6, 391, 78, 36, '#10242c'); rect(x + 10, 396, 36, 3, pod.color); rect(x + 35, 437, 20, 7, '#a8bfba');}
  label('NURSING STATION', 597, 474, 18); label('REPORT  •  CHARTS', 598, 493, 12, '#adc1c6');
  rect(40, 326, 235, 203, '#19333e'); label('SUPPLIES', 75, 412, 22, '#e6ba70');
  for (const y of [350, 480]) {
    rect(60, y, 150, 30, '#6d817b');
    for (let i = 0; i < 6; i++) {rect(66 + i * 24, y - 14, 18, 19, i % 2 ? '#c6bc8e' : '#8ab2ac'); rect(72 + i * 24, y - 9, 6, 7, '#f3f0df');}
  }
  label('PACK CART →', 73, 440, 14, '#adc1c6');
  label('CHARGE', 1060, 379, 17, pod.color); person(1100, 420, '#76d5ba');
  rect(1180, 355, 32, 40, '#677f68'); rect(1170, 335, 52, 34, '#82a17f');
  for (let number = 1; number <= 12; number++) {
    const r = roomGeometry(number), p = shift.patients.find(x => x.room === number);
    const incoming = shift.admission?.room === number && !shift.admission.accepted;
    const active = !!p || incoming, color = p?.stage === 'changed' ? '#ff8e94' : incoming ? '#e6ba70' : pod.color;
    rect(r.x + 4, r.y + 8, 220, 220, '#07172055'); rect(r.x, r.y, 220, 220, active ? '#243f4b' : '#20343e');
    for (let x = r.x + 10; x < r.x + 210; x += 32) for (let y = r.y + 10; y < r.y + 210; y += 32) rect(x, y, 30, 30, active ? '#294650' : '#243b44');
    rect(r.x, r.y, 220, 8, '#617b83'); rect(r.x, r.y, 8, 220, '#617b83'); rect(r.x + 212, r.y, 8, 220, '#617b83'); rect(r.x, r.y + 212, 220, 8, '#617b83');
    const doorY = r.top ? r.y + 212 : r.y;
    rect(r.x + 82, doorY, 64, 8, active ? color : '#3c5761');
    rect(r.x + 9, r.y + 11, 202, 31, '#142933'); label(`ROOM ${String(number).padStart(2, '0')}`, r.x + 18, r.y + 33, 20, active ? color : '#899da3');
    // Bed, patient, monitor, room computer.
    rect(r.x + 27, r.y + 65, 78, 91, '#0b202966'); rect(r.x + 25, r.y + 60, 78, 91, '#8fa9a7');
    rect(r.x + 30, r.y + 66, 68, 78, '#dae2d6'); rect(r.x + 35, r.y + 69, 58, 20, '#f1eddb');
    if (!incoming) {rect(r.x + 54, r.y + 71, 20, 19, '#c99d7b'); rect(r.x + 53, r.y + 70, 22, 6, '#53413a'); rect(r.x + 32, r.y + 94, 64, 48, active ? pod.color : '#6e858a');}
    rect(r.x + 133, r.y + 51, 60, 43, '#708b92'); rect(r.x + 138, r.y + 56, 50, 32, '#0a2026');
    ctx.strokeStyle = p?.stage === 'changed' ? '#ff8e94' : '#76d5ba'; ctx.lineWidth = 2; ctx.beginPath();
    [[141, 73], [150, 73], [154, 64], [158, 81], [164, 72], [184, 72]].forEach(([x, y], i) => i ? ctx.lineTo(r.x + x, r.y + y) : ctx.moveTo(r.x + x, r.y + y)); ctx.stroke();
    rect(r.x + 157, r.y + 95, 6, 18, '#708b92'); rect(r.x + 148, r.y + 111, 25, 4, '#708b92');
    rect(r.x + 159, r.y + 139, 40, 22, '#718d93'); rect(r.x + 163, r.y + 142, 32, 14, '#123341'); rect(r.x + 166, r.y + 145, 22, 3, '#76d5ba');
    label('PC', r.x + 177, r.y + 193, 12, '#bed0cb');
    if (p) {
      const model = PATIENT_BY_ID[p.profile];
      label(model.icon === 'heart' ? 'CABG' : model.icon === 'dialysis' ? 'SLED' : model.icon === 'evd' ? 'EVD' : model.icon === 'impella' ? 'IMPELLA' : model.icon === 'vent' ? 'VENT' : 'MONITOR', r.x + 17, r.y + 197, 14, '#d8e5df');
      if (model.icon === 'evd') {rect(r.x + 116, r.y + 68, 4, 72, '#b5c8c8'); rect(r.x + 110, r.y + 81, 17, 28, '#e0d8b7'); rect(r.x + 113, r.y + 92, 11, 13, '#d7a7a4');}
      if (model.icon === 'heart') {rect(r.x + 109, r.y + 129, 23, 29, '#a5b9ad'); rect(r.x + 113, r.y + 141, 14, 13, '#ac6c66');}
      if (model.icon === 'dialysis' || model.icon === 'impella' || model.icon === 'vent') {
        rect(r.x + 109, r.y + 117, 38, 40, model.icon === 'dialysis' ? '#8da8bd' : '#b0c1b7'); rect(r.x + 114, r.y + 121, 27, 17, '#16333e');
        rect(r.x + 117, r.y + 124, 20, 3, '#76d5ba'); rect(r.x + 115, r.y + 143, 7, 6, '#e6ba70'); rect(r.x + 132, r.y + 143, 7, 6, '#ed9f86');
      }
      if (p.stage === 'changed') {rect(r.x + 182, r.y + 100, 24, 25, '#a4444d'); label('!', r.x + 189, r.y + 120, 22);}
    } else if (incoming) label('PREPARE BED', r.x + 16, r.y + 196, 15, '#e6ba70');
    else label('OTHER ASSIGNMENT', r.x + 16, r.y + 196, 11, '#899da3');
  }
  if (path.length) {
    ctx.fillStyle = '#e6ba70';
    path.filter((_, i) => i % 2 === 0).forEach(p => ctx.fillRect(p.x - 2, p.y - 2, 4, 4));
    const goal = path.at(-1); ctx.strokeStyle = '#e6ba70'; ctx.lineWidth = 3; ctx.strokeRect(goal.x - 13, goal.y - 13, 26, 26);
  }
  person(shift.player.x, shift.player.y, '#aaa4ee', path.length > 0);
  label('YOU', shift.player.x - 9, shift.player.y - 33, 11, '#f0e3b7');
  const near = nearestTarget(shift);
  if (near) {
    ctx.strokeStyle = '#e6ba70'; ctx.lineWidth = 2;
    ctx.strokeRect(near.x - 20, near.y - 14, 40, 32);
  }
  return camera;
}
