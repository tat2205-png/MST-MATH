export interface QuestionIdParts { grade: 10 | 11 | 12; topicCode: string; unitCode: string; typeCode: string; level: 1 | 2 | 3; sequence: number }
const ID_PATTERN = /^NA-M(10|11|12)-([A-Z0-9]+)-([A-Z0-9]+)-(MCQ|TF|SA|ESSAY)-L([1-3])-(\d{6})$/;
export function parseQuestionId(id: string): QuestionIdParts | undefined {
  const match = ID_PATTERN.exec(id);
  if (!match) return undefined;
  return { grade: Number(match[1]) as QuestionIdParts["grade"], topicCode: match[2], unitCode: match[3], typeCode: match[4], level: Number(match[5]) as 1 | 2 | 3, sequence: Number(match[6]) };
}
export function isValidQuestionId(id: string): boolean { return parseQuestionId(id) !== undefined; }
