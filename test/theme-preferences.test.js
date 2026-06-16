import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_THEME_KEY,
  THEME_QUERY_PARAM,
  buildThemeSearch,
  getThemeSlug,
  readThemeFromSearch,
  resolveThemeKeyFromSlug,
} from "../src/theme-preferences.js";
import { groupThemeOptions, resolveThemeKey, themeGroups, themeOptions, themes } from "../src/watch-renderer.js";

test("default theme is minimal white", () => {
  assert.equal(DEFAULT_THEME_KEY, "minimal");
});

test("readThemeFromSearch restores a valid query theme", () => {
  assert.equal(readThemeFromSearch("?theme=black-hole", themeOptions), "blackhole");
  assert.equal(readThemeFromSearch("?theme=starry-sky", themeOptions), "starfield");
});

test("readThemeFromSearch falls back when the query is empty or invalid", () => {
  assert.equal(readThemeFromSearch("", themeOptions), DEFAULT_THEME_KEY);
  assert.equal(readThemeFromSearch("?theme=unknown", themeOptions), DEFAULT_THEME_KEY);
});

test("theme query uses readable slugs while tolerating legacy keys", () => {
  assert.equal(THEME_QUERY_PARAM, "theme");
  assert.equal(getThemeSlug("minimal", themeOptions), "warm-white");
  assert.equal(resolveThemeKeyFromSlug("warm-white", themeOptions), "minimal");
  assert.equal(resolveThemeKeyFromSlug("minimal", themeOptions), "minimal");
});

test("buildThemeSearch writes the theme slug without dropping other query params", () => {
  assert.equal(buildThemeSearch("?mode=debug", "blackhole", themeOptions), "?mode=debug&theme=black-hole");
  assert.equal(buildThemeSearch("?theme=warm-white&mode=debug", "pixel", themeOptions), "?theme=neon-pixel&mode=debug");
  assert.equal(buildThemeSearch("?mode=debug", "unknown", themeOptions), null);
});

test("theme groups cover the theme menu in the intended order", () => {
  const groups = groupThemeOptions(themeOptions, themeGroups);
  const groupedKeys = groups.flatMap((group) => group.options.map((option) => option.key));
  const optionKeys = themeOptions.map((option) => option.key);
  const optionSlugs = themeOptions.map((option) => option.slug);

  assert.deepEqual([...groupedKeys].sort(), [...optionKeys].sort());
  assert.equal(new Set(groupedKeys).size, optionKeys.length);
  assert.equal(new Set(optionSlugs).size, optionSlugs.length);
  for (const slug of optionSlugs) {
    assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
  }
  assert.deepEqual(groups.map((group) => group.label), ["光谱", "天文", "简约", "像素"]);
  assert.deepEqual(groups[0].options.map((option) => option.key), ["midnight", "sunset", "aurora", "porcelain"]);
  assert.deepEqual(groups[1].options.map((option) => option.key), ["starfield", "blackhole"]);
  assert.deepEqual(groups[1].options.map((option) => option.label), ["星空", "黑洞"]);
});

test("system theme resolves to a concrete monochrome theme", () => {
  assert.equal(resolveThemeKey("simple-system", "light"), "minimal");
  assert.equal(resolveThemeKey("simple-system", "dark"), "simple-black");
});

test("starfield theme uses a hidden tick style", () => {
  assert.equal(themes.starfield.dialStyle, "hidden");
  assert.equal(themes.starfield.minuteRgb, "166, 190, 255");
  assert.equal(themes.starfield.secondRgb, "220, 196, 255");
  assert.notEqual(themes.starfield.minuteRgb, "93, 226, 210");
  assert.equal(themes.midnight.dialStyle, undefined);
});

test("blackhole theme uses a minimal lensed text palette", () => {
  assert.equal(resolveThemeKey("blackhole", "dark"), "blackhole");
  assert.equal(themes.blackhole.bgTop, "#010205");
  assert.equal(themes.blackhole.bgBottom, "#000000");
  assert.equal(themes.blackhole.minuteRgb, "224, 238, 255");
  assert.equal(themes.blackhole.secondRgb, "126, 184, 255");
  assert.equal(themes.blackhole.dialStyle, "dots");
});

test("minimal theme is configured from black and white primitives", () => {
  assert.equal(themes.minimal.monochrome, true);
  assert.equal(themes.minimal.bgTop, "#f4f1e8");
  assert.equal(themes.minimal.bgBottom, "#f4f1e8");
  assert.equal(themes.minimal.minuteRgb, "0, 0, 0");
  assert.equal(themes.minimal.secondRgb, "0, 0, 0");
  assert.equal(themes.minimal.monochromeStrokeRgb, "244, 241, 232");
  assert.equal(themes["simple-black"].bgTop, "#000000");
  assert.equal(themes["simple-black"].minuteRgb, "255, 255, 255");
  assert.equal(themes["simple-black"].monochromeStrokeRgb, "0, 0, 0");
});

test("porcelain theme uses a light craft palette with dedicated hour ink", () => {
  assert.equal(resolveThemeKey("porcelain", "dark"), "porcelain");
  assert.equal(themes.porcelain.pixel, undefined);
  assert.equal(themes.porcelain.monochrome, undefined);
  assert.equal(themes.porcelain.bgTop, "#edf7f1");
  assert.equal(themes.porcelain.bgBottom, "#dbe8e7");
  assert.equal(themes.porcelain.hourRgb, "29, 51, 63");
  assert.equal(themes.porcelain.minuteRgb, "36, 132, 110");
  assert.equal(themes.porcelain.secondRgb, "188, 70, 54");
  assert.equal(themes.porcelain.numberStrokeRgb, "238, 247, 241");
});
