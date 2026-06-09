import assert from "node:assert/strict";
import test from "node:test";

import {
  FACE_CLICKED_STORAGE_KEY,
  readFaceClickedPreference,
  writeFaceClickedPreference,
} from "../src/interaction-preferences.js";

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial));

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

test("readFaceClickedPreference restores the clicked hint state", () => {
  const storage = createStorage({ [FACE_CLICKED_STORAGE_KEY]: "1" });

  assert.equal(readFaceClickedPreference(storage), true);
});

test("readFaceClickedPreference falls back when storage is empty or unavailable", () => {
  const throwingStorage = {
    getItem() {
      throw new Error("unavailable");
    },
  };

  assert.equal(readFaceClickedPreference(createStorage()), false);
  assert.equal(readFaceClickedPreference(throwingStorage), false);
});

test("writeFaceClickedPreference stores the clicked hint state", () => {
  const storage = createStorage();

  assert.equal(writeFaceClickedPreference(storage), true);
  assert.equal(readFaceClickedPreference(storage), true);
});
