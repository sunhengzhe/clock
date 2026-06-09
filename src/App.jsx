import { useCallback, useEffect, useRef, useState } from "react";

import { modes, resolveTheme, startWatchRenderer, themeOptions as watchThemeOptions, themes } from "./watch-renderer.js";

const FACE_CLICKED_STORAGE_KEY = "watch-face-clicked";
const MENU_IDLE_HIDE_MS = 2800;

function getStoredFaceClicked() {
  try {
    return window.sessionStorage.getItem(FACE_CLICKED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function storeFaceClicked() {
  try {
    window.sessionStorage.setItem(FACE_CLICKED_STORAGE_KEY, "1");
  } catch {
    // Session storage is an enhancement; the interaction should still work.
  }
}

export default function App() {
  const [themeKey, setThemeKey] = useState("midnight");
  const [modeIndex, setModeIndex] = useState(0);
  const [menuVisible, setMenuVisible] = useState(true);
  const [hasClickedFace, setHasClickedFace] = useState(getStoredFaceClicked);

  const watchFaceRef = useRef(null);
  const canvasRef = useRef(null);
  const themeKeyRef = useRef(themeKey);
  const modeRef = useRef(modes[modeIndex]);
  const menuIdleTimerRef = useRef(0);

  useEffect(() => {
    themeKeyRef.current = themeKey;
  }, [themeKey]);

  useEffect(() => {
    modeRef.current = modes[modeIndex] ?? "normal";
  }, [modeIndex]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const watchFace = watchFaceRef.current;
    if (!canvas || !watchFace) {
      return undefined;
    }

    return startWatchRenderer({
      canvas,
      watchFace,
      getMode: () => modeRef.current,
      getThemeKey: () => themeKeyRef.current,
    });
  }, []);

  useEffect(() => {
    const body = document.body;
    const theme = resolveTheme(themeKey);

    body.style.setProperty("--bg-top", theme.bgTop);
    body.style.setProperty("--bg-bottom", theme.bgBottom);
    body.style.setProperty("--glow-blue-rgb", theme.glowBlueRgb);
    body.style.setProperty("--glow-green-rgb", theme.glowGreenRgb);
    body.style.setProperty("--ring-minute-rgb", theme.minuteRgb);
    body.style.setProperty("--ring-second-rgb", theme.secondRgb);

    for (const key of Object.keys(themes)) {
      body.classList.remove(`theme-${key}`);
    }
    body.classList.add(`theme-${themeKey}`);
    body.classList.toggle("theme-pixel", Boolean(theme.pixel));
  }, [themeKey]);

  useEffect(() => {
    const body = document.body;
    body.classList.toggle("menu-visible", menuVisible);
    body.classList.toggle("show-tap-hint", !hasClickedFace);
  }, [hasClickedFace, menuVisible]);

  useEffect(() => {
    return () => {
      window.clearTimeout(menuIdleTimerRef.current);
    };
  }, []);

  const hideMenu = useCallback(() => {
    window.clearTimeout(menuIdleTimerRef.current);
    menuIdleTimerRef.current = 0;
    setMenuVisible(false);
  }, []);

  const showMenuWithTimeout = useCallback(() => {
    setMenuVisible(true);
    window.clearTimeout(menuIdleTimerRef.current);
    menuIdleTimerRef.current = window.setTimeout(() => {
      setMenuVisible(false);
      menuIdleTimerRef.current = 0;
    }, MENU_IDLE_HIDE_MS);
  }, []);

  useEffect(() => {
    const handlePointerMove = (event) => {
      if (event.pointerType === "mouse") {
        showMenuWithTimeout();
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [showMenuWithTimeout]);

  const markFaceClicked = useCallback(() => {
    if (hasClickedFace) {
      return;
    }
    setHasClickedFace(true);
    storeFaceClicked();
  }, [hasClickedFace]);

  const toggleMode = useCallback(() => {
    setModeIndex((current) => (current + 1) % modes.length);
    markFaceClicked();
  }, [markFaceClicked]);

  const handleStageClick = useCallback(
    (event) => {
      if (event.target instanceof Element && event.target.closest("#watch-menu")) {
        return;
      }
      toggleMode();
    },
    [toggleMode],
  );

  const handleStagePointerEnter = useCallback(
    (event) => {
      if (event.pointerType === "mouse") {
        showMenuWithTimeout();
      }
    },
    [showMenuWithTimeout],
  );

  const handleStagePointerLeave = useCallback(
    (event) => {
      if (event.pointerType === "mouse") {
        hideMenu();
      }
    },
    [hideMenu],
  );

  const handleThemeClick = useCallback(
    (nextThemeKey) => {
      setThemeKey(nextThemeKey);
      showMenuWithTimeout();
    },
    [showMenuWithTimeout],
  );

  return (
    <main
      className="watch-stage"
      onClick={handleStageClick}
      onPointerEnter={handleStagePointerEnter}
      onPointerLeave={handleStagePointerLeave}
    >
      <button ref={watchFaceRef} id="watch-face" className="watch-face" type="button" aria-label="点击切换表盘圈层模式">
        <canvas ref={canvasRef} id="watch-canvas" className="watch-canvas" aria-hidden="true" />
      </button>

      <aside id="watch-menu" className="watch-menu" aria-label="表盘菜单">
        <div className="menu-item">
          <span className="menu-item-label">主题</span>
          <div id="theme-options" className="theme-options" role="radiogroup" aria-label="选择主题">
            {watchThemeOptions.map((theme) => (
              <button
                key={theme.key}
                type="button"
                className="theme-swatch"
                data-theme={theme.key}
                role="radio"
                aria-checked={themeKey === theme.key}
                aria-label={theme.label}
                title={theme.label}
                onClick={() => handleThemeClick(theme.key)}
              >
                <span className="theme-swatch-dot" />
                <span className="theme-swatch-name">{theme.label}</span>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <p id="tap-hint" className="tap-hint" aria-live="polite">
        试试点击表盘
      </p>
    </main>
  );
}
