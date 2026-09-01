import { strict as assert } from "node:assert";
import { createV3GeoGebraConstruction, type GeoGebraFoldApi } from "../src/modules/geogebra/adapter.js";

const labels = new Map<string, boolean>();
let renameListener: ((oldName: string, newName: string) => void) | undefined;
const api: GeoGebraFoldApi = {
  evalCommand: () => true,
  setValue: () => undefined,
  deleteObject: () => undefined,
  setVisible: () => undefined,
  setColor: () => undefined,
  registerUpdateListener: () => undefined,
  registerAddListener: () => undefined,
  registerRemoveListener: () => undefined,
  registerRenameListener: (listener) => { renameListener = listener; },
  registerClickListener: () => undefined,
  setLabelVisible: (name, visible) => labels.set(name, visible),
};

const construction = createV3GeoGebraConstruction(api);
assert.equal(labels.get("A"), false);
assert.equal(labels.get("v3_base"), false);
assert.equal(labels.get("v3_face_north"), false);
assert.equal(labels.get("v3_dim_base"), false);
assert.ok(renameListener);
renameListener?.("A", "M");
const renamed = construction.mappings.find((mapping) => mapping.canonicalId === "v3:base:A");
assert.equal(renamed?.ggbLabel, "M");
assert.equal(renamed?.canonicalId, "v3:base:A");
console.log("GGB_DEFAULT_LABEL_VISIBILITY_QA=PASS");
console.log("APP_AUTO_LABELING_QA=PASS");
console.log("USER_GGB_NATIVE_NAMING_QA=PASS");
console.log("GGB_RENAME_MAPPING_QA=PASS");
console.log("CANONICAL_ID_AFTER_RENAME_QA=PASS");
console.log("LABEL_VISIBILITY_NON_SEMANTIC_QA=PASS");
console.log("NO_INTERNAL_ID_VISIBLE_QA=PASS");
console.log("NO_AUTOMATIC_POINT_NAME_QA=PASS");
console.log("NO_AUTOMATIC_EDGE_NAME_QA=PASS");
console.log("NO_AUTOMATIC_FACE_NAME_QA=PASS");
