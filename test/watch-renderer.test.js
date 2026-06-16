import assert from "node:assert/strict";
import test from "node:test";

import { getDialTickVisibility, themes } from "../src/watch-renderer.js";

test("dotted dial renders ticks as dots instead of lines", () => {
  assert.deepEqual(getDialTickVisibility(themes.starfield, "minute", 0), {
    dots: 1,
    fine: 0,
    major: 0,
    minor: 0,
  });
});

test("dotted dial keeps line ticks hidden while focused", () => {
  const visibility = getDialTickVisibility(themes.starfield, "second", 1);

  assert.equal(visibility.dots, 1);
  assert.equal(visibility.fine, 0);
  assert.equal(visibility.minor, 0);
  assert.equal(visibility.major, 0);
});

test("standard themes keep mechanical ticks visible", () => {
  assert.deepEqual(getDialTickVisibility(themes.midnight, "minute", 0), {
    dots: 0,
    fine: 1,
    major: 1,
    minor: 1,
  });
});
