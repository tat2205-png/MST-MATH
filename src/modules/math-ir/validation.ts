import {
  MATH_CONSTRAINT_TYPES,
  MATH_ENTITY_TYPES,
  MATH_IR_SCHEMA_VERSION,
  type MathConstraint,
  type MathDocument,
  type MathEntity,
  type MathExpression,
  type MathProblem,
  type MathRelation,
  type MathScene,
} from "./types.js";
import { hasCycle, isParameterValueValid } from "./semantics.js";

export type MathIRIssueSeverity = "error" | "warning";

export interface MathIRValidationIssue {
  code: string;
  severity: MathIRIssueSeverity;
  path: string;
  message: string;
}

export interface MathIRValidationResult {
  status: "PASS" | "FAIL";
  issues: MathIRValidationIssue[];
}

const entityTypes = new Set<string>(MATH_ENTITY_TYPES);
const constraintTypes = new Set<string>(MATH_CONSTRAINT_TYPES);
const constraintModes = new Set(["LOCKED", "WATCH"]);
const constraintStatuses = new Set(["UNKNOWN", "SATISFIED", "VIOLATED", "UNRESOLVED"]);
const relationStatuses = new Set(["UNKNOWN", "TRUE", "FALSE", "UNRESOLVED"]);
const eventKinds = new Set(["OBJECT_CHANGED", "DEPENDENCY_RECALCULATED", "CONSTRAINT_STATUS_CHANGED", "RELATION_CHANGED", "PARAMETER_CHANGED", "CASE_CHANGED", "CRITICAL_EVENT"]);
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const nonEmptyString = (value: unknown): value is string => typeof value === "string" && value.length > 0;

class ValidationContext {
  readonly issues: MathIRValidationIssue[] = [];

  error(code: string, path: string, message: string): void {
    this.issues.push({ code, severity: "error", path, message });
  }

  warning(code: string, path: string, message: string): void {
    this.issues.push({ code, severity: "warning", path, message });
  }
}

function validateFiniteNumbers(value: unknown, path: string, ctx: ValidationContext, ancestors = new Set<object>(), visited = new Set<object>()): void {
  if (typeof value === "number" && !Number.isFinite(value)) {
    ctx.error("INVALID_NUMERIC_VALUE", path, "Numeric values must be finite.");
    return;
  }
  if (typeof value !== "object" || value === null) return;
  if (ancestors.has(value)) {
    ctx.error("CIRCULAR_REFERENCE", path, "Math IR must use ID references and cannot contain circular object references.");
    return;
  }
  if (visited.has(value)) return;
  ancestors.add(value);
  if (Array.isArray(value)) value.forEach((item, index) => validateFiniteNumbers(item, `${path}[${index}]`, ctx, ancestors, visited));
  else Object.entries(value).forEach(([key, item]) => validateFiniteNumbers(item, `${path}.${key}`, ctx, ancestors, visited));
  ancestors.delete(value);
  visited.add(value);
}

function collectIds(values: unknown[], path: string, ctx: ValidationContext): Set<string> {
  const ids = new Set<string>();
  values.forEach((value, index) => {
    const itemPath = `${path}[${index}]`;
    if (!isRecord(value) || !nonEmptyString(value.id)) {
      ctx.error("MISSING_ID", `${itemPath}.id`, "Every Math IR object in an identified collection requires a non-empty ID.");
      return;
    }
    if (ids.has(value.id)) ctx.error("DUPLICATE_ID", `${itemPath}.id`, `Duplicate ID: ${value.id}`);
    ids.add(value.id);
  });
  return ids;
}

function requireReference(id: unknown, ids: Set<string>, path: string, ctx: ValidationContext, kind = "entity"): void {
  if (!nonEmptyString(id) || !ids.has(id)) ctx.error("INVALID_REFERENCE", path, `Referenced ${kind} does not exist: ${String(id)}`);
}

function entityReferences(entity: MathEntity): string[] {
  switch (entity.type) {
    case "line": return [...entity.pointIds];
    case "ray": return [entity.startPointId, entity.throughPointId];
    case "segment": return [entity.startPointId, entity.endPointId];
    case "vector": return [entity.startPointId, entity.endPointId].filter(nonEmptyString);
    case "plane": return entity.pointIds ?? [];
    case "polygon": case "triangle": case "quadrilateral": return [...entity.vertexIds];
    case "circle": case "sphere": return [entity.centerPointId];
    case "arc": return [entity.circleId, entity.startPointId, entity.endPointId];
    case "cylinder": return [...entity.baseCenterIds];
    case "cone": return [entity.apexPointId, entity.baseCenterPointId];
    case "prism": return [...entity.baseFaceIds, ...entity.faceIds];
    case "pyramid": return [entity.apexPointId, entity.baseFaceId, ...(entity.faceIds ?? [])];
    case "polyhedron": return [...entity.vertexIds, ...entity.edgeIds, ...entity.faceIds];
    case "function_graph": return entity.axesId ? [entity.axesId] : [];
    case "label": return entity.targetEntityId ? [entity.targetEntityId] : [];
    case "measurement": return [entity.targetEntityId];
    case "angle_marker": case "right_angle_marker": return [...entity.pointIds];
    default: return [];
  }
}

function entityExpressionReferences(entity: MathEntity): string[] {
  const ids = [...(entity.expressionIds ?? [])];
  switch (entity.type) {
    case "plane": if (entity.equationExpressionId) ids.push(entity.equationExpressionId); break;
    case "circle": case "sphere": case "cylinder": case "cone": if (entity.radiusExpressionId) ids.push(entity.radiusExpressionId); break;
    case "function_graph": ids.push(entity.expressionId); if (entity.domainExpressionId) ids.push(entity.domainExpressionId); break;
    case "measurement": ids.push(entity.valueExpressionId); break;
  }
  return ids;
}

function validateExpressions(expressions: unknown, path: string, ctx: ValidationContext): { values: MathExpression[]; ids: Set<string> } {
  if (!Array.isArray(expressions)) {
    ctx.error("MALFORMED_EXPRESSIONS", path, "Expressions must be an array.");
    return { values: [], ids: new Set() };
  }
  const ids = collectIds(expressions, path, ctx);
  expressions.forEach((expression, index) => {
    if (!isRecord(expression)) return;
    if (![expression.raw, expression.latex, expression.normalized].some((value) => typeof value === "string" && value.length > 0)) {
      ctx.warning("EMPTY_EXPRESSION", `${path}[${index}]`, "Expression has no raw, LaTeX, or normalized representation.");
    }
  });
  return { values: expressions as MathExpression[], ids };
}

function validateEntities(entities: unknown, expressionIds: Set<string>, path: string, ctx: ValidationContext): { values: MathEntity[]; ids: Set<string> } {
  if (!Array.isArray(entities)) {
    ctx.error("MALFORMED_ENTITIES", path, "Entities must be an array.");
    return { values: [], ids: new Set() };
  }
  const ids = collectIds(entities, path, ctx);
  entities.forEach((raw, index) => {
    const itemPath = `${path}[${index}]`;
    if (!isRecord(raw)) {
      ctx.error("MALFORMED_ENTITY", itemPath, "Entity must be an object.");
      return;
    }
    if (!entityTypes.has(String(raw.type))) {
      ctx.error("UNSUPPORTED_ENTITY_TYPE", `${itemPath}.type`, `Unsupported entity type: ${String(raw.type)}`);
      return;
    }
    const entity = raw as unknown as MathEntity;
    entityReferences(entity).forEach((id, refIndex) => requireReference(id, ids, `${itemPath}.references[${refIndex}]`, ctx));
    entityExpressionReferences(entity).forEach((id, refIndex) => requireReference(id, expressionIds, `${itemPath}.expressionReferences[${refIndex}]`, ctx, "expression"));
    if ((entity.type === "line" && entity.pointIds[0] === entity.pointIds[1]) ||
        (entity.type === "segment" && entity.startPointId === entity.endPointId) ||
        (entity.type === "ray" && entity.startPointId === entity.throughPointId)) {
      ctx.error("SELF_REFERENCE", itemPath, `${entity.type} requires distinct point references.`);
    }
  });
  return { values: entities as MathEntity[], ids };
}

function validateFact(raw: unknown, path: string, ctx: ValidationContext): void {
  if (!isRecord(raw) || !["given", "derived", "user", "imported", "visual", "unknown"].includes(String(raw.origin))) {
    ctx.error("INVALID_FACT_PROVENANCE", path, "Fact provenance requires a supported origin.");
    return;
  }
  if (raw.confidence !== undefined && (typeof raw.confidence !== "number" || raw.confidence < 0 || raw.confidence > 1)) {
    ctx.error("INVALID_CONFIDENCE", `${path}.confidence`, "Confidence must be between 0 and 1.");
  }
}

function validateConstraints(constraints: unknown, entityIds: Set<string>, expressionIds: Set<string>, path: string, ctx: ValidationContext): MathConstraint[] {
  if (!Array.isArray(constraints)) {
    ctx.error("MALFORMED_CONSTRAINTS", path, "Constraints must be an array.");
    return [];
  }
  collectIds(constraints, path, ctx);
  constraints.forEach((raw, index) => {
    const itemPath = `${path}[${index}]`;
    if (!isRecord(raw)) return;
    if (!constraintTypes.has(String(raw.type))) ctx.error("UNSUPPORTED_CONSTRAINT_TYPE", `${itemPath}.type`, `Unsupported constraint type: ${String(raw.type)}`);
    if (!Array.isArray(raw.entityIds) || raw.entityIds.length === 0) ctx.error("MALFORMED_CONSTRAINT", `${itemPath}.entityIds`, "Constraint requires entity references.");
    else {
      raw.entityIds.forEach((id, refIndex) => requireReference(id, entityIds, `${itemPath}.entityIds[${refIndex}]`, ctx));
      if (new Set(raw.entityIds).size !== raw.entityIds.length) ctx.error("SELF_REFERENCE", `${itemPath}.entityIds`, "Constraint cannot repeat an entity reference.");
    }
    if (raw.expressionId !== undefined) requireReference(raw.expressionId, expressionIds, `${itemPath}.expressionId`, ctx, "expression");
    if (raw.mode !== undefined && !constraintModes.has(String(raw.mode))) ctx.error("INVALID_CONSTRAINT_MODE", `${itemPath}.mode`, "Constraint mode must be LOCKED or WATCH.");
    if (raw.status !== undefined && !constraintStatuses.has(String(raw.status))) ctx.error("INVALID_CONSTRAINT_STATUS", `${itemPath}.status`, "Constraint status is unsupported.");
    if (raw.targetIds !== undefined) {
      if (!Array.isArray(raw.targetIds)) ctx.error("MALFORMED_CONSTRAINT", `${itemPath}.targetIds`, "Constraint targetIds must be an array.");
      else raw.targetIds.forEach((id, refIndex) => requireReference(id, entityIds, `${itemPath}.targetIds[${refIndex}]`, ctx));
    }
    validateFact(raw.fact, `${itemPath}.fact`, ctx);
  });
  return constraints as MathConstraint[];
}

function validateRelations(relations: unknown, entityIds: Set<string>, expressionIds: Set<string>, path: string, ctx: ValidationContext): MathRelation[] {
  if (relations === undefined) return [];
  if (!Array.isArray(relations)) {
    ctx.error("MALFORMED_RELATIONS", path, "Relations must be an array.");
    return [];
  }
  collectIds(relations, path, ctx);
  relations.forEach((raw, index) => {
    const itemPath = `${path}[${index}]`;
    if (!isRecord(raw)) return;
    requireReference(raw.subjectId, entityIds, `${itemPath}.subjectId`, ctx);
    if (!Array.isArray(raw.objectIds) || raw.objectIds.length === 0) ctx.error("MALFORMED_RELATION", `${itemPath}.objectIds`, "Relation requires at least one object.");
    else {
      raw.objectIds.forEach((id, refIndex) => requireReference(id, entityIds, `${itemPath}.objectIds[${refIndex}]`, ctx));
      if (raw.objectIds.includes(raw.subjectId)) ctx.error("SELF_REFERENCE", itemPath, "Relation subject cannot also be its object.");
    }
    if (raw.expressionId !== undefined) requireReference(raw.expressionId, expressionIds, `${itemPath}.expressionId`, ctx, "expression");
    if (raw.status !== undefined && !relationStatuses.has(String(raw.status))) ctx.error("INVALID_RELATION_STATUS", `${itemPath}.status`, "Relation status is unsupported.");
    validateFact(raw.fact, `${itemPath}.fact`, ctx);
  });
  return relations as MathRelation[];
}

function validateProblem(problem: unknown, path: string, sceneIds: Set<string>, ctx: ValidationContext): void {
  if (!isRecord(problem)) {
    ctx.error("MALFORMED_PROBLEM", path, "Problem must be an object.");
    return;
  }
  if (!nonEmptyString(problem.statement)) ctx.error("MALFORMED_PROBLEM", `${path}.statement`, "Problem statement is required.");
  const expressions = validateExpressions(problem.expressions, `${path}.expressions`, ctx);
  const entities = validateEntities(problem.entities, expressions.ids, `${path}.entities`, ctx);
  validateConstraints(problem.constraints, entities.ids, expressions.ids, `${path}.constraints`, ctx);
  validateRelations(problem.relations, entities.ids, expressions.ids, `${path}.relations`, ctx);
  if (!Array.isArray(problem.givens) || !Array.isArray(problem.targets) || !Array.isArray(problem.sceneIds)) ctx.error("MALFORMED_PROBLEM", path, "Problem givens, targets, and sceneIds must be arrays.");
  else problem.sceneIds.forEach((id, index) => requireReference(id, sceneIds, `${path}.sceneIds[${index}]`, ctx, "scene"));
}

function validateScene(scene: unknown, path: string, ctx: ValidationContext): void {
  if (!isRecord(scene)) {
    ctx.error("MALFORMED_SCENE", path, "Scene must be an object.");
    return;
  }
  if (!nonEmptyString(scene.name) || !["2d", "3d"].includes(String(scene.dimension))) ctx.error("MALFORMED_SCENE", path, "Scene requires a name and a 2d or 3d dimension.");
  const expressions = validateExpressions(scene.expressions ?? [], `${path}.expressions`, ctx);
  const entities = validateEntities(scene.entities, expressions.ids, `${path}.entities`, ctx);
  validateConstraints(scene.constraints, entities.ids, expressions.ids, `${path}.constraints`, ctx);
  validateRelations(scene.relations, entities.ids, expressions.ids, `${path}.relations`, ctx);
  validateSemantics(scene.semantics, entities.ids, `${path}.semantics`, ctx);
  if (scene.camera !== undefined && (!isRecord(scene.camera) || scene.camera.dimension !== scene.dimension)) ctx.error("MALFORMED_SCENE", `${path}.camera`, "Camera dimension must match its scene.");
}

function validateSemantics(raw: unknown, entityIds: Set<string>, path: string, ctx: ValidationContext): void {
  if (raw === undefined) return;
  if (!isRecord(raw)) { ctx.error("MALFORMED_SEMANTICS", path, "Scene semantics must be an object."); return; }
  const dependencies = Array.isArray(raw.dependencies) ? raw.dependencies : [];
  const parameters = Array.isArray(raw.parameters) ? raw.parameters : [];
  const events = Array.isArray(raw.events) ? raw.events : [];
  const cases = Array.isArray(raw.cases) ? raw.cases : [];
  for (const [name, value] of [["dependencies", raw.dependencies], ["parameters", raw.parameters], ["events", raw.events], ["cases", raw.cases]] as const) {
    if (value !== undefined && !Array.isArray(value)) ctx.error("MALFORMED_SEMANTICS", `${path}.${name}`, `${name} must be an array.`);
  }
  const semanticIds = new Set<string>();
  for (const [name, values] of [["dependencies", dependencies], ["parameters", parameters], ["events", events], ["cases", cases]] as const) {
    values.forEach((value, index) => {
      const id = isRecord(value) ? value.id : undefined;
      if (!nonEmptyString(id)) ctx.error("MISSING_ID", `${path}.${name}[${index}].id`, "Semantic records require a non-empty ID.");
      else if (semanticIds.has(id)) ctx.error("DUPLICATE_SEMANTIC_ID", `${path}.${name}[${index}].id`, `Duplicate semantic ID: ${id}`);
      else semanticIds.add(id);
    });
  }
  const parameterIds = new Set(parameters.flatMap((value) => isRecord(value) && nonEmptyString(value.id) ? [value.id] : []));
  const dependencySourceIds = new Set([...entityIds, ...parameterIds]);
  dependencies.forEach((value, index) => {
    const itemPath = `${path}.dependencies[${index}]`;
    if (!isRecord(value)) { ctx.error("INVALID_DEPENDENCY", itemPath, "Dependency must be an object."); return; }
    requireReference(value.dependentId, entityIds, `${itemPath}.dependentId`, ctx);
    if (!Array.isArray(value.sourceIds) || value.sourceIds.length === 0) ctx.error("INVALID_DEPENDENCY", `${itemPath}.sourceIds`, "Dependency requires source IDs.");
    else value.sourceIds.forEach((id, refIndex) => requireReference(id, dependencySourceIds, `${itemPath}.sourceIds[${refIndex}]`, ctx, "entity or parameter"));
    if (!nonEmptyString(value.kind) || !nonEmptyString(value.evaluatorRef)) ctx.error("INVALID_DEPENDENCY", itemPath, "Dependency kind and evaluatorRef are required.");
  });
  const cycleCandidates = dependencies.filter((value): value is any => isRecord(value) && nonEmptyString(value.dependentId) && Array.isArray(value.sourceIds) && value.sourceIds.every(nonEmptyString));
  if (hasCycle(cycleCandidates)) ctx.error("DEPENDENCY_CYCLE", `${path}.dependencies`, "Dependency cycles are not allowed.");
  parameters.forEach((value, index) => {
    const itemPath = `${path}.parameters[${index}]`;
    if (!isRecord(value)) return;
    const parameter = value as any;
    if (parameter.domain?.kind === "range" && (!Number.isFinite(parameter.domain.min) || !Number.isFinite(parameter.domain.max) || parameter.domain.min > parameter.domain.max)) ctx.error("INVALID_PARAMETER_RANGE", `${itemPath}.domain`, "Parameter range must be finite and ordered.");
    if (parameter.step !== undefined && (!Number.isFinite(parameter.step) || parameter.step <= 0)) ctx.error("INVALID_PARAMETER_STEP", `${itemPath}.step`, "Parameter step must be positive and finite.");
    if (!isParameterValueValid(parameter, parameter.value)) ctx.error("INVALID_PARAMETER_VALUE", `${itemPath}.value`, "Parameter value is outside its domain.");
    if (Array.isArray(parameter.bindings)) parameter.bindings.forEach((binding: unknown, bindingIndex: number) => { if (!isRecord(binding)) ctx.error("INVALID_PARAMETER_BINDING", `${itemPath}.bindings[${bindingIndex}]`, "Binding must be an object."); else requireReference(binding.objectId, entityIds, `${itemPath}.bindings[${bindingIndex}].objectId`, ctx); });
  });
  events.forEach((value, index) => {
    const itemPath = `${path}.events[${index}]`;
    if (!isRecord(value) || !Number.isInteger(value.sequence) || (value.sequence as number) < 0 || !eventKinds.has(String(value.kind))) ctx.error("INVALID_EVENT", itemPath, "Event kind and non-negative integer sequence are required.");
    else if (value.objectIds !== undefined) { if (!Array.isArray(value.objectIds)) ctx.error("INVALID_EVENT", `${itemPath}.objectIds`, "Event objectIds must be an array."); else value.objectIds.forEach((id, refIndex) => requireReference(id, dependencySourceIds, `${itemPath}.objectIds[${refIndex}]`, ctx, "entity or parameter")); }
  });
  cases.forEach((value, index) => {
    const itemPath = `${path}.cases[${index}]`;
    if (!isRecord(value) || !nonEmptyString(value.family) || !nonEmptyString(value.currentKey)) ctx.error("INVALID_CASE_STATE", itemPath, "Case state requires family and currentKey.");
    else if (value.objectIds !== undefined) { if (!Array.isArray(value.objectIds)) ctx.error("INVALID_CASE_STATE", `${itemPath}.objectIds`, "Case objectIds must be an array."); else value.objectIds.forEach((id, refIndex) => requireReference(id, entityIds, `${itemPath}.objectIds[${refIndex}]`, ctx)); }
  });
}

export function validateMathIR(value: unknown): MathIRValidationResult {
  const ctx = new ValidationContext();
  if (!isRecord(value)) return { status: "FAIL", issues: [{ code: "MALFORMED_DOCUMENT", severity: "error", path: "$", message: "Math IR root must be an object." }] };
  if (value.schemaVersion !== MATH_IR_SCHEMA_VERSION) ctx.error("UNSUPPORTED_SCHEMA_VERSION", "$.schemaVersion", `Expected ${MATH_IR_SCHEMA_VERSION}.`);
  if (!nonEmptyString(value.id)) ctx.error("MISSING_ID", "$.id", "MathDocument requires a stable ID.");
  for (const field of ["sections", "problems", "scenes", "expressions"] as const) if (!Array.isArray(value[field])) ctx.error("MALFORMED_DOCUMENT", `$.${field}`, `${field} must be an array.`);

  const expressions = validateExpressions(value.expressions, "$.expressions", ctx);
  const scenes = Array.isArray(value.scenes) ? value.scenes : [];
  const problems = Array.isArray(value.problems) ? value.problems : [];
  const sections = Array.isArray(value.sections) ? value.sections : [];
  const sceneIds = collectIds(scenes, "$.scenes", ctx);
  const problemIds = collectIds(problems, "$.problems", ctx);
  const assetIds = collectIds(Array.isArray(value.assets) ? value.assets : [], "$.assets", ctx);
  collectIds(sections, "$.sections", ctx);
  scenes.forEach((scene, index) => validateScene(scene, `$.scenes[${index}]`, ctx));
  problems.forEach((problem, index) => validateProblem(problem, `$.problems[${index}]`, sceneIds, ctx));
  sections.forEach((section, sectionIndex) => {
    if (!isRecord(section) || !Array.isArray(section.blocks)) {
      ctx.error("MALFORMED_SECTION", `$.sections[${sectionIndex}]`, "Section requires a blocks array.");
      return;
    }
    collectIds(section.blocks, `$.sections[${sectionIndex}].blocks`, ctx);
    section.blocks.forEach((block, blockIndex) => {
      if (!isRecord(block)) return;
      const path = `$.sections[${sectionIndex}].blocks[${blockIndex}]`;
      if (block.type === "problem_reference") requireReference(block.problemId, problemIds, `${path}.problemId`, ctx, "problem");
      if (block.type === "image_reference") requireReference(block.assetId, assetIds, `${path}.assetId`, ctx, "asset");
      if (block.type === "table_reference") requireReference(block.tableId, assetIds, `${path}.tableId`, ctx, "asset");
      if (["paragraph", "heading", "list_item"].includes(String(block.type)) && Array.isArray(block.expressionIds)) block.expressionIds.forEach((id, index) => requireReference(id, expressions.ids, `${path}.expressionIds[${index}]`, ctx, "document expression"));
      if (block.type === "equation") requireReference(block.expressionId, expressions.ids, `${path}.expressionId`, ctx, "document expression");
    });
  });
  validateFiniteNumbers(value, "$", ctx);
  return { status: ctx.issues.some((issue) => issue.severity === "error") ? "FAIL" : "PASS", issues: ctx.issues };
}

export function isValidMathIR(value: unknown): value is MathDocument {
  return validateMathIR(value).status === "PASS";
}
