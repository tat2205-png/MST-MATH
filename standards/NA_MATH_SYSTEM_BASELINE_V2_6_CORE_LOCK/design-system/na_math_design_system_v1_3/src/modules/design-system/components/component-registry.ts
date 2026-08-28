export type ComponentKind =
  | 'learning-objective'
  | 'key-idea'
  | 'worked-example'
  | 'try-it'
  | 'common-mistake'
  | 'hint'
  | 'checkpoint'
  | 'summary'
  | 'math-formula-card'
  | 'geometry-figure-card'
  | 'solution-steps'
  | 'final-answer'
  | 'prerequisite'
  | 'concept-map'
  | 'compare'
  | 'strategy'
  | 'proof'
  | 'real-world-connection'
  | 'focus';

export interface ComponentSpec {
  kind: ComponentKind;
  tone: 'blue' | 'teal' | 'green' | 'amber' | 'purple';
  icon: string;
  allowedLayouts: Array<'document' | 'worksheet' | 'assessment' | 'video'>;
  density: 'comfortable' | 'compact' | 'adaptive';
  requiresMathRenderer?: boolean;
  requiresGeometryQA?: boolean;
  pedagogicalRole: string;
}

export const componentRegistry: Record<ComponentKind, ComponentSpec> = {
  'learning-objective': { kind:'learning-objective', tone:'blue', icon:'target', allowedLayouts:['document','worksheet','video'], density:'comfortable', pedagogicalRole:'state intended learning outcomes' },
  'key-idea': { kind:'key-idea', tone:'teal', icon:'sparkles', allowedLayouts:['document','video'], density:'comfortable', pedagogicalRole:'emphasize conceptual essence' },
  'worked-example': { kind:'worked-example', tone:'green', icon:'book-open-check', allowedLayouts:['document','worksheet','video'], density:'adaptive', requiresMathRenderer:true, pedagogicalRole:'model complete reasoning' },
  'try-it': { kind:'try-it', tone:'blue', icon:'pencil-line', allowedLayouts:['document','worksheet'], density:'compact', pedagogicalRole:'immediate low-stakes practice' },
  'common-mistake': { kind:'common-mistake', tone:'amber', icon:'triangle-alert', allowedLayouts:['document','worksheet','video'], density:'compact', pedagogicalRole:'prevent frequent errors' },
  'hint': { kind:'hint', tone:'teal', icon:'lightbulb', allowedLayouts:['document','worksheet','video'], density:'compact', pedagogicalRole:'provide scaffold without full solution' },
  'checkpoint': { kind:'checkpoint', tone:'purple', icon:'circle-check-big', allowedLayouts:['document','worksheet','video'], density:'compact', pedagogicalRole:'formative check' },
  'summary': { kind:'summary', tone:'blue', icon:'list-checks', allowedLayouts:['document','worksheet','video'], density:'comfortable', pedagogicalRole:'consolidate essential knowledge' },
  'math-formula-card': { kind:'math-formula-card', tone:'teal', icon:'sigma', allowedLayouts:['document','worksheet','assessment','video'], density:'adaptive', requiresMathRenderer:true, pedagogicalRole:'present formula, meaning and conditions' },
  'geometry-figure-card': { kind:'geometry-figure-card', tone:'blue', icon:'triangle', allowedLayouts:['document','worksheet','assessment','video'], density:'adaptive', requiresGeometryQA:true, pedagogicalRole:'present mathematically verified figure' },
  'solution-steps': { kind:'solution-steps', tone:'teal', icon:'list-ordered', allowedLayouts:['document','worksheet','video'], density:'adaptive', requiresMathRenderer:true, pedagogicalRole:'show ordered detailed solution' },
  'final-answer': { kind:'final-answer', tone:'green', icon:'badge-check', allowedLayouts:['document','worksheet','assessment','video'], density:'compact', requiresMathRenderer:true, pedagogicalRole:'show final mathematical result' },

  'prerequisite': { kind:'prerequisite', tone:'blue', icon:'history', allowedLayouts:['document','worksheet','video'], density:'compact', pedagogicalRole:'activate prerequisite knowledge' },
  'concept-map': { kind:'concept-map', tone:'teal', icon:'network', allowedLayouts:['document','worksheet','video'], density:'adaptive', pedagogicalRole:'show relationships among concepts' },
  'compare': { kind:'compare', tone:'purple', icon:'columns-2', allowedLayouts:['document','worksheet','video'], density:'adaptive', pedagogicalRole:'compare and distinguish related concepts' },
  'strategy': { kind:'strategy', tone:'teal', icon:'route', allowedLayouts:['document','worksheet','video'], density:'adaptive', requiresMathRenderer:true, pedagogicalRole:'teach recognition and method selection' },
  'proof': { kind:'proof', tone:'blue', icon:'file-check-2', allowedLayouts:['document','worksheet','assessment','video'], density:'adaptive', requiresMathRenderer:true, pedagogicalRole:'present formal mathematical proof' },
  'real-world-connection': { kind:'real-world-connection', tone:'green', icon:'globe-2', allowedLayouts:['document','worksheet','assessment','video'], density:'adaptive', requiresMathRenderer:true, pedagogicalRole:'connect authentic context to mathematical model' },
  'focus': { kind:'focus', tone:'teal', icon:'scan-search', allowedLayouts:['video'], density:'compact', requiresGeometryQA:true, pedagogicalRole:'highlight current mathematical object without obscuring content' },
};
