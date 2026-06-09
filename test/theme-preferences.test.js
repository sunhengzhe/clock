import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_THEME_KEY, THEME_STORAGE_KEY, readThemePreference, writeThemePreference } from "../src/theme-preferences.js";
import { groupThemeOptions, resolveThemeKey, themeGroups, themeOptions, themes } from "../src/watch-renderer.js";

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

test("default theme is minimal white", () => {
  assert.equal(DEFAULT_THEME_KEY, "minimal");
});

test("readThemePreference restores a valid stored theme", () => {
  const storage = createStorage({ [THEME_STORAGE_KEY]: "simple-system" });

  assert.equal(readThemePreference(storage, themes), "simple-system");
});

test("readThemePreference falls back when storage is empty or invalid", () => {
  assert.equal(readThemePreference(createStorage(), themes), DEFAULT_THEME_KEY);
  assert.equal(readThemePreference(createStorage({ [THEME_STORAGE_KEY]: "unknown" }), themes), DEFAULT_THEME_KEY);
});

test("writeThemePreference persists only known themes", () => {
  const storage = createStorage();

  assert.equal(writeThemePreference(storage, "minecraft", themes), true);
  assert.equal(readThemePreference(storage, themes), "minecraft");
  assert.equal(writeThemePreference(storage, "unknown", themes), false);
  assert.equal(readThemePreference(storage, themes), "minecraft");
});

test("theme groups cover the theme menu in the intended order", () => {
  const groups = groupThemeOptions(themeOptions, themeGroups);
  const groupedKeys = groups.flatMap((group) => group.options.map((option) => option.key));
  const optionKeys = themeOptions.map((option) => option.key);

  assert.deepEqual(groupedKeys, optionKeys);
  assert.deepEqual(groups.map((group) => group.label), ["光谱", "简约", "像素"]);
  assert.deepEqual(groups[0].options.map((option) => option.key), ["midnight", "sunset", "aurora", "starfield"]);
});

test("system theme resolves to a concrete monochrome theme", () => {
  assert.equal(resolveThemeKey("simple-system", "light"), "minimal");
  assert.equal(resolveThemeKey("simple-system", "dark"), "simple-black");
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
