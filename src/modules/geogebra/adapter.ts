export type UpdateOrigin = "CANONICAL" | "GEOGEBRA" | "UI";
export interface GeoGebraFoldApi { evalCommand(command: string): boolean; setValue(name: string, value: number): void; deleteObject(name: string): void; setVisible(name: string, visible: boolean): void; setColor(name: string, r: number, g: number, b: number): void; registerUpdateListener(listener: (name: string) => void): void; registerAddListener(listener: (name: string) => void): void; registerRemoveListener(listener: (name: string) => void): void; registerRenameListener(listener: (oldName: string, newName: string) => void): void; registerClickListener(listener: (name: string) => void): void; setLabelVisible?(name: string, visible: boolean): void; setPerspective?(perspective: string): void; setSize?(width: number, height: number): void; recalculateEnvironments?(): void; }
export interface GeoGebraIdMapping { canonicalId: string; geogebraLabel: string; }
export const createGeoGebraOriginGuard = () => { let origin: UpdateOrigin = "UI"; return { get current() { return origin; }, run<T>(next: UpdateOrigin, work: () => T) { const previous = origin; origin = next; try { return work(); } finally { origin = previous; } } }; };
export const createGeoGebraIdMapping = (entries: GeoGebraIdMapping[] = []) => new Map(entries.map(entry => [entry.canonicalId, entry.geogebraLabel]));
export const createGeoGebraSmokeConstruction = (api: GeoGebraFoldApi) => { api.evalCommand("t = 0.5"); api.evalCommand("A = (0, 0, 0)"); api.evalCommand("B = (4, 0, 0)"); api.evalCommand("C = (4, 3, 0)"); api.evalCommand("D = (0, 3, 0)"); api.evalCommand("ggb_hinge = Line(A, B)"); api.evalCommand("ggb_face = Polygon(A, B, C, D)"); api.evalCommand("ggb_rotated = Rotate(ggb_face, t * 45°, ggb_hinge)"); return { slider: "t", face: "ggb_face", rotated: "ggb_rotated", hinge: "ggb_hinge" } as const; };

import { V3_FOLD_MODEL } from "../pattern-fold/v3-fold-model.js";
import { createSquareSheetRegularSquareFrustum } from "../pattern-fold/canonical-frustum-fixture.js";
import { getNAMathVisualStyle, type NAMathVisualRole } from "../../config/naMathFoldVisualStandardV1.js";

export type GeoGebraObjectType = "point" | "polygon" | "segment" | "reference";
export interface CanonicalGgbMap { canonicalId: string; ggbLabel: string; objectType: GeoGebraObjectType; role: string; }

const v3Mappings: CanonicalGgbMap[] = [
  { canonicalId: "v3:source-sheet", ggbLabel: "v3_source_sheet", objectType: "reference", role: "SOURCE_SHEET" },
  ...["A", "B", "C", "D"].map((id) => ({ canonicalId: `v3:base:${id}`, ggbLabel: id, objectType: "point" as const, role: "CENTRAL_BASE" })),
  { canonicalId: "v3:base:polygon", ggbLabel: "v3_base", objectType: "polygon", role: "CENTRAL_BASE" },
  ...["north", "east", "south", "west"].map((id) => ({ canonicalId: `v3:face:${id}`, ggbLabel: `v3_face_${id}`, objectType: "polygon" as const, role: "FOLDING_FACE" })),
  ...["ne", "se", "sw", "nw"].map((id) => ({ canonicalId: `v3:cut:${id}`, ggbLabel: `v3_cut_${id}`, objectType: "polygon" as const, role: "CUT_PIECE" })),
  ...[["AB", "north"], ["BC", "east"], ["CD", "south"], ["DA", "west"]].map(([id]) => ({ canonicalId: `v3:hinge:${id}`, ggbLabel: `v3_hinge_${id}`, objectType: "segment" as const, role: "HINGE" })),
  ...["sheet", "base", "outer"].map((id) => ({ canonicalId: `v3:dimension:${id}`, ggbLabel: `v3_dim_${id}`, objectType: "reference" as const, role: "DIMENSION" })),
];

export const createV3GeoGebraConstruction = (api: GeoGebraFoldApi, options: { renderCutPieces?: boolean } = {}) => {
  const renderCutPieces = options.renderCutPieces ?? true;
  const mappings = v3Mappings.map((mapping) => ({ ...mapping }));
  const guard = createGeoGebraOriginGuard();
  const a = V3_FOLD_MODEL.defaultBaseSide;
  const canonicalCutPieces = createSquareSheetRegularSquareFrustum(a).shapes.filter((shape) => shape.role === "CUT_PIECE");
  const polygonCommand = (label: string, vertices: [number, number][]) => `${label} = Polygon(${vertices.map(([x, y]) => `(${x}, ${y}, 0)`).join(", ")})`;
  const commands = [
    `v3_a = ${a}`, "v3_t = 0", "v3_q = sqrt(6.25 - 4 * v3_t^2)", "v3_h = 2 * v3_t",
    "A = (-v3_a / 2, -v3_a / 2, 0)", "B = (v3_a / 2, -v3_a / 2, 0)", "C = (v3_a / 2, v3_a / 2, 0)", "D = (-v3_a / 2, v3_a / 2, 0)",
    "v3_base = Polygon(A, B, C, D)", "SHEET_A = (-4, -4, 0)", "SHEET_B = (4, -4, 0)", "SHEET_C = (4, 4, 0)", "SHEET_D = (-4, 4, 0)", "v3_source_sheet = Polygon(SHEET_A, SHEET_B, SHEET_C, SHEET_D)",
    "FN1 = (-v3_a / 2, v3_a / 2, 0)", "FN2 = (v3_a / 2, v3_a / 2, 0)", "FN3 = (3, v3_a / 2 + v3_q, v3_h)", "FN4 = (-3, v3_a / 2 + v3_q, v3_h)", "v3_face_north = Polygon(FN1, FN2, FN3, FN4)",
    "FE1 = (v3_a / 2, -v3_a / 2, 0)", "FE2 = (v3_a / 2, v3_a / 2, 0)", "FE3 = (v3_a / 2 + v3_q, 3, v3_h)", "FE4 = (v3_a / 2 + v3_q, -3, v3_h)", "v3_face_east = Polygon(FE1, FE2, FE3, FE4)",
    "FS1 = (-v3_a / 2, -v3_a / 2, 0)", "FS2 = (v3_a / 2, -v3_a / 2, 0)", "FS3 = (3, -v3_a / 2 - v3_q, v3_h)", "FS4 = (-3, -v3_a / 2 - v3_q, v3_h)", "v3_face_south = Polygon(FS1, FS2, FS3, FS4)",
    "FW1 = (-v3_a / 2, -v3_a / 2, 0)", "FW2 = (-v3_a / 2, v3_a / 2, 0)", "FW3 = (-v3_a / 2 - v3_q, 3, v3_h)", "FW4 = (-v3_a / 2 - v3_q, -3, v3_h)", "v3_face_west = Polygon(FW1, FW2, FW3, FW4)",
    ...(renderCutPieces ? canonicalCutPieces.map((shape, index) => polygonCommand(`v3_cut_${["ne", "se", "sw", "nw"][index]}`, shape.geometry.kind === "polygon" ? shape.geometry.vertices : [])) : []),
    "v3_hinge_AB = Segment(A, B)", "v3_hinge_BC = Segment(B, C)", "v3_hinge_CD = Segment(C, D)", "v3_hinge_DA = Segment(D, A)", "v3_dim_sheet = Segment((-4, -4, 0), (4, -4, 0))", "v3_dim_base = Segment(A, B)", "v3_dim_outer = Segment((3, 4, 0), (-3, 4, 0))",
  ];
  guard.run("CANONICAL", () => mappings.forEach(({ ggbLabel }) => api.deleteObject(ggbLabel)));
  guard.run("CANONICAL", () => commands.forEach((command) => {
    const ok = api.evalCommand(command);
    if (!ok) {
      throw new Error(`GEOGEBRA_COMMAND_FAILED:${command}`);
    }
  }));
  const rgb = (hex: string) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)] as const;
  const style = (label: string, role: NAMathVisualRole) => { const visual = getNAMathVisualStyle(role), [r, g, b] = rgb(visual.color); api.setColor(label, r, g, b); api.evalCommand(`SetFilling(${label}, ${visual.opacity})`); api.setLabelVisible?.(label, false); };
  api.evalCommand('SetActiveView("T")');
  style("v3_source_sheet", "source-sheet"); style("v3_base", "base-face");
  ["v3_face_north", "v3_face_east", "v3_face_south", "v3_face_west"].forEach((label) => style(label, "folding-face"));
  if (renderCutPieces) ["v3_cut_ne", "v3_cut_se", "v3_cut_sw", "v3_cut_nw"].forEach((label) => style(label, "cut-piece"));
  if (renderCutPieces) {
    api.evalCommand("SetLayer(v3_source_sheet, 1)");
    ["v3_cut_ne", "v3_cut_se", "v3_cut_sw", "v3_cut_nw"].forEach((label) => api.evalCommand(`SetLayer(${label}, 5)`));
  }
  if (api.setLabelVisible) {
    const managedLabels = [
      ...mappings.map(({ ggbLabel }) => ggbLabel),
      "v3_a", "v3_t", "v3_q", "v3_h", "SHEET_A", "SHEET_B", "SHEET_C", "SHEET_D",
      "FN1", "FN2", "FN3", "FN4", "FE1", "FE2", "FE3", "FE4",
      "FS1", "FS2", "FS3", "FS4", "FW1", "FW2", "FW3", "FW4",
    ];
    managedLabels.forEach((label) => api.setLabelVisible?.(label, false));
  }
  api.registerRenameListener((oldName, newName) => {
    const mapping = mappings.find((entry) => entry.ggbLabel === oldName);
    if (mapping) mapping.ggbLabel = newName;
  });
  ["v3_hinge_AB", "v3_hinge_BC", "v3_hinge_CD", "v3_hinge_DA"].forEach((label) => style(label, "fold-edge"));
  ["v3_dim_sheet", "v3_dim_base", "v3_dim_outer"].forEach((label) => style(label, "dimension"));
  api.recalculateEnvironments?.();
  const update = (nextT: number, nextA = a) => guard.run("CANONICAL", () => { api.setValue("v3_t", nextT); api.setValue("v3_a", nextA); });
  return { api, mappings, guard, update, reset: () => update(0, a), setVisible: (id: string, visible: boolean) => api.setVisible(id, visible), styles: { sourceSheet: getNAMathVisualStyle("source-sheet"), base: getNAMathVisualStyle("base-face"), foldingFace: getNAMathVisualStyle("folding-face"), cutPiece: getNAMathVisualStyle("cut-piece"), foldEdge: getNAMathVisualStyle("fold-edge"), dimension: getNAMathVisualStyle("dimension") }, inventory: () => mappings.map((mapping) => ({ ...mapping, visible: renderCutPieces || mapping.role !== "CUT_PIECE" })) };
};
