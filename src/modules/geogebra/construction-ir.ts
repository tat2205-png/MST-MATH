export type ConstructionIRObjectType = 'Point' | 'Segment' | 'Line' | 'Ray' | 'Polygon' | 'Circle' | 'Plane' | 'Parameter' | 'Slider' | 'Guide' | 'Cut' | 'Crease' | 'FoldFace' | 'FoldHinge' | 'FoldSequence' | 'Measure' | 'Dimension';
export type SemanticRole = 'SOURCE_SHEET' | 'BASE' | 'FOLD_FACE' | 'CUT_PIECE' | 'CREASE' | 'HINGE' | 'PARAMETER' | 'DIMENSION' | 'GUIDE';
export interface ConstructionIRObject { systemId: string; displayLabel?: string; objectType: ConstructionIRObjectType; semanticRole?: SemanticRole; dependencies?: string[]; properties?: Record<string, string | number | boolean>; }
export interface ConstructionIR { version: '1.0'; command: string; objects: ConstructionIRObject[]; parameters: { systemId: string; displayLabel: string; min: number; max: number; step: number; value: number }[]; validation: { valid: boolean; issues: string[] }; }

export function parseV3FoldCommand(command: string): ConstructionIR {
  const normalized = command.toLocaleLowerCase('vi-VN');
  const required = ['8 dm', '3 dm', 'cắt', 'đường gấp', 'thanh trượt'];
  const issues = required.filter((term) => !normalized.includes(term)).map((term) => `Missing construction intent: ${term}`);
  const objects: ConstructionIRObject[] = [
    { systemId: 'v3.source.sheet', displayLabel: 'Tấm bìa 8×8 dm', objectType: 'Plane', semanticRole: 'SOURCE_SHEET', properties: { side: 8 } },
    ...['A', 'B', 'C', 'D'].map((displayLabel) => ({ systemId: `v3.base.point.${displayLabel}`, displayLabel, objectType: 'Point' as const, semanticRole: 'BASE' as const })),
    { systemId: 'v3.base.abcd', displayLabel: 'ABCD', objectType: 'Polygon', semanticRole: 'BASE' },
    ...['NE', 'SE', 'SW', 'NW'].map((displayLabel) => ({ systemId: `v3.cut.${displayLabel.toLowerCase()}`, displayLabel, objectType: 'Cut' as const, semanticRole: 'CUT_PIECE' as const, properties: { cornerOffset: 1, z: 0 } })),
    ...['north', 'east', 'south', 'west'].map((side) => ({ systemId: `v3.face.${side}`, objectType: 'FoldFace' as const, semanticRole: 'FOLD_FACE' as const })),
    ...['AB', 'BC', 'CD', 'DA'].map((displayLabel) => ({ systemId: `v3.hinge.${displayLabel}`, displayLabel, objectType: 'FoldHinge' as const, semanticRole: 'HINGE' as const })),
    { systemId: 'v3.parameter.a', displayLabel: 'a', objectType: 'Slider', semanticRole: 'PARAMETER', properties: { min: 1, max: 5.5, step: 0.1, value: 3 } },
    { systemId: 'v3.parameter.t', displayLabel: 't', objectType: 'Slider', semanticRole: 'PARAMETER', properties: { min: 0, max: 1, step: 0.01, value: 0 } },
  ];
  return { version: '1.0', command, objects, parameters: [{ systemId: 'v3.parameter.a', displayLabel: 'a', min: 1, max: 5.5, step: 0.1, value: 3 }, { systemId: 'v3.parameter.t', displayLabel: 't', min: 0, max: 1, step: 0.01, value: 0 }], validation: { valid: issues.length === 0, issues } };
}
