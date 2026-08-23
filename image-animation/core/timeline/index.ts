import type {
  AnimationActionType,
  AnimationEvent,
  AnimationTimeline,
  TimelineValidationContext,
  TimelineValidationIssue,
  TimelineValidationResult,
} from "./types.ts";
import type { NodeMetadata, SceneGraph } from "../scene-graph/index.ts";

export * from "./types.ts";

const ACTION_TYPES = new Set<AnimationActionType>([
  "appear",
  "disappear",
  "move",
  "highlight",
  "draw",
  "fade",
  "scale",
  "camera_focus",
]);

const CONFLICT_CHANNEL: Readonly<Record<AnimationActionType, string>> = {
  appear: "visibility",
  disappear: "visibility",
  move: "position",
  highlight: "highlight",
  draw: "drawing",
  fade: "visibility",
  scale: "scale",
  camera_focus: "camera",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finite(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function compareIssues(a: TimelineValidationIssue, b: TimelineValidationIssue): number {
  return a.path < b.path ? -1 : a.path > b.path ? 1 :
    a.code < b.code ? -1 : a.code > b.code ? 1 :
    a.message < b.message ? -1 : a.message > b.message ? 1 : 0;
}

function validateVec2(
  value: unknown,
  path: string,
  add: (path: string, code: string, message: string) => void,
): void {
  if (!isRecord(value) || !finite(value.x) || !finite(value.y)) {
    add(path, "INVALID_POINT", "Expected finite numeric x and y coordinates.");
  }
}

function validateOpacity(
  value: unknown,
  path: string,
  add: (path: string, code: string, message: string) => void,
): void {
  if (!finite(value) || value < 0 || value > 1) {
    add(path, "INVALID_OPACITY", "Opacity must be a finite number between 0 and 1.");
  }
}

function validateMetadata(
  value: unknown,
  path: string,
  add: (path: string, code: string, message: string) => void,
): void {
  const visit = (item: unknown, itemPath: string): void => {
    if (item === null || typeof item === "string" || typeof item === "boolean" || finite(item)) return;
    if (Array.isArray(item)) {
      item.forEach((child, index) => visit(child, `${itemPath}[${index}]`));
      return;
    }
    if (isRecord(item)) {
      for (const key of Object.keys(item)) visit(item[key], `${itemPath}.${key}`);
      return;
    }
    add(itemPath, "INVALID_METADATA", "Metadata must contain only JSON-compatible finite values.");
  };
  visit(value, path);
}

function validateAction(
  event: Record<string, unknown>,
  path: string,
  add: (path: string, code: string, message: string) => void,
): void {
  if (typeof event.type !== "string" || !ACTION_TYPES.has(event.type as AnimationActionType)) {
    add(`${path}.type`, "INVALID_ACTION", "Animation action type is not supported.");
    return;
  }

  switch (event.type as AnimationActionType) {
    case "move":
      if (event.from !== undefined) validateVec2(event.from, `${path}.from`, add);
      validateVec2(event.to, `${path}.to`, add);
      break;
    case "highlight":
      if (!isNonEmptyString(event.color)) {
        add(`${path}.color`, "INVALID_HIGHLIGHT_COLOR", "Highlight color must be a non-empty string.");
      }
      break;
    case "fade":
      validateOpacity(event.from, `${path}.from`, add);
      validateOpacity(event.to, `${path}.to`, add);
      break;
    case "scale":
      if (event.from !== undefined && (!finite(event.from) || event.from <= 0)) {
        add(`${path}.from`, "INVALID_SCALE", "Scale values must be positive finite numbers.");
      }
      if (!finite(event.to) || event.to <= 0) {
        add(`${path}.to`, "INVALID_SCALE", "Scale values must be positive finite numbers.");
      }
      break;
    case "camera_focus":
      if (event.zoom !== undefined && (!finite(event.zoom) || event.zoom <= 0)) {
        add(`${path}.zoom`, "INVALID_CAMERA_ZOOM", "Camera zoom must be a positive finite number.");
      }
      if (event.padding !== undefined && (!finite(event.padding) || event.padding < 0)) {
        add(`${path}.padding`, "INVALID_CAMERA_PADDING", "Camera padding must be a non-negative finite number.");
      }
      break;
    case "appear":
    case "disappear":
    case "draw":
      break;
  }
}

interface ConflictCandidate {
  readonly index: number;
  readonly id: string;
  readonly targetId: string;
  readonly type: AnimationActionType;
  readonly start: number;
  readonly duration: number;
}

function intervalsOverlap(a: ConflictCandidate, b: ConflictCandidate): boolean {
  if (a.duration === 0 || b.duration === 0) return false;
  return a.start < b.start + b.duration && b.start < a.start + a.duration;
}

export function validateAnimationTimeline(
  value: unknown,
  context: TimelineValidationContext,
): TimelineValidationResult {
  const issues: TimelineValidationIssue[] = [];
  const add = (path: string, code: string, message: string): void => {
    issues.push({ path, code, message });
  };

  if (!isRecord(value)) {
    return {
      valid: false,
      issues: [{ path: "$", code: "INVALID_TIMELINE", message: "Animation timeline must be an object." }],
    };
  }

  if (value.version !== 1) {
    add("$.version", "INVALID_VERSION", "Animation timeline version must be 1.");
  }
  if (!Array.isArray(value.events)) {
    add("$.events", "INVALID_EVENTS", "Timeline events must be an array.");
  }
  validateMetadata(value.metadata, "$.metadata", add);

  const nodeIds = new Set(context.sceneGraph.nodes.map((node) => node.identity.id));
  const eventIds = new Set<string>();
  const candidates: ConflictCandidate[] = [];
  let previousStart = Number.NEGATIVE_INFINITY;
  const events = Array.isArray(value.events) ? value.events : [];

  events.forEach((event, index) => {
    const path = `$.events[${index}]`;
    if (!isRecord(event)) {
      add(path, "INVALID_EVENT", "Timeline event must be an object.");
      return;
    }

    if (!isNonEmptyString(event.id)) {
      add(`${path}.id`, "INVALID_EVENT_ID", "Event ID must be a non-empty string.");
    } else if (eventIds.has(event.id)) {
      add(`${path}.id`, "DUPLICATE_EVENT_ID", `Duplicate event ID: ${event.id}`);
    } else {
      eventIds.add(event.id);
    }

    if (!isNonEmptyString(event.targetId)) {
      add(`${path}.targetId`, "INVALID_REFERENCE", "Target must be a non-empty Scene Graph node ID.");
    } else if (!nodeIds.has(event.targetId)) {
      add(`${path}.targetId`, "MISSING_REFERENCE", `Scene Graph node does not exist: ${event.targetId}`);
    }

    if (!finite(event.start) || event.start < 0) {
      add(`${path}.start`, "INVALID_START", "Event start must be a non-negative finite number.");
    } else {
      if (event.start < previousStart) {
        add(`${path}.start`, "BAD_ORDERING", "Events must be ordered by non-decreasing start time.");
      }
      previousStart = event.start;
    }

    if (!finite(event.duration) || event.duration < 0) {
      add(`${path}.duration`, "NEGATIVE_DURATION", "Event duration must be a non-negative finite number.");
    }

    validateAction(event, path, add);

    if (
      isNonEmptyString(event.id) &&
      isNonEmptyString(event.targetId) &&
      finite(event.start) && event.start >= 0 &&
      finite(event.duration) && event.duration >= 0 &&
      typeof event.type === "string" && ACTION_TYPES.has(event.type as AnimationActionType)
    ) {
      candidates.push({
        index,
        id: event.id,
        targetId: event.targetId,
        type: event.type as AnimationActionType,
        start: event.start,
        duration: event.duration,
      });
    }
  });

  for (let left = 0; left < candidates.length; left += 1) {
    for (let right = left + 1; right < candidates.length; right += 1) {
      const a = candidates[left];
      const b = candidates[right];
      if (
        a.targetId === b.targetId &&
        CONFLICT_CHANNEL[a.type] === CONFLICT_CHANNEL[b.type] &&
        intervalsOverlap(a, b)
      ) {
        add(
          `$.events[${b.index}]`,
          "EVENT_CONFLICT",
          `Event ${b.id} conflicts with ${a.id} on target ${b.targetId} (${CONFLICT_CHANNEL[b.type]} channel).`,
        );
      }
    }
  }

  issues.sort(compareIssues);
  return { valid: issues.length === 0, issues };
}

export function assertValidAnimationTimeline(
  value: unknown,
  context: TimelineValidationContext,
): asserts value is AnimationTimeline {
  const result = validateAnimationTimeline(value, context);
  if (!result.valid) {
    throw new TypeError(
      `Invalid animation timeline:\n${result.issues
        .map((issue) => `${issue.path} [${issue.code}] ${issue.message}`)
        .join("\n")}`,
    );
  }
}

export function createAnimationTimeline(
  events: readonly AnimationEvent[],
  sceneGraph: SceneGraph,
  metadata: NodeMetadata = {},
): AnimationTimeline {
  const timeline: AnimationTimeline = { version: 1, events: [...events], metadata };
  assertValidAnimationTimeline(timeline, { sceneGraph });
  return timeline;
}

export function serializeAnimationTimeline(
  timeline: AnimationTimeline,
  sceneGraph: SceneGraph,
): string {
  assertValidAnimationTimeline(timeline, { sceneGraph });
  return JSON.stringify(timeline);
}

export function deserializeAnimationTimeline(
  serialized: string,
  sceneGraph: SceneGraph,
): AnimationTimeline {
  const value: unknown = JSON.parse(serialized);
  assertValidAnimationTimeline(value, { sceneGraph });
  return value;
}
