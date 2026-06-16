import { useEffect, useRef, useState } from "react";

import { BLACK_HOLE_REAL_TIME_NOTE, formatBlackHoleRealTime, getBlackHoleRealTimeRefreshDelay } from "./blackhole-real-time.js";
import { startBlackHoleBackdropRenderer } from "./blackhole-renderer.js";

export function BlackHoleBackdrop({ active }) {
  const canvasRef = useRef(null);
  const [realTime, setRealTime] = useState(() => formatBlackHoleRealTime(new Date()));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!active || !canvas) {
      return undefined;
    }

    const motionMedia = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    return startBlackHoleBackdropRenderer({
      canvas,
      getReducedMotion: () => motionMedia?.matches ?? false,
    });
  }, [active]);

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    let timeoutId = 0;
    const tick = () => {
      const now = new Date();
      setRealTime(formatBlackHoleRealTime(now));
      timeoutId = window.setTimeout(tick, getBlackHoleRealTimeRefreshDelay(now.getTime()));
    };

    tick();

    return () => window.clearTimeout(timeoutId);
  }, [active]);

  return (
    <>
      <canvas ref={canvasRef} className="blackhole-backdrop" aria-hidden="true" />
      <div className="blackhole-real-time" aria-hidden={!active}>
        <time className="blackhole-real-time-clock" dateTime={realTime.replace(" ", "T")}>
          {realTime}
        </time>
        <span className="blackhole-real-time-note">{BLACK_HOLE_REAL_TIME_NOTE}</span>
      </div>
    </>
  );
}
