import { promises as fs } from "node:fs";
import path from "node:path";
import { ensureWorkspace, hashSource, detectInputType } from "../workspace/storage.js";
import { publishAtomically } from "../workspace/publication.js";
import type { DesktopJob } from "../workspace/types.js";
import { MemoryQuestionBankRepository } from "../../src/modules/question-bank/repository.js";
import { QuestionBankService } from "../../src/modules/question-bank/bankService.js";
import { AssessmentService } from "../../src/modules/question-bank/assessment.js";
import { QuestionBankExportService } from "../../src/modules/question-bank/export.js";
export class JobManager {
  constructor(private readonly root?: string) {}
  async create(sourcePath: string, outputProfile = "NA_MATH_STANDARD") {
    const inputType = detectInputType(sourcePath);
    if (inputType !== "docx") throw new Error("UNSUPPORTED_FILE: DOCX vertical slice only");
    const p = await ensureWorkspace(this.root);
    const now = new Date().toISOString();
    const job: DesktopJob = { jobId: `desktop-${Date.now()}-${Math.random().toString(36).slice(2,8)}`, sourcePath, sourceHash: await hashSource(sourcePath), inputType, outputProfile, status: "QUEUED", createdAt: now, localWorkspacePath: path.join(p.jobs, `desktop-${Date.now()}`), resultPaths: [], publishedPaths: [], issues: [], reviewRequired: false };
    await fs.mkdir(job.localWorkspacePath, { recursive: true });
    const persist = async () => fs.writeFile(path.join(p.jobs, `${job.jobId}.json`), JSON.stringify(job, null, 2));
    await persist();
    try {
      const bytes = new Uint8Array(await fs.readFile(sourcePath));
      job.status = "ANALYZING"; await persist();
      const repository = new MemoryQuestionBankRepository();
      const bank = new QuestionBankService(repository);
      const imported = await bank.importDocxForRuntime(bytes, path.basename(sourcePath));
      if (!imported.imported.length) throw new Error("DOCX_NO_QUESTIONS");
      const ids = imported.imported.map((q) => q.id);
      const snapshot = repository.load();
      for (const q of snapshot.questions) if (ids.includes(q.id)) q.bankStatus = "APPROVED";
      repository.replace(snapshot);
      job.status = "PROCESSING"; await persist();
      const types = [...new Set(imported.imported.map((q) => q.type))];
      const assessment = new AssessmentService(repository).generate({ id: job.jobId, title: path.basename(sourcePath, path.extname(sourcePath)), seed: job.sourceHash, sections: types.map((type, i) => ({ id: `section-${i + 1}`, questionType: type, count: imported.imported.filter((q) => q.type === type).length })) });
      if (assessment.ok !== true) throw new Error(assessment.diagnostics.map((d) => d.message).join(" | "));
      job.status = "EXPORTING"; await persist();
      const created = new QuestionBankExportService().deliver(assessment.assessment, assessment.answerManifest, repository, { audience: "TEACHER", formats: ["DOCX"], includeAnswers: true, includeSolutions: true, includeMetadata: true, includeProvenance: true, assetMode: "EMBED", outputProfile: "NA_MATH_STANDARD", outputDirectory: job.localWorkspacePath, filename: path.basename(sourcePath, path.extname(sourcePath)) });
      if (created.ok !== true) throw new Error(created.diagnostics.map((d) => d.message).join(" | "));
      const staged = created.artifacts[0].path; job.resultPaths = [staged];
      const config = JSON.parse(await fs.readFile(p.config, "utf8").catch(() => "{}")) as { outputRoot?: string };
      if (config.outputRoot) job.publishedPaths = [await publishAtomically(staged, config.outputRoot, path.basename(staged))];
      job.status = "COMPLETED"; job.completedAt = new Date().toISOString(); await persist(); return job;
    } catch (error) { job.status = "FAILED"; job.issues = [error instanceof Error ? error.message : String(error)]; await persist(); throw error; }
  }
}
