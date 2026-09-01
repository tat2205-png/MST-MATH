import type { VisualSemanticModel } from "./types.js";

export interface RendererSemanticSnapshot { renderer: string; entityIds: string[]; relationIds: string[]; visibleEntityIds: string[] }
export interface LayoutBox { id: string; x: number; y: number; width: number; height: number; fontSizePx?: number; kind?: "text" | "formula" | "visual" }

export function compareRendererSemantics(model: VisualSemanticModel, snapshots: RendererSemanticSnapshot[]): { status: "PASS" | "FAIL"; issues: string[] } {
  const expectedEntities = [...model.entities.map((entity) => entity.mathEntityId)].sort().join("|");
  const expectedRelations = [...model.relations.map((relation) => relation.id)].sort().join("|");
  const issues = snapshots.flatMap((snapshot) => [snapshot.entityIds.slice().sort().join("|") === expectedEntities ? undefined : `${snapshot.renderer}:ENTITY_IDENTITY_MISMATCH`, snapshot.relationIds.slice().sort().join("|") === expectedRelations ? undefined : `${snapshot.renderer}:RELATION_IDENTITY_MISMATCH`]).filter((issue): issue is string => Boolean(issue));
  return { status: issues.length ? "FAIL" : "PASS", issues };
}

export function validateLayout(boxes: LayoutBox[], viewport: { width: number; height: number; safeMargin: number; mobile?: boolean }): { status: "PASS" | "FAIL"; issues: string[] } {
  const issues: string[] = [];
  for (const box of boxes) {
    if (box.x < viewport.safeMargin || box.y < viewport.safeMargin || box.x + box.width > viewport.width - viewport.safeMargin || box.y + box.height > viewport.height - viewport.safeMargin) issues.push(`${box.id}:CLIPPED_OR_OUTSIDE_SAFE_AREA`);
    if (box.kind === "formula" && box.width > viewport.width - 2 * viewport.safeMargin) issues.push(`${box.id}:FORMULA_OVERFLOW`);
    if (viewport.mobile && box.fontSizePx !== undefined && box.fontSizePx < 28) issues.push(`${box.id}:MOBILE_TYPOGRAPHY_TOO_SMALL`);
  }
  for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) if (boxes[i].x < boxes[j].x + boxes[j].width && boxes[i].x + boxes[i].width > boxes[j].x && boxes[i].y < boxes[j].y + boxes[j].height && boxes[i].y + boxes[i].height > boxes[j].y) issues.push(`${boxes[i].id}:${boxes[j].id}:OVERLAP`);
  return { status: issues.length ? "FAIL" : "PASS", issues };
}
