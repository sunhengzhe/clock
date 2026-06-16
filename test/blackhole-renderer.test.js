import assert from "node:assert/strict";
import test from "node:test";

import {
  BLACK_HOLE_FRAGMENT_SHADER,
  createBlackHoleTextRows,
  createBlackHoleTimeRows,
  formatChineseLunarDate,
  formatLocalizedDateVariants,
  formatTimeVariants,
  getBlackHoleTextRowStyle,
  getBlackHoleMotion,
  getBlackHoleRenderSize,
  getBlackHoleTextMetrics,
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

test("blackhole text rows use typographic hierarchy instead of a flat list", () => {
  const rows = createBlackHoleTextRows({ columns: 72, rows: 12, date: new Date(2026, 5, 16, 9, 32, 20) });
  const tiers = new Set(rows.map((row) => row.tier));

  assert.ok(rows.every((row) => row.text.length >= 72));
  assert.ok(tiers.has("anchor"));
  assert.ok(tiers.has("lunar"));
  assert.ok(tiers.has("technical"));
  assert.ok(tiers.has("whisper"));
  assert.ok(tiers.has("world"));
  assert.ok(rows.some((row) => row.tier === "lunar" && row.text.includes("农历丙午年五月初二")));
  assert.ok(rows.some((row) => row.tier === "world" && row.text.includes("Tuesday, June 16, 2026")));
  assert.ok(rows.some((row) => row.tier === "world" && row.text.includes("火曜日")));
  assert.ok(rows.some((row) => row.text.includes(" · ")));
});

test("blackhole text rows repeat ordered time groups with breathing room", () => {
  const rows = createBlackHoleTextRows({ columns: 72, rows: 12, date: new Date(2026, 5, 16, 9, 32, 20) });
  const groupTiers = ["anchor", "lunar", "world", "civic", "technical", "whisper"];

  assert.deepEqual(rows.slice(0, 6).map((row) => row.tier), groupTiers);
  assert.deepEqual(rows.slice(6, 12).map((row) => row.tier), groupTiers);
  assert.ok(rows[5].gapAfter > rows[0].gapAfter);
  assert.ok(rows[5].gapAfter < 0.6);
  assert.ok(rows[6].xShift > rows[0].xShift);
});

test("blackhole text rows keep anchor rows visually close", () => {
  const rows = createBlackHoleTextRows({ columns: 72, rows: 12, date: new Date(2026, 5, 16, 9, 32, 20) });
  const anchorStyle = getBlackHoleTextRowStyle("anchor");

  assert.ok(anchorStyle.fontScale < 1.25);
  assert.ok(anchorStyle.lineScale < 1.4);
  assert.ok(rows[6].xShift - rows[0].xShift < 0.7);
});

test("blackhole text row styles use distinct chromatic hierarchy", () => {
  const tiers = ["anchor", "lunar", "world", "civic", "technical", "whisper"];
  const colors = new Set(tiers.map((tier) => getBlackHoleTextRowStyle(tier).color));

  assert.equal(colors.size, tiers.length);
  assert.ok(getBlackHoleTextRowStyle("anchor").alpha > getBlackHoleTextRowStyle("world").alpha);
  assert.ok(getBlackHoleTextRowStyle("whisper").alpha < getBlackHoleTextRowStyle("technical").alpha);
  assert.equal(getBlackHoleTextRowStyle("missing"), getBlackHoleTextRowStyle("civic"));
  assert.match(getBlackHoleTextRowStyle("lunar").color, /^142, 220, 203$/);
  assert.match(getBlackHoleTextRowStyle("technical").color, /^178, 156, 232$/);
  assert.match(getBlackHoleTextRowStyle("whisper").color, /^112, 222, 255$/);
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
