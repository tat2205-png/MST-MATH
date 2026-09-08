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
  semantics: {
    fixed: string[];
    dependent: string[];
    controls: string[];
  };
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
  return { schema: "MST_MATH_UNIT_CIRCLE_V1", angle, unit, normalizedRadians, point: { x, y }, labelLatex: `N(${display})`, labelPosition: labelPosition(x, y), view: { width: view.width, height: view.height }, semantics: { fixed: ["O", "M", "c", "initialRay"], dependent: ["alpha", "N", "terminalRay", "angleArc", "directionArrow"], controls: ["alphaSlider"] } };
}

export function unitCircleCommands(construction: UnitCircleConstruction): string[] {
  const a = construction.normalizedRadians;
  return [
    "O = (0, 0)",
    "M = (1, 0)",
    "c = Circle(O, 1)",
    "initialRay = Ray(O, M)",
    `alpha = ${a}`,
    "N = Rotate(M, alpha, O)",
    "terminalRay = Ray(O, N)",
    "angleArc = CircularArc(O, M, N)",
    "arrowTail = Point(angleArc, 0.55)",
    "arrowHead = Point(angleArc, 0.68)",
    "directionArrow = Vector(arrowTail, arrowHead)",
    "alphaSlider = Slider(0, 2*pi, 0.01, alpha)",
    `Text(\"${construction.labelLatex}\", N)`,
  ];
}

export function exportUnitCircleGgb(construction: UnitCircleConstruction): Uint8Array {
  const esc = (value: string): string => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const command = (name: string, inputs: string[], output: string): string =>
    `<command name="${name}"><input${inputs.map((value, index) => ` a${index}="${esc(value)}"`).join("")}/><output a0="${esc(output)}"/></command>`;
  const point = (label: string, x: number, y: number): string =>
    `<element type="point" label="${esc(label)}"><show object="true" label="${label === "O" || label === "M" ? "true" : "false"}"/><objColor r="52" g="85" b="111" alpha="1"/><layer val="0"/><labelMode val="0"/><coords x="${x}" y="${y}" z="1"/></element>`;
  const styled = (type: string, label: string, show: boolean, showLabel: boolean, color = { r: 52, g: 85, b: 111 }, thickness = 3): string =>
    `<element type="${type}" label="${esc(label)}"><show object="${show}" label="${showLabel}"/><objColor r="${color.r}" g="${color.g}" b="${color.b}" alpha="1"/><layer val="1"/><labelMode val="0"/><lineStyle thickness="${thickness}" type="0" opacity="255"/></element>`;
  const metadata = `<!--<metadata>${JSON.stringify(construction)}</metadata>-->`;
  const commands = [
    command("Circle", ["O", "1"], "c"),
    command("Ray", ["O", "M"], "initialRay"),
    command("Rotate", ["M", "alpha", "O"], "N"),
    command("Ray", ["O", "N"], "terminalRay"),
    command("CircularArc", ["O", "M", "N"], "angleArc"),
    command("Point", ["angleArc", "0.55"], "arrowTail"),
    command("Point", ["angleArc", "0.68"], "arrowHead"),
    command("Vector", ["arrowTail", "arrowHead"], "directionArrow"),
  ].join("");
  const elements = [
    point("O", 0, 0),
    point("M", 1, 0),
    `<element type="circle" label="c"><show object="true" label="false"/><objColor r="52" g="85" b="111" alpha="1"/><layer val="0"/><labelMode val="0"/><equationStyle item="0"/><lineStyle thickness="4" type="0" opacity="255"/></element>`,
    `<element type="numeric" label="alpha"><show object="true" label="false"/><caption val="α"/><value val="${construction.normalizedRadians}"/><slider min="0" max="6.283185307179586" step="0.01" absoluteScreenLocation="true" width="240"/><startPoint x="280" y="540" z="1"/></element>`,
    styled("point", "N", true, true, { r: 204, g: 76, b: 67 }, 4),
    styled("ray", "initialRay", true, false, { r: 52, g: 85, b: 111 }, 3),
    styled("ray", "terminalRay", true, false, { r: 204, g: 76, b: 67 }, 4),
    styled("arc", "angleArc", true, false, { r: 230, g: 143, b: 35 }, 5),
    styled("point", "arrowTail", false, false),
    styled("point", "arrowHead", false, false),
    styled("vector", "directionArrow", true, false, { r: 230, g: 143, b: 35 }, 5),
  ].join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><geogebra format="5.0" version="5.0.507.0" app="classic" platform="w"><gui><window width="800" height="600"/></gui><euclidianView><coordSystem xZero="400" yZero="300" scale="220" yscale="220"/><evSettings axes="true" grid="false" gridIsBold="false" pointCapturing="0"/></euclidianView><kernel><usePathAndRegionParameters val="true"/></kernel><construction>${metadata}${elements}${commands}</construction></geogebra>`;
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

export function validateUnitCircleConstruction(construction: UnitCircleConstruction): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const commands = unitCircleCommands(construction);
  if (!construction.semantics.fixed.includes("O") || !construction.semantics.fixed.includes("c")) issues.push("UNIT_CIRCLE_FIXED_OBJECTS_MISSING");
  if (!construction.semantics.dependent.includes("N") || !construction.semantics.dependent.includes("terminalRay")) issues.push("UNIT_CIRCLE_DEPENDENCY_SEMANTICS_MISSING");
  for (const required of ["alphaSlider"]) if (!commands.some((command) => command.startsWith(required))) issues.push(`UNIT_CIRCLE_CONTROL_MISSING:${required}`);
  if (!commands.some((command) => command.startsWith("angleArc")) || !commands.some((command) => command.startsWith("directionArrow"))) issues.push("UNIT_CIRCLE_ANGLE_MARKING_MISSING");
  return { valid: issues.length === 0, issues };
}
