import { Router } from "express";
import { QuestionBankImportError, QuestionBankImportService } from "./importService.js";
import type { QuestionBankUploadRequest } from "../../src/modules/question-bank/types.js";

export function createQuestionBankRouter(service: QuestionBankImportService): Router {
  const router = Router();
  router.get("/questions", (_req, res) => res.json({ success: true, questions: service.listQuestions() }));
  router.post("/import", (req, res) => {
    try { res.json(service.importUpload(req.body as QuestionBankUploadRequest)); }
    catch (error) { const known = error instanceof QuestionBankImportError; res.status(known ? error.status : 500).json({ success: false, code: known ? error.code : "IMPORT_FAILED", error: known ? error.message : "Question Bank import failed" }); }
  });
  return router;
}
