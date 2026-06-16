export const BLACK_HOLE_REAL_TIME_NOTE = "越靠近黑洞，时间流逝越慢";

function pad2(value) {
  return String(value).padStart(2, "0");
}

export function formatBlackHoleRealTime(date) {
  return [
    date.getFullYear(),
    pad2(date.getMonth() + 1),
    pad2(date.getDate()),
  ].join("-") + ` ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}

export function getBlackHoleRealTimeRefreshDelay(nowMs) {
  return 1000 - (nowMs % 1000) + 16;
}
