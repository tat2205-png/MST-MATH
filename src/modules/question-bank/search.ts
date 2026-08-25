import type { QuestionRecord, QuestionSearchFilters } from "./types.js";
export function matchesQuestionFilters(q: QuestionRecord, f: QuestionSearchFilters): boolean {
  const query = f.query?.trim().toLocaleLowerCase("vi");
  return (!query || q.searchText.includes(query)) && (!f.grade || q.grade === f.grade) && (!f.chapter || q.chapter === f.chapter) &&
    (!f.lesson || q.lesson === f.lesson) && (!f.topic || q.topic === f.topic) && (!f.knowledgeUnit || q.knowledgeUnit === f.knowledgeUnit) &&
    (!f.questionType || q.questionType === f.questionType) && (!f.cognitiveLevel || q.cognitiveLevel === f.cognitiveLevel) &&
    (!f.difficulty || q.difficulty === f.difficulty) && (!f.status || q.status === f.status) && (!f.tags?.length || f.tags.every((tag) => q.tags.includes(tag)));
}
