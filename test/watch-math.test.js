import assert from "node:assert/strict";
import test from "node:test";

import {
  clamp01,
  getClockAngles,
  getExpandedCenter,
  lerp,
  normalizeDeg,
  smoothStep,
} from "../src/watch-math.js";

test("clamp01 constrains values into the unit interval", () => {
  assert.equal(clamp01(-0.25), 0);
  assert.equal(clamp01(0.4), 0.4);
  assert.equal(clamp01(1.5), 1);
});

test("lerp interpolates linearly", () => {
  assert.equal(lerp(10, 20, 0), 10);
  assert.equal(lerp(10, 20, 0.5), 15);
  assert.equal(lerp(10, 20, 1), 20);
});

test("smoothStep eases clamped progress", () => {
  assert.equal(smoothStep(-1), 0);
  assert.equal(smoothStep(0), 0);
  assert.equal(smoothStep(0.5), 0.5);
  assert.equal(smoothStep(1), 1);
  assert.equal(smoothStep(2), 1);
});

test("normalizeDeg wraps positive and negative angles", () => {
  assert.equal(normalizeDeg(370), 10);
  assert.equal(normalizeDeg(-10), 350);
  assert.equal(normalizeDeg(720), 0);
});

test("getClockAngles includes sub-second, minute, and hour progress", () => {
  const angles = getClockAngles(new Date(2026, 5, 7, 3, 15, 30, 500));

  assert.equal(angles.secondDeg, 183);
  assert.equal(angles.minuteDeg, 93.05);
  assert.equal(Number(angles.hourDeg.toFixed(4)), 97.7542);
});

test("getExpandedCenter keeps the expanded ring tangent to the hand tip", () => {
  const up = getExpandedCenter(100, 100, 0, 50, 20);
  const right = getExpandedCenter(100, 100, 90, 50, 20, 5);

  assert.deepEqual(up, { x: 100, y: 70 });
  assert.equal(Number(right.x.toFixed(8)), 125);
  assert.equal(Number(right.y.toFixed(8)), 100);
});
