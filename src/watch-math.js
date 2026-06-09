export function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

export function lerp(from, to, t) {
  return from + (to - from) * t;
}

export function smoothStep(value) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

export function normalizeDeg(value) {
  return ((value % 360) + 360) % 360;
}

export function getClockAngles(now) {
  const milliseconds = now.getMilliseconds();
  const seconds = now.getSeconds() + milliseconds / 1000;
  const minutes = now.getMinutes() + seconds / 60;
  const hours = (now.getHours() % 12) + minutes / 60;

  return {
    secondDeg: seconds * 6,
    minuteDeg: minutes * 6,
    hourDeg: hours * 30,
  };
}

export function getExpandedCenter(centerX, centerY, angleDeg, tipDistance, expandedRadius, gap = 0) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  const axisX = Math.cos(rad);
  const axisY = Math.sin(rad);
  const centerDistance = tipDistance - expandedRadius - gap;

  return {
    x: centerX + axisX * centerDistance,
    y: centerY + axisY * centerDistance,
  };
}
