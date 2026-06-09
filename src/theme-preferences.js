export const DEFAULT_THEME_KEY = "minimal";
export const THEME_STORAGE_KEY = "watch-face-theme";

export function isThemeKey(themeKey, themesByKey) {
  return typeof themeKey === "string" && Object.hasOwn(themesByKey, themeKey);
}

export function readThemePreference(storage, themesByKey, fallback = DEFAULT_THEME_KEY) {
  try {
    const storedThemeKey = storage?.getItem(THEME_STORAGE_KEY);
    return isThemeKey(storedThemeKey, themesByKey) ? storedThemeKey : fallback;
  } catch {
    return fallback;
  }
}

export function writeThemePreference(storage, themeKey, themesByKey) {
  if (!isThemeKey(themeKey, themesByKey)) {
    return false;
  }

  try {
    storage?.setItem(THEME_STORAGE_KEY, themeKey);
    return true;
  } catch {
    return false;
  }
}
