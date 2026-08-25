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
  if (scene.camera !== undefined && (!isRecord(scene.camera) || scene.camera.dimension !== scene.dimension)) ctx.error("MALFORMED_SCENE", `${path}.camera`, "Camera dimension must match its scene.");
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
