import assert from "node:assert/strict";
import test from "node:test";

import { BLACK_HOLE_REAL_TIME_NOTE, formatBlackHoleRealTime, getBlackHoleRealTimeRefreshDelay } from "../src/blackhole-real-time.js";

test("blackhole real time formats local time as YYYY-MM-DD HH:mm:ss", () => {
  const date = new Date(2026, 5, 16, 9, 3, 7);

  assert.equal(formatBlackHoleRealTime(date), "2026-06-16 09:03:07");
});

test("blackhole real time refreshes just after the next second boundary", () => {
  assert.equal(getBlackHoleRealTimeRefreshDelay(1234), 782);
  assert.equal(getBlackHoleRealTimeRefreshDelay(1999), 17);
});

test("blackhole real time note hints at time dilation", () => {
  assert.match(BLACK_HOLE_REAL_TIME_NOTE, /黑洞/);
  assert.match(BLACK_HOLE_REAL_TIME_NOTE, /时间/);
});
