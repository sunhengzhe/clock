import assert from "node:assert/strict";
import test from "node:test";

import {
  CONSTELLATION_DATA_CREDITS,
  CONSTELLATION_LINE_STYLE,
  getConstellationDisplayLayers,
  getConstellationTiming,
  normalizeRaDeltaDegrees,
  projectConstellation,
  starfieldConstellations,
} from "../src/starfield-constellations.js";

test("starfield constellations use catalogued astronomy data", () => {
  assert.match(CONSTELLATION_DATA_CREDITS.coordinates, /SIMBAD\/CDS/);
  assert.match(CONSTELLATION_DATA_CREDITS.lines, /Stellarium/);
  assert.deepEqual(
    starfieldConstellations.map((constellation) => constellation.name),
    ["北斗七星", "仙后座", "猎户座", "天鹅座", "天琴座", "小熊座", "天鹰座", "南十字座", "狮子座", "天蝎座"],
  );
});

test("requested constellations are appended in the intended order", () => {
  assert.deepEqual(
    starfieldConstellations.slice(4).map((constellation) => constellation.key),
    ["lyra", "ursa-minor", "aquila", "crux", "leo", "scorpius"],
  );
});

test("big dipper uses SIMBAD coordinates for its seven named stars", () => {
  const bigDipper = starfieldConstellations.find((constellation) => constellation.key === "big-dipper");

  assert.equal(bigDipper.stars.length, 7);
  assert.deepEqual(bigDipper.linePaths[0], ["HIP 67301", "HIP 65378", "HIP 62956", "HIP 59774", "HIP 54061", "HIP 53910", "HIP 58001", "HIP 59774"]);
  assert.deepEqual(
    bigDipper.stars.map((star) => star.name),
    ["Dubhe", "Merak", "Phecda", "Megrez", "Alioth", "Mizar", "Alkaid"],
  );
  assert.equal(bigDipper.stars.find((star) => star.name === "Dubhe").ra, 165.93196467);
  assert.equal(bigDipper.stars.find((star) => star.name === "Alkaid").dec, 49.31326673);
});

test("RA deltas wrap across zero degrees", () => {
  assert.equal(normalizeRaDeltaDegrees(2, 358), 4);
  assert.equal(normalizeRaDeltaDegrees(358, 2), -4);
});

test("constellation projection preserves relative star positions inside the viewport", () => {
  const cassiopeia = starfieldConstellations.find((constellation) => constellation.key === "cassiopeia");
  const projected = projectConstellation(cassiopeia, 1200, 800);
  const caph = projected.stars.find((star) => star.name === "Caph");
  const segin = projected.stars.find((star) => star.name === "Segin");

  assert.ok(projected.stars.every((star) => star.x >= 0 && star.x <= 1200 && star.y >= 0 && star.y <= 800));
  assert.ok(projected.linePaths.every((path) => path.length >= 2));
  assert.ok(caph.x > segin.x);
});

test("all constellation line paths resolve to catalogued stars and fit the viewport", () => {
  for (const constellation of starfieldConstellations) {
    const starIds = new Set(constellation.stars.map((star) => star.id));
    const projected = projectConstellation(constellation, 1200, 800);

    assert.ok(constellation.linePaths.flat().every((id) => starIds.has(id)), constellation.name);
    assert.ok(projected.stars.every((star) => star.x >= 0 && star.x <= 1200 && star.y >= 0 && star.y <= 800), constellation.name);
  }
});

test("new constellations include their recognizable anchor stars", () => {
  const anchorsByConstellation = new Map(starfieldConstellations.map((constellation) => [constellation.key, new Set(constellation.stars.map((star) => star.name))]));

  assert.ok(anchorsByConstellation.get("lyra").has("Vega"));
  assert.ok(anchorsByConstellation.get("ursa-minor").has("Polaris"));
  assert.ok(anchorsByConstellation.get("aquila").has("Altair"));
  assert.ok(anchorsByConstellation.get("crux").has("Acrux"));
  assert.ok(anchorsByConstellation.get("leo").has("Regulus"));
  assert.ok(anchorsByConstellation.get("scorpius").has("Antares"));
});

test("constellation timing is deterministic but varied per constellation", () => {
  const timings = starfieldConstellations.map((constellation) => getConstellationTiming(constellation));

  assert.ok(new Set(timings.map((timing) => Math.round(timing.holdMs))).size > 6);
  assert.ok(timings.every((timing) => timing.fadeMs >= 4200 && timing.fadeMs <= 6800));
  assert.ok(timings.every((timing) => timing.gapMs >= 8500 && timing.gapMs <= 17000));
  assert.ok(timings.every((timing) => timing.holdMs >= 18000 && timing.holdMs <= 36000));
});

test("constellation display layer shows at most one constellation at a time", () => {
  const sampledLayers = Array.from({ length: 80 }, (_, index) => getConstellationDisplayLayers(index * 4000, starfieldConstellations));

  assert.ok(sampledLayers.some((layers) => layers.length === 1));
  for (const layers of sampledLayers) {
    assert.ok(layers.length <= 1);
    assert.ok(layers.every((layer) => layer.alpha > 0 && layer.alpha <= 0.82));
  }
});

test("constellation schedule eventually shows every constellation", () => {
  const seenKeys = new Set();
  for (let timestamp = 0; timestamp <= 520000; timestamp += 4000) {
    for (const layer of getConstellationDisplayLayers(timestamp, starfieldConstellations)) {
      seenKeys.add(layer.key);
    }
  }

  assert.deepEqual([...seenKeys].sort(), starfieldConstellations.map((constellation) => constellation.key).sort());
});

test("constellation line style stays visible as a subtle solid guide", () => {
  assert.ok(CONSTELLATION_LINE_STYLE.alpha >= 0.24 && CONSTELLATION_LINE_STYLE.alpha <= 0.3);
  assert.ok(CONSTELLATION_LINE_STYLE.endGapRatio >= 0.05 && CONSTELLATION_LINE_STYLE.endGapRatio <= 0.1);
  assert.equal(Object.hasOwn(CONSTELLATION_LINE_STYLE, "dashMarkScale"), false);
  assert.equal(Object.hasOwn(CONSTELLATION_LINE_STYLE, "dashGapScale"), false);
  assert.ok(CONSTELLATION_LINE_STYLE.minWidth >= 0.5);
  assert.equal(CONSTELLATION_LINE_STYLE.rgb, "188, 216, 255");
});

test("reduced motion keeps a single static constellation", () => {
  const layers = getConstellationDisplayLayers(999999, starfieldConstellations, true);

  assert.equal(layers.length, 1);
  assert.equal(layers[0].key, starfieldConstellations[0].key);
  assert.ok(layers.every((layer) => layer.alpha > 0 && layer.alpha < 0.82));
});
