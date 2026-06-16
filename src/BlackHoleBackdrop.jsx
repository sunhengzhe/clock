import { useEffect, useRef } from "react";

import { startBlackHoleBackdropRenderer } from "./blackhole-renderer.js";

export function BlackHoleBackdrop({ active }) {
  const canvasRef = useRef(null);

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

  return <canvas ref={canvasRef} className="blackhole-backdrop" aria-hidden="true" />;
}
