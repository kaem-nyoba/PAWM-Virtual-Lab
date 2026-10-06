const assert = require('node:assert/strict');
const P = require('./physics.js');
let checks = 0;
function near(actual, expected, tolerance = 1e-9) { assert.ok(Math.abs(actual - expected) < tolerance, `${actual} differs from ${expected}`); checks++; }

// Known closed-form result: launch and landing at equal heights.
const equalHeight = { angle: 45, speed: 10, distance: 8, height: 0 };
near(P.metrics(equalHeight).range, 100 / P.G);
near(P.metrics(equalHeight).time, 2 * 10 * Math.sin(Math.PI / 4) / P.G);
near(P.metrics(equalHeight).height, 25 / P.G);

// Landing root, apex and constant horizontal velocity across the control domain.
for (const angle of [10, 30, 45, 60, 80]) {
  for (const speed of [3, 9.6, 18]) {
    for (const height of [1, 1.9, 2.5, 4.3, 4.9]) {
      const p = { angle, speed, height, distance: 8 };
      const m = P.metrics(p), c = P.components(p);
      near(P.position(p, m.time).y, 0);
      near(P.position(p, c.vy / P.G).y, m.height);
      near(P.position(p, c.vy / P.G).vy, 0);
      near(P.position(p, 0).vx, P.position(p, 1).vx);
      const out = P.outcome(p);
      assert.ok(out.time > 0 && out.time <= m.time && Number.isFinite(out.time)); checks++;
      if (out.type === 'ground') near(P.position(p, out.time).y, P.HOOP.ballRadius);
    }
  }
}

// Every challenge admits a physically reachable centered, descending shot.
for (const distance of [5, 8, 10]) {
  const angle = 60, height = 1.9, theta = angle * Math.PI / 180;
  const speed = Math.sqrt(P.G * distance ** 2 / (2 * Math.cos(theta) ** 2 * (distance * Math.tan(theta) - (P.HOOP.y - height))));
  const p = { angle, speed, height, distance };
  const out = P.outcome(p);
  assert.equal(out.type, 'score'); checks++;
  near(P.position(p, out.time).x, P.HOOP.x);
  near(P.position(p, out.time).y, P.HOOP.y);
  assert.ok(P.position(p, out.time).vy < 0); checks++;
  // Rounded control inputs must also permit an actual winning shot.
  assert.equal(P.outcome({ ...p, speed: Number(speed.toFixed(1)) }).type, 'score'); checks++;
}

assert.equal(P.outcome({ angle: 48, speed: 9.6, distance: 8, height: 1.9 }).type, 'rim'); checks++;
assert.equal(P.outcome({ angle: 10, speed: 3, distance: 8, height: 1.9 }).type, 'ground'); checks++;
assert.equal(P.descendingAtHeight({ angle: 10, speed: 3, height: 1.9 }, P.HOOP.y), null); checks++;

// A shot that crosses the ring on ascent must not be counted as a basket.
const ascendingTheta = 20 * Math.PI / 180;
const ascending = { angle: 20, speed: Math.sqrt(P.G * 5 ** 2 / (2 * Math.cos(ascendingTheta) ** 2 * (5 * Math.tan(ascendingTheta) - 1.15))), distance: 5, height: 1.9 };
assert.notEqual(P.outcome(ascending).type, 'score'); checks++;
console.log(`PASS: ${checks} physics assertions, all challenge levels reachable.`);
