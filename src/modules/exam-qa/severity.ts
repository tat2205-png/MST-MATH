export const QA_SEVERITIES = ["INFO", "WARNING", "ERROR", "BLOCKER"] as const;
export type QASeverity = (typeof QA_SEVERITIES)[number];

