import { useEffect, useRef } from "react";

import { startStarfieldConstellationRenderer } from "./starfield-constellations.js";

export function StarfieldConstellations({ active }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!active || !canvas) {
      return undefined;
    }

    const motionMedia = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    return startStarfieldConstellationRenderer({
      canvas,
      getReducedMotion: () => motionMedia?.matches ?? false,
    });
  }, [active]);

  return <canvas ref={canvasRef} className="starfield-constellations" aria-hidden="true" />;
}
