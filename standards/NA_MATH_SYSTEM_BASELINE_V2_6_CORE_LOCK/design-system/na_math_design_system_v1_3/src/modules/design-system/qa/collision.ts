export interface BoundingBox {
  x: number; y: number; width: number; height: number;
}

export function intersects(a: BoundingBox, b: BoundingBox): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

export interface QaIssue {
  code: string;
  severity: 'warning' | 'error';
  message: string;
}

export function checkCollisions(boxes: Array<{id:string; box:BoundingBox}>): QaIssue[] {
  const issues: QaIssue[] = [];
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      if (intersects(boxes[i].box, boxes[j].box)) {
        issues.push({
          code: 'LAYOUT_COLLISION',
          severity: 'error',
          message: `${boxes[i].id} overlaps ${boxes[j].id}`,
        });
      }
    }
  }
  return issues;
}
