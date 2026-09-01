// Compatibility facade for the existing GeoGebra FOLD workspace API.

export type {
  FoldWorkspaceToolController,
  ToolSelection,
  ToolState,
} from "../pattern-fold/geogebra/tool-controller.js";

export {
  createFoldWorkspaceToolController,
} from "../pattern-fold/geogebra/tool-controller.js";
