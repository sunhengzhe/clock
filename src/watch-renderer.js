import { clamp01, getClockAngles, getExpandedCenter, lerp, normalizeDeg, smoothStep } from "./watch-math.js";

const CANVAS_SCALE = 3;
const MAX_CANVAS_BACKING_SIZE = 3072;
const MAX_PIXEL_CANVAS_BACKING_SIZE = 8192;

export const themes = {
  midnight: {
    bgTop: "#18243b",
    bgBottom: "#04060d",
    glowBlueRgb: "96, 152, 255",
    glowGreenRgb: "64, 206, 170",
    minuteRgb: "64, 224, 178",
    secondRgb: "96, 152, 255",
  },
  sunset: {
    bgTop: "#2b1733",
    bgBottom: "#0b0410",
    glowBlueRgb: "255, 120, 170",
    glowGreenRgb: "255, 178, 92",
    minuteRgb: "255, 154, 92",
    secondRgb: "255, 104, 156",
  },
  aurora: {
    bgTop: "#0c2230",
    bgBottom: "#03100f",
    glowBlueRgb: "80, 220, 255",
    glowGreenRgb: "120, 255, 170",
    minuteRgb: "120, 255, 176",
    secondRgb: "84, 214, 255",
  },
  starfield: {
    bgTop: "#070d1c",
    bgBottom: "#01030a",
    glowBlueRgb: "64, 118, 210",
    glowGreenRgb: "58, 196, 184",
    minuteRgb: "93, 226, 210",
    secondRgb: "142, 184, 255",
  },
  "simple-system": {
    systemTheme: true,
    lightThemeKey: "minimal",
    darkThemeKey: "simple-black",
  },
  "simple-black": {
    bgTop: "#000000",
    bgBottom: "#000000",
    glowBlueRgb: "255, 255, 255",
    glowGreenRgb: "255, 255, 255",
    minuteRgb: "255, 255, 255",
    secondRgb: "255, 255, 255",
    monochromeStrokeRgb: "0, 0, 0",
    monochrome: true,
  },
  minimal: {
    bgTop: "#f4f1e8",
    bgBottom: "#f4f1e8",
    glowBlueRgb: "244, 241, 232",
    glowGreenRgb: "244, 241, 232",
    minuteRgb: "0, 0, 0",
    secondRgb: "0, 0, 0",
    monochromeStrokeRgb: "244, 241, 232",
    monochrome: true,
  },
  minecraft: {
    bgTop: "#263f25",
    bgBottom: "#11170f",
    glowBlueRgb: "126, 200, 80",
    glowGreenRgb: "139, 91, 49",
    minuteRgb: "106, 170, 78",
    secondRgb: "139, 91, 49",
    pixel: true,
  },
  pixel: {
    bgTop: "#1a1326",
    bgBottom: "#080510",
    glowBlueRgb: "138, 110, 255",
    glowGreenRgb: "92, 255, 150",
    minuteRgb: "92, 255, 150",
    secondRgb: "168, 130, 255",
    pixel: true,
  },
};

export const modes = ["normal", "focus-second", "focus-minute"];

export const themeOptions = [
  { key: "midnight", label: "深空" },
  { key: "sunset", label: "日落" },
  { key: "aurora", label: "极光" },
  { key: "starfield", label: "星空" },
  { key: "simple-system", label: "跟随系统" },
  { key: "simple-black", label: "黑" },
  { key: "minimal", label: "白" },
  { key: "minecraft", label: "我的世界" },
  { key: "pixel", label: "霓虹" },
];

export const themeGroups = [
  { key: "spectrum", label: "光谱", themeKeys: ["midnight", "sunset", "aurora", "starfield"] },
  { key: "minimal", label: "简约", themeKeys: ["simple-system", "simple-black", "minimal"] },
  { key: "pixel", label: "像素", themeKeys: ["minecraft", "pixel"] },
];

export function groupThemeOptions(options = themeOptions, groups = themeGroups) {
  const optionByKey = new Map(options.map((option) => [option.key, option]));

  return groups.map((group) => ({
    ...group,
    options: group.themeKeys.map((key) => optionByKey.get(key)).filter(Boolean),
  }));
}

let secondFocusProgress = 0;
let minuteFocusProgress = 0;
let lastFrameTs = 0;

const secondFocusScale = 3.47;
const minuteFocusScale = 5.64;

const secondFocusGap = 0;

const hourHandTipRatio = 0.2;
const minuteHandTipRatio = 0.38;
const secondHandTipRatio = 0.47;

const rings = {
  hour: {
    key: "hour",
    baseRadiusRatio: 0.29,
    colorMinor: "rgba(243, 248, 255, 0.44)",
    colorMajor: "rgba(243, 248, 255, 0.95)",
    minorLenRatio: 0.02,
    majorLenRatio: 0.031,
    minorWidthRatio: 0.0018,
    majorWidthRatio: 0.0042,
    minorStepDeg: 10,
    majorStepDeg: 30,
    numberColor: "rgba(236, 244, 255, 0.95)",
    numberStroke: "rgba(8, 14, 28, 0.76)",
    numberFamily: '"DIN Alternate", "Avenir Next Condensed", "SF Pro Rounded", "Trebuchet MS", sans-serif',
    numberSizeRatio: 0.021,
    numberWeight: 620,
    numberGapRatio: 0.02,
    numberValues: ["12", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"],
  },
  minute: {
    key: "minute",
    baseRadiusRatio: 0.38,
    colorMinor: "rgba(82, 255, 209, 0.42)",
    colorMajor: "rgba(82, 255, 209, 0.92)",
    minorLenRatio: 0.017,
    majorLenRatio: 0.027,
    minorWidthRatio: 0.0018,
    majorWidthRatio: 0.0044,
    fineColor: "rgba(82, 255, 209, 0)",
    fineLenRatio: 0,
    fineWidthRatio: 0,
    minorStepDeg: 6,
    majorStepDeg: 30,
    fineStepDeg: 1,
    numberColor: "rgba(101, 255, 218, 0.94)",
    numberStroke: "rgba(5, 22, 18, 0.76)",
    numberFamily: '"DIN Alternate", "Avenir Next Condensed", "SF Pro Rounded", "Trebuchet MS", sans-serif',
    numberSizeRatio: 0.023,
    numberWeight: 610,
    numberGapRatio: 0.024,
    numberValues: ["60", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"],
  },
  second: {
    key: "second",
    baseRadiusRatio: 0.47,
    colorMinor: "rgba(103, 174, 255, 0.4)",
    colorMajor: "rgba(103, 174, 255, 0.94)",
    fineColor: "rgba(103, 174, 255, 0)",
    minorLenRatio: 0.014,
    majorLenRatio: 0.021,
    fineLenRatio: 0,
    minorWidthRatio: 0.0018,
    majorWidthRatio: 0.0045,
    fineWidthRatio: 0,
    minorStepDeg: 3,
    majorStepDeg: 30,
    fineStepDeg: 1,
    numberColor: "rgba(133, 193, 255, 0.96)",
    numberStroke: "rgba(7, 16, 32, 0.78)",
    numberFamily: '"DIN Alternate", "Avenir Next Condensed", "SF Pro Rounded", "Trebuchet MS", sans-serif',
    numberSizeRatio: 0.024,
    numberWeight: 610,
    numberGapRatio: 0.026,
    numberValues: ["60", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"],
  },
};

let activeTheme = themes.midnight;

export function getSystemColorScheme() {
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
}

export function resolveThemeKey(themeKey, systemScheme = getSystemColorScheme()) {
  const theme = themes[themeKey] ?? themes.midnight;
  if (!theme.systemTheme) {
    return themes[themeKey] ? themeKey : "midnight";
  }

  return systemScheme === "dark" ? theme.darkThemeKey : theme.lightThemeKey;
}

export function resolveTheme(themeKey, systemScheme) {
  return themes[resolveThemeKey(themeKey, systemScheme)] ?? themes.midnight;
}

function applyRendererTheme(themeKey) {
  activeTheme = resolveTheme(themeKey);
}

function accent(ringKey, alpha) {
  const rgb = ringKey === "minute" ? activeTheme.minuteRgb : activeTheme.secondRgb;
  return `rgba(${rgb}, ${alpha})`;
}

const PIXEL_FONT = '"Silkscreen", "Press Start 2P", "DotGothic16", "Courier New", monospace';

function numberFamily(style) {
  return activeTheme.pixel ? PIXEL_FONT : style.numberFamily;
}

// 像素主题：表盘半径决定一个网格单元的大小，刻度按它对齐成方块。
let pixelCell = 4;

function setPixelCell(faceSize) {
  const rawCell = Math.max(2, Math.round(faceSize * 0.0042));
  pixelCell = rawCell % 2 === 0 ? rawCell : rawCell + 1;
}

function pixelMetric(value, min = pixelCell) {
  return Math.max(min, Math.ceil(value / pixelCell) * pixelCell);
}

function snapDevicePixel(value, dpr) {
  return Math.round(value * dpr) / dpr;
}

function drawPixelTick(ctx, x0, y0, x1, y1, width, color, dpr) {
  const originX = snapDevicePixel(x0, dpr);
  const originY = snapDevicePixel(y0, dpr);
  const targetX = snapDevicePixel(x1, dpr);
  const targetY = snapDevicePixel(y1, dpr);
  const dx = targetX - originX;
  const dy = targetY - originY;
  const len = Math.hypot(dx, dy);
  if (len <= 0) {
    return;
  }

  const thickness = pixelMetric(width);
  const length = pixelMetric(len);
  const edgeBleed = 1;
  ctx.fillStyle = color;
  ctx.save();
  ctx.translate(originX, originY);
  ctx.rotate(Math.atan2(dy, dx));
  ctx.fillRect(-edgeBleed, -thickness / 2 - edgeBleed, length + edgeBleed * 2, thickness + edgeBleed * 2);
  ctx.restore();
}

// 把刻度/数字的固定配色换成跟随主题的强调色（分钟、秒针两套）。
function applyRingAccent(style, ringKey) {
  if (activeTheme.monochrome) {
    const inkRgb = ringKey === "hour" ? activeTheme.minuteRgb : ringKey === "minute" ? activeTheme.minuteRgb : activeTheme.secondRgb;
    style.colorMinor = `rgba(${inkRgb}, 0.34)`;
    style.colorMajor = `rgba(${inkRgb}, 0.92)`;
    style.numberColor = `rgba(${inkRgb}, 0.96)`;
    style.numberStroke = `rgba(${activeTheme.monochromeStrokeRgb}, 0.86)`;
    return;
  }

  if (ringKey === "minute" || ringKey === "second") {
    const pixel = activeTheme.pixel;
    style.colorMinor = accent(ringKey, pixel ? 0.72 : ringKey === "minute" ? 0.42 : 0.4);
    style.colorMajor = accent(ringKey, pixel ? 1 : ringKey === "minute" ? 0.92 : 0.94);
    style.numberColor = accent(ringKey, ringKey === "minute" ? 0.94 : 0.96);
  }
}

function drawTicks(ctx, cx, cy, radius, style, rotationDeg = 0, dpr = 1) {
  const drawRingTicks = (stepDeg, width, length, color) => {
    if (!stepDeg || width <= 0 || length <= 0) {
      return;
    }
    const pixel = activeTheme.pixel;
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    ctx.lineWidth = width;

    for (let deg = 0; deg < 360; deg += stepDeg) {
      const angleDeg = deg + rotationDeg;
      const rad = ((angleDeg - 90) * Math.PI) / 180;
      const outerX = cx + Math.cos(rad) * radius;
      const outerY = cy + Math.sin(rad) * radius;
      const innerX = cx + Math.cos(rad) * (radius - length);
      const innerY = cy + Math.sin(rad) * (radius - length);

      if (pixel) {
        drawPixelTick(ctx, outerX, outerY, innerX, innerY, width, color, dpr);
        continue;
      }

      ctx.beginPath();
      ctx.moveTo(outerX, outerY);
      ctx.lineTo(innerX, innerY);
      ctx.stroke();
    }
  };

  drawRingTicks(style.fineStepDeg, style.fineWidth, style.fineLen, style.fineColor);
  drawRingTicks(style.minorStepDeg, style.minorWidth, style.minorLen, style.colorMinor);
  drawRingTicks(style.majorStepDeg, style.majorWidth, style.majorLen, style.colorMajor);
}

function drawNumbers(ctx, cx, cy, radius, style, rotationDeg = 0) {
  const values = style.numberValues;
  if (!values || values.length !== 12) {
    return;
  }

  ctx.fillStyle = style.numberColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `${style.numberWeight} ${style.numberSize}px ${numberFamily(style)}`;
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(0.8, style.numberSize * 0.1);
  ctx.strokeStyle = style.numberStroke;
  ctx.shadowColor = "rgba(0, 0, 0, 0.24)";
  ctx.shadowBlur = Math.max(1, style.numberSize * 0.12);

  // 数字与主刻度底部拉开一些距离。
  const numberRadius = radius - style.majorLen - style.numberGap;

  for (let i = 0; i < 12; i += 1) {
    const deg = i * 30 + rotationDeg;
    const normalizedDeg = normalizeDeg(deg);
    const rad = ((normalizedDeg - 90) * Math.PI) / 180;
    const x = cx + Math.cos(rad) * numberRadius;
    const y = cy + Math.sin(rad) * numberRadius;

    const isBottomHalf = normalizedDeg > 90 && normalizedDeg < 270;
    const textRotationDeg = normalizedDeg + (isBottomHalf ? 180 : 0);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((textRotationDeg * Math.PI) / 180);
    ctx.strokeText(values[i], 0, 0);
    ctx.fillText(values[i], 0, 0);
    ctx.restore();
  }

  ctx.shadowBlur = 0;
}

function drawDetailNumbers(ctx, cx, cy, radius, style, focusLevel, rotationDeg = 0) {
  if (focusLevel <= 0.01 || (style.key !== "minute" && style.key !== "second")) {
    return;
  }

  const visibility = smoothStep((focusLevel - 0.18) / 0.18);
  if (visibility <= 0.01) {
    return;
  }

  const alpha = (0.14 + 0.56 * focusLevel) * visibility;
  ctx.fillStyle = accent(style.key, alpha.toFixed(3));
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const detailFontSize = style.numberSize;
  ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
  ctx.shadowBlur = Math.max(0.8, detailFontSize * 0.08);
  ctx.font = `${style.numberWeight} ${detailFontSize}px ${numberFamily(style)}`;
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(0.5, detailFontSize * 0.08);
  ctx.strokeStyle = style.numberStroke;

  const detailRadius = radius - style.majorLen - style.numberGap;

  for (let mark = 1; mark < 60; mark += 1) {
    if (mark % 5 === 0) {
      continue;
    }

    const deg = mark * 6 + rotationDeg;
    const normalizedDeg = normalizeDeg(deg);
    const rad = ((normalizedDeg - 90) * Math.PI) / 180;
    const x = cx + Math.cos(rad) * detailRadius;
    const y = cy + Math.sin(rad) * detailRadius;

    const isBottomHalf = normalizedDeg > 90 && normalizedDeg < 270;
    const textRotationDeg = normalizedDeg + (isBottomHalf ? 180 : 0);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate((textRotationDeg * Math.PI) / 180);
    const label = String(mark).padStart(2, "0");
    ctx.strokeText(label, 0, 0);
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }

  ctx.shadowBlur = 0;
}

function drawHand(ctx, centerX, centerY, faceSize, deg, widthRatio, tipRatio, color) {
  const width = Math.max(1, faceSize * widthRatio);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate((deg * Math.PI) / 180);
  // 像素主题用方头加粗指针，保持复古块感又不会逐帧重新栅格化导致闪烁。
  ctx.lineCap = activeTheme.pixel ? "butt" : "round";
  ctx.strokeStyle = color;
  ctx.lineWidth = activeTheme.pixel ? Math.max(width, pixelCell * 1.5) : width;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, -faceSize * tipRatio);
  ctx.stroke();
  ctx.restore();
}

function drawCenterCap(ctx, centerX, centerY, faceSize, alpha) {
  if (alpha <= 0.01) {
    return;
  }

  ctx.save();
  ctx.globalAlpha = alpha;

  const radius = Math.max(6, faceSize * 0.011);
  ctx.fillStyle = activeTheme.monochrome ? accent("minute", 1) : "#f6f9ff";
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = Math.max(2, faceSize * 0.005);
  ctx.strokeStyle = activeTheme.monochrome ? `rgba(${activeTheme.monochromeStrokeRgb}, 1)` : "rgba(23, 32, 49, 0.95)";
  ctx.stroke();

  ctx.restore();
}

function drawRing(ctx, ring, faceSize, params) {
  const { cx, cy, scale, focusLevel, rotationDeg = 0, dpr = 1 } = params;

  const radius = activeTheme.pixel
    ? snapDevicePixel(faceSize * ring.baseRadiusRatio * scale, dpr)
    : faceSize * ring.baseRadiusRatio * scale;
  const ringCx = activeTheme.pixel ? snapDevicePixel(cx, dpr) : cx;
  const ringCy = activeTheme.pixel ? snapDevicePixel(cy, dpr) : cy;
  const style = {
    ...ring,
    // 放大时只改变圈半径，不改变刻度和文字的视觉尺寸。
    minorLen: activeTheme.pixel ? pixelMetric(faceSize * ring.minorLenRatio) : faceSize * ring.minorLenRatio,
    majorLen: activeTheme.pixel ? pixelMetric(faceSize * ring.majorLenRatio) : faceSize * ring.majorLenRatio,
    fineLen: faceSize * (ring.fineLenRatio ?? 0),
    minorWidth: activeTheme.pixel ? pixelMetric(faceSize * ring.minorWidthRatio) : Math.max(1, faceSize * ring.minorWidthRatio),
    majorWidth: activeTheme.pixel ? pixelMetric(faceSize * ring.majorWidthRatio, pixelCell * 1.5) : Math.max(1, faceSize * ring.majorWidthRatio),
    fineWidth: Math.max(0, faceSize * (ring.fineWidthRatio ?? 0)),
    numberSize: activeTheme.pixel ? pixelMetric(Math.max(10, faceSize * ring.numberSizeRatio), pixelCell * 3) : Math.max(10, faceSize * ring.numberSizeRatio),
    numberGap: activeTheme.pixel ? pixelMetric(Math.max(8, faceSize * ring.numberGapRatio)) : Math.max(8, faceSize * ring.numberGapRatio),
  };

  applyRingAccent(style, ring.key);

  if (ring.key === "second") {
    const fineLevel = clamp01(Math.pow(focusLevel, 0.72));
    style.fineColor = accent("second", ((activeTheme.pixel ? 0.62 : 0.3) * fineLevel).toFixed(3));
    style.fineLen = activeTheme.pixel ? pixelMetric(style.minorLen * 0.72) : style.minorLen * 0.74;
    style.fineWidth = activeTheme.pixel ? pixelMetric(style.minorWidth * 0.72) : Math.max(0.8, style.minorWidth * 0.52);
  }

  if (ring.key === "minute") {
    const fineLevel = clamp01(Math.pow(focusLevel, 0.72));
    style.fineColor = accent("minute", ((activeTheme.pixel ? 0.58 : 0.28) * fineLevel).toFixed(3));
    style.fineLen = activeTheme.pixel ? pixelMetric(style.minorLen * 0.68) : style.minorLen * 0.7;
    style.fineWidth = activeTheme.pixel ? pixelMetric(style.minorWidth * 0.68) : Math.max(0.7, style.minorWidth * 0.46);
  }

  drawTicks(ctx, ringCx, ringCy, radius, style, rotationDeg, dpr);
  drawNumbers(ctx, ringCx, ringCy, radius, style, rotationDeg);
  drawDetailNumbers(ctx, ringCx, ringCy, radius, style, focusLevel, rotationDeg);
}

function renderFrame(timestamp, options) {
  const { canvas, watchFace, getMode, getThemeKey } = options;
  applyRendererTheme(getThemeKey());

  if (!canvas || !watchFace) {
    return null;
  }

  const faceRect = watchFace.getBoundingClientRect();
  const faceSize = Math.max(1, faceRect.width);
  const canvasSize = Math.max(1, Math.round(faceSize * CANVAS_SCALE));
  setPixelCell(faceSize);
  canvas.style.width = `${canvasSize}px`;
  canvas.style.height = `${canvasSize}px`;

  const rawDpr = window.devicePixelRatio || 1;
  const maxBackingSize = activeTheme.pixel ? MAX_PIXEL_CANVAS_BACKING_SIZE : MAX_CANVAS_BACKING_SIZE;
  const maxDpr = maxBackingSize / canvasSize;
  const pixelDpr = Math.max(1, Math.min(2, Math.max(1, Math.round(rawDpr)), Math.max(1, Math.floor(maxDpr))));
  const dpr = activeTheme.pixel
    ? pixelDpr
    : Math.min(rawDpr, maxDpr);
  const pxSize = Math.max(1, Math.min(maxBackingSize, Math.round(canvasSize * dpr)));

  if (canvas.width !== pxSize || canvas.height !== pxSize) {
    canvas.width = pxSize;
    canvas.height = pxSize;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return null;
  }
  ctx.imageSmoothingEnabled = !activeTheme.pixel;

  const deltaSec = Math.min(0.05, Math.max(0, (timestamp - lastFrameTs) / 1000));
  lastFrameTs = timestamp;

  const mode = getMode();
  const secondTarget = mode === "normal" ? 0 : 1;
  const minuteTarget = mode === "focus-minute" ? 1 : 0;

  const follow = 1 - Math.exp(-deltaSec * 2.5);
  secondFocusProgress += (secondTarget - secondFocusProgress) * follow;
  minuteFocusProgress += (minuteTarget - minuteFocusProgress) * follow;

  secondFocusProgress = clamp01(secondFocusProgress);
  minuteFocusProgress = clamp01(minuteFocusProgress);

  const secondEase = smoothStep(secondFocusProgress);
  const minuteEase = smoothStep(minuteFocusProgress);

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, canvasSize, canvasSize);

  const now = new Date();
  const angles = getClockAngles(now);

  const centerX = canvasSize / 2;
  const centerY = canvasSize / 2;

  const secondScale = lerp(1, secondFocusScale, secondEase);
  const minuteScale = lerp(1, minuteFocusScale, minuteEase);

  const secondRadius = faceSize * rings.second.baseRadiusRatio * secondScale;
  const secondCenter = getExpandedCenter(
    centerX,
    centerY,
    angles.secondDeg,
    faceSize * secondHandTipRatio,
    secondRadius,
    secondFocusGap,
  );

  const minuteRadius = faceSize * rings.minute.baseRadiusRatio * minuteScale;
  const minuteCenter = getExpandedCenter(
    centerX,
    centerY,
    angles.minuteDeg,
    faceSize * minuteHandTipRatio,
    minuteRadius,
    0,
  );

  drawRing(ctx, rings.hour, faceSize, {
    cx: centerX,
    cy: centerY,
    scale: 1,
    focusLevel: 0,
    rotationDeg: 0,
    dpr,
  });

  drawRing(ctx, rings.minute, faceSize, {
    cx: minuteCenter.x,
    cy: minuteCenter.y,
    scale: minuteScale,
    focusLevel: minuteEase,
    rotationDeg: 0,
    dpr,
  });

  drawRing(ctx, rings.second, faceSize, {
    cx: secondCenter.x,
    cy: secondCenter.y,
    scale: secondScale,
    focusLevel: secondEase,
    rotationDeg: 0,
    dpr,
  });

  drawHand(ctx, centerX, centerY, faceSize, angles.hourDeg, 0.0125, hourHandTipRatio, activeTheme.monochrome ? accent("minute", 1) : "#eef5ff");
  drawHand(ctx, centerX, centerY, faceSize, angles.minuteDeg, 0.008, minuteHandTipRatio, accent("minute", 0.95));
  drawHand(ctx, centerX, centerY, faceSize, angles.secondDeg, 0.0038, secondHandTipRatio, accent("second", 0.95));

  drawCenterCap(ctx, centerX, centerY, faceSize, 1 - Math.max(secondEase, minuteEase));

  return null;
}

export function startWatchRenderer(options) {
  let frameId = 0;
  lastFrameTs = performance.now();
  secondFocusProgress = 0;
  minuteFocusProgress = 0;

  const tick = (timestamp) => {
    renderFrame(timestamp, options);
    frameId = window.requestAnimationFrame(tick);
  };

  frameId = window.requestAnimationFrame(tick);

  return () => {
    window.cancelAnimationFrame(frameId);
  };
}
