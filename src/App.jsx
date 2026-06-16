import { useCallback, useEffect, useRef, useState } from "react";

import { BlackHoleBackdrop } from "./BlackHoleBackdrop.jsx";
import { readFaceClickedPreference, writeFaceClickedPreference } from "./interaction-preferences.js";
import { DEFAULT_THEME_KEY, buildThemeSearch, readThemeFromSearch } from "./theme-preferences.js";
import {
  groupThemeOptions,
  modes,
  resolveTheme,
  resolveThemeKey,
  startWatchRenderer,
  themeOptions,
  themes,
} from "./watch-renderer.js";

const MENU_IDLE_HIDE_MS = 2800;
const watchThemeGroups = groupThemeOptions();

function getStoredFaceClicked() {
  if (typeof window === "undefined") {
    return false;
  }

  return readFaceClickedPreference(window.localStorage);
}

function storeFaceClicked() {
  writeFaceClickedPreference(window.localStorage);
}

function getThemeKeyFromUrl() {
  if (typeof window === "undefined") {
    return DEFAULT_THEME_KEY;
  }

  return readThemeFromSearch(window.location.search, themeOptions, DEFAULT_THEME_KEY);
}

function replaceThemeUrl(themeKey) {
  const nextSearch = buildThemeSearch(window.location.search, themeKey, themeOptions);
  if (nextSearch === null) {
    return;
  }

  const nextUrl = `${window.location.pathname}${nextSearch}${window.location.hash}`;
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (nextUrl !== currentUrl) {
    window.history.replaceState(window.history.state, "", nextUrl);
  }
}

function getCurrentSystemScheme() {
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
}

function getIsTouchMenu() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia?.("(hover: none), (pointer: coarse), (max-width: 720px)").matches ?? false;
}

export default function App() {
  const [themeKey, setThemeKey] = useState(getThemeKeyFromUrl);
  const [systemScheme, setSystemScheme] = useState(getCurrentSystemScheme);
  const [isTouchMenu, setIsTouchMenu] = useState(getIsTouchMenu);
  const [modeIndex, setModeIndex] = useState(0);
  const [menuVisible, setMenuVisible] = useState(false);
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
    const theme = resolveTheme(themeKey, systemScheme);
    const resolvedThemeKey = resolveThemeKey(themeKey, systemScheme);

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
    if (resolvedThemeKey !== themeKey) {
      body.classList.add(`theme-${resolvedThemeKey}`);
    }
    body.classList.toggle("theme-pixel", Boolean(theme.pixel));
    body.classList.toggle("theme-monochrome", Boolean(theme.monochrome));
  }, [systemScheme, themeKey]);

  useEffect(() => {
    const syncThemeFromUrl = () => {
      setThemeKey(getThemeKeyFromUrl());
    };

    window.addEventListener("popstate", syncThemeFromUrl);
    return () => window.removeEventListener("popstate", syncThemeFromUrl);
  }, []);

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) {
      return undefined;
    }

    const syncSystemScheme = () => {
      setSystemScheme(media.matches ? "dark" : "light");
    };

    syncSystemScheme();
    media.addEventListener("change", syncSystemScheme);
    return () => media.removeEventListener("change", syncSystemScheme);
  }, []);

  useEffect(() => {
    const body = document.body;
    body.classList.toggle("menu-visible", menuVisible);
    body.classList.toggle("touch-menu", isTouchMenu);
    body.classList.toggle("show-tap-hint", !hasClickedFace);
  }, [hasClickedFace, isTouchMenu, menuVisible]);

  useEffect(() => {
    const media = window.matchMedia?.("(hover: none), (pointer: coarse), (max-width: 720px)");
    if (!media) {
      return undefined;
    }

    const syncTouchMenu = () => {
      setIsTouchMenu(media.matches);
      setMenuVisible(false);
    };

    syncTouchMenu();
    media.addEventListener("change", syncTouchMenu);
    return () => media.removeEventListener("change", syncTouchMenu);
  }, []);

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
    if (isTouchMenu) {
      window.clearTimeout(menuIdleTimerRef.current);
      menuIdleTimerRef.current = 0;
      return undefined;
    }

    const handlePointerMove = (event) => {
      if (event.pointerType === "mouse") {
        showMenuWithTimeout();
      }
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [isTouchMenu, showMenuWithTimeout]);

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

  const handleStagePointerUp = useCallback(
    (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) {
        return;
      }
      if (event.target instanceof Element && event.target.closest("#watch-menu")) {
        return;
      }
      toggleMode();
    },
    [toggleMode],
  );

  const toggleMenu = useCallback(() => {
    setMenuVisible((current) => !current);
  }, []);

  const handleStagePointerEnter = useCallback(
    (event) => {
      if (!isTouchMenu && event.pointerType === "mouse") {
        showMenuWithTimeout();
      }
    },
    [isTouchMenu, showMenuWithTimeout],
  );

  const handleStagePointerLeave = useCallback(
    (event) => {
      if (!isTouchMenu && event.pointerType === "mouse") {
        hideMenu();
      }
    },
    [hideMenu, isTouchMenu],
  );

  const handleThemeClick = useCallback(
    (nextThemeKey) => {
      setThemeKey(nextThemeKey);
      replaceThemeUrl(nextThemeKey);
      if (!isTouchMenu) {
        showMenuWithTimeout();
      }
    },
    [isTouchMenu, showMenuWithTimeout],
  );

  const activeThemeKey = resolveThemeKey(themeKey, systemScheme);

  return (
    <main
      className="watch-stage"
      data-mode={modes[modeIndex]}
      onPointerUp={handleStagePointerUp}
      onPointerEnter={handleStagePointerEnter}
      onPointerLeave={handleStagePointerLeave}
    >
      <BlackHoleBackdrop active={activeThemeKey === "blackhole"} />

      <div ref={watchFaceRef} id="watch-face" className="watch-face" aria-hidden="true">
        <canvas ref={canvasRef} id="watch-canvas" className="watch-canvas" aria-hidden="true" />
      </div>

      <aside id="watch-menu" className="watch-menu" aria-label="表盘菜单">
        <button
          type="button"
          className="menu-trigger"
          data-theme={themeKey}
          aria-controls="theme-options-panel"
          aria-expanded={menuVisible}
          onClick={toggleMenu}
        >
          <span className="theme-trigger-dot" aria-hidden="true" />
          <span>主题</span>
        </button>

        <div id="theme-options-panel" className="menu-item">
          <span className="menu-item-label">主题</span>
          <div id="theme-options" className="theme-options" role="radiogroup" aria-label="选择主题">
            {watchThemeGroups.map((group) => (
              <div key={group.key} className="theme-group" aria-label={group.label} role="group">
                <span className="theme-group-label">{group.label}</span>
                <div className="theme-group-options">
                  {group.options.map((theme) => (
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
