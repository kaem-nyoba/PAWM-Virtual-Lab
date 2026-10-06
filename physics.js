/* Pure SI-unit physics shared by the browser and the verification script. */
(function (root) {
  'use strict';
  const G = 9.81;
  const HOOP = Object.freeze({ x: 12, y: 3.05, halfWidth: 0.225, ballRadius: 0.12, boardX: 12.45, boardBottom: 2.95, boardTop: 4.15 });
  function components(p) { const radians = p.angle * Math.PI / 180; return { vx: p.speed * Math.cos(radians), vy: p.speed * Math.sin(radians) }; }
  function position(p, t) { const { vx, vy } = components(p); return { x: HOOP.x - p.distance + vx * t, y: p.height + vy * t - 0.5 * G * t * t, vx, vy: vy - G * t }; }
  function metrics(p) { const { vx, vy } = components(p); const time = (vy + Math.sqrt(vy * vy + 2 * G * p.height)) / G; return { time, height: p.height + vy * vy / (2 * G), range: vx * time }; }
  function descendingAtHeight(p, height) { const { vy } = components(p); const discriminant = vy * vy + 2 * G * (p.height - height); return discriminant < 0 ? null : (vy + Math.sqrt(discriminant)) / G; }
  // Solve each event analytically so scoring is independent of frame rate.
  function outcome(p) {
    const { vx } = components(p); const events = [];
    const crossing = descendingAtHeight(p, HOOP.y);
    if (crossing !== null && crossing > 0) {
      const at = position(p, crossing); const offset = at.x - HOOP.x;
      if (Math.abs(offset) <= HOOP.halfWidth - HOOP.ballRadius) events.push({ time: crossing, type: 'score', offset });
      else if (Math.abs(offset) <= HOOP.halfWidth + HOOP.ballRadius) events.push({ time: crossing, type: 'rim', offset });
    }
    // Check both ascending and descending crossings of the rim's expanded disk.
    for (const rimX of [HOOP.x - HOOP.halfWidth, HOOP.x + HOOP.halfWidth]) {
      const { vy } = components(p);
      const dx = HOOP.x - p.distance - rimX;
      const a = .25 * G * G;
      const b = -G * vy;
      const c = vx * vx + vy * vy - G * (p.height - HOOP.y);
      const d = 2 * dx * vx + 2 * (p.height - HOOP.y) * vy;
      const e = dx * dx + (p.height - HOOP.y) ** 2 - HOOP.ballRadius ** 2;
      // Collision intervals use fixed substeps plus bisection; never render-frame steps.
      const distanceSquared = t => (((a * t + b) * t + c) * t + d) * t + e;
      const end = metrics(p).time;
      for (let t = 0.005; t <= end + 0.005; t += 0.005) {
        if (distanceSquared(t) <= 0) {
          let lo = t - 0.005, hi = t;
          for (let i = 0; i < 24; i++) { const mid = (lo + hi) / 2; if (distanceSquared(mid) <= 0) hi = mid; else lo = mid; }
          events.push({ time: hi, type: 'rim', offset: position(p, hi).x - HOOP.x }); break;
        }
      }
    }
    const boardTime = (p.distance + HOOP.boardX - HOOP.x - HOOP.ballRadius) / vx;
    if (boardTime > 0) { const at = position(p, boardTime); if (at.y + HOOP.ballRadius >= HOOP.boardBottom && at.y - HOOP.ballRadius <= HOOP.boardTop) events.push({ time: boardTime, type: 'board', offset: at.x - HOOP.x }); }
    // The center is one ball radius above the ground at physical contact.
    const groundTime = descendingAtHeight(p, HOOP.ballRadius);
    events.push({ time: groundTime, type: 'ground', offset: position(p, groundTime).x - HOOP.x });
    events.sort((a, b) => a.time - b.time);
    return events[0];
  }
  const api = Object.freeze({ G, HOOP, components, position, metrics, descendingAtHeight, outcome });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SportsPhysics = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
