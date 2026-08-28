import type {
  CaseState, CaseTransition, DynamicParameter, EntityId, MathDependency, MathEvent,
  SemanticChangeKind, SemanticUpdateResult,
} from "./types.js";

export interface SemanticOperationResult<T> {
  status: "PASS" | "FAIL";
  value?: T;
  error?: string;
}

const compareText = (left: string, right: string): number => left.localeCompare(right, "en");

export class DependencyGraph {
  private readonly dependencies = new Map<string, MathDependency>();

  constructor(dependencies: readonly MathDependency[] = []) {
    for (const dependency of dependencies) {
      const result = this.add(dependency);
      if (result.status === "FAIL") throw new Error(result.error);
    }
  }

  add(dependency: MathDependency): SemanticOperationResult<MathDependency> {
    if (!dependency.id || !dependency.dependentId || !dependency.evaluatorRef || dependency.sourceIds.length === 0) {
      return { status: "FAIL", error: "INVALID_DEPENDENCY" };
    }
    if (this.dependencies.has(dependency.id)) return { status: "FAIL", error: "DUPLICATE_DEPENDENCY_ID" };
    const candidate = new Map(this.dependencies);
    candidate.set(dependency.id, structuredClone(dependency));
    if (hasCycle(candidate.values())) return { status: "FAIL", error: "DEPENDENCY_CYCLE" };
    this.dependencies.set(dependency.id, structuredClone(dependency));
    return { status: "PASS", value: structuredClone(dependency) };
  }

  remove(dependencyId: string): boolean { return this.dependencies.delete(dependencyId); }

  directDependencies(dependentId: EntityId): EntityId[] {
    return [...this.dependencies.values()]
      .filter((item) => item.dependentId === dependentId)
      .flatMap((item) => item.sourceIds)
      .filter((id, index, values) => values.indexOf(id) === index)
      .sort(compareText);
  }

  dependents(sourceId: EntityId): EntityId[] {
    return [...this.dependencies.values()]
      .filter((item) => item.sourceIds.includes(sourceId))
      .map((item) => item.dependentId)
      .filter((id, index, values) => values.indexOf(id) === index)
      .sort(compareText);
  }

  recomputationOrder(changedIds: readonly EntityId[]): EntityId[] {
    const affected = new Set<EntityId>();
    const queue = [...new Set(changedIds)].sort(compareText);
    while (queue.length > 0) {
      const sourceId = queue.shift()!;
      for (const dependentId of this.dependents(sourceId)) {
        if (!affected.has(dependentId)) { affected.add(dependentId); queue.push(dependentId); }
      }
      queue.sort(compareText);
    }
    const indegree = new Map([...affected].map((id) => [id, 0]));
    for (const dependency of this.dependencies.values()) {
      if (!affected.has(dependency.dependentId)) continue;
      indegree.set(dependency.dependentId, dependency.sourceIds.filter((id) => affected.has(id)).length);
    }
    const ready = [...affected].filter((id) => indegree.get(id) === 0).sort(compareText);
    const order: EntityId[] = [];
    while (ready.length > 0) {
      const id = ready.shift()!; order.push(id);
      for (const dependentId of this.dependents(id)) {
        if (!indegree.has(dependentId)) continue;
        indegree.set(dependentId, indegree.get(dependentId)! - 1);
        if (indegree.get(dependentId) === 0) { ready.push(dependentId); ready.sort(compareText); }
      }
    }
    return order;
  }
}

export function hasCycle(dependencies: Iterable<MathDependency>): boolean {
  const edges = new Map<EntityId, Set<EntityId>>();
  for (const item of dependencies) for (const sourceId of item.sourceIds) {
    if (!edges.has(sourceId)) edges.set(sourceId, new Set());
    edges.get(sourceId)!.add(item.dependentId);
  }
  const visiting = new Set<EntityId>(), visited = new Set<EntityId>();
  const visit = (id: EntityId): boolean => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const next of edges.get(id) ?? []) if (visit(next)) return true;
    visiting.delete(id); visited.add(id); return false;
  };
  return [...edges.keys()].sort(compareText).some(visit);
}

export function isParameterValueValid(parameter: DynamicParameter, value: DynamicParameter["value"]): boolean {
  if (!parameter.domain) return typeof value === typeof parameter.value;
  if (parameter.domain.kind === "discrete") return parameter.domain.values.some((item) => Object.is(item, value));
  if (typeof value !== "number" || !Number.isFinite(value)) return false;
  const minimum = parameter.domain.inclusiveMin === false ? value > parameter.domain.min : value >= parameter.domain.min;
  const maximum = parameter.domain.inclusiveMax === false ? value < parameter.domain.max : value <= parameter.domain.max;
  if (!minimum || !maximum) return false;
  return parameter.step === undefined || Math.abs((value - parameter.domain.min) / parameter.step - Math.round((value - parameter.domain.min) / parameter.step)) < 1e-9;
}

export function updateDynamicParameter(parameter: DynamicParameter, value: DynamicParameter["value"], graph?: DependencyGraph): SemanticOperationResult<{ parameter: DynamicParameter; update: SemanticUpdateResult }> {
  if (!isParameterValueValid(parameter, value)) return { status: "FAIL", error: "INVALID_PARAMETER_VALUE" };
  const changed = !Object.is(parameter.value, value);
  const affected = changed && graph ? graph.recomputationOrder([parameter.id]) : [];
  const events: MathEvent[] = changed ? [{ id: `parameter:${parameter.id}:changed`, kind: "PARAMETER_CHANGED", sequence: 0, objectIds: [parameter.id], changeKind: "SEMANTIC_CHANGE", payload: { from: parameter.value, to: value } }] : [];
  return { status: "PASS", value: { parameter: { ...parameter, value }, update: emptySemanticUpdate({ changedParameterIds: changed ? [parameter.id] : [], affectedDependentIds: affected, events }) } };
}

export function transitionCase(state: CaseState, to: string, trigger: string, sequence = 0): { state: CaseState; transition?: CaseTransition; event?: MathEvent } {
  if (state.currentKey === to) return { state };
  const transition = { from: state.currentKey, to, trigger, objectIds: state.objectIds };
  return {
    state: { ...state, previousKey: state.currentKey, currentKey: to, trigger, order: sequence }, transition,
    event: { id: `case:${state.id}:${sequence}`, kind: "CASE_CHANGED", sequence, objectIds: state.objectIds, changeKind: "CASE_TRANSITION", payload: { family: state.family, from: state.currentKey, to, trigger } },
  };
}

export function createMathEvent(id: string, kind: MathEvent["kind"], sequence: number, changeKind?: SemanticChangeKind, objectIds?: EntityId[]): MathEvent {
  return { id, kind, sequence, ...(changeKind ? { changeKind } : {}), ...(objectIds ? { objectIds: [...objectIds] } : {}) };
}

export function sortMathEvents(events: readonly MathEvent[]): MathEvent[] {
  return [...events].sort((left, right) => left.sequence - right.sequence || compareText(left.id, right.id));
}

export function emptySemanticUpdate(overrides: Partial<SemanticUpdateResult> = {}): SemanticUpdateResult {
  return { changedObjectIds: [], affectedDependentIds: [], changedParameterIds: [], constraintStatusChanges: [], relationStatusChanges: [], caseTransitions: [], events: [], ...overrides };
}
