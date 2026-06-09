export const FACE_CLICKED_STORAGE_KEY = "watch-face-clicked";

export function readFaceClickedPreference(storage) {
  try {
    return storage?.getItem(FACE_CLICKED_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeFaceClickedPreference(storage) {
  try {
    storage?.setItem(FACE_CLICKED_STORAGE_KEY, "1");
    return true;
  } catch {
    return false;
  }
}
