export type DesktopInputType = "docx" | "doc" | "pdf" | "png" | "jpg" | "jpeg";
export type DesktopJobStatus = "QUEUED" | "ANALYZING" | "PROCESSING" | "REVIEW" | "EXPORTING" | "COMPLETED" | "FAILED";
export interface DesktopConfiguration { schemaVersion: 1; outputRoot?: string; updatedAt: string; }
export interface DesktopJob { jobId: string; sourcePath: string; sourceHash: string; inputType: DesktopInputType; outputProfile: string; status: DesktopJobStatus; createdAt: string; startedAt?: string; completedAt?: string; localWorkspacePath: string; resultPaths: string[]; publishedPaths: string[]; issues: string[]; reviewRequired: boolean; }
