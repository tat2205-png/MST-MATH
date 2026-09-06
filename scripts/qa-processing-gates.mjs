
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const ROOT = "/Users/mac/Projects/mst-math-input-p01-qa-v1";
const REPORT_DIR = path.join(ROOT, "reports", "mst-processing-gates-v1");
const JSON_REPORT = path.join(REPORT_DIR, "processing-gates-report.json");
const MD_REPORT = path.join(REPORT_DIR, "processing-gates-report.md");

fs.mkdirSync(REPORT_DIR, { recursive: true });

const pkg = JSON.parse(
  fs.readFileSync(path.join(ROOT, "package.json"), "utf8")
);

const results = [];

function add(gate, status, message, details = {}) {
  const item = {
    gate,
    status,
    message,
    details,
    timestamp: new Date().toISOString()
  };

  results.push(item);
  console.log("[" + status + "] " + gate + " - " + message);
}

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (
      entry.name === "node_modules" ||
      entry.name === ".git" ||
      entry.name === "dist" ||
      entry.name === "coverage"
    ) {
      continue;
    }

    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(full, files);
    } else {
      files.push(full);
    }
  }

  return files;
}

function runScript(name) {
  if (!pkg.scripts || !pkg.scripts[name]) {
    return {
      name,
      status: "BLOCKED",
      exitCode: null,
      output: "npm script not found"
    };
  }

  try {
    const output = execFileSync(
      "npm",
      ["run", name],
      {
        cwd: ROOT,
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"]
      }
    );

    return {
      name,
      status: "PASS",
      exitCode: 0,
      output: output.slice(-10000)
    };
  } catch (error) {
    return {
      name,
      status: "FAIL",
      exitCode: error.status || 1,
      output:
        String(error.stdout || "") +
        String(error.stderr || "")
    };
  }
}

function runGroup(names) {
  const output = [];

  for (const name of names) {
    const result = runScript(name);
    output.push(result);

    if (result.status !== "PASS") {
      return {
        status: result.status,
        output
      };
    }
  }

  return {
    status: "PASS",
    output
  };
}

/* GATE 1: CONTRACT */
{
  const files = walk(ROOT);
  const matches = [];

  for (const file of files) {
    const lower = file.toLowerCase();

    if (
      lower.includes("documentir") ||
      lower.includes("questionir") ||
      lower.includes("questionobject") ||
      lower.includes("provenance")
    ) {
      matches.push(file);
      continue;
    }

    if (!/\\.(ts|tsx|js|mjs|json|md)$/.test(file)) {
      continue;
    }

    try {
      const text = fs.readFileSync(file, "utf8");

      if (
        /DocumentIR|QuestionIR|QuestionObject|provenance/i.test(text)
      ) {
        matches.push(file);
      }
    } catch {
      // Ignore unreadable files.
    }
  }

  if (matches.length === 0) {
    add(
      "PROCESS-GATE-1-CONTRACT",
      "BLOCKED",
      "Không tìm thấy DocumentIR, QuestionIR, QuestionObject hoặc provenance.",
      { matches }
    );
  } else {
    add(
      "PROCESS-GATE-1-CONTRACT",
      "PASS",
      "Đã phát hiện authority xử lí dữ liệu hiện hữu.",
      { matches: matches.slice(0, 100) }
    );
  }
}

/* GATE 2: NORMALIZATION */
{
  const result = runGroup([
    "qa:question-bank",
    "qa:question-bank:persistence"
  ]);

  add(
    "PROCESS-GATE-2-NORMALIZATION",
    result.status,
    result.status === "PASS"
      ? "Question Bank normalization và persistence đã PASS."
      : "Normalization hoặc persistence chưa PASS.",
    result
  );
}

/* GATE 3: SEMANTIC QA */
{
  const result = runGroup([
    "qa:math",
    "qa:question-bank:relations",
    "qa:export"
  ]);

  add(
    "PROCESS-GATE-3-SEMANTIC-QA",
    result.status,
    result.status === "PASS"
      ? "Math, relations và export semantic QA đã PASS."
      : "Semantic QA chưa PASS.",
    result
  );
}

/* GATE 4: HUMAN AUTHORITY */
{
  if (process.env.MST_MATH_HUMAN_AUTHORITY === "APPROVED") {
    add(
      "PROCESS-GATE-4-HUMAN-AUTHORITY",
      "PASS",
      "Human authority đã được xác nhận."
    );
  } else {
    add(
      "PROCESS-GATE-4-HUMAN-AUTHORITY",
      "NEEDS_HUMAN_REVIEW",
      "Chưa có phê duyệt human authority; không promote dữ liệu thành canonical.",
      {
        required:
          "MST_MATH_HUMAN_AUTHORITY=APPROVED npm run qa:processing-gates"
      }
    );
  }
}

/* GATE 5: ROUND-TRIP OUTPUT */
{
  const result = runGroup([
    "qa:regression",
    "qa:export"
  ]);

  add(
    "PROCESS-GATE-5-ROUND-TRIP-OUTPUT",
    result.status,
    result.status === "PASS"
      ? "Regression và export round-trip đã PASS."
      : "Round-trip output chưa PASS.",
    result
  );
}

const overall =
  results.some((x) => x.status === "FAIL")
    ? "FAIL"
    : results.some((x) => x.status === "BLOCKED")
      ? "BLOCKED"
      : results.some((x) => x.status === "NEEDS_HUMAN_REVIEW")
        ? "NEEDS_HUMAN_REVIEW"
        : "PASS";

const report = {
  reportId: "MST-MATH-PROCESSING-GATES-V1",
  repository: ROOT,
  completedAt: new Date().toISOString(),
  overall,
  results
};

fs.writeFileSync(
  JSON_REPORT,
  JSON.stringify(report, null, 2) + "\\n"
);

const markdown = [
  "# MST-MATH Processing Gates V1",
  "",
  "Repository: " + ROOT,
  "",
  "Overall: **" + overall + "**",
  "",
  "| Gate | Status | Message |",
  "|---|---|---|"
];

for (const item of results) {
  markdown.push(
    "| " +
      item.gate +
      " | " +
      item.status +
      " | " +
      item.message.replaceAll("|", "\\\\|") +
      " |"
  );
}

markdown.push("");
markdown.push("JSON report: " + JSON_REPORT);
markdown.push("");

fs.writeFileSync(
  MD_REPORT,
  markdown.join("\\n") + "\\n"
);

console.log("");
console.log("JSON_REPORT=" + JSON_REPORT);
console.log("MD_REPORT=" + MD_REPORT);
console.log("OVERALL=" + overall);

if (overall !== "PASS") {
  process.exitCode = 1;
}
