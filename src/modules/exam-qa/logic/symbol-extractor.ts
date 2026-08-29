const LABEL_PATTERN = /[A-ZĐ](?:['’′]|[₀-₉]+|_\d+|\d+)?/g;

export function extractPointLabels(token: string): string[] {
  return token.match(LABEL_PATTERN) ?? [];
}

export function extractGeometryReferences(text: string): string[] {
  const references = new Set<string>();
  const compoundPattern = /[A-ZĐ](?:['’′]|[₀-₉]+|_\d+|\d+)?(?:[A-ZĐ](?:['’′]|[₀-₉]+|_\d+|\d+)?)+/g;
  for (const token of text.match(compoundPattern) ?? []) extractPointLabels(token).forEach((label) => references.add(label));
  for (const plane of text.matchAll(/\(([A-ZĐ][A-ZĐ0-9_₀-₉'’′]{1,})\)/g)) extractPointLabels(plane[1]).forEach((label) => references.add(label));
  return [...references];
}

export function extractTargetReferences(text: string): string[] {
  const references = new Set<string>();
  for (const target of text.matchAll(/(?:tính|tìm|xác định)\s+([^.!?]+)/giu)) extractGeometryReferences(target[1]).forEach((label) => references.add(label));
  for (const ratio of text.matchAll(/([A-ZĐ][A-ZĐ0-9_₀-₉'’′]+)\s*\/\s*([A-ZĐ][A-ZĐ0-9_₀-₉'’′]+)/g)) [ratio[1], ratio[2]].flatMap(extractPointLabels).forEach((label) => references.add(label));
  return [...references];
}

