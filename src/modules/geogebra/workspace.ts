import type { ConstructionIR, ConstructionIRObject } from './construction-ir.js';
export type CanonicalTool = 'SELECT'|'POINT'|'SEGMENT'|'POLYGON'|'CUT'|'CREASE'|'FOLD'|'DIMENSION'|'SLIDER'|'RESET';
export interface CanonicalWorkspaceState { ir: ConstructionIR; activeTool: CanonicalTool; selectedIds: string[]; t: number; a: number; visibility: { cuts: boolean; sheet: boolean; lines: boolean; dimensions: boolean }; }
export function createCanonicalWorkspace(ir: ConstructionIR): CanonicalWorkspaceState { return { ir, activeTool: 'SELECT', selectedIds: [], t: 0, a: 3, visibility: { cuts: true, sheet: true, lines: true, dimensions: true } }; }
export function dispatchCanonicalTool(state: CanonicalWorkspaceState, tool: CanonicalTool, selectedIds: string[] = []): CanonicalWorkspaceState {
  if (tool === 'RESET') return createCanonicalWorkspace(state.ir);
  return { ...state, activeTool: tool, selectedIds };
}
export function canonicalObject(ir: ConstructionIR, systemId: string): ConstructionIRObject | undefined { return ir.objects.find((object) => object.systemId === systemId); }
