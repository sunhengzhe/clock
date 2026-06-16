const MAX_DPR = 2;
const MAX_LAYER_ALPHA = 0.82;

export const CONSTELLATION_DATA_CREDITS = {
  coordinates: "SIMBAD/CDS ICRS coordinates",
  lines: "Stellarium western sky culture line paths",
};

export const CONSTELLATION_LINE_STYLE = {
  alpha: 0.26,
  endGapRatio: 0.075,
  minWidth: 0.58,
  rgb: "188, 216, 255",
  widthScale: 0.00105,
};

export const starfieldConstellations = [
  {
    key: "big-dipper",
    name: "北斗七星",
    anchor: { x: 0.32, y: 0.32 },
    box: { width: 0.52, height: 0.34 },
    stars: [
      { id: "HIP 54061", name: "Dubhe", ra: 165.93196467, dec: 61.75103469, mag: 1.79 },
      { id: "HIP 53910", name: "Merak", ra: 165.4603322979729, dec: 56.3824336494964, mag: 2.37 },
      { id: "HIP 58001", name: "Phecda", ra: 178.4576971525, dec: 53.6947597292, mag: 2.44 },
      { id: "HIP 59774", name: "Megrez", ra: 183.856499361267, dec: 57.0326169777361, mag: 3.32 },
      { id: "HIP 62956", name: "Alioth", ra: 193.5072899675, dec: 55.9598229569, mag: 1.77 },
      { id: "HIP 65378", name: "Mizar", ra: 200.98141867, dec: 54.92535197, mag: 2.23 },
      { id: "HIP 67301", name: "Alkaid", ra: 206.88515734, dec: 49.31326673, mag: 1.86 },
    ],
    linePaths: [["HIP 67301", "HIP 65378", "HIP 62956", "HIP 59774", "HIP 54061", "HIP 53910", "HIP 58001", "HIP 59774"]],
  },
  {
    key: "cassiopeia",
    name: "仙后座",
    anchor: { x: 0.62, y: 0.27 },
    box: { width: 0.42, height: 0.28 },
    stars: [
      { id: "HIP 8886", name: "Segin", ra: 28.5988920257, dec: 63.67010006633, mag: 3.37 },
      { id: "HIP 6686", name: "Ruchbah", ra: 21.4539644621, dec: 60.2352840297, mag: 2.68 },
      { id: "HIP 4427", name: "Gamma Cassiopeiae", ra: 14.1772128937, dec: 60.7167400247, mag: 2.39 },
      { id: "HIP 3179", name: "Schedar", ra: 10.1268460076912, dec: 56.5373292170428, mag: 2.23 },
      { id: "HIP 746", name: "Caph", ra: 2.29452158, dec: 59.1497811, mag: 2.27 },
    ],
    linePaths: [["HIP 8886", "HIP 6686", "HIP 4427", "HIP 3179", "HIP 746"]],
  },
  {
    key: "orion",
    name: "猎户座",
    anchor: { x: 0.68, y: 0.48 },
    box: { width: 0.34, height: 0.56 },
    stars: [
      { id: "HIP 27989", name: "Betelgeuse", ra: 88.79293899, dec: 7.407064, mag: 0.42 },
      { id: "HIP 25336", name: "Bellatrix", ra: 81.28276356, dec: 6.34970326, mag: 1.64 },
      { id: "HIP 26207", name: "Meissa", ra: 83.78449002, dec: 9.93415587, mag: 3.66 },
      { id: "HIP 25930", name: "Mintaka", ra: 83.00166706, dec: -0.29909511, mag: 2.41 },
      { id: "HIP 26311", name: "Alnilam", ra: 84.05338894, dec: -1.20191914, mag: 1.69 },
      { id: "HIP 26727", name: "Alnitak", ra: 85.18969443, dec: -1.94257359, mag: 1.77 },
      { id: "HIP 27366", name: "Saiph", ra: 86.9391201683, dec: -9.6696049186, mag: 2.06 },
      { id: "HIP 24436", name: "Rigel", ra: 78.63446707, dec: -8.20163836, mag: 0.13 },
    ],
    linePaths: [
      ["HIP 26727", "HIP 26311", "HIP 25930"],
      ["HIP 27989", "HIP 26727", "HIP 27366", "HIP 24436", "HIP 25930", "HIP 25336", "HIP 26207", "HIP 27989"],
    ],
  },
  {
    key: "cygnus",
    name: "天鹅座",
    anchor: { x: 0.34, y: 0.58 },
    box: { width: 0.48, height: 0.48 },
    stars: [
      { id: "HIP 94779", name: "Kappa Cygni", ra: 289.2757013450687, dec: 53.3684582778131, mag: 3.76 },
      { id: "HIP 95853", name: "Iota Cygni", ra: 292.4264926137312, dec: 51.7297779220522, mag: 3.76 },
      { id: "HIP 97165", name: "Delta Cygni", ra: 296.243653844308, dec: 45.1308146314153, mag: 2.87 },
      { id: "HIP 100453", name: "Sadr", ra: 305.5570909821, dec: 40.2566791564, mag: 2.23 },
      { id: "HIP 102098", name: "Deneb", ra: 310.35797975, dec: 45.28033881, mag: 1.25 },
      { id: "HIP 102488", name: "Gienah", ra: 311.5528011535109, dec: 33.9703283436458, mag: 2.48 },
      { id: "HIP 104732", name: "Zeta Cygni", ra: 318.2341082895136, dec: 30.22689868062, mag: 3.21 },
      { id: "HIP 107310", name: "Mu Cygni", ra: 326.0357402981634, dec: 28.742626869585, mag: 4.5 },
      { id: "HIP 98110", name: "Eta Cygni", ra: 299.0765493221692, dec: 35.0834228854981, mag: 3.88 },
      { id: "HIP 95947", name: "Albireo", ra: 292.6803150140083, dec: 27.9596736312217, mag: 3.08 },
    ],
    linePaths: [
      ["HIP 94779", "HIP 95853", "HIP 97165", "HIP 100453", "HIP 102098"],
      ["HIP 100453", "HIP 102488", "HIP 104732", "HIP 107310"],
      ["HIP 100453", "HIP 98110", "HIP 95947"],
    ],
  },
  {
    key: "lyra",
    name: "天琴座",
    anchor: { x: 0.28, y: 0.28 },
    box: { width: 0.3, height: 0.28 },
    stars: [
      { id: "HIP 91262", name: "Vega", ra: 279.23473479, dec: 38.78368896, mag: 0.03 },
      { id: "HIP 91971", name: "Zeta Lyrae", ra: 281.19315450619, dec: 37.6051216533817, mag: 4.36 },
      { id: "HIP 92420", name: "Sheliak", ra: 282.5199797676482, dec: 33.3626667697778, mag: 3.42 },
      { id: "HIP 93194", name: "Sulafat", ra: 284.7359273443813, dec: 32.6895557406572, mag: 3.25 },
      { id: "HIP 92791", name: "Delta-2 Lyrae", ra: 283.6261778687371, dec: 36.8986199096161, mag: 4.3 },
    ],
    linePaths: [["HIP 91262", "HIP 91971", "HIP 92420", "HIP 93194", "HIP 92791", "HIP 91971"]],
  },
  {
    key: "ursa-minor",
    name: "小熊座",
    anchor: { x: 0.36, y: 0.34 },
    box: { width: 0.44, height: 0.38 },
    stars: [
      { id: "HIP 11767", name: "Polaris", ra: 37.95456067, dec: 89.26410897, mag: 2.02 },
      { id: "HIP 85822", name: "Yildun", ra: 263.0541592214034, dec: 86.5864596055753, mag: 4.34 },
      { id: "HIP 82080", name: "Epsilon Ursae Minoris", ra: 251.49268168439, dec: 82.03725828429, mag: 4.21 },
      { id: "HIP 77055", name: "Zeta Ursae Minoris", ra: 236.0146607057633, dec: 77.7944931248106, mag: 4.27 },
      { id: "HIP 79822", name: "Eta Ursae Minoris", ra: 244.3761260456899, dec: 75.75534307839, mag: 4.95 },
      { id: "HIP 75097", name: "Pherkad", ra: 230.1820980485008, dec: 71.8340254549122, mag: 3 },
      { id: "HIP 72607", name: "Kochab", ra: 222.6763575, dec: 74.15550394, mag: 2.08 },
    ],
    linePaths: [["HIP 11767", "HIP 85822", "HIP 82080", "HIP 77055", "HIP 79822", "HIP 75097", "HIP 72607", "HIP 77055"]],
  },
  {
    key: "aquila",
    name: "天鹰座",
    anchor: { x: 0.62, y: 0.56 },
    box: { width: 0.42, height: 0.42 },
    stars: [
      { id: "HIP 98036", name: "Alshain", ra: 298.8283035123829, dec: 6.406764233985, mag: 3.71 },
      { id: "HIP 97649", name: "Altair", ra: 297.6958273, dec: 8.8683212, mag: 0.76 },
      { id: "HIP 97278", name: "Tarazed", ra: 296.5649123092774, dec: 10.6132587226325, mag: 2.72 },
      { id: "HIP 95501", name: "Delta Aquilae", ra: 291.37458914, dec: 3.11477947, mag: 3.36 },
      { id: "HIP 97804", name: "Eta Aquilae", ra: 298.1182038432421, dec: 1.0056588834764, mag: 3.8 },
      { id: "HIP 99473", name: "Theta Aquilae", ra: 302.8261945487963, dec: -0.8214635937475, mag: 3.22 },
      { id: "HIP 93747", name: "Zeta Aquilae", ra: 286.3525333979, dec: 13.8634772811, mag: 2.99 },
      { id: "HIP 93244", name: "Epsilon Aquilae", ra: 284.90565157805, dec: 15.06828104146, mag: 4.02 },
      { id: "HIP 93805", name: "Lambda Aquilae", ra: 286.56224439258, dec: -4.88256274593, mag: 3.43 },
    ],
    linePaths: [
      ["HIP 98036", "HIP 97649", "HIP 97278"],
      ["HIP 97649", "HIP 95501", "HIP 97804"],
      ["HIP 99473", "HIP 97804"],
      ["HIP 95501", "HIP 93747", "HIP 93244"],
      ["HIP 95501", "HIP 93805"],
    ],
  },
  {
    key: "crux",
    name: "南十字座",
    anchor: { x: 0.7, y: 0.32 },
    box: { width: 0.22, height: 0.3 },
    stars: [
      { id: "HIP 61084", name: "Gacrux", ra: 187.79149838, dec: -57.11321346, mag: 1.64 },
      { id: "HIP 60718", name: "Acrux", ra: 186.6495634, dec: -63.09909286, mag: 0.76 },
      { id: "HIP 62434", name: "Mimosa", ra: 191.93028656, dec: -59.688772, mag: 1.25 },
      { id: "HIP 59747", name: "Imai", ra: 183.786326996115, dec: -58.7489240768383, mag: 2.75 },
    ],
    linePaths: [
      ["HIP 61084", "HIP 60718"],
      ["HIP 62434", "HIP 59747"],
    ],
  },
  {
    key: "leo",
    name: "狮子座",
    anchor: { x: 0.4, y: 0.5 },
    box: { width: 0.5, height: 0.34 },
    stars: [
      { id: "HIP 57632", name: "Denebola", ra: 177.26490976, dec: 14.57205806, mag: 2.13 },
      { id: "HIP 54879", name: "Chertan", ra: 168.5600236272283, dec: 15.4295710864244, mag: 3.35 },
      { id: "HIP 49669", name: "Regulus", ra: 152.09296244, dec: 11.96720878, mag: 1.4 },
      { id: "HIP 49583", name: "Eta Leonis", ra: 151.8331349646567, dec: 16.762663324555, mag: 3.41 },
      { id: "HIP 50583", name: "Algieba", ra: 154.99312733, dec: 19.84148522, mag: 2.01 },
      { id: "HIP 54872", name: "Zosma", ra: 168.52708927, dec: 20.52371814, mag: 2.53 },
      { id: "HIP 50335", name: "Adhafera", ra: 154.1725631843479, dec: 23.4173169889911, mag: 3.41 },
      { id: "HIP 48455", name: "Rasalas", ra: 148.190904223595, dec: 26.00695118609, mag: 3.88 },
      { id: "HIP 47908", name: "Algenubi", ra: 146.4628067368779, dec: 23.7742537771122, mag: 2.98 },
    ],
    linePaths: [
      ["HIP 57632", "HIP 54879", "HIP 49669", "HIP 49583", "HIP 50583", "HIP 54872", "HIP 57632"],
      ["HIP 50583", "HIP 50335", "HIP 48455", "HIP 47908"],
      ["HIP 54872", "HIP 54879"],
    ],
  },
  {
    key: "scorpius",
    name: "天蝎座",
    anchor: { x: 0.6, y: 0.62 },
    box: { width: 0.52, height: 0.52 },
    stars: [
      { id: "HIP 85927", name: "Shaula", ra: 263.40216718, dec: -37.10382355, mag: 1.63 },
      { id: "HIP 86670", name: "Kappa Scorpii", ra: 265.62198, dec: -39.02998308, mag: 2.39 },
      { id: "HIP 87073", name: "Iota-1 Scorpii", ra: 266.8961644595651, dec: -40.1269973623281, mag: 2.99 },
      { id: "HIP 86228", name: "Sargas", ra: 264.32970772, dec: -42.99782799, mag: 1.85 },
      { id: "HIP 84143", name: "Eta Scorpii", ra: 258.0383087285559, dec: -43.2391895309511, mag: 3.33 },
      { id: "HIP 82671", name: "Zeta-1 Scorpii", ra: 253.4988630478699, dec: -42.36202981513, mag: 4.79 },
      { id: "HIP 82514", name: "Mu-1 Scorpii", ra: 252.96761814529, dec: -38.047399464, mag: 2.98 },
      { id: "HIP 82396", name: "Epsilon Scorpii", ra: 252.5408783862, dec: -34.2932315931, mag: 2.29 },
      { id: "HIP 81266", name: "Tau Scorpii", ra: 248.9706368875, dec: -28.2160170875, mag: 2.81 },
      { id: "HIP 80763", name: "Antares", ra: 247.35191542, dec: -26.43200261, mag: 0.91 },
      { id: "HIP 78401", name: "Dschubba", ra: 240.08335535, dec: -22.62170643, mag: 2.32 },
      { id: "HIP 78265", name: "Pi Scorpii", ra: 239.7129718242, dec: -26.114107945, mag: 2.91 },
      { id: "HIP 78820", name: "Acrab", ra: 241.3592999275, dec: -19.8054527828, mag: 2.62 },
    ],
    linePaths: [
      ["HIP 85927", "HIP 86670", "HIP 87073", "HIP 86228", "HIP 84143", "HIP 82671", "HIP 82514", "HIP 82396", "HIP 81266", "HIP 80763", "HIP 78401"],
      ["HIP 80763", "HIP 78265"],
      ["HIP 80763", "HIP 78820"],
    ],
  },
];

export function normalizeRaDeltaDegrees(ra, centerRa) {
  return ((((ra - centerRa) % 360) + 540) % 360) - 180;
}

function circularMeanDegrees(values) {
  const vector = values.reduce(
    (sum, value) => {
      const radians = (value * Math.PI) / 180;
      return {
        x: sum.x + Math.cos(radians),
        y: sum.y + Math.sin(radians),
      };
    },
    { x: 0, y: 0 },
  );

  return (((Math.atan2(vector.y, vector.x) * 180) / Math.PI) + 360) % 360;
}

function smoothStep(value) {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function keyedUnitInterval(key, salt) {
  return hashString(`${key}:${salt}`) / 0xffffffff;
}

export function getConstellationTiming(constellation) {
  return {
    fadeMs: 4200 + keyedUnitInterval(constellation.key, "fade") * 2600,
    gapMs: 8500 + keyedUnitInterval(constellation.key, "gap") * 8500,
    holdMs: 18000 + keyedUnitInterval(constellation.key, "hold") * 18000,
  };
}

function getRelativeStarLayout(constellation) {
  const centerRa = circularMeanDegrees(constellation.stars.map((star) => star.ra));
  const centerDec = constellation.stars.reduce((sum, star) => sum + star.dec, 0) / constellation.stars.length;
  const decScale = Math.cos((centerDec * Math.PI) / 180);
  const points = constellation.stars.map((star) => ({
    ...star,
    x: -normalizeRaDeltaDegrees(star.ra, centerRa) * decScale,
    y: centerDec - star.dec,
  }));
  const bounds = points.reduce(
    (current, point) => ({
      maxX: Math.max(current.maxX, point.x),
      maxY: Math.max(current.maxY, point.y),
      minX: Math.min(current.minX, point.x),
      minY: Math.min(current.minY, point.y),
    }),
    { maxX: -Infinity, maxY: -Infinity, minX: Infinity, minY: Infinity },
  );

  return {
    bounds,
    center: {
      x: (bounds.minX + bounds.maxX) / 2,
      y: (bounds.minY + bounds.maxY) / 2,
    },
    points,
    span: {
      x: Math.max(bounds.maxX - bounds.minX, 0.001),
      y: Math.max(bounds.maxY - bounds.minY, 0.001),
    },
  };
}

export function projectConstellation(constellation, width, height) {
  const layout = getRelativeStarLayout(constellation);
  const fitWidth = width * constellation.box.width;
  const fitHeight = height * constellation.box.height;
  const scale = Math.min(fitWidth / layout.span.x, fitHeight / layout.span.y);
  const starById = new Map(
    layout.points.map((point) => [
      point.id,
      {
        ...point,
        x: width * constellation.anchor.x + (point.x - layout.center.x) * scale,
        y: height * constellation.anchor.y + (point.y - layout.center.y) * scale,
      },
    ]),
  );

  return {
    linePaths: constellation.linePaths.map((path) => path.map((id) => starById.get(id)).filter(Boolean)),
    stars: [...starById.values()],
  };
}

function getLayerAlpha(elapsed, timing) {
  if (elapsed < timing.fadeMs) {
    return smoothStep(elapsed / timing.fadeMs);
  }
  if (elapsed < timing.fadeMs + timing.holdMs) {
    return 1;
  }
  if (elapsed < timing.fadeMs * 2 + timing.holdMs) {
    return 1 - smoothStep((elapsed - timing.fadeMs - timing.holdMs) / timing.fadeMs);
  }

  return 0;
}

export function getConstellationDisplayLayers(timestamp, constellations = starfieldConstellations, reducedMotion = false) {
  if (constellations.length <= 0) {
    return [];
  }

  if (reducedMotion) {
    return [{ alpha: MAX_LAYER_ALPHA * 0.74, index: 0, key: constellations[0].key }];
  }

  const entries = constellations.map((constellation, index) => ({
    constellation,
    index,
    timing: getConstellationTiming(constellation),
  }));
  const totalCycle = entries.reduce((sum, entry) => sum + entry.timing.fadeMs * 2 + entry.timing.holdMs + entry.timing.gapMs, 0);
  let elapsed = ((timestamp % totalCycle) + totalCycle) % totalCycle;

  for (const entry of entries) {
    const slotMs = entry.timing.fadeMs * 2 + entry.timing.holdMs + entry.timing.gapMs;
    if (elapsed >= slotMs) {
      elapsed -= slotMs;
      continue;
    }

    const alpha = getLayerAlpha(elapsed, entry.timing) * MAX_LAYER_ALPHA;
    if (alpha > 0.01) {
      return [{ alpha, index: entry.index, key: entry.constellation.key }];
    }
    return [];
  }

  return [];
}

function resizeCanvas(canvas) {
  const width = Math.max(1, canvas.clientWidth || window.innerWidth || 1);
  const height = Math.max(1, canvas.clientHeight || window.innerHeight || 1);
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  const backingWidth = Math.round(width * dpr);
  const backingHeight = Math.round(height * dpr);

  if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
    canvas.width = backingWidth;
    canvas.height = backingHeight;
  }

  return { dpr, height, width };
}

function drawConnection(ctx, from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const distance = Math.hypot(dx, dy);
  if (distance <= 0.01) {
    return;
  }

  const gap = Math.min(distance * CONSTELLATION_LINE_STYLE.endGapRatio, 12);
  const startX = from.x + (dx / distance) * gap;
  const startY = from.y + (dy / distance) * gap;
  const endX = to.x - (dx / distance) * gap;
  const endY = to.y - (dy / distance) * gap;

  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
}

function drawPath(ctx, path) {
  if (path.length < 2) {
    return;
  }

  for (let index = 1; index < path.length; index += 1) {
    drawConnection(ctx, path[index - 1], path[index]);
  }
}

function drawStar(ctx, star, timestamp) {
  const twinkle = 0.88 + Math.sin(timestamp * 0.0011 + star.ra * 0.13 + star.dec * 0.07) * 0.12;
  const radius = Math.max(0.95, 3.5 - star.mag * 0.42) * twinkle;

  ctx.beginPath();
  ctx.fillStyle = "rgba(235, 246, 255, 0.94)";
  ctx.arc(star.x, star.y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.fillStyle = "rgba(148, 196, 255, 0.14)";
  ctx.arc(star.x, star.y, radius * 2.8, 0, Math.PI * 2);
  ctx.fill();
}

function drawConstellation(ctx, constellation, width, height, alpha, timestamp) {
  const projected = projectConstellation(constellation, width, height);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineWidth = Math.max(CONSTELLATION_LINE_STYLE.minWidth, Math.min(width, height) * CONSTELLATION_LINE_STYLE.widthScale);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.setLineDash([]);
  ctx.strokeStyle = `rgba(${CONSTELLATION_LINE_STYLE.rgb}, ${CONSTELLATION_LINE_STYLE.alpha})`;
  for (const path of projected.linePaths) {
    drawPath(ctx, path);
  }

  for (const star of projected.stars) {
    drawStar(ctx, star, timestamp);
  }
  ctx.restore();
}

export function drawStarfieldConstellations(ctx, width, height, timestamp, reducedMotion = false) {
  ctx.clearRect(0, 0, width, height);
  const layers = getConstellationDisplayLayers(timestamp, starfieldConstellations, reducedMotion);

  for (const layer of layers) {
    drawConstellation(ctx, starfieldConstellations[layer.index], width, height, layer.alpha, timestamp);
  }
}

export function startStarfieldConstellationRenderer({ canvas, getReducedMotion = () => false }) {
  const ctx = canvas.getContext("2d");
  let frameId = 0;
  let stopped = false;

  if (!ctx) {
    return () => {};
  }

  const render = (timestamp) => {
    if (stopped) {
      return;
    }

    const { dpr, height, width } = resizeCanvas(canvas);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawStarfieldConstellations(ctx, width, height, timestamp, getReducedMotion());
    frameId = window.requestAnimationFrame(render);
  };

  frameId = window.requestAnimationFrame(render);

  return () => {
    stopped = true;
    window.cancelAnimationFrame(frameId);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
}
