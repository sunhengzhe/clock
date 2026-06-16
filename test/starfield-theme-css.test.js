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

test("starfield theme defines twinkling atmospheric star layers", () => {
  assert.match(styles, /body\.theme-starfield::before\s*{[^}]*animation:\s*starfield-twinkle/s);
  assert.match(styles, /@keyframes\s+starfield-twinkle/);
});

test("starfield stars are manually scattered instead of tiled", () => {
  assert.doesNotMatch(getCssBlock("body.theme-starfield::before"), /\brepeat\b/);
});

test("starfield background avoids artificial galaxy bands", () => {
  assert.doesNotMatch(getCssBlock("body.theme-starfield"), /linear-gradient\(118deg/);
  assert.doesNotMatch(getCssBlock("body.theme-starfield::after"), /linear-gradient\(118deg/);
});

test("starfield theme defines intermittent meteor layers", () => {
  assert.match(styles, /body\.theme-starfield\s+\.watch-stage::before/s);
  assert.match(styles, /body\.theme-starfield\s+\.watch-stage::after/s);
  assert.match(styles, /@keyframes\s+starfield-meteor/);
});

test("starfield theme has a dedicated constellation canvas layer", () => {
  assert.match(getCssBlock(".starfield-constellations"), /position:\s*fixed/);
  assert.match(getCssBlock(".starfield-constellations"), /pointer-events:\s*none/);
  assert.match(getCssBlock("body.theme-starfield .starfield-constellations"), /opacity:\s*1/);
});

test("starfield meteors are slow and subdued", () => {
  assert.match(styles, /body\.theme-starfield\s+\.watch-stage::before\s*{[\s\S]*?--meteor-duration:\s*30s/);
  assert.match(styles, /body\.theme-starfield\s+\.watch-stage::after\s*{[\s\S]*?--meteor-duration:\s*42s/);
  assert.match(styles, /opacity:\s*0\.42/);
});

test("starfield motion respects reduced motion preference", () => {
  assert.match(styles, /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*body\.theme-starfield::before/s);
  assert.match(styles, /body\.theme-starfield\s+\.watch-stage::before,[\s\S]*body\.theme-starfield\s+\.watch-stage::after[\s\S]*animation:\s*none/s);
});
