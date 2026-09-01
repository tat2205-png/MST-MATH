import type { PatternSheet, PatternShape } from "./types.js";
export const SQUARE_SHEET_TO_REGULAR_SQUARE_FRUSTUM = { id: "SQUARE_SHEET_TO_REGULAR_SQUARE_FRUSTUM", sheetSide: 8, cornerOffset: 1, topRimSide: 6, defaultBaseSide: 3, baseSideStep: .1, validBaseSide: (a: number) => Number.isFinite(a) && a > 0 && a < 6 } as const;
const poly = (id: string, vertices: [number, number][], role: PatternShape["role"]): PatternShape => ({ id, geometry: { kind: "polygon", vertices }, role });
export function createSquareSheetRegularSquareFrustum(baseSide = 3): PatternSheet {
  if (!SQUARE_SHEET_TO_REGULAR_SQUARE_FRUSTUM.validBaseSide(baseSide)) throw new Error("INVALID_FRUSTUM_BASE_SIDE");
  const h = baseSide / 2, outer = 3, sheet = 4;
  const regions = [{ id: "base", vertices: [[-h,-h],[h,-h],[h,h],[-h,h]] as [number,number][] }, { id: "fold-north", vertices: [[-h,h],[h,h],[outer,sheet],[-outer,sheet]] as [number,number][] }, { id: "fold-east", vertices: [[h,-h],[sheet,-outer],[sheet,outer],[h,h]] as [number,number][] }, { id: "fold-south", vertices: [[-outer,-sheet],[outer,-sheet],[h,-h],[-h,-h]] as [number,number][] }, { id: "fold-west", vertices: [[-sheet,-outer],[-h,-h],[-h,h],[-sheet,outer]] as [number,number][] }];
  const cuts = [
    poly("cut-ne", [[sheet, sheet], [sheet, outer], [h, h], [outer, sheet]], "CUT_PIECE"),
    poly("cut-se", [[sheet, -sheet], [outer, -sheet], [h, -h], [sheet, -outer]], "CUT_PIECE"),
    poly("cut-sw", [[-sheet, -sheet], [-sheet, -outer], [-h, -h], [-outer, -sheet]], "CUT_PIECE"),
    poly("cut-nw", [[-sheet, sheet], [-outer, sheet], [-h, h], [-sheet, outer]], "CUT_PIECE"),
  ];
  const hinge = (id: string, points: [[number,number],[number,number]], regionIds: [string,string]) => ({ id, points, assignment: "VALLEY" as const, regionIds, targetAngleRadians: Math.PI / 2 });
  return { id: SQUARE_SHEET_TO_REGULAR_SQUARE_FRUSTUM.id, motionModel: "APPROVED_V3_FRUSTUM", sourceShape: { type: "SQUARE", side: 8 }, boundary: { id: "source-sheet", kind: "square", geometry: { kind: "polygon", vertices: [[-sheet,-sheet],[sheet,-sheet],[sheet,sheet],[-sheet,sheet]] } }, shapes: cuts, cuts: cuts.map(p => ({ id: `${p.id}:cut-edge`, points: p.geometry.kind === "polygon" ? p.geometry.vertices : [], cutType: "PARTIAL" as const })), creases: [hinge("hinge-north", [[-h,h],[h,h]], ["base","fold-north"]), hinge("hinge-east", [[h,-h],[h,h]], ["base","fold-east"]), hinge("hinge-south", [[-h,-h],[h,-h]], ["base","fold-south"]), hinge("hinge-west", [[-h,-h],[-h,h]], ["base","fold-west"])], regions, rootRegionId: "base" };
}
