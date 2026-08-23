export interface PorcelainEntry {
  code: string;
  path: string;
  originalPath?: string;
}

export function parseGitPorcelainLine(line: string): PorcelainEntry | null {
  if (line.length < 3 || line[2] !== " ") return null;
  const code = line.slice(0, 2);
  const payload = line.slice(3);
  if (code.includes("R") && payload.includes(" -> ")) {
    const [originalPath, path] = payload.split(" -> ", 2);
    return { code, path, originalPath };
  }
  return { code, path: payload };
}

export function parseGitPorcelain(output: string): PorcelainEntry[] {
  return output.split(/\r?\n/).filter(Boolean).flatMap((line) => {
    const entry = parseGitPorcelainLine(line);
    return entry ? [entry] : [];
  });
}