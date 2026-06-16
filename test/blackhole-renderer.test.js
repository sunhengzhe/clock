import assert from "node:assert/strict";
import test from "node:test";

import {
  BLACK_HOLE_FRAGMENT_SHADER,
  createBlackHolePointerTracker,
  createBlackHoleMotionState,
  createBlackHoleTimeDilationState,
  createBlackHoleTextRows,
  createBlackHoleTimeRows,
  formatChineseLunarDate,
  formatLocalizedDateVariants,
  formatTimeVariants,
  getBlackHoleTimeDilationRate,
  getBlackHolePointerTarget,
  getBlackHoleTextRowStyle,
  getBlackHoleMotion,
  getBlackHoleRenderSize,
  getBlackHoleTextMetrics,
  isBlackHolePointerInsideRect,
  isBlackHolePointerTargetIgnored,
  updateBlackHoleMotionState,
  getBlackHoleTextSegmentStyle,
  updateBlackHoleTimeDilationState,
} from "../src/blackhole-renderer.js";

test("blackhole time variants include numeric and Chinese formats", () => {
  const variants = formatTimeVariants(new Date(2026, 5, 16, 9, 32, 20, 123));

  assert.ok(variants.includes("2026 06-16 09:32:20"));
  assert.ok(variants.includes("2026-06-16 09:32:20"));
  assert.ok(variants.includes("2026-06-16 09:32:20.123"));
  assert.ok(variants.includes("二〇二六年六月十六日九点三十二分二十秒"));
  assert.ok(variants.includes("农历丙午年五月初二 09:32:20"));
  assert.ok(variants.includes("农历丙午年五月初二 星期二 2026-06-16"));
  assert.ok(variants.includes("Tuesday, June 16, 2026"));
  assert.ok(variants.includes("Dienstag, 16. Juni 2026"));
  assert.ok(variants.includes("mardi 16 juin 2026"));
  assert.ok(variants.includes("2026年6月16日 火曜日"));
  assert.ok(variants.includes("PRECISION 09:32:20.123"));
  assert.ok(variants.includes("2026-W25-2 ISO 09:32:20"));
  assert.ok(variants.includes("2026 DAY 167 09:32:20"));
  assert.ok(variants.includes("Q2 2026 TUE 09:32:20"));
  assert.equal(variants.filter((variant) => /\d{2}:\d{2}:\d{2}[.,]\d{3}/.test(variant)).length, 2);
  assert.ok(variants.every((variant) => !/\b(?:US|UK|EU|FR|JP|JP ERA)\b/.test(variant)));
  assert.ok(variants.some((variant) => variant.startsWith("UNIX ")));
  assert.ok(variants.some((variant) => variant.startsWith("JD ")));
  assert.ok(variants.length >= 18);
  assert.equal(new Set(variants).size, variants.length);
});

test("blackhole lunar formatter renders Chinese lunar dates", () => {
  assert.equal(formatChineseLunarDate(new Date(2026, 5, 16, 9, 32, 20)), "农历丙午年五月初二");
});

test("blackhole localized formatters use weekday names without country labels", () => {
  const date = new Date(2026, 5, 16, 9, 32, 20, 123);
  const localized = formatLocalizedDateVariants(date);

  assert.equal(localized.american, "Tuesday, June 16, 2026");
  assert.equal(localized.british, "16 June 2026, Tuesday");
  assert.equal(localized.german, "Dienstag, 16. Juni 2026");
  assert.equal(localized.french, "mardi 16 juin 2026");
  assert.equal(localized.japanese, "2026年6月16日 火曜日");
  assert.equal(localized.preciseClock, "09:32:20.123");
});

test("blackhole text rows mix multiple time formats inline", () => {
  const rows = createBlackHoleTextRows({ columns: 72, rows: 12, date: new Date(2026, 5, 16, 9, 32, 20) });

  assert.ok(rows.every((row) => row.text.length >= 72));
  assert.ok(rows.every((row) => row.tier === "inline"));
  assert.ok(rows.every((row) => new Set(row.segments.map((segment) => segment.tier).filter((tier) => tier !== "separator")).size >= 4));
  assert.ok(rows.some((row) => row.text.includes("农历丙午年五月初二")));
  assert.ok(rows.some((row) => row.text.includes("Tuesday, June 16, 2026")));
  assert.ok(rows.some((row) => row.text.includes("火曜日")));
  assert.ok(rows.some((row) => row.text.includes(" · ")));
});

test("blackhole lunar text keeps weekday without UTC suffix", () => {
  const rows = createBlackHoleTextRows({
    columns: 96,
    date: new Date(2026, 5, 16, 9, 32, 20),
    orderSeed: "stable-lunar-weekday",
    rows: 8,
  });
  const text = rows.map((row) => row.text).join("\n");

  assert.match(text, /农历丙午年五月初二 星期二/);
  assert.doesNotMatch(text, /农历丙午年五月初二 UTC[+-]\d{2}:\d{2}/);
});

test("blackhole text rows repeat inline time groups with restrained spacing", () => {
  const rows = createBlackHoleTextRows({ columns: 72, rows: 12, date: new Date(2026, 5, 16, 9, 32, 20) });

  assert.ok(rows.every((row) => row.gapAfter <= 0.18));
  assert.ok(rows.some((row) => row.gapAfter > 0.08));
  assert.ok(rows[5].xShift > rows[0].xShift);
  assert.ok(rows.every((row) => row.segments.filter((segment) => segment.tier === "separator").length >= 3));
});

test("blackhole inline time formats use stable randomized ordering per row", () => {
  const orderSeed = "test-page-entry";
  const first = createBlackHoleTextRows({ columns: 72, rows: 8, date: new Date(2026, 5, 16, 9, 32, 20), orderSeed });
  const second = createBlackHoleTextRows({ columns: 72, rows: 8, date: new Date(2026, 5, 16, 9, 33, 21), orderSeed });
  const tierOrders = first.map((row) => row.segments.map((segment) => segment.tier).filter((tier) => tier !== "separator").slice(0, 6).join("/"));

  assert.deepEqual(tierOrders, second.map((row) => row.segments.map((segment) => segment.tier).filter((tier) => tier !== "separator").slice(0, 6).join("/")));
  assert.ok(new Set(tierOrders).size > 4);
  assert.notEqual(tierOrders[0], "anchor/lunar/world/technical/civic/whisper");
});

test("blackhole inline time formats reshuffle only for a new page seed", () => {
  const date = new Date(2026, 5, 16, 9, 32, 20);
  const first = createBlackHoleTextRows({ columns: 72, rows: 8, date, orderSeed: "first-page-entry" });
  const second = createBlackHoleTextRows({ columns: 72, rows: 8, date, orderSeed: "second-page-entry" });
  const getTierOrders = (rows) => rows.map((row) => row.segments.map((segment) => segment.tier).filter((tier) => tier !== "separator").slice(0, 6).join("/"));

  assert.notDeepEqual(getTierOrders(first), getTierOrders(second));
});

test("blackhole time dilation rate slows down near the shadow", () => {
  const motion = {
    center: { x: 0.12, y: 0.16 },
    shadowRadius: 0.04,
  };
  const nearRate = getBlackHoleTimeDilationRate({
    motion,
    position: { x: 0.12, y: 0.16 },
  });
  const farRate = getBlackHoleTimeDilationRate({
    motion,
    position: { x: 0.9, y: 0.86 },
  });

  assert.ok(nearRate < 0.08);
  assert.ok(farRate > 0.96);
});

test("blackhole local clocks diverge by distance from the shadow", () => {
  const startMs = new Date(2026, 5, 16, 9, 32, 20).getTime();
  const state = createBlackHoleTimeDilationState(startMs);
  const updateOptions = {
    columns: 96,
    height: 720,
    motion: {
      center: { x: 0.08, y: 0.94 },
      shadowRadius: 0.035,
    },
    orderSeed: "stable-page-entry",
    rows: 8,
    width: 1280,
  };

  updateBlackHoleTimeDilationState(state, {
    ...updateOptions,
    date: new Date(startMs),
  });
  updateBlackHoleTimeDilationState(state, {
    ...updateOptions,
    date: new Date(startMs + 1000),
  });

  const elapsedTimes = [...state.clocks.values()].map((clock) => clock.timeMs - startMs);
  assert.equal(elapsedTimes.length, 48);
  assert.ok(Math.min(...elapsedTimes) < 120);
  assert.ok(Math.max(...elapsedTimes) > 920);
});

test("blackhole text styles keep a single font size", () => {
  const tiers = ["anchor", "lunar", "world", "civic", "technical", "whisper", "separator"];

  assert.ok(tiers.every((tier) => !Object.hasOwn(getBlackHoleTextRowStyle(tier), "fontScale")));
  assert.ok(tiers.every((tier) => !Object.hasOwn(getBlackHoleTextRowStyle(tier), "lineScale")));
});

test("blackhole text row styles use distinct chromatic hierarchy", () => {
  const tiers = ["anchor", "lunar", "world", "civic", "technical", "whisper"];
  const colors = new Set(tiers.map((tier) => getBlackHoleTextRowStyle(tier).color));

  assert.equal(colors.size, tiers.length);
  assert.ok(getBlackHoleTextRowStyle("anchor").alpha > getBlackHoleTextRowStyle("world").alpha);
  assert.ok(getBlackHoleTextRowStyle("whisper").alpha < getBlackHoleTextRowStyle("technical").alpha);
  assert.equal(getBlackHoleTextRowStyle("missing"), getBlackHoleTextRowStyle("civic"));
  assert.ok(tiers.every((tier) => getBlackHoleTextRowStyle(tier).alpha >= 0.26));
  assert.match(getBlackHoleTextRowStyle("lunar").color, /^168, 238, 220$/);
  assert.match(getBlackHoleTextRowStyle("technical").color, /^204, 186, 255$/);
  assert.match(getBlackHoleTextRowStyle("whisper").color, /^154, 232, 255$/);
});

test("blackhole technical and localized segments use format-specific accent colors", () => {
  const technicalSegments = [
    { key: "precisionClock", tier: "technical" },
    { key: "unixSeconds", tier: "technical" },
    { key: "julianDay", tier: "technical" },
    { key: "epochMilliseconds", tier: "technical" },
  ];
  const localizedSegments = [
    { key: "germanDate", tier: "world" },
    { key: "frenchDate", tier: "world" },
  ];

  assert.equal(new Set(technicalSegments.map((segment) => getBlackHoleTextSegmentStyle(segment).color)).size, technicalSegments.length);
  assert.notEqual(getBlackHoleTextSegmentStyle(localizedSegments[0]).color, getBlackHoleTextSegmentStyle(localizedSegments[1]).color);
  assert.notEqual(getBlackHoleTextSegmentStyle(technicalSegments[0]).color, getBlackHoleTextRowStyle("technical").color);
});

test("blackhole time rows keep stable row lengths while time content changes", () => {
  const first = createBlackHoleTimeRows({ columns: 48, rows: 4, date: new Date(2026, 5, 16, 9, 32, 20) });
  const second = createBlackHoleTimeRows({ columns: 48, rows: 4, date: new Date(2026, 5, 16, 9, 32, 21) });

  assert.equal(first.length, 4);
  assert.ok(first.every((row) => row.length >= 48));
  assert.notDeepEqual(first, second);
});

test("blackhole render size is capped for lightweight fullscreen animation", () => {
  const size = getBlackHoleRenderSize(1920, 1080, 2);

  assert.ok(size.width <= 1600);
  assert.ok(size.height <= 1000);
  assert.equal(Math.round((size.width / size.height) * 100), Math.round((1920 / 1080) * 100));
});

test("blackhole text metrics cover the whole render texture", () => {
  const metrics = getBlackHoleTextMetrics(1280, 720);

  assert.ok(metrics.columns > 120);
  assert.ok(metrics.rows > 30);
  assert.ok(metrics.fontSize >= 10);
  assert.ok(metrics.lineHeight > metrics.fontSize);
});

test("blackhole shader performs lensed text sampling on the GPU", () => {
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /uniform\s+sampler2D\s+u_text/);
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /uniform\s+vec2\s+u_center/);
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /uniform\s+float\s+u_shadow_radius/);
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /vec3\s+farFieldText/);
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /vec3\s+geodesicScene/);
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /texture2D\(u_text/);
});

test("blackhole shader follows the reference geodesic structure", () => {
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /const\s+float\s+B_CRIT/);
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /const\s+int\s+N_STEPS/);
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /-1\.5\s*\*\s*h2\s*\*\s*x\s*\/\s*\(r2\s*\*\s*r2\s*\*\s*r\)/);
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /side\s*\*\s*previousSide\s*<\s*0\.0/);
  assert.match(BLACK_HOLE_FRAGMENT_SHADER, /coolDiskColor/);
});

test("blackhole motion grows slowly and collapses near the end of a cycle", () => {
  const start = getBlackHoleMotion(0);
  const mid = getBlackHoleMotion(19000);
  const peak = getBlackHoleMotion(33440);
  const collapsed = getBlackHoleMotion(38000);

  assert.ok(mid.shadowRadius > start.shadowRadius);
  assert.ok(peak.shadowRadius > mid.shadowRadius);
  assert.equal(collapsed.shadowRadius, start.shadowRadius);
  assert.ok(start.center.x >= 0.28 && start.center.x <= 0.72);
  assert.ok(start.center.y >= 0.26 && start.center.y <= 0.74);
});

test("blackhole pointer target converts DOM y to shader UV y", () => {
  const topTarget = getBlackHolePointerTarget({
    clientX: 250,
    clientY: 100,
    height: 1000,
    width: 1000,
  });
  const bottomTarget = getBlackHolePointerTarget({
    clientX: 250,
    clientY: 900,
    height: 1000,
    width: 1000,
  });

  assert.equal(topTarget.x, 0.25);
  assert.equal(topTarget.y, 0.9);
  assert.equal(bottomTarget.x, 0.25);
  assert.equal(Number(bottomTarget.y.toFixed(2)), 0.1);
  assert.ok(topTarget.y > bottomTarget.y);
});

test("blackhole pointer target is measured relative to the canvas rect", () => {
  const target = getBlackHolePointerTarget({
    clientX: 260,
    clientY: 140,
    height: 400,
    left: 60,
    top: 40,
    width: 800,
  });

  assert.equal(target.x, 0.25);
  assert.equal(target.y, 0.75);
});

test("blackhole pointer tracking treats the canvas rect as the active area", () => {
  assert.equal(isBlackHolePointerInsideRect({
    clientX: 260,
    clientY: 140,
    height: 400,
    left: 60,
    top: 40,
    width: 800,
  }), true);
  assert.equal(isBlackHolePointerInsideRect({
    clientX: 40,
    clientY: 140,
    height: 400,
    left: 60,
    top: 40,
    width: 800,
  }), false);
});

test("blackhole pointer tracking ignores the theme menu", () => {
  const menuTarget = {
    closest: (selector) => (selector === "#watch-menu" ? { id: "watch-menu" } : null),
  };
  const canvasTarget = {
    closest: () => null,
  };

  assert.equal(isBlackHolePointerTargetIgnored(menuTarget), true);
  assert.equal(isBlackHolePointerTargetIgnored(canvasTarget), false);
  assert.equal(isBlackHolePointerTargetIgnored(null), false);
});

test("blackhole pointer tracker follows window pointer moves over the canvas", () => {
  const previousWindow = globalThis.window;
  const previousDocument = globalThis.document;
  const windowTarget = new EventTarget();
  const documentTarget = new EventTarget();
  const canvas = {
    getBoundingClientRect: () => ({
      height: 400,
      left: 100,
      top: 50,
      width: 800,
    }),
  };

  Object.defineProperty(documentTarget, "visibilityState", {
    configurable: true,
    value: "visible",
  });
  globalThis.window = windowTarget;
  globalThis.document = documentTarget;

  try {
    const tracker = createBlackHolePointerTracker(canvas);
    const event = new Event("pointermove");
    Object.defineProperties(event, {
      clientX: { value: 500 },
      clientY: { value: 250 },
      pointerType: { value: "mouse" },
    });
    windowTarget.dispatchEvent(event);

    assert.deepEqual(tracker.getTarget(), { x: 0.5, y: 0.5 });
    const outEvent = new Event("pointerout");
    Object.defineProperty(outEvent, "relatedTarget", { value: null });
    windowTarget.dispatchEvent(outEvent);

    assert.equal(tracker.getTarget(), null);
    tracker.cleanup();
  } finally {
    globalThis.window = previousWindow;
    globalThis.document = previousDocument;
  }
});

test("blackhole motion eases toward the mouse target when the pointer is inside", () => {
  const state = createBlackHoleMotionState(0);
  state.center = { x: 0.2, y: 0.2 };
  const target = { x: 0.82, y: 0.74 };
  const beforeDistance = Math.hypot(state.center.x - target.x, state.center.y - target.y);
  const motion = updateBlackHoleMotionState(state, {
    pointerTarget: target,
    timestamp: 1000,
  });
  const afterDistance = Math.hypot(motion.center.x - target.x, motion.center.y - target.y);

  assert.ok(afterDistance < beforeDistance);
  assert.ok(motion.center.x > 0.2 && motion.center.x < target.x);
  assert.ok(motion.center.y > 0.2 && motion.center.y < target.y);
});

test("blackhole motion keeps drifting toward random targets without the pointer", () => {
  const state = createBlackHoleMotionState(0);
  state.center = { x: 0.2, y: 0.2 };
  const target = getBlackHoleMotion(12000).center;
  const beforeDistance = Math.hypot(state.center.x - target.x, state.center.y - target.y);
  const motion = updateBlackHoleMotionState(state, {
    timestamp: 12000,
  });
  const afterDistance = Math.hypot(motion.center.x - target.x, motion.center.y - target.y);

  assert.ok(afterDistance < beforeDistance);
  assert.ok(motion.center.x >= 0.2 && motion.center.x <= 0.72);
  assert.ok(motion.center.y >= 0.2 && motion.center.y <= 0.74);
});

test("blackhole motion does not jump on the first pointer frame", () => {
  const state = createBlackHoleMotionState();
  const initialCenter = { ...state.center };
  const motion = updateBlackHoleMotionState(state, {
    pointerTarget: { x: 0.9, y: 0.9 },
    timestamp: 500000,
  });

  assert.deepEqual(motion.center, initialCenter);
});
