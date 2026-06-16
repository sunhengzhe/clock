const MAX_RENDER_WIDTH = 1600;
const MAX_RENDER_HEIGHT = 1000;
const TEXTURE_UPDATE_MS = 125;
const MOTION_SEGMENT_MS = 11000;
const MOTION_CYCLE_MS = 38000;
const MOUSE_FOLLOW_RATE = 0.72;
const RANDOM_FOLLOW_RATE = 0.36;
const POINTER_TARGET_MARGIN = 0.06;
const MIN_SHADOW_RADIUS = 0.032;
const MAX_SHADOW_RADIUS = 0.078;
const MIN_TIME_DILATION_RATE = 0.045;
const TIME_DILATION_INNER_RADIUS = 1.35;
const TIME_DILATION_OUTER_RADIUS = 8.4;

const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const BLACK_HOLE_FRAGMENT_SHADER = `
precision highp float;

uniform sampler2D u_text;
uniform vec2 u_center;
uniform vec2 u_resolution;
uniform float u_shadow_radius;
uniform float u_time;
uniform float u_intensity;
uniform float u_reduced_motion;

varying vec2 v_uv;

const float PI = 3.1415927;
const float TWO_PI = 6.2831853;
const float B_CRIT = 2.5980762;
const float LENS_DEPTH = 13.0;
const float DISK_INNER = 1.8;
const float DISK_OUTER = 6.2;
const float DISK_INCL = 1.50;
const float DISK_ROLL = 0.10;
const float DISK_GAIN = 1.20;
const float DISK_OPACITY = 0.76;
const float DISK_BEAM = 2.1;
const float DISK_WIND = 7.0;
const float EXPOSURE = 1.08;
const int N_STEPS = 28;

mat2 rotate2d(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

float hash21(vec2 p) {
  p = fract(p * vec2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}

float vnoiseWrapY(vec2 p, float periodY) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float y0 = mod(i.y, periodY);
  float y1 = mod(i.y + 1.0, periodY);
  return mix(
    mix(hash21(vec2(i.x, y0)), hash21(vec2(i.x + 1.0, y0)), f.x),
    mix(hash21(vec2(i.x, y1)), hash21(vec2(i.x + 1.0, y1)), f.x),
    f.y
  );
}

vec2 mirrorUv(vec2 uv) {
  return 1.0 - abs(1.0 - mod(uv, 2.0));
}

vec3 sampleText(vec2 uv) {
  return texture2D(u_text, mirrorUv(vec2(uv.x, 1.0 - uv.y))).rgb;
}

vec3 coolDiskColor(float energy, float doppler) {
  vec3 dimBlue = vec3(0.18, 0.28, 0.40);
  vec3 steel = vec3(0.46, 0.62, 0.78);
  vec3 white = vec3(0.90, 0.94, 1.0);
  vec3 blue = vec3(0.42, 0.62, 1.0);
  vec3 base = mix(dimBlue, steel, smoothstep(0.08, 0.42, energy));
  base = mix(base, white, smoothstep(0.34, 0.88, energy));
  return base + blue * smoothstep(1.02, 1.55, doppler) * 0.28;
}

vec3 farFieldText(vec2 p, float plen, float b, float worldScale, float aspect, float window) {
  float z0 = max(14.0, DISK_OUTER + 5.0);
  float u = z0 * inversesqrt(z0 * z0 + b * b);
  float deflection = (2.0 / (worldScale * worldScale)) / max(plen, 0.0001)
    * (1.29 * u + 0.07)
    * max(LENS_DEPTH - 2.14 * u + 0.75, 0.0)
    * window;
  vec2 dir = p / max(plen, 0.0001);
  vec2 sampled = p - dir * deflection;
  return sampleText(u_center + sampled / vec2(aspect, 1.0));
}

vec3 geodesicScene(vec2 p, float b, float worldScale, float aspect, float window) {
  float motion = mix(u_time, 0.0, u_reduced_motion);
  float z0 = max(14.0, DISK_OUTER + 5.0);
  vec2 impact = rotate2d(DISK_ROLL) * vec2(p.x, -p.y) * worldScale;
  vec3 x = vec3(impact, z0);
  vec3 v = vec3(0.0, 0.0, -1.0);
  float h2 = dot(impact, impact);

  float ci = cos(DISK_INCL);
  float si = sin(DISK_INCL);
  vec3 diskNormal = vec3(0.0, si, ci);
  vec3 diskAxisY = vec3(0.0, ci, -si);

  vec3 emitted = vec3(0.0);
  float transmittance = 1.0;
  bool captured = false;
  float previousSide = dot(x, diskNormal);
  vec3 previousX = x;

  for (int stepIndex = 0; stepIndex < N_STEPS; stepIndex++) {
    float r2 = dot(x, x);
    if (r2 < 1.0) {
      captured = true;
      break;
    }
    if (x.z < -z0 && v.z < 0.0) {
      break;
    }
    if (r2 > 4.0 * z0 * z0) {
      break;
    }

    float r = sqrt(r2);
    float dt = clamp(0.16 * r, 0.03, 1.5);
    vec3 acceleration = -1.5 * h2 * x / (r2 * r2 * r);
    v += acceleration * (0.5 * dt);
    x += v * dt;
    r2 = dot(x, x);
    r = sqrt(r2);
    acceleration = -1.5 * h2 * x / (r2 * r2 * r);
    v += acceleration * (0.5 * dt);

    float side = dot(x, diskNormal);
    if (side * previousSide < 0.0 && transmittance > 0.02) {
      float crossingT = previousSide / (previousSide - side);
      vec3 crossing = mix(previousX, x, crossingT);
      float diskRadius = length(crossing);
      if (diskRadius > DISK_INNER && diskRadius < DISK_OUTER) {
        float band = smoothstep(DISK_INNER, DISK_INNER * 1.16, diskRadius)
          * (1.0 - smoothstep(DISK_OUTER * 0.84, DISK_OUTER, diskRadius));
        float phi = atan(dot(crossing, diskAxisY), crossing.x);
        float turns = phi / TWO_PI;
        float kep = pow(DISK_INNER / diskRadius, 1.5);
        float localTime = sqrt(max(1.0 - 1.5 / diskRadius, 0.02));
        float swirl = diskRadius * DISK_WIND * 0.12 - motion * kep * 1.8 * localTime;
        float streaks = vnoiseWrapY(vec2(diskRadius * 2.8, turns * 19.0 + swirl * 3.0), 19.0) * 0.65
          + vnoiseWrapY(vec2(diskRadius, turns * 9.0 + swirl * 1.5 + 7.0), 9.0) * 0.35;
        streaks = 0.35 + 1.28 * streaks * streaks;

        vec3 gasDirection = normalize(cross(diskNormal, crossing));
        float beta = clamp(inversesqrt(max(2.0 * (diskRadius - 1.0), 0.2)), 0.0, 0.99);
        float doppler = localTime / max(1.0 + beta * dot(gasDirection, normalize(v)), 0.05);
        float profile = max(1.0 - sqrt(DISK_INNER / diskRadius), 0.0);
        float temperatureProfile = pow(DISK_INNER / diskRadius, 0.75) * pow(profile, 0.25) / 0.488;
        float shiftedDoppler = mix(1.0, doppler, 0.48);
        vec3 color = coolDiskColor(temperatureProfile * shiftedDoppler, shiftedDoppler);
        float boost = pow(mix(1.0, doppler, 0.62), DISK_BEAM);
        float density = band * streaks;

        emitted += transmittance * color * (DISK_GAIN * mix(0.72, 1.0, u_intensity) * density * temperatureProfile * temperatureProfile * boost);
        transmittance *= 1.0 - clamp(DISK_OPACITY * density, 0.0, 1.0);
      }
    }

    previousSide = side;
    previousX = x;
  }

  if (!captured && dot(x, x) < 4.0) {
    captured = true;
  }

  vec3 background = vec3(0.0);
  if (!captured) {
    vec3 rayDirection = normalize(v);
    if (rayDirection.z < -0.05) {
      float skyT = (-LENS_DEPTH - x.z) / rayDirection.z;
      vec3 skyHit = x + rayDirection * skyT;
      vec2 unrolled = rotate2d(-DISK_ROLL) * skyHit.xy / worldScale;
      vec2 projected = vec2(unrolled.x, -unrolled.y);
      vec2 uv = u_center + (p + (projected - p) * window) / vec2(aspect, 1.0);
      float towardSky = smoothstep(0.05, 0.35, -rayDirection.z);
      background = sampleText(uv) * towardSky;
    }
  }

  return background * transmittance + (vec3(1.0) - exp(-emitted * EXPOSURE));
}

void main() {
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 p = (v_uv - u_center) * vec2(aspect, 1.0);
  float plen = length(p);
  float worldScale = B_CRIT / max(u_shadow_radius, 0.0001);
  float b = plen * worldScale;
  float rout = max(DISK_OUTER, DISK_INNER + 0.5);
  float bmax = rout + 3.0;
  float window = exp(-pow(plen / (6.2 * u_shadow_radius), 2.0));

  vec3 color = sampleText(v_uv) * 0.74;
  if (b >= bmax) {
    color = farFieldText(p, plen, b, worldScale, aspect, window);
  } else {
    color = geodesicScene(p, b, worldScale, aspect, window);
  }

  float vignette = smoothstep(0.88, 0.18, distance(v_uv, u_center));
  color *= 0.46 + vignette * 0.84;

  gl_FragColor = vec4(color, 1.0);
}
`;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function smoothStep(value) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function smootherStep(value) {
  const t = clamp(value, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function pad3(value) {
  return String(value).padStart(3, "0");
}

const CHINESE_DIGITS = ["零", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
const CHINESE_YEAR_DIGITS = ["〇", "一", "二", "三", "四", "五", "六", "七", "八", "九"];
const EN_MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const EN_WEEKDAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DE_MONTH_NAMES = ["Januar", "Februar", "Marz", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
const DE_WEEKDAY_NAMES = ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"];
const FR_MONTH_NAMES = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"];
const FR_WEEKDAY_NAMES = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const JA_WEEKDAY_NAMES = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"];
const WEEKDAY_NAMES = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
const WEEKDAY_SHORT_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
const TEXT_ROW_STYLES = {
  anchor: { alpha: 0.5, color: "246, 250, 255", weight: 600 },
  civic: { alpha: 0.34, color: "146, 208, 255", weight: 500 },
  lunar: { alpha: 0.44, color: "168, 238, 220", weight: 600 },
  separator: { alpha: 0.22, color: "178, 202, 232", weight: 400 },
  technical: { alpha: 0.32, color: "204, 186, 255", weight: 450 },
  whisper: { alpha: 0.28, color: "154, 232, 255", weight: 400 },
  world: { alpha: 0.36, color: "255, 188, 218", weight: 500 },
};
const TEXT_SEGMENT_STYLES = {
  epochMilliseconds: { alpha: 0.34, color: "255, 196, 142" },
  frenchDate: { alpha: 0.37, color: "188, 210, 255" },
  germanDate: { alpha: 0.37, color: "255, 172, 158" },
  julianDay: { alpha: 0.33, color: "188, 238, 176" },
  precisionClock: { alpha: 0.36, color: "220, 198, 255" },
  unixSeconds: { alpha: 0.35, color: "142, 224, 255" },
};
const BLACK_HOLE_TEXT_PATTERN_SPECS = [
  {
    gapAfter: 0.04,
    offset: 0,
    segments: [
      { key: "isoClock", tier: "anchor" },
      { key: "lunarDate", tier: "lunar" },
      { key: "americanDate", tier: "world" },
      { key: "precisionClock", tier: "technical" },
      { key: "isoWeek", tier: "civic" },
      { key: "dayProgressCn", tier: "whisper" },
    ],
    xShift: 0,
  },
  {
    gapAfter: 0.06,
    offset: 8,
    segments: [
      { key: "spacedClock", tier: "anchor" },
      { key: "japaneseDate", tier: "world" },
      { key: "lunarWeekday", tier: "lunar" },
      { key: "unixSeconds", tier: "technical" },
      { key: "dayQuarter", tier: "civic" },
      { key: "untilMidnight", tier: "whisper" },
    ],
    xShift: 0.18,
  },
  {
    gapAfter: 0.04,
    offset: 15,
    segments: [
      { key: "ampmClock", tier: "anchor" },
      { key: "britishDate", tier: "world" },
      { key: "chineseDateTime", tier: "lunar" },
      { key: "julianDay", tier: "technical" },
      { key: "weekdayOffset", tier: "civic" },
      { key: "dayProgressEn", tier: "whisper" },
    ],
    xShift: 0.34,
  },
  {
    gapAfter: 0.12,
    offset: 4,
    segments: [
      { key: "slashClock", tier: "anchor" },
      { key: "germanDate", tier: "world" },
      { key: "frenchDate", tier: "world" },
      { key: "lunarWeekday", tier: "lunar" },
      { key: "epochMilliseconds", tier: "technical" },
      { key: "chineseWeek", tier: "civic" },
    ],
    xShift: 0.1,
  },
];

function createChineseLunarFormatter() {
  try {
    return new Intl.DateTimeFormat("zh-CN-u-ca-chinese", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

const CHINESE_LUNAR_FORMATTER = createChineseLunarFormatter();

export function getBlackHoleTextRowStyle(tier) {
  return TEXT_ROW_STYLES[tier] ?? TEXT_ROW_STYLES.civic;
}

export function getBlackHoleTextSegmentStyle(segment) {
  return {
    ...getBlackHoleTextRowStyle(segment.tier),
    ...(TEXT_SEGMENT_STYLES[segment.key] ?? {}),
  };
}

function formatChineseYear(year) {
  return String(year)
    .split("")
    .map((digit) => CHINESE_YEAR_DIGITS[Number(digit)])
    .join("");
}

function formatChineseNumber(value) {
  if (value < 10) {
    return CHINESE_DIGITS[value];
  }
  if (value < 20) {
    return value === 10 ? "十" : `十${CHINESE_DIGITS[value % 10]}`;
  }

  const tens = Math.floor(value / 10);
  const ones = value % 10;
  return ones === 0 ? `${CHINESE_DIGITS[tens]}十` : `${CHINESE_DIGITS[tens]}十${CHINESE_DIGITS[ones]}`;
}

function formatLunarDay(day) {
  if (day < 1 || day > 30) {
    return String(day);
  }
  if (day <= 10) {
    return `初${CHINESE_DIGITS[day]}`;
  }
  if (day < 20) {
    return `十${CHINESE_DIGITS[day - 10]}`;
  }
  if (day === 20) {
    return "二十";
  }
  if (day < 30) {
    return `廿${CHINESE_DIGITS[day - 20]}`;
  }
  return "三十";
}

export function formatChineseLunarDate(date) {
  if (!CHINESE_LUNAR_FORMATTER) {
    return `农历${formatChineseYear(date.getFullYear())}年`;
  }

  const parts = CHINESE_LUNAR_FORMATTER.formatToParts(date);
  const yearName = parts.find((part) => part.type === "yearName")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const dayPart = parts.find((part) => part.type === "day")?.value;
  const day = Number(dayPart);

  if (!yearName || !month || !Number.isFinite(day)) {
    return `农历${CHINESE_LUNAR_FORMATTER.format(date)}`;
  }

  return `农历${yearName}年${month}${formatLunarDay(day)}`;
}

function getDayOfYear(date) {
  const yearStart = Date.UTC(date.getFullYear(), 0, 1);
  const today = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return Math.floor((today - yearStart) / 86400000) + 1;
}

function getIsoWeek(date) {
  const current = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = current.getUTCDay() || 7;
  current.setUTCDate(current.getUTCDate() + 4 - dayNumber);

  const weekYear = current.getUTCFullYear();
  const yearStart = new Date(Date.UTC(weekYear, 0, 1));
  const week = Math.ceil(((current - yearStart) / 86400000 + 1) / 7);

  return {
    week,
    year: weekYear,
  };
}

function formatUtcOffset(date) {
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absoluteMinutes = Math.abs(offsetMinutes);
  return `UTC${sign}${pad2(Math.floor(absoluteMinutes / 60))}:${pad2(absoluteMinutes % 60)}`;
}

function formatDuration(totalSeconds) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
}

function formatJulianDay(date) {
  return (date.getTime() / 86400000 + 2440587.5).toFixed(5);
}

function repeatToColumns(text, columns) {
  const spacer = "   ";
  const repeated = `${text}${spacer}`.repeat(Math.ceil((columns + text.length + spacer.length) / (text.length + spacer.length)) + 1);
  return repeated.slice(0, columns + 8);
}

function createSeparatorSegment() {
  return { text: "   ·   ", tier: "separator" };
}

function hashTextUnit(text) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0) / 4294967296;
}

function shuffleSegments(segments, seed) {
  return segments
    .map((segment, index) => ({
      order: hashTextUnit(`${seed}:${index}:${segment.tier}`),
      segment,
    }))
    .sort((first, second) => first.order - second.order)
    .map((entry) => entry.segment);
}

function createTextOrderSeed() {
  const random = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}:${Math.random()}`;

  return `blackhole-text-order:${random}`;
}

export function getBlackHolePointerTarget({ clientX, clientY, height, left = 0, top = 0, width }) {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);

  return {
    x: clamp((clientX - left) / safeWidth, POINTER_TARGET_MARGIN, 1 - POINTER_TARGET_MARGIN),
    y: clamp(1 - (clientY - top) / safeHeight, POINTER_TARGET_MARGIN, 1 - POINTER_TARGET_MARGIN),
  };
}

export function isBlackHolePointerInsideRect({ clientX, clientY, height, left = 0, top = 0, width }) {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);

  return clientX >= left && clientX <= left + safeWidth && clientY >= top && clientY <= top + safeHeight;
}

export function isBlackHolePointerTargetIgnored(eventTarget, ignoredSelector = "#watch-menu") {
  return Boolean(eventTarget?.closest?.(ignoredSelector));
}

export function createBlackHolePointerTracker(target) {
  if (typeof window === "undefined" || !target) {
    return {
      cleanup: () => { },
      getTarget: () => null,
    };
  }

  const pointer = {
    inside: false,
    x: 0.5,
    y: 0.5,
  };
  const markOutside = () => {
    pointer.inside = false;
  };
  const handlePointerMove = (event) => {
    if (event.pointerType && event.pointerType !== "mouse") {
      return;
    }
    if (isBlackHolePointerTargetIgnored(event.target)) {
      markOutside();
      return;
    }

    const rect = target.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const inside = isBlackHolePointerInsideRect({
      clientX: event.clientX,
      clientY: event.clientY,
      height,
      left: rect.left,
      top: rect.top,
      width,
    });
    pointer.inside = inside;

    if (!inside) {
      return;
    }

    const pointerTarget = getBlackHolePointerTarget({
      clientX: event.clientX,
      clientY: event.clientY,
      height,
      left: rect.left,
      top: rect.top,
      width,
    });

    pointer.x = pointerTarget.x;
    pointer.y = pointerTarget.y;
  };
  const handlePointerOut = (event) => {
    if (!event.relatedTarget) {
      markOutside();
    }
  };
  const handleVisibilityChange = () => {
    if (document.visibilityState !== "visible") {
      markOutside();
    }
  };

  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("pointerout", handlePointerOut, { passive: true });
  window.addEventListener("pointercancel", markOutside, { passive: true });
  window.addEventListener("blur", markOutside);
  document.documentElement?.addEventListener("mouseleave", markOutside);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  return {
    cleanup: () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerout", handlePointerOut);
      window.removeEventListener("pointercancel", markOutside);
      window.removeEventListener("blur", markOutside);
      document.documentElement?.removeEventListener("mouseleave", markOutside);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    },
    getTarget: () => (pointer.inside ? { x: pointer.x, y: pointer.y } : null),
  };
}

function createInlineSegments(segments, columns, offset = 0) {
  const safeColumns = Math.max(1, Math.floor(columns));
  const repeatedSegments = offset > 0 ? [{ text: " ".repeat(offset), tier: "separator" }] : [];
  const baseSegments = segments.flatMap((segment) => [segment, createSeparatorSegment()]);
  let textLength = repeatedSegments.reduce((total, segment) => total + segment.text.length, 0);
  const appendBaseSegments = () => {
    for (const segment of baseSegments) {
      repeatedSegments.push({ ...segment });
      textLength += segment.text.length;
    }
  };

  appendBaseSegments();
  while (textLength < safeColumns + 16) {
    appendBaseSegments();
  }

  return repeatedSegments;
}

function segmentsToText(segments) {
  return segments.map((segment) => segment.text).join("");
}

export function formatLocalizedDateVariants(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  const millisecond = date.getMilliseconds();
  const yyyy = String(year);
  const mm = pad2(month);
  const dd = pad2(day);
  const hh = pad2(hour);
  const mi = pad2(minute);
  const ss = pad2(second);
  const ms = pad3(millisecond);
  const weekdayIndex = date.getDay();
  const englishWeekday = EN_WEEKDAY_NAMES[weekdayIndex];
  const englishMonth = EN_MONTH_NAMES[date.getMonth()];

  return {
    american: `${englishWeekday}, ${englishMonth} ${day}, ${yyyy}`,
    british: `${day} ${englishMonth} ${yyyy}, ${englishWeekday}`,
    french: `${FR_WEEKDAY_NAMES[weekdayIndex]} ${day} ${FR_MONTH_NAMES[date.getMonth()]} ${yyyy}`,
    german: `${DE_WEEKDAY_NAMES[weekdayIndex]}, ${day}. ${DE_MONTH_NAMES[date.getMonth()]} ${yyyy}`,
    japanese: `${yyyy}年${month}月${day}日 ${JA_WEEKDAY_NAMES[weekdayIndex]}`,
    preciseClock: `${hh}:${mi}:${ss}.${ms}`,
  };
}

function getTimeParts(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  const millisecond = date.getMilliseconds();
  const yyyy = String(year);
  const mm = pad2(month);
  const dd = pad2(day);
  const hh = pad2(hour);
  const mi = pad2(minute);
  const ss = pad2(second);
  const ms = pad3(millisecond);
  const chineseDateTime = `${formatChineseYear(year)}年${formatChineseNumber(month)}月${formatChineseNumber(day)}日${formatChineseNumber(hour)}点${formatChineseNumber(minute)}分${formatChineseNumber(second)}秒`;
  const dayOfYear = getDayOfYear(date);
  const isoWeek = getIsoWeek(date);
  const quarter = Math.floor((month - 1) / 3) + 1;
  const weekday = WEEKDAY_NAMES[date.getDay()];
  const weekdayShort = WEEKDAY_SHORT_NAMES[date.getDay()];
  const unixSeconds = Math.floor(date.getTime() / 1000);
  const secondsSinceMidnight = hour * 3600 + minute * 60 + second;
  const dayProgress = ((secondsSinceMidnight / 86400) * 100).toFixed(2);
  const hour12 = hour % 12 || 12;
  const amPm = hour < 12 ? "AM" : "PM";
  const isoWeekday = date.getDay() || 7;
  const lunarDate = formatChineseLunarDate(date);
  const localized = formatLocalizedDateVariants(date);

  return {
    amPm,
    chineseDateTime,
    day,
    dayOfYear,
    dayProgress,
    dd,
    hh,
    hour,
    hour12,
    isoWeek,
    isoWeekday,
    localized,
    lunarDate,
    mi,
    minute,
    mm,
    ms,
    month,
    quarter,
    second,
    secondsSinceMidnight,
    ss,
    unixSeconds,
    weekday,
    weekdayShort,
    year,
    yyyy,
  };
}

function formatBlackHoleTextSegment(key, date) {
  const {
    amPm,
    chineseDateTime,
    day,
    dayOfYear,
    dayProgress,
    dd,
    hh,
    hour12,
    isoWeek,
    isoWeekday,
    lunarDate,
    mi,
    minute,
    mm,
    ms,
    quarter,
    localized,
    secondsSinceMidnight,
    ss,
    unixSeconds,
    weekday,
    weekdayShort,
    yyyy,
  } = getTimeParts(date);

  switch (key) {
    case "americanDate":
      return localized.american;
    case "ampmClock":
      return `${pad2(hour12)}:${mi}:${ss} ${amPm}`;
    case "britishDate":
      return localized.british;
    case "chineseDateTime":
      return chineseDateTime;
    case "chineseWeek":
      return `${yyyy} 第${formatChineseNumber(isoWeek.week)}周`;
    case "dayProgressCn":
      return `今日进度 ${dayProgress}%`;
    case "dayProgressEn":
      return `${dayProgress}% of Today`;
    case "dayQuarter":
      return `DAY ${String(dayOfYear).padStart(3, "0")} Q${quarter}`;
    case "epochMilliseconds":
      return `EPOCH ${date.getTime()}ms`;
    case "frenchDate":
      return localized.french;
    case "germanDate":
      return localized.german;
    case "isoClock":
      return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
    case "isoWeek":
      return `${isoWeek.year}-W${pad2(isoWeek.week)}-${isoWeekday}`;
    case "japaneseDate":
      return localized.japanese;
    case "julianDay":
      return `JD ${formatJulianDay(date)}`;
    case "lunarDate":
      return lunarDate;
    case "lunarWeekday":
      return `${lunarDate} ${weekday}`;
    case "precisionClock":
      return `PRECISION ${localized.preciseClock}`;
    case "slashClock":
      return `${yyyy}/${mm}/${dd} ${hh}:${mi}:${ss}`;
    case "spacedClock":
      return `${yyyy} ${mm}-${dd} ${hh}:${mi}:${ss}`;
    case "unixSeconds":
      return `UNIX ${unixSeconds}`;
    case "untilMidnight":
      return `距午夜 ${formatDuration(86400 - secondsSinceMidnight)}`;
    case "weekdayOffset":
      return `${weekdayShort} ${formatUtcOffset(date)}`;
    default:
      return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
  }
}

function createBlackHoleTextPattern(patternIndex, date, getSegmentDate = () => date, rowIndex = 0) {
  const pattern = BLACK_HOLE_TEXT_PATTERN_SPECS[patternIndex];

  return {
    ...pattern,
    segments: pattern.segments.map((segment, segmentIndex) => {
      const segmentDate = getSegmentDate({
        key: segment.key,
        patternIndex,
        rowIndex,
        segmentIndex,
        tier: segment.tier,
      }) ?? date;

      return {
        ...segment,
        text: formatBlackHoleTextSegment(segment.key, segmentDate),
      };
    }),
  };
}

export function formatTimeVariants(date) {
  const {
    amPm,
    chineseDateTime,
    day,
    dayOfYear,
    dayProgress,
    dd,
    hh,
    hour,
    hour12,
    isoWeek,
    isoWeekday,
    lunarDate,
    mi,
    minute,
    mm,
    ms,
    month,
    quarter,
    localized,
    second,
    secondsSinceMidnight,
    ss,
    unixSeconds,
    weekday,
    weekdayShort,
    year,
    yyyy,
  } = getTimeParts(date);

  return [
    `${yyyy} ${mm}-${dd} ${hh}:${mi}:${ss}`,
    `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`,
    `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}.${ms}`,
    `${yyyy}/${mm}/${dd} ${hh}:${mi}:${ss}`,
    `${hh}:${mi}:${ss} ${mm}.${dd}.${yyyy}`,
    `${yyyy}${mm}${dd}T${hh}${mi}${ss}`,
    `${formatChineseYear(year)} ${formatChineseNumber(month)}月${formatChineseNumber(day)}日 ${formatChineseNumber(hour)}:${mi}:${ss}`,
    chineseDateTime,
    `${formatChineseNumber(hour)}点${formatChineseNumber(minute)}分${formatChineseNumber(second)}秒 ${yyyy}-${mm}-${dd}`,
    `${lunarDate} ${hh}:${mi}:${ss}`,
    `${lunarDate} ${weekday} ${yyyy}-${mm}-${dd}`,
    localized.american,
    localized.british,
    localized.german,
    localized.french,
    localized.japanese,
    `PRECISION ${localized.preciseClock}`,
    `${isoWeek.year}-W${pad2(isoWeek.week)}-${isoWeekday} ISO ${hh}:${mi}:${ss}`,
    `${yyyy} 第${formatChineseNumber(isoWeek.week)}周 ${weekday} ${hh}:${mi}:${ss}`,
    `${yyyy} DAY ${String(dayOfYear).padStart(3, "0")} ${hh}:${mi}:${ss}`,
    `Q${quarter} ${yyyy} ${weekdayShort} ${hh}:${mi}:${ss}`,
    `${yyyy}-${mm}-${dd} ${formatUtcOffset(date)} ${hh}:${mi}:${ss}`,
    `${pad2(hour12)}:${mi}:${ss} ${amPm} ${weekdayShort} ${mm}/${dd}`,
    `UNIX ${unixSeconds}`,
    `EPOCH ${date.getTime()}ms`,
    `JD ${formatJulianDay(date)}`,
    `今日进度 ${dayProgress}% ${hh}:${mi}:${ss}`,
    `距午夜 ${formatDuration(86400 - secondsSinceMidnight)} ${yyyy}-${mm}-${dd}`,
  ];
}

export function createBlackHoleTextRows({ columns, rows, date = new Date(), phase = 0, orderSeed = "blackhole-text-order:default", getSegmentDate = () => date }) {
  const safeColumns = Math.max(1, Math.floor(columns));
  const safeRows = Math.max(1, Math.floor(rows));

  return Array.from({ length: safeRows }, (_, index) => {
    const patternIndex = (index + phase) % BLACK_HOLE_TEXT_PATTERN_SPECS.length;
    const pattern = createBlackHoleTextPattern(patternIndex, date, getSegmentDate, index);
    const block = Math.floor((index + phase) / BLACK_HOLE_TEXT_PATTERN_SPECS.length);
    const rowOffset = (pattern.offset + block * 6) % 24;
    const shuffledSegments = shuffleSegments(pattern.segments, `${orderSeed}:${phase}:${index}:${patternIndex}:${block}`);
    const segments = createInlineSegments(shuffledSegments, safeColumns, rowOffset);

    return {
      gapAfter: pattern.gapAfter,
      segments,
      text: segmentsToText(segments),
      tier: "inline",
      xShift: pattern.xShift + (block % 3) * 0.36,
    };
  });
}

export function createBlackHoleTimeRows({ columns, rows, date = new Date(), phase = 0 }) {
  const safeColumns = Math.max(1, Math.floor(columns));
  const safeRows = Math.max(1, Math.floor(rows));
  const variants = formatTimeVariants(date);

  return Array.from({ length: safeRows }, (_, index) => {
    const variant = variants[(index + phase) % variants.length];
    const rowPrefix = index % 3 === 0 ? "" : " ".repeat(index % 3);
    return repeatToColumns(`${rowPrefix}${variant}`, safeColumns);
  });
}

export function getBlackHoleRenderSize(cssWidth, cssHeight, dpr = 1) {
  const scale = Math.max(1, Math.min(1.6, dpr || 1));
  const rawWidth = Math.max(1, cssWidth * scale);
  const rawHeight = Math.max(1, cssHeight * scale);
  const fit = Math.min(1, MAX_RENDER_WIDTH / rawWidth, MAX_RENDER_HEIGHT / rawHeight);

  return {
    height: Math.max(1, Math.round(rawHeight * fit)),
    width: Math.max(1, Math.round(rawWidth * fit)),
  };
}

export function getBlackHoleTextMetrics(width, height) {
  const unit = Math.min(width, height);
  const fontSize = Math.max(10, Math.round(unit * 0.021));
  const lineHeight = Math.round(fontSize * 1.2);

  return {
    columns: Math.ceil(width / (fontSize * 0.62)) + 24,
    fontSize,
    lineHeight,
    rows: Math.ceil(height / lineHeight) + 18,
  };
}

function hashUnit(value, salt) {
  const raw = Math.sin(value * 127.1 + salt * 311.7) * 43758.5453123;
  return raw - Math.floor(raw);
}

function getMotionPoint(index) {
  return {
    x: 0.28 + hashUnit(index, 1.7) * 0.44,
    y: 0.26 + hashUnit(index, 6.3) * 0.48,
  };
}

export function getBlackHoleMotion(timestamp, reducedMotion = false) {
  if (reducedMotion) {
    return {
      center: { x: 0.5, y: 0.5 },
      intensity: 0.35,
      shadowRadius: MIN_SHADOW_RADIUS,
    };
  }

  const segment = Math.floor(timestamp / MOTION_SEGMENT_MS);
  const segmentProgress = smootherStep((timestamp % MOTION_SEGMENT_MS) / MOTION_SEGMENT_MS);
  const from = getMotionPoint(segment);
  const to = getMotionPoint(segment + 1);
  const cycle = (timestamp % MOTION_CYCLE_MS) / MOTION_CYCLE_MS;
  const growEnd = 0.88;
  const intensity = cycle < growEnd
    ? smoothStep(cycle / growEnd)
    : 1 - smoothStep((cycle - growEnd) / (1 - growEnd));

  return {
    center: {
      x: from.x + (to.x - from.x) * segmentProgress,
      y: from.y + (to.y - from.y) * segmentProgress,
    },
    intensity,
    shadowRadius: MIN_SHADOW_RADIUS + (MAX_SHADOW_RADIUS - MIN_SHADOW_RADIUS) * intensity,
  };
}

export function createBlackHoleMotionState(timestamp = null) {
  const initialTimestamp = Number.isFinite(timestamp) ? timestamp : 0;

  return {
    center: getBlackHoleMotion(initialTimestamp).center,
    lastTimestamp: timestamp,
  };
}

export function updateBlackHoleMotionState(state, { pointerTarget = null, reducedMotion = false, timestamp = 0 }) {
  if (reducedMotion) {
    const motion = getBlackHoleMotion(timestamp, true);
    state.center = motion.center;
    state.lastTimestamp = timestamp;
    return motion;
  }

  const randomMotion = getBlackHoleMotion(timestamp, false);
  const hasPreviousTimestamp = Number.isFinite(state.lastTimestamp);
  const previousTimestamp = hasPreviousTimestamp ? state.lastTimestamp : timestamp;
  const deltaSeconds = hasPreviousTimestamp ? Math.max(0, (timestamp - previousTimestamp) / 1000) : 0;
  const target = pointerTarget ?? randomMotion.center;
  const followRate = pointerTarget ? MOUSE_FOLLOW_RATE : RANDOM_FOLLOW_RATE;
  const follow = 1 - Math.exp(-deltaSeconds * followRate);

  state.center = {
    x: state.center.x + (target.x - state.center.x) * follow,
    y: state.center.y + (target.y - state.center.y) * follow,
  };
  state.lastTimestamp = timestamp;

  return {
    ...randomMotion,
    center: state.center,
  };
}

function getBlackHoleSegmentClockKey(rowIndex, segmentKey) {
  return `row:${rowIndex}:segment:${segmentKey}`;
}

function getBlackHoleSegmentPosition({ columns, offset, rowIndex, rows, segmentCount, segmentIndex, xShift }) {
  const safeColumns = Math.max(1, columns);
  const offsetRatio = (offset % safeColumns) / safeColumns;
  const rawX = ((segmentIndex + 0.5) / Math.max(1, segmentCount)) + offsetRatio - xShift * 0.035;
  const wrappedX = ((rawX % 1) + 1) % 1;

  return {
    x: wrappedX,
    y: clamp(1 - (rowIndex + 0.5) / Math.max(1, rows), 0, 1),
  };
}

export function getBlackHoleTimeDilationRate({ height = 1, motion, position, width = 1 }) {
  const unit = Math.max(1, Math.min(width, height));
  const dx = (position.x - motion.center.x) * width / unit;
  const dy = (position.y - motion.center.y) * height / unit;
  const distance = Math.hypot(dx, dy);
  const innerRadius = motion.shadowRadius * TIME_DILATION_INNER_RADIUS;
  const outerRadius = motion.shadowRadius * TIME_DILATION_OUTER_RADIUS;
  const distanceProgress = smoothStep((distance - innerRadius) / Math.max(0.001, outerRadius - innerRadius));

  return MIN_TIME_DILATION_RATE + (1 - MIN_TIME_DILATION_RATE) * distanceProgress;
}

export function createBlackHoleTimeDilationState(startTimeMs = Date.now()) {
  return {
    clocks: new Map(),
    lastUpdateMs: startTimeMs,
  };
}

export function updateBlackHoleTimeDilationState(
  state,
  {
    columns,
    date = new Date(),
    height = 1,
    motion,
    orderSeed = "blackhole-text-order:default",
    phase = 0,
    rows,
    width = 1,
  },
) {
  const nowMs = date.getTime();
  const previousMs = Number.isFinite(state.lastUpdateMs) ? state.lastUpdateMs : nowMs;
  const deltaMs = Math.max(0, nowMs - previousMs);
  const safeColumns = Math.max(1, Math.floor(columns));
  const safeRows = Math.max(1, Math.floor(rows));
  const activeClockKeys = new Set();

  state.lastUpdateMs = nowMs;

  for (let rowIndex = 0; rowIndex < safeRows; rowIndex += 1) {
    const patternIndex = (rowIndex + phase) % BLACK_HOLE_TEXT_PATTERN_SPECS.length;
    const pattern = BLACK_HOLE_TEXT_PATTERN_SPECS[patternIndex];
    const block = Math.floor((rowIndex + phase) / BLACK_HOLE_TEXT_PATTERN_SPECS.length);
    const rowOffset = (pattern.offset + block * 6) % 24;
    const shuffledSegments = shuffleSegments(pattern.segments, `${orderSeed}:${phase}:${rowIndex}:${patternIndex}:${block}`);

    shuffledSegments.forEach((segment, segmentIndex) => {
      const clockKey = getBlackHoleSegmentClockKey(rowIndex, segment.key);
      const position = getBlackHoleSegmentPosition({
        columns: safeColumns,
        offset: rowOffset,
        rowIndex,
        rows: safeRows,
        segmentCount: shuffledSegments.length,
        segmentIndex,
        xShift: pattern.xShift + (block % 3) * 0.36,
      });
      const rate = getBlackHoleTimeDilationRate({
        height,
        motion,
        position,
        width,
      });
      const clock = state.clocks.get(clockKey);
      const nextClock = clock
        ? {
          rate,
          timeMs: clock.timeMs + deltaMs * rate,
        }
        : {
          rate,
          timeMs: nowMs,
        };

      state.clocks.set(clockKey, nextClock);
      activeClockKeys.add(clockKey);
    });
  }

  for (const clockKey of state.clocks.keys()) {
    if (!activeClockKeys.has(clockKey)) {
      state.clocks.delete(clockKey);
    }
  }

  return state;
}

function getBlackHoleSegmentDate(timeDilationState, segmentInfo, fallbackDate) {
  const clockKey = getBlackHoleSegmentClockKey(segmentInfo.rowIndex, segmentInfo.key);
  const clock = timeDilationState.clocks.get(clockKey);

  return clock ? new Date(clock.timeMs) : fallbackDate;
}

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  if (!shader) {
    return null;
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function createProgram(gl) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, BLACK_HOLE_FRAGMENT_SHADER);
  if (!vertexShader || !fragmentShader) {
    return null;
  }

  const program = gl.createProgram();
  if (!program) {
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

function drawTextTexture(ctx, rows, width, height) {
  const metrics = getBlackHoleTextMetrics(width, height);
  const background = ctx.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, "#080b13");
  background.addColorStop(0.45, "#02040a");
  background.addColorStop(1, "#000000");

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);
  ctx.textBaseline = "top";

  let y = -metrics.lineHeight * 1.1;
  rows.forEach((row) => {
    const segments = typeof row === "string" ? [{ text: row, tier: "civic" }] : (row.segments ?? [{ text: row.text, tier: row.tier }]);
    const fontSize = metrics.fontSize;
    const lineHeight = metrics.lineHeight;
    if (y > height || y < -metrics.lineHeight * 2) {
      y += lineHeight;
      return;
    }

    let x = -fontSize * (0.55 + (typeof row === "string" ? 0 : (row.xShift ?? 0)));
    for (const segment of segments) {
      const style = getBlackHoleTextSegmentStyle(segment);
      ctx.font = `${style.weight} ${fontSize}px "SFMono-Regular", "Menlo", "Consolas", "PingFang SC", monospace`;
      ctx.fillStyle = `rgba(${style.color}, ${style.alpha})`;
      ctx.fillText(segment.text, x, y);
      x += ctx.measureText(segment.text).width;
    }

    y += lineHeight + metrics.lineHeight * (row.gapAfter ?? 0);
  });
}

function createTexture(gl) {
  const texture = gl.createTexture();
  if (!texture) {
    return null;
  }

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  return texture;
}

function resizeRenderer(state) {
  const rect = state.canvas.getBoundingClientRect();
  const size = getBlackHoleRenderSize(rect.width, rect.height, window.devicePixelRatio || 1);
  if (state.width === size.width && state.height === size.height) {
    return;
  }

  state.width = size.width;
  state.height = size.height;
  state.canvas.width = size.width;
  state.canvas.height = size.height;
  state.textCanvas.width = size.width;
  state.textCanvas.height = size.height;
  state.lastTextureUpdate = 0;
  state.gl.viewport(0, 0, size.width, size.height);
}

function updateTextTexture(state, timestamp, motion) {
  if (timestamp - state.lastTextureUpdate < TEXTURE_UPDATE_MS && state.lastTextureUpdate !== 0) {
    return;
  }

  const date = new Date();
  const metrics = getBlackHoleTextMetrics(state.width, state.height);
  updateBlackHoleTimeDilationState(state.timeDilationState, {
    columns: metrics.columns,
    date,
    height: state.height,
    motion,
    orderSeed: state.textOrderSeed,
    phase: 0,
    rows: metrics.rows,
    width: state.width,
  });

  const rows = createBlackHoleTextRows({
    columns: metrics.columns,
    date,
    getSegmentDate: (segmentInfo) => getBlackHoleSegmentDate(state.timeDilationState, segmentInfo, date),
    orderSeed: state.textOrderSeed,
    phase: 0,
    rows: metrics.rows,
  });

  drawTextTexture(state.textCtx, rows, state.width, state.height);
  state.gl.bindTexture(state.gl.TEXTURE_2D, state.texture);
  state.gl.texImage2D(state.gl.TEXTURE_2D, 0, state.gl.RGBA, state.gl.RGBA, state.gl.UNSIGNED_BYTE, state.textCanvas);
  state.lastTextureUpdate = timestamp;
}

function renderFrame(state, timestamp) {
  resizeRenderer(state);
  if (state.width <= 0 || state.height <= 0) {
    return;
  }

  const gl = state.gl;
  const reducedMotion = state.getReducedMotion();
  const time = reducedMotion ? 0 : timestamp / 1000;
  const motion = updateBlackHoleMotionState(state.motionState, {
    pointerTarget: state.pointerTracker.getTarget(),
    reducedMotion,
    timestamp,
  });
  updateTextTexture(state, timestamp, motion);

  gl.useProgram(state.program);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, state.texture);
  gl.uniform2f(state.uniforms.center, motion.center.x, motion.center.y);
  gl.uniform1f(state.uniforms.intensity, motion.intensity);
  gl.uniform1f(state.uniforms.shadowRadius, motion.shadowRadius);
  gl.uniform1i(state.uniforms.text, 0);
  gl.uniform2f(state.uniforms.resolution, state.width, state.height);
  gl.uniform1f(state.uniforms.time, time);
  gl.uniform1f(state.uniforms.reducedMotion, reducedMotion ? 1 : 0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}

function drawFallbackFrame(canvas, timestamp, getReducedMotion, textOrderSeed, timeDilationState, motionState, pointerTracker) {
  const rect = canvas.getBoundingClientRect();
  const size = getBlackHoleRenderSize(rect.width, rect.height, window.devicePixelRatio || 1);
  if (canvas.width !== size.width || canvas.height !== size.height) {
    canvas.width = size.width;
    canvas.height = size.height;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const reducedMotion = getReducedMotion();
  const metrics = getBlackHoleTextMetrics(size.width, size.height);
  const motion = updateBlackHoleMotionState(motionState, {
    pointerTarget: pointerTracker.getTarget(),
    reducedMotion,
    timestamp,
  });
  const date = new Date();
  updateBlackHoleTimeDilationState(timeDilationState, {
    columns: metrics.columns,
    date,
    height: size.height,
    motion,
    orderSeed: textOrderSeed,
    phase: 0,
    rows: metrics.rows,
    width: size.width,
  });

  const rows = createBlackHoleTextRows({
    columns: metrics.columns,
    date,
    getSegmentDate: (segmentInfo) => getBlackHoleSegmentDate(timeDilationState, segmentInfo, date),
    orderSeed: textOrderSeed,
    phase: 0,
    rows: metrics.rows,
  });
  drawTextTexture(ctx, rows, size.width, size.height);

  const unit = Math.min(size.width, size.height);
  const cx = size.width * motion.center.x;
  const cy = size.height * (1 - motion.center.y);
  const shadowRadius = unit * motion.shadowRadius;
  const diskGradient = ctx.createLinearGradient(cx - shadowRadius * 3.4, cy, cx + shadowRadius * 3.4, cy);
  diskGradient.addColorStop(0, "rgba(84, 126, 178, 0.28)");
  diskGradient.addColorStop(0.48, "rgba(220, 235, 255, 0.86)");
  diskGradient.addColorStop(0.72, "rgba(92, 150, 230, 0.52)");
  diskGradient.addColorStop(1, "rgba(54, 86, 130, 0.22)");

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.12);
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = diskGradient;
  ctx.lineCap = "round";
  ctx.lineWidth = shadowRadius * 0.3;
  ctx.shadowColor = "rgba(128, 176, 255, 0.3)";
  ctx.shadowBlur = shadowRadius * 0.22;
  ctx.beginPath();
  ctx.ellipse(0, 0, shadowRadius * 3.4, shadowRadius * 0.45, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#000000";
  ctx.beginPath();
  ctx.arc(cx, cy, shadowRadius * 1.06, 0, Math.PI * 2);
  ctx.fill();
}

function startFallbackRenderer({ canvas, getReducedMotion }) {
  let frameId = 0;
  let lastPaint = 0;
  const motionState = createBlackHoleMotionState();
  const pointerTracker = createBlackHolePointerTracker(canvas);
  const textOrderSeed = createTextOrderSeed();
  const timeDilationState = createBlackHoleTimeDilationState();

  const tick = (timestamp) => {
    if (timestamp - lastPaint >= TEXTURE_UPDATE_MS || lastPaint === 0) {
      drawFallbackFrame(canvas, timestamp, getReducedMotion, textOrderSeed, timeDilationState, motionState, pointerTracker);
      lastPaint = timestamp;
    }

    if (!getReducedMotion()) {
      frameId = window.requestAnimationFrame(tick);
    }
  };

  frameId = window.requestAnimationFrame(tick);

  return () => {
    window.cancelAnimationFrame(frameId);
    pointerTracker.cleanup();
  };
}

export function startBlackHoleBackdropRenderer({ canvas, getReducedMotion = () => false }) {
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    desynchronized: true,
    powerPreference: "high-performance",
    preserveDrawingBuffer: false,
    stencil: false,
  });

  if (!gl) {
    return startFallbackRenderer({ canvas, getReducedMotion });
  }

  const program = createProgram(gl);
  const texture = createTexture(gl);
  const textCanvas = document.createElement("canvas");
  const textCtx = textCanvas.getContext("2d");
  const positionBuffer = gl.createBuffer();

  if (!program || !texture || !textCtx || !positionBuffer) {
    return startFallbackRenderer({ canvas, getReducedMotion });
  }

  const positionLocation = gl.getAttribLocation(program, "a_position");
  const uniforms = {
    center: gl.getUniformLocation(program, "u_center"),
    intensity: gl.getUniformLocation(program, "u_intensity"),
    reducedMotion: gl.getUniformLocation(program, "u_reduced_motion"),
    resolution: gl.getUniformLocation(program, "u_resolution"),
    shadowRadius: gl.getUniformLocation(program, "u_shadow_radius"),
    text: gl.getUniformLocation(program, "u_text"),
    time: gl.getUniformLocation(program, "u_time"),
  };

  if (
    positionLocation < 0 ||
    !uniforms.center ||
    !uniforms.intensity ||
    !uniforms.reducedMotion ||
    !uniforms.resolution ||
    !uniforms.shadowRadius ||
    !uniforms.text ||
    !uniforms.time
  ) {
    return startFallbackRenderer({ canvas, getReducedMotion });
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.useProgram(program);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const state = {
    canvas,
    getReducedMotion,
    gl,
    height: 0,
    lastTextureUpdate: 0,
    motionState: createBlackHoleMotionState(),
    pointerTracker: createBlackHolePointerTracker(canvas),
    program,
    textCanvas,
    textCtx,
    textOrderSeed: createTextOrderSeed(),
    timeDilationState: createBlackHoleTimeDilationState(),
    texture,
    uniforms,
    width: 0,
  };
  let frameId = 0;

  const tick = (timestamp) => {
    renderFrame(state, timestamp);

    if (!getReducedMotion()) {
      frameId = window.requestAnimationFrame(tick);
    }
  };

  frameId = window.requestAnimationFrame(tick);

  return () => {
    window.cancelAnimationFrame(frameId);
    state.pointerTracker.cleanup();
    gl.deleteBuffer(positionBuffer);
    gl.deleteTexture(texture);
    gl.deleteProgram(program);
  };
}
