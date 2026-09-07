import { unzipSync, zipSync } from "fflate";

export type AngleUnit = "DEG" | "RAD";
export interface UnitCircleConstruction {
  schema: "MST_MATH_UNIT_CIRCLE_V1";
  angle: number;
  unit: AngleUnit;
  normalizedRadians: number;
  point: { x: number; y: number };
  labelLatex: string;
  labelPosition: "TOP" | "RIGHT" | "BOTTOM" | "LEFT";
  view: { width: number; height: number };
}

function positiveTurns(radians: number): number {
  const turn = Math.PI * 2;
  const value = radians % turn;
  return value < 0 ? value + turn : value;
}

function labelPosition(x: number, y: number): UnitCircleConstruction["labelPosition"] {
  if (Math.abs(x) >= Math.abs(y)) return x >= 0 ? "RIGHT" : "LEFT";
  return y >= 0 ? "TOP" : "BOTTOM";
}

export function buildUnitCircleConstruction(angle: number, unit: AngleUnit, view = { width: 640, height: 480 }): UnitCircleConstruction {
  if (!Number.isFinite(angle) || !Number.isFinite(view.width) || !Number.isFinite(view.height) || view.width <= 0 || view.height <= 0) throw new Error("UNIT_CIRCLE_INVALID_INPUT");
  const radians = unit === "DEG" ? angle * Math.PI / 180 : angle;
  const normalizedRadians = positiveTurns(radians);
  const x = Math.cos(normalizedRadians);
  const y = Math.sin(normalizedRadians);
  const display = unit === "DEG" ? `${angle}°` : `${angle}\\,\\mathrm{rad}`;
  return { schema: "MST_MATH_UNIT_CIRCLE_V1", angle, unit, normalizedRadians, point: { x, y }, labelLatex: `P(${display})`, labelPosition: labelPosition(x, y), view: { width: view.width, height: view.height } };
}

export function unitCircleCommands(construction: UnitCircleConstruction): string[] {
  const a = construction.normalizedRadians;
  return ["O = (0, 0)", "c = Circle(O, 1)", `P = (${construction.point.x}, ${construction.point.y})`, `r = Segment(O, P)`, `ang = ${a}`, `Text(\"${construction.labelLatex}\", P)`];
}

export function exportUnitCircleGgb(construction: UnitCircleConstruction): Uint8Array {
  const commands = unitCircleCommands(construction).map((command) => `<element type="command"><command>${command.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</command></element>`).join("");
  const xml = `<?xml version="1.0" encoding="utf-8"?><geogebra format="5.0"><construction>${commands}<element type="mst-math-unit-circle-v1"><metadata>${JSON.stringify(construction)}</metadata></element></construction></geogebra>`;
  return zipSync({ "geogebra.xml": new TextEncoder().encode(xml) });
}

export function reopenUnitCircleGgb(bytes: Uint8Array): UnitCircleConstruction {
  const xmlBytes = unzipSync(bytes)["geogebra.xml"];
  if (!xmlBytes) throw new Error("UNIT_CIRCLE_GGB_MISSING_XML");
  const xml = new TextDecoder().decode(xmlBytes);
  const match = xml.match(/<metadata>([\s\S]*?)<\/metadata>/);
  if (!match) throw new Error("UNIT_CIRCLE_GGB_MISSING_METADATA");
  const parsed = JSON.parse(match[1]!) as UnitCircleConstruction;
  const rebuilt = buildUnitCircleConstruction(parsed.angle, parsed.unit, parsed.view);
  if (JSON.stringify(rebuilt) !== JSON.stringify(parsed)) throw new Error("UNIT_CIRCLE_GGB_CONSTRUCTION_MISMATCH");
  return rebuilt;
}
