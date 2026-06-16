export const DEFAULT_THEME_KEY = "minimal";
export const THEME_QUERY_PARAM = "theme";

export function normalizeThemeSlug(themeSlug) {
  return typeof themeSlug === "string" ? themeSlug.trim().toLowerCase() : "";
}

export function getThemeSlug(themeKey, options) {
  return options.find((option) => option.key === themeKey)?.slug ?? "";
}

export function resolveThemeKeyFromSlug(themeSlug, options, fallback = DEFAULT_THEME_KEY) {
  const normalizedSlug = normalizeThemeSlug(themeSlug);
  const option = options.find((themeOption) => themeOption.slug === normalizedSlug || themeOption.key === normalizedSlug);

  return option?.key ?? fallback;
}

export function readThemeFromSearch(search, options, fallback = DEFAULT_THEME_KEY) {
  const params = new URLSearchParams(search);

  return resolveThemeKeyFromSlug(params.get(THEME_QUERY_PARAM), options, fallback);
}

export function buildThemeSearch(search, themeKey, options) {
  const themeSlug = getThemeSlug(themeKey, options);
  if (!themeSlug) {
    return null;
  }

  const params = new URLSearchParams(search);
  params.set(THEME_QUERY_PARAM, themeSlug);
  const nextSearch = params.toString();

  return nextSearch ? `?${nextSearch}` : "";
}
