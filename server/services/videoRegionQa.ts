export type VideoRegionBox = readonly [number, number, number, number];
export type VideoBoundingBox = { left: number; right: number; top: number; bottom: number };

export interface VideoRegionQaInput {
  regions: { top: VideoRegionBox; left: VideoRegionBox; right: VideoRegionBox };
  question?: VideoBoundingBox;
  solutionTitle?: VideoBoundingBox;
  solution?: VideoBoundingBox;
  answer?: VideoBoundingBox;
  visual?: VideoBoundingBox;
}

export interface VideoRegionQaResult {
  pass: boolean;
  issues: string[];
}

const contains = (region: VideoRegionBox, box: VideoBoundingBox): boolean =>
  box.left >= region[0] && box.right <= region[1] && box.bottom >= region[2] && box.top <= region[3];

const overlaps = (a: VideoBoundingBox, b: VideoBoundingBox): boolean =>
  a.left < b.right && a.right > b.left && a.bottom < b.top && a.top > b.bottom;

export function validateVideoRegionConformance(input: VideoRegionQaInput): VideoRegionQaResult {
  const issues: string[] = [];
  if (input.question && !contains(input.regions.top, input.question)) issues.push("QUESTION_OUTSIDE_TOP_REGION");
  for (const [name, box] of [["SOLUTION_TITLE", input.solutionTitle], ["SOLUTION", input.solution], ["ANSWER", input.answer]] as const) {
    if (box && !contains(input.regions.left, box)) issues.push(`${name}_OUTSIDE_LEFT_REGION`);
  }
  if (input.visual && !contains(input.regions.right, input.visual)) issues.push("VISUAL_OUTSIDE_RIGHT_REGION");
  if (input.question && input.solutionTitle && overlaps(input.question, input.solutionTitle)) issues.push("QUESTION_SOLUTION_TITLE_OVERLAP");
  if (input.question && input.solution && overlaps(input.question, input.solution)) issues.push("QUESTION_SOLUTION_OVERLAP");
  if (input.solution && input.visual && overlaps(input.solution, input.visual)) issues.push("SOLUTION_VISUAL_OVERLAP");
  return { pass: issues.length === 0, issues };
}
