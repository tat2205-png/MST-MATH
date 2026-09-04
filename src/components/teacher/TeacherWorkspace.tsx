import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  Download,
  FileInput,
  FileOutput,
  Gamepad2,
  Home,
  Library,
  LoaderCircle,
  Play,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Video,
  X,
} from "lucide-react";
import { MathView } from "../MathView.js";
import { LocalBridgeClient } from "../../services/localBridgeClient.js";
import type {
  AssessmentWorkflowResult,
  ContentBlock,
  ExportAudience,
  ExportFormat,
  ExportWorkflowResult,
  GameWorkflowView,
  ImportWorkflowResult,
  QuestionQueryResponse,
  QuestionType,
  TeacherArea,
  TeacherQuestion,
  VideoWorkflowResult,
  WorkflowSummary,
} from "../../services/teacherWorkflowTypes.js";
import { deriveTeacherWorkflowState } from "../../services/teacherWorkflowTypes.js";
import { groupTeacherDiagnostics } from "../../services/teacherWorkflowTypes.js";

type BusyTask = "import" | "approve" | "query" | "assessment" | "game" | "video" | "export" | null;
type Notice = { tone: "error" | "success" | "warning"; title: string; message: string };

const typeLabels: Record<QuestionType, string> = {
  MULTIPLE_CHOICE: "Trắc nghiệm",
  TRUE_FALSE: "Đúng / Sai",
  SHORT_ANSWER: "Trả lời ngắn",
  ESSAY: "Tự luận",
  UNKNOWN: "Chưa xác định",
};

const areas: Array<{ id: TeacherArea; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "workspace", label: "Tổng quan", icon: Home },
  { id: "import", label: "Nguồn", icon: FileInput },
  { id: "review", label: "Xử lý", icon: ShieldCheck },
  { id: "assessment", label: "Thiết kế", icon: BookOpenCheck },
  { id: "video", label: "QA", icon: ShieldCheck },
  { id: "export", label: "Xuất", icon: FileOutput },
];

export const CANONICAL_TEACHER_STAGES = ["Nguồn", "Xử lý", "Thiết kế", "QA", "Xuất"] as const;

async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, body === undefined ? undefined : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await response.json();
  if (!response.ok || !data.success) throw new Error(data.error || data.diagnostics?.[0]?.message || "Yêu cầu không thành công.");
  return (data.result ?? data.summary) as T;
}

function fileBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Không thể đọc tệp đã chọn."));
    reader.onload = () => resolve(String(reader.result).split(",", 2)[1] || "");
    reader.readAsDataURL(file);
  });
}

function Blocks({ blocks }: { blocks?: ContentBlock[]; key?: React.Key }) {
  if (!blocks?.length) return <span className="text-slate-400">Chưa có nội dung</span>;
  return (
    <div className="space-y-1.5 leading-7">
      {blocks.map((block, index) => {
        if (block.type === "text") return <span key={index} className="whitespace-pre-wrap">{block.value}</span>;
        if (block.type === "math") return <MathView key={index} math={block.math.latex ?? block.math.sourceRaw} className="mx-1" />;
        if (block.type === "figure") return <span key={index} className="text-xs text-slate-500">[Hình {block.figureId}]</span>;
        return <div key={index} className="overflow-x-auto text-sm">{block.cells.map((cell, cellIndex) => <Blocks key={cellIndex} blocks={cell} />)}</div>;
      })}
    </div>
  );
}

function StatusBadge({ status }: { status?: string }) {
  const tone = status === "APPROVED" || status === "VALID" || status === "READY" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : status === "QUARANTINED" || status === "INVALID" || status === "BLOCKED" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-800 border-amber-200";
  return <span className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-bold ${tone}`}>{status || "CHƯA RÕ"}</span>;
}

export function canonicalQuestionNumberLabel(question: Pick<TeacherQuestion, "index">): string | undefined {
  return Number.isInteger(question.index) && question.index! > 0 ? `Câu ${question.index}` : undefined;
}

export function QuestionCard({ question, selected, onToggle, review }: { question: TeacherQuestion; selected?: boolean; onToggle?: () => void; review?: boolean; key?: React.Key }) {
  const confirmed = new Set(question.figureAssociations.filter((item) => item.status === "CONFIRMED" && item.questionId === question.id).map((item) => item.figureId));
  const questionNumber = canonicalQuestionNumberLabel(question);
  return (
    <article className={`rounded-xl border bg-white p-4 shadow-sm ${selected ? "border-blue-400 ring-2 ring-blue-100" : "border-slate-200"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {onToggle && <input aria-label={`Chọn câu hỏi ${question.id}`} type="checkbox" checked={selected} onChange={onToggle} className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />}
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h2 className={`text-base font-bold ${questionNumber ? "text-slate-900" : "text-amber-800"}`}>{questionNumber ?? "Không xác định số câu hỏi"}</h2>
              {!questionNumber && <StatusBadge status="REVIEW_REQUIRED" />}
            </div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] text-slate-500">{question.id}</span>
              <StatusBadge status={question.bankStatus} />
              <StatusBadge status={question.validationStatus} />
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700">{typeLabels[question.type]}</span>
            </div>
            <Blocks blocks={question.stem} />
          </div>
        </div>
        <span className="max-w-48 truncate text-xs text-slate-500" title={question.source.document}>{question.source.document}</span>
      </div>
      {question.options.length > 0 && <div className="mt-3 grid gap-2 sm:grid-cols-2">{question.options.map((option) => <div key={option.label} className="rounded-lg bg-slate-50 px-3 py-2 text-sm"><strong>{option.label}.</strong> <Blocks blocks={option.content} /></div>)}</div>}
      {question.figures.filter((figure) => confirmed.has(figure.id) && figure.dataUrl).map((figure) => <img key={figure.id} src={figure.dataUrl} alt={figure.caption || `Hình minh họa đã xác nhận cho ${question.id}`} className="mt-3 max-h-72 max-w-full rounded-lg border border-slate-200 object-contain" />)}
      {review && (
        <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-600">
          <div>Exam QA: <strong>{question.examQa?.status ?? "NOT_TESTED"}</strong></div>
          {question.warnings.length > 0 && <div className="mt-1 text-amber-800">Cần xem lại: {question.warnings.join(", ")}</div>}
          {question.figureAssociations.some((association) => association.status !== "CONFIRMED") && <div className="mt-1 text-amber-800">Có liên kết hình chưa được xác nhận; hệ thống không hiển thị hình đó.</div>}
        </div>
      )}
    </article>
  );
}

export function TeacherWorkspace({ onOpenStudio }: { onOpenStudio: () => void }) {
  const [area, setArea] = useState<TeacherArea>("workspace");
  const [summary, setSummary] = useState<WorkflowSummary | null>(null);
  const [questions, setQuestions] = useState<TeacherQuestion[]>([]);
  const [total, setTotal] = useState(0);
  const [questionOffset, setQuestionOffset] = useState(0);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [busy, setBusy] = useState<BusyTask>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportWorkflowResult | null>(null);
  const [searchText, setSearchText] = useState("");
  const [type, setType] = useState<QuestionType | "">("");
  const [status, setStatus] = useState<"APPROVED" | "REVIEW" | "QUARANTINED" | "">("");
  const [hasFigures, setHasFigures] = useState<"" | "yes" | "no">("");
  const [assessment, setAssessment] = useState<AssessmentWorkflowResult | null>(null);
  const [assessmentCount, setAssessmentCount] = useState(1);
  const [assessmentType, setAssessmentType] = useState<QuestionType>("MULTIPLE_CHOICE");
  const [seed, setSeed] = useState("ux-01");
  const [game, setGame] = useState<GameWorkflowView | null>(null);
  const [gameResponse, setGameResponse] = useState("");
  const [video, setVideo] = useState<VideoWorkflowResult | null>(null);
  const [videoStage, setVideoStage] = useState("CHƯA BẮT ĐẦU");
  const [videoArtifact, setVideoArtifact] = useState<{ pathOrUrl: string; sizeBytes?: number } | null>(null);
  const [exportAudience, setExportAudience] = useState<ExportAudience>("STUDENT");
  const [exportFormats, setExportFormats] = useState<ExportFormat[]>(["DOCX", "PDF"]);
  const [includeAnswers, setIncludeAnswers] = useState(false);
  const [includeSolutions, setIncludeSolutions] = useState(false);
  const [exportResult, setExportResult] = useState<ExportWorkflowResult | null>(null);

  const workflowState = useMemo(() => deriveTeacherWorkflowState({
    sourceReady: Boolean(file || importResult || (summary && summary.counts.TOTAL > 0)),
    processing: busy === "import" || busy === "approve" || busy === "query",
    processingError: notice?.tone === "error",
    designReady: Boolean(assessment),
    qa: assessment ? (questions.some((question) => question.examQa?.status === "BLOCKED" || question.validationStatus === "INVALID") ? "FAIL" : "PASS") : undefined,
    exportReady: Boolean(assessment && summary?.readiness.actions.export.ready),
  }), [assessment, busy, file, importResult, notice, questions, summary]);

  const loadSummary = useCallback(async () => {
    try { setSummary(await api<WorkflowSummary>("/api/teacher-workflow/status")); }
    catch (error) { setNotice({ tone: "error", title: "Không thể tải trạng thái", message: error instanceof Error ? error.message : String(error) }); }
  }, []);

  const questionPageSize = 50;
  const queryQuestions = useCallback(async (overrides: { statuses?: Array<"APPROVED" | "REVIEW" | "QUARANTINED">; offset?: number } = {}) => {
    const offset = overrides.offset ?? questionOffset;
    setBusy("query");
    try {
      const result = await api<QuestionQueryResponse>("/api/teacher-workflow/questions/query", { query: { text: searchText || undefined, types: type ? [type] : undefined, statuses: overrides.statuses ?? (status ? [status] : undefined), hasFigures: hasFigures === "" ? undefined : hasFigures === "yes", sort: { field: "INDEX", direction: "ASC" }, offset, limit: questionPageSize } });
      setQuestions(result.items); setTotal(result.total); setQuestionOffset(offset);
    } catch (error) { setNotice({ tone: "error", title: "Không thể tải ngân hàng", message: error instanceof Error ? error.message : String(error) }); }
    finally { setBusy(null); }
  }, [hasFigures, questionOffset, searchText, status, type]);

  useEffect(() => { void loadSummary(); }, [loadSummary]);
  useEffect(() => { if (area === "bank") void queryQuestions(); if (area === "review") void queryQuestions({ statuses: ["REVIEW", "QUARANTINED"] }); }, [area]);

  const selectedQuestions = useMemo(() => questions.filter((question) => selectedIds.includes(question.id)), [questions, selectedIds]);
  const actionReady = selectedIds.length > 0;

  const runImport = async () => {
    if (!file) return;
    if (!file.name.toLocaleLowerCase().endsWith(".docx")) { setNotice({ tone: "error", title: "Định dạng không hỗ trợ", message: "UX-01 chỉ hiển thị DOCX vì đây là đường nhập tài liệu đã được runtime xác minh." }); return; }
    setBusy("import"); setNotice(null);
    try {
      const result = await api<ImportWorkflowResult>("/api/teacher-workflow/import", { fileName: file.name, base64: await fileBase64(file) });
      setImportResult(result); setSummary(result.summary); setQuestions(result.imported); setArea("review");
      setNotice({ tone: result.diagnostics.some((item) => item.severity === "WARNING" || item.severity === "ERROR") ? "warning" : "success", title: "Đã phân tích tài liệu", message: `${result.imported.length} câu hỏi được nhận diện. Hãy duyệt nội dung trước khi đưa vào sử dụng.` });
    } catch (error) { setNotice({ tone: "error", title: "Nhập tài liệu thất bại", message: error instanceof Error ? error.message : String(error) }); }
    finally { setBusy(null); }
  };

  const approveSelected = async () => {
    const ids = selectedIds.length ? selectedIds : questions.filter((question) => question.bankStatus === "REVIEW" && question.validationStatus !== "INVALID" && question.examQa?.status !== "BLOCKED" && question.examQa?.status !== "NOT_TESTED").map((question) => question.id);
    setBusy("approve");
    try { setSummary(await api<WorkflowSummary>("/api/teacher-workflow/approve", { ids })); setSelectedIds([]); await queryQuestions({ statuses: ["REVIEW", "QUARANTINED"] }); setNotice({ tone: "success", title: "Đã duyệt", message: `${ids.length} câu hỏi hợp lệ đã được chuyển vào nhóm APPROVED.` }); }
    catch (error) { setNotice({ tone: "error", title: "Không thể duyệt", message: error instanceof Error ? error.message : String(error) }); }
    finally { setBusy(null); }
  };

  const generateAssessment = async () => {
    setBusy("assessment"); setNotice(null);
    try {
      const ids = selectedIds.length ? selectedIds : undefined;
      const result = await api<AssessmentWorkflowResult>("/api/teacher-workflow/assessments", { spec: { title: "Đề kiểm tra", seed, globalFilters: ids ? { ids } : undefined, sections: [{ id: "section-1", title: "Phần 1", questionType: assessmentType, count: assessmentCount, ordering: "SEEDED_SHUFFLE", pointsPerQuestion: 1 }] } });
      setAssessment(result); setArea("assessment"); setNotice({ tone: "success", title: "Đã tạo đề", message: `Đề gồm ${result.questionIds.length} tham chiếu Question ID; câu hỏi nguồn không bị sao chép hoặc sửa đổi.` });
    } catch (error) { setNotice({ tone: "error", title: "Không đủ câu hỏi phù hợp", message: error instanceof Error ? error.message : String(error) }); }
    finally { setBusy(null); }
  };

  const startGame = async () => {
    if (!assessment) return;
    setBusy("game");
    try { setGame(await api<GameWorkflowView>("/api/teacher-workflow/games/start", { assessmentId: assessment.assessment.id })); setArea("game"); }
    catch (error) { setNotice({ tone: "error", title: "Không thể tạo trò chơi", message: error instanceof Error ? error.message : String(error) }); }
    finally { setBusy(null); }
  };

  const gameAction = async (action: "OPEN" | "CLOSE" | "COMPLETE_ROUND" | "NEXT_ROUND" | "SUBMIT") => {
    if (!game) return;
    setBusy("game");
    try { setGame(await api<GameWorkflowView>("/api/teacher-workflow/games/action", { sessionId: game.session.id, action, response: gameResponse })); if (action === "SUBMIT") setGameResponse(""); }
    catch (error) { setNotice({ tone: "error", title: "Thao tác trò chơi chưa hợp lệ", message: error instanceof Error ? error.message : String(error) }); }
    finally { setBusy(null); }
  };

  const prepareVideo = async () => {
    const questionId = selectedIds[0] ?? assessment?.questionIds[0];
    if (!questionId) return;
    setBusy("video"); setVideoStage("PREPARING"); setVideoArtifact(null);
    try { const result = await api<VideoWorkflowResult>("/api/teacher-workflow/video/prepare", { questionId }); setVideo(result); setVideoStage("PLANNING_VISUAL"); setArea("video"); }
    catch (error) { setVideoStage("FAILED"); setNotice({ tone: "error", title: "Không thể chuẩn bị video", message: error instanceof Error ? error.message : String(error) }); }
    finally { setBusy(null); }
  };

  const renderVideo = async () => {
    if (!video) return;
    setBusy("video"); setVideoStage("RENDERING");
    try {
      const client = new LocalBridgeClient();
      const health = await client.checkHealth();
      if (health.status !== "READY") throw new Error("Local Render Bridge chưa READY. Hãy khởi động ứng dụng bằng npm run studio.");
      let job = await client.createRenderJob(video.job.renderTask);
      for (let attempt = 0; attempt < 120 && !["COMPLETED", "FAILED", "CANCELLED"].includes(job.status); attempt += 1) { await new Promise((resolve) => setTimeout(resolve, 1000)); job = await client.getRenderJob(job.jobId); }
      if (job.status !== "COMPLETED" || job.exitCode !== 0) throw new Error("Render không hoàn tất thành công.");
      setVideoStage("QA");
      const artifacts = await client.getRenderArtifacts(job.jobId);
      const artifact = artifacts.find((item) => item.type === "preview_video" || item.type === "final_video");
      if (!artifact?.sizeBytes) throw new Error("Không tìm thấy MP4 thực tế sau render.");
      setVideoArtifact({ pathOrUrl: artifact.pathOrUrl, sizeBytes: artifact.sizeBytes }); setVideoStage("COMPLETE");
    } catch (error) { setVideoStage("FAILED"); setNotice({ tone: "error", title: "Render thất bại", message: error instanceof Error ? error.message : String(error) }); }
    finally { setBusy(null); }
  };

  const runExport = async () => {
    if (!assessment || workflowState !== "EXPORT_READY") {
      setNotice({ tone: "error", title: "Chưa thể xuất", message: workflowState === "QA_REQUIRED" ? "QA chưa PASS; cần hoàn tất duyệt và kiểm tra trước khi xuất." : "Quy trình chưa sẵn sàng để xuất." });
      return;
    }
    setBusy("export");
    try { const result = await api<ExportWorkflowResult>("/api/teacher-workflow/exports", { assessmentId: assessment.assessment.id, audience: exportAudience, formats: exportFormats, includeAnswers: exportAudience === "TEACHER" && includeAnswers, includeSolutions: exportAudience === "TEACHER" && includeSolutions, filename: "de-kiem-tra" }); setExportResult(result); setArea("export"); }
    catch (error) { setNotice({ tone: "error", title: "Xuất bản thất bại", message: error instanceof Error ? error.message : String(error) }); }
    finally { setBusy(null); }
  };

  const toggleSelected = (id: string) => setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const navigate = (next: TeacherArea) => {
    const blocked = (next === "review" && !file && !importResult) || (next === "assessment" && !summary?.counts.APPROVED) || (next === "export" && workflowState !== "EXPORT_READY");
    if (blocked) {
      const message = next === "review" ? "Chưa có tài liệu DOCX đã nhập. Hãy chọn tệp DOCX và bấm “Phân tích và nhận diện câu hỏi”." : next === "assessment" ? `Cần duyệt câu hợp lệ trước khi thiết kế. Còn ${summary?.counts.REVIEW ?? 0} câu cần xem lại.` : "QA chưa PASS hoặc chưa có đề thiết kế; hoàn tất các mục REVIEW_REQUIRED trước khi xuất.";
      setNotice({ tone: "warning", title: "Chưa thể chuyển bước", message }); return;
    }
    setArea(next); setNotice(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button onClick={() => navigate("workspace")} className="flex items-center gap-3 rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-blue-400">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-xl font-bold">Σ</span>
            <span><strong className="block text-sm tracking-wide">MST-MATH Studio</strong><span className="text-xs text-slate-300">Teacher Workspace · Quy trình dành cho giáo viên</span></span>
          </button>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-emerald-300">Runtime sẵn sàng</span>
            <button onClick={onOpenStudio} className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-400">Studio chuyên sâu</button>
          </div>
        </div>
        <nav aria-label="Điều hướng quy trình giáo viên" className="overflow-x-auto border-t border-slate-800">
          <div className="mx-auto flex max-w-7xl gap-1 px-3 sm:px-6">{areas.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => navigate(item.id)} aria-current={area === item.id ? "page" : undefined} className={`flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-400 ${area === item.id ? "border-blue-400 bg-slate-800 text-white" : "border-transparent text-slate-300 hover:bg-slate-800 hover:text-white"}`}><Icon className="h-4 w-4" />{item.label}</button>; })}</div>
        </nav>
      </header>

      {busy && <div role="status" className="border-b border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800"><div className="mx-auto flex max-w-7xl items-center gap-2"><LoaderCircle className="h-4 w-4 animate-spin" />Đang xử lý {busy}… Vui lòng không gửi lại thao tác.</div></div>}
      {notice && <div className="mx-auto mt-4 max-w-7xl px-4 sm:px-6"><div role={notice.tone === "error" ? "alert" : "status"} className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-sm ${notice.tone === "error" ? "border-rose-200 bg-rose-50 text-rose-800" : notice.tone === "warning" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}><div className="flex gap-2">{notice.tone === "error" ? <AlertCircle className="h-5 w-5 shrink-0" /> : <CheckCircle2 className="h-5 w-5 shrink-0" />}<div><strong className="block">{notice.title}</strong>{notice.message}</div></div><button aria-label="Đóng thông báo" onClick={() => setNotice(null)} className="rounded p-1 focus:outline-none focus:ring-2 focus:ring-current"><X className="h-4 w-4" /></button></div></div>}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {area === "workspace" && <section>
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-blue-950 p-6 text-white shadow-lg sm:p-8"><p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-blue-300">MST-MATH Teacher Workspace</p><h1 className="text-2xl font-bold sm:text-3xl">Nguồn → Xử lý → Thiết kế → QA → Xuất</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">Một không gian giáo viên thích ứng: nguồn và ngữ cảnh ở bên trái, thiết kế ở trung tâm, QA và AI theo ngữ cảnh ở bên phải. DOCX là đường nhập tài liệu đã được xác minh.</p><div className="mt-5 flex flex-wrap gap-2" aria-label="Các giai đoạn quy trình">{CANONICAL_TEACHER_STAGES.map((stage, index) => <button key={stage} onClick={() => navigate((["import", "review", "assessment", "video", "export"] as TeacherArea[])[index])} className="rounded-lg border border-blue-400/40 bg-white/10 px-3 py-2 text-xs font-semibold hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-blue-300">{index + 1}. {stage}</button>)}</div></div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[{ label: "Tổng câu hỏi", value: summary?.counts.TOTAL ?? 0 }, { label: "Đã duyệt", value: summary?.counts.APPROVED ?? 0 }, { label: "Cần xem lại", value: summary?.counts.REVIEW ?? 0 }, { label: "Cách ly", value: summary?.counts.QUARANTINED ?? 0 }].map((item) => <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="text-xs text-slate-500">{item.label}</div><div className="mt-1 text-2xl font-bold">{item.value}</div></div>)}</div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">{[{ title: "Thiết kế bài học / Geometry", text: "Bài học, worksheet, bài tập và geometry dùng capability hiện có; FOLD là mode trong Geometry.", action: "assessment" as TeacherArea, icon: BookOpenCheck }, { title: "QA theo ngữ cảnh", text: "Theo dõi math, source, layout và output readiness trước khi xuất.", action: "video" as TeacherArea, icon: ShieldCheck }, { title: "Hồ sơ đầu ra", text: "THPTQG · DGNL · SAT · V-SAT là output profiles, không phải ứng dụng riêng.", action: "export" as TeacherArea, icon: FileOutput }].map((card) => <button key={card.title} onClick={() => navigate(card.action)} className="rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500"><card.icon className="h-6 w-6 text-blue-600" /><strong className="mt-3 block">{card.title}</strong><span className="mt-1 block text-sm leading-6 text-slate-600">{card.text}</span></button>)}</div>
        </section>}

        {area === "import" && <section className="mx-auto max-w-3xl"><button onClick={() => navigate("workspace")} className="mb-4 inline-flex items-center gap-1 text-sm text-slate-600 hover:text-blue-600"><ArrowLeft className="h-4 w-4" />Không gian làm việc</button><div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><h1 className="text-xl font-bold">Nhập tài liệu DOCX</h1><p className="mt-2 text-sm text-slate-600">Hiện tại MST-MATH hỗ trợ nhập tài liệu DOCX. PDF và hình ảnh sẽ được bổ sung sau khi hoàn tất kiểm thử.</p><label htmlFor="teacher-docx" className="mt-6 block cursor-pointer rounded-xl border-2 border-dashed border-slate-300 p-8 text-center hover:border-blue-400"><FileInput className="mx-auto h-8 w-8 text-blue-600" /><span className="mt-3 block text-sm font-semibold">Chọn tệp DOCX</span><span className="mt-1 block text-xs text-slate-500">Tệp được kiểm tra trước khi nhập; nội dung không rõ ràng sẽ cần giáo viên xem lại.</span><input id="teacher-docx" aria-label="Chọn tệp DOCX" type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(event) => setFile(event.target.files?.[0] ?? null)} className="sr-only" /></label>{file && <div className="mt-3 rounded-lg bg-slate-50 p-3 text-sm">Đã chọn: <strong>{file.name}</strong> · {(file.size / 1024).toFixed(1)} KB · <span className="text-emerald-700">DOCX hợp lệ</span></div>}<button disabled={!file || busy !== null} onClick={runImport} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"><FileInput className="h-4 w-4" />Phân tích và nhận diện câu hỏi</button></div></section>}

        {area === "review" && <section><div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-xl font-bold">Xử lý và duyệt nội dung</h1><p className="mt-1 text-sm text-slate-600">Câu REVIEW_REQUIRED cần giáo viên kiểm tra. Câu cách ly, không hợp lệ hoặc chưa kiểm định không được tự động duyệt.</p></div><button disabled={busy !== null} onClick={approveSelected} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Duyệt {selectedIds.length || summary?.counts.REVIEW || 0} câu hợp lệ và tiếp tục</button></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm"><strong>{summary?.counts.REVIEW ?? 0}</strong><span className="ml-1">câu cần xem lại</span></div><div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm"><strong>{summary?.counts.QUARANTINED ?? 0}</strong><span className="ml-1">câu đang cách ly</span></div><div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-sm">Sau khi duyệt, hãy vào <strong>Thiết kế</strong> để tạo đề.</div></div>{importResult?.diagnostics.length ? <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Vấn đề cần kiểm tra:</strong><ul className="mt-2 space-y-2">{groupTeacherDiagnostics(importResult.diagnostics).map((item) => <li key={item.code}><strong>{item.count} mục:</strong> {item.message} <details className="mt-1 text-xs"><summary>Chi tiết kỹ thuật</summary><span className="font-mono">{item.code}</span>{item.questionIds.length ? ` · ${item.questionIds.join(", ")}` : ""}</details></li>)}</ul></div> : null}<div className="mt-5 space-y-4">{questions.length ? questions.map((question) => <QuestionCard key={question.id} question={question} selected={selectedIds.includes(question.id)} onToggle={() => toggleSelected(question.id)} review />) : <Empty title="Không còn câu hỏi cần duyệt" action="Mở ngân hàng câu hỏi" onAction={() => navigate("bank")} />}</div></section>}

        {area === "bank" && <section><div className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-xl font-bold">Ngân hàng câu hỏi</h1><p className="mt-1 text-sm text-slate-600">Kết quả được phân trang, sắp xếp và lọc bởi QB-1F. Đã chọn {selectedIds.length} Question ID.</p></div><div className="flex gap-2"><button onClick={() => setSelectedIds(questions.filter((q) => q.bankStatus === "APPROVED").map((q) => q.id))} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold hover:bg-slate-50">Chọn câu APPROVED đang hiển thị</button><button onClick={() => setSelectedIds([])} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold hover:bg-slate-50">Bỏ chọn</button></div></div><div className="mt-4 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-5"><label className="md:col-span-2 text-xs font-semibold text-slate-700">Từ khóa<div className="mt-1 flex rounded-lg border border-slate-300"><Search className="ml-3 mt-2.5 h-4 w-4 text-slate-400" /><input value={searchText} onChange={(e) => { setSearchText(e.target.value); setQuestionOffset(0); }} className="w-full rounded-lg px-3 py-2 text-sm outline-none" placeholder="Nội dung, nguồn, ký hiệu…" /></div></label><Filter label="Loại câu hỏi" value={type} onChange={(value) => { setType(value as QuestionType | ""); setQuestionOffset(0); }} options={Object.entries(typeLabels)} /><Filter label="Trạng thái" value={status} onChange={(value) => { setStatus(value as typeof status); setQuestionOffset(0); }} options={[["APPROVED", "Đã duyệt"], ["REVIEW", "Cần xem"], ["QUARANTINED", "Cách ly"]]} /><Filter label="Hình" value={hasFigures} onChange={(value) => { setHasFigures(value as typeof hasFigures); setQuestionOffset(0); }} options={[["yes", "Có hình xác nhận"], ["no", "Không có hình"]]} /><button disabled={busy !== null} onClick={() => queryQuestions({ offset: 0 })} className="md:col-span-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">Tìm kiếm bằng dịch vụ Question Bank</button></div><div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500"><span>Hiển thị {total ? `${questionOffset + 1}–${Math.min(questionOffset + questions.length, total)}` : "0"} / {total} kết quả</span><div className="flex gap-2"><button aria-label="Trang trước" disabled={busy !== null || questionOffset === 0} onClick={() => queryQuestions({ offset: Math.max(0, questionOffset - questionPageSize) })} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Trang trước</button><button aria-label="Trang tiếp" disabled={busy !== null || questionOffset + questions.length >= total} onClick={() => queryQuestions({ offset: questionOffset + questionPageSize })} className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">Trang tiếp</button></div></div><div className="mt-4 space-y-4">{questions.length ? questions.map((question) => <QuestionCard key={question.id} question={question} selected={selectedIds.includes(question.id)} onToggle={() => toggleSelected(question.id)} />) : <Empty title="Không có kết quả phù hợp" action="Xóa bộ lọc" onAction={() => { setSearchText(""); setType(""); setStatus(""); setHasFigures(""); setQuestionOffset(0); }} />}</div>{actionReady && <div className="sticky bottom-4 mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-white/95 p-4 shadow-lg backdrop-blur"><strong className="text-sm">{selectedIds.length} Question ID đã chọn</strong><div className="flex flex-wrap gap-2"><button onClick={() => navigate("assessment")} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white">Tạo đề</button><button onClick={prepareVideo} disabled={!summary?.readiness.actions.video.ready} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">Giải / Video</button></div></div>}</section>}

        {area === "assessment" && <section className="grid gap-6 lg:grid-cols-[380px_1fr]"><div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h1 className="text-xl font-bold">Tạo đề kiểm tra</h1><p className="mt-2 text-sm text-slate-600">AssessmentService dùng APPROVED-only và không tự nới lỏng khi thiếu câu hỏi.</p><FormSelect label="Loại câu" value={assessmentType} onChange={(value) => setAssessmentType(value as QuestionType)} options={Object.entries(typeLabels)} /><label className="mt-4 block text-xs font-semibold">Số câu<input type="number" min={1} max={50} value={assessmentCount} onChange={(e) => setAssessmentCount(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label><label className="mt-4 block text-xs font-semibold">Seed<input value={seed} onChange={(e) => setSeed(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label><div className="mt-3 text-xs text-slate-500">Phạm vi: {selectedIds.length ? `${selectedIds.length} Question ID đã chọn` : "toàn bộ câu APPROVED phù hợp"}</div><button disabled={busy !== null} onClick={generateAssessment} className="mt-5 w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">Sinh đề bằng AssessmentService</button></div><div>{assessment ? <div className="rounded-xl border border-emerald-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><StatusBadge status="READY" /><h2 className="mt-2 text-lg font-bold">{assessment.assessment.title}</h2><p className="text-xs text-slate-500">{assessment.assessment.id}</p></div><span className="text-2xl font-bold">{assessment.questionIds.length}</span></div><div className="mt-4 space-y-2">{assessment.questionIds.map((id, index) => <div key={id} className="rounded-lg bg-slate-50 px-3 py-2 text-sm"><strong>{index + 1}.</strong> <span className="font-mono text-xs">{id}</span></div>)}</div><div className="mt-5 flex flex-wrap gap-2"><button onClick={startGame} className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold text-white"><Gamepad2 className="mr-1 inline h-4 w-4" />Tạo trò chơi</button><button onClick={prepareVideo} className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white"><Video className="mr-1 inline h-4 w-4" />Tạo video</button><button onClick={() => navigate("export")} className="rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white"><Download className="mr-1 inline h-4 w-4" />Xuất bản</button></div></div> : <Empty title="Chưa có đề kiểm tra" action="Mở ngân hàng câu hỏi" onAction={() => navigate("bank")} />}</div></section>}

        {area === "game" && <section><h1 className="text-xl font-bold">Trò chơi lớp học</h1><p className="mt-1 text-sm text-slate-600">Phiên hiện tại dùng GameSession thật. Khung học sinh chỉ nhận StudentGameQuestion, không có đáp án hoặc lời giải.</p>{!game ? <Empty title="Chưa có phiên trò chơi" action={assessment ? "Bắt đầu từ đề hiện tại" : "Tạo đề trước"} onAction={assessment ? startGame : () => navigate("assessment")} /> : <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]"><div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><StatusBadge status={game.session.state} /><span className="text-xs text-slate-500">Vòng {game.session.currentRoundIndex + 1}</span></div>{game.currentQuestion ? <div className="mt-5"><p className="mb-2 text-xs font-bold uppercase tracking-wide text-blue-600">Màn hình học sinh</p><Blocks blocks={game.currentQuestion.stem} />{game.currentQuestion.options.map((option) => <div key={option.label} className="mt-2 rounded-lg bg-slate-50 p-3 text-sm"><strong>{option.label}.</strong> <Blocks blocks={option.content} /></div>)}<label className="mt-5 block text-xs font-semibold">Câu trả lời hiện tại<input value={gameResponse} onChange={(e) => setGameResponse(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label><button disabled={busy !== null} onClick={() => gameAction("SUBMIT")} className="mt-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white">Ghi nhận</button></div> : <p className="mt-5 text-sm text-slate-500">Câu hỏi đang đóng.</p>}</div><div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold">Điều khiển giáo viên</h2><div className="mt-4 grid gap-2"><button disabled={game.session.state !== "ACTIVE" && game.session.state !== "QUESTION_CLOSED" || busy !== null} onClick={() => gameAction("OPEN")} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Mở câu hỏi</button><button disabled={game.session.state !== "QUESTION_OPEN" || busy !== null} onClick={() => gameAction("CLOSE")} className="rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40">Đóng câu hỏi</button><button disabled={!(["ACTIVE", "QUESTION_CLOSED"].includes(game.session.state)) || busy !== null} onClick={() => gameAction("COMPLETE_ROUND")} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-40">Kết thúc vòng</button><button disabled={game.session.state !== "ROUND_COMPLETE" || busy !== null} onClick={() => gameAction("NEXT_ROUND")} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-40">Vòng tiếp theo / Hoàn tất</button></div><div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm">Điểm hiện tại: <strong>{game.session.scoreState["Lớp học"] ?? 0}</strong></div>{game.result && <div className="mt-3 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">Phiên hoàn tất · Tổng điểm {game.result.totalScore}</div>}</div></div>}</section>}

        {area === "video" && <section><h1 className="text-xl font-bold">Giải và Video</h1><p className="mt-1 text-sm text-slate-600">Question → Math QA → Studio Orchestrator → Local Render Bridge. Không có đường gọi Manim thay thế.</p>{!video ? <Empty title="Chưa có tác vụ video" action={actionReady || assessment ? "Chuẩn bị từ câu hỏi" : "Chọn câu hỏi"} onAction={actionReady || assessment ? prepareVideo : () => navigate("bank")} /> : <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]"><div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-wrap items-center justify-between gap-2"><div><StatusBadge status={videoStage} /><h2 className="mt-2 font-bold">Question ID: <span className="font-mono text-sm">{video.job.questionId}</span></h2></div><span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">{video.job.visualEngine}</span></div><ol className="mt-5 grid gap-2 sm:grid-cols-3">{video.stages.map((stage) => <li key={stage} className={`rounded-lg border px-3 py-2 text-xs font-semibold ${videoStage === stage || videoStage === "COMPLETE" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 text-slate-500"}`}>{stage}</li>)}</ol>{videoArtifact && <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4"><strong className="text-emerald-800">MP4 đã hoàn tất</strong><p className="mt-1 break-all font-mono text-xs text-emerald-700">{videoArtifact.pathOrUrl}</p><p className="mt-1 text-xs text-emerald-700">{videoArtifact.sizeBytes} bytes · QA artifact tồn tại</p><a href={videoArtifact.pathOrUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 rounded-lg bg-emerald-700 px-3 py-2 text-xs font-semibold text-white"><Play className="h-3.5 w-3.5" />Mở video</a></div>}</div><div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="font-bold">Tác vụ render</h2><p className="mt-2 text-xs leading-5 text-slate-600">Math gate: {video.job.mathGate}<br />Route: {video.job.visualRoute.routeId}<br />Project: {video.job.renderTask.projectId}</p><button disabled={busy !== null || videoStage === "COMPLETE"} onClick={renderVideo} className="mt-5 w-full rounded-lg bg-violet-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50"><Video className="mr-1 inline h-4 w-4" />Render bằng Studio runtime</button></div></div>}</section>}

        {area === "export" && <section className="grid gap-6 lg:grid-cols-[380px_1fr]"><div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h1 className="text-xl font-bold">Xuất đề và tài liệu</h1><p className="mt-2 text-sm text-slate-600">Dùng QB-2D. Chế độ học sinh luôn chặn đáp án và lời giải.</p><FormSelect label="Đối tượng" value={exportAudience} onChange={(value) => { setExportAudience(value as ExportAudience); if (value === "STUDENT") { setIncludeAnswers(false); setIncludeSolutions(false); } }} options={[["STUDENT", "Học sinh"], ["TEACHER", "Giáo viên"]]} /><fieldset className="mt-4"><legend className="text-xs font-semibold">Định dạng</legend><div className="mt-2 grid grid-cols-2 gap-2">{(["JSON", "LATEX", "DOCX", "PDF"] as ExportFormat[]).map((format) => <label key={format} className="flex items-center gap-2 rounded-lg border border-slate-200 p-2 text-sm"><input type="checkbox" checked={exportFormats.includes(format)} onChange={() => setExportFormats((current) => current.includes(format) ? current.filter((item) => item !== format) : [...current, format])} />{format}</label>)}</div></fieldset><label className="mt-4 flex items-center gap-2 text-sm"><input type="checkbox" disabled={exportAudience === "STUDENT"} checked={includeAnswers} onChange={(e) => setIncludeAnswers(e.target.checked)} />Kèm đáp án</label><label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" disabled={exportAudience === "STUDENT"} checked={includeSolutions} onChange={(e) => setIncludeSolutions(e.target.checked)} />Kèm lời giải</label>{exportAudience === "STUDENT" && <p className="mt-2 text-xs text-amber-700">Đáp án, lời giải và metadata giáo viên bị khóa trong bản học sinh.</p>}<button disabled={!assessment || !exportFormats.length || busy !== null} onClick={runExport} className="mt-5 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40">Tạo artifact thực tế</button></div><div>{!assessment ? <Empty title="Chưa có Assessment để xuất" action="Tạo đề" onAction={() => navigate("assessment")} /> : !exportResult ? <Empty title="Chưa có artifact xuất bản" action="Chọn định dạng và xuất" onAction={runExport} /> : <div className="rounded-xl border border-emerald-200 bg-white p-5 shadow-sm"><StatusBadge status="READY" /><h2 className="mt-2 text-lg font-bold">Artifact đã tạo</h2><p className="mt-1 text-xs text-slate-500">{exportResult.audience} · {exportResult.questionIds.length} Question ID</p><div className="mt-4 space-y-3">{exportResult.artifacts.map((artifact) => <div key={artifact.format} className="rounded-lg border border-slate-200 p-3"><div className="flex items-center justify-between"><strong>{artifact.format}</strong><span className="text-xs text-slate-500">{artifact.bytes} bytes</span></div><p className="mt-1 break-all font-mono text-xs text-slate-500">{artifact.path}</p><span className="mt-2 inline-block text-xs font-semibold text-emerald-700">Đã xác minh tồn tại · SHA-256 {artifact.sha256.slice(0, 12)}…</span></div>)}</div></div>}</div></section>}
      </main>
      <footer className="border-t border-slate-200 bg-white px-4 py-3 text-center text-xs text-slate-500">Teacher Workflow · Trạng thái: {workflowState} · Dữ liệu nghiệp vụ đi qua các service authoritative</footer>
    </div>
  );
}

function Empty({ title, action, onAction }: { title: string; action: string; onAction: () => void }) {
  return <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center"><Library className="mx-auto h-8 w-8 text-slate-400" /><strong className="mt-3 block">{title}</strong><button onClick={onAction} className="mt-3 inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold hover:border-blue-400 hover:text-blue-600"><RefreshCw className="h-3.5 w-3.5" />{action}</button></div>;
}

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) {
  return <label className="text-xs font-semibold text-slate-700">{label}<select value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"><option value="">Tất cả</option>{options.map(([key, text]) => <option key={key} value={key}>{text}</option>)}</select></label>;
}

function FormSelect(props: { label: string; value: string; onChange: (value: string) => void; options: string[][] }) {
  return <div className="mt-4"><Filter {...props} /></div>;
}
