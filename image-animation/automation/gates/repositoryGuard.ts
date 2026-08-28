export type RepositoryGuardStatus = "PASS" | "FAIL";

export interface RepositoryGuardSpec {
  allowedPaths: string[];
  forbiddenPaths: string[];
}

export interface RepositoryGuardResult {
  status: RepositoryGuardStatus;
  checkedFiles: string[];
  violations: string[];
}

function normalizePath(filePath: string): string {
  return filePath.replaceAll("\\", "/").replace(/^\.\//, "");
}

function matchesPath(filePath: string, pattern: string): boolean {
  const normalizedFile = normalizePath(filePath);
  const normalizedPattern = normalizePath(pattern);
  if (normalizedPattern.endsWith("/**")) {
    const prefix = normalizedPattern.slice(0, -3).replace(/\/$/, "");
    return normalizedFile === prefix || normalizedFile.startsWith(`${prefix}/`);
  }
  return normalizedFile === normalizedPattern;
}

export function evaluateRepositoryGuard(
  changedFiles: readonly string[],
  spec: RepositoryGuardSpec,
): RepositoryGuardResult {
  const checkedFiles = changedFiles.map(normalizePath);
  const violations = checkedFiles.flatMap((filePath) => {
    if (spec.forbiddenPaths.some((pattern) => matchesPath(filePath, pattern))) {
      return [`${filePath}: forbidden path`];
    }
    if (!spec.allowedPaths.some((pattern) => matchesPath(filePath, pattern))) {
      return [`${filePath}: outside allowed paths`];
    }
    return [];
  });

  return {
    status: violations.length === 0 ? "PASS" : "FAIL",
    checkedFiles,
    violations,
  };
}