import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const styles = readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");

function getCssBlock(selector) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = styles.match(new RegExp(`${escapedSelector}\\s*{([\\s\\S]*?)\\n}`));

  assert.ok(match, `Expected CSS block for ${selector}`);
  return match[1];
}

test("blackhole theme uses its own fullscreen canvas backdrop", () => {
  assert.match(getCssBlock(".blackhole-backdrop"), /position:\s*fixed/);
  assert.match(getCssBlock(".blackhole-backdrop"), /pointer-events:\s*none/);
  assert.match(getCssBlock("body.theme-blackhole .blackhole-backdrop"), /opacity:\s*1/);
  assert.match(getCssBlock("body.theme-blackhole .blackhole-backdrop"), /pointer-events:\s*auto/);
});

test("blackhole theme suppresses generic pseudo background layers", () => {
  assert.match(styles, /body\.theme-blackhole::before,\s*body\.theme-blackhole::after\s*{[^}]*opacity:\s*0/s);
});

test("blackhole theme hides the watch face and tap hint", () => {
  assert.match(styles, /body\.theme-blackhole\s+\.watch-face,\s*body\.theme-blackhole\s+\.tap-hint\s*{[^}]*visibility:\s*hidden/s);
  assert.match(styles, /body\.theme-blackhole\s+\.watch-face,\s*body\.theme-blackhole\s+\.tap-hint\s*{[^}]*pointer-events:\s*none/s);
});

test("blackhole theme scopes pointer tracking to the backdrop canvas", () => {
  const stageBlock = getCssBlock("body.theme-blackhole .watch-stage");
  const backdropBlock = getCssBlock("body.theme-blackhole .blackhole-backdrop");

  assert.match(stageBlock, /pointer-events:\s*none/);
  assert.match(backdropBlock, /pointer-events:\s*auto/);
});

test("blackhole theme keeps an unaffected real-time overlay above the canvas", () => {
  const block = getCssBlock(".blackhole-real-time");

  assert.match(block, /position:\s*fixed/);
  assert.match(block, /right:\s*max\(18px,\s*env\(safe-area-inset-right\)\)/);
  assert.match(block, /bottom:\s*max\(16px,\s*env\(safe-area-inset-bottom\)\)/);
  assert.match(block, /z-index:\s*4/);
  assert.match(block, /flex-direction:\s*column/);
  assert.match(block, /align-items:\s*flex-end/);
  assert.match(getCssBlock(".blackhole-real-time-clock"), /color:\s*rgba\(238,\s*198,\s*116,\s*0\.88\)/);
  assert.match(getCssBlock(".blackhole-real-time-clock"), /font-weight:\s*300/);
  assert.match(getCssBlock(".blackhole-real-time-note"), /color:\s*rgba\(214,\s*178,\s*112,\s*0\.68\)/);
  assert.match(getCssBlock(".blackhole-real-time-note"), /font-size:\s*10\.5px/);
  assert.match(getCssBlock("body.theme-blackhole .blackhole-real-time"), /opacity:\s*1/);
});

test("blackhole theme has a dedicated menu swatch", () => {
  assert.match(styles, /\.theme-swatch\[data-theme="blackhole"\]\s+\.theme-swatch-dot/);
  assert.match(styles, /\.menu-trigger\[data-theme="blackhole"\]\s+\.theme-trigger-dot/);
});

test("blackhole menu swatch avoids warm yellow highlights", () => {
  const block = getCssBlock('.theme-swatch[data-theme="blackhole"] .theme-swatch-dot,\n.menu-trigger[data-theme="blackhole"] .theme-trigger-dot');

  assert.doesNotMatch(block, /255,\s*(?:17[0-9]|18[0-9]|19[0-9]|2[0-4][0-9]),\s*(?:[0-9]{1,2}|1[0-8][0-9])/);
});
