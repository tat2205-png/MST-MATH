import fs from "fs/promises";
import path from "path";

export interface SkillMetadata {
  name: string;
  version?: string;
  description?: string;
}

export interface LoadedSkill {
  metadata: SkillMetadata;
  coreInstruction: string;
  references: Record<string, string>;
  prompts: Record<string, string>;
}

export type SkillReferenceName =
  | "STYLE_REFERENCE_FACEBOOK_V1"
  | "CAMERA_DIRECTOR"
  | "VISUAL_SYSTEM"
  | "MATH_GEOMETRY_QA"
  | "NARRATION_SYNC"
  | "WORKFLOW";

// In-memory cache for skill data
interface SkillCacheEntry {
  coreSkill?: LoadedSkill;
  modules: Map<string, string>;
}

const skillCache = new Map<string, SkillCacheEntry>();

function getSkillsDirectory(): string {
  return path.resolve(process.cwd(), "server", "skills");
}

function validateSkillName(skillName: string): string {
  if (!skillName || typeof skillName !== "string") {
    throw new Error(`Invalid skill name: "${skillName}"`);
  }

  // Reject paths containing directory traversal or disallowed characters
  if (skillName.includes("..") || skillName.includes("/") || skillName.includes("\\")) {
    throw new Error(`Security Violation: Path traversal detected in skill name: "${skillName}"`);
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(skillName)) {
    throw new Error(`Invalid characters in skill name: "${skillName}"`);
  }

  const baseDir = getSkillsDirectory();
  const targetDir = path.resolve(baseDir, skillName);
  
  if (!targetDir.startsWith(baseDir)) {
    throw new Error(`Security Violation: Path traversal detected in skill target: "${skillName}"`);
  }

  return targetDir;
}

function validateModuleName(moduleName: string): string {
  if (!moduleName || typeof moduleName !== "string") {
    throw new Error(`Invalid module name: "${moduleName}"`);
  }

  if (moduleName.includes("..") || moduleName.includes("/") || moduleName.includes("\\")) {
    throw new Error(`Security Violation: Path traversal detected in module name: "${moduleName}"`);
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(moduleName)) {
    throw new Error(`Invalid characters in module name: "${moduleName}"`);
  }

  return moduleName;
}

/**
 * Minimalist, safe YAML frontmatter parser for simple key-value and multiline strings
 */
export function parseYamlFrontmatter(content: string): { metadata: SkillMetadata; body: string } {
  // Normalize Windows CRLF / legacy CR before parsing. Without this, lines such as
  // `name: value\r` fail the anchored metadata regex on Windows-authored skill files.
  const trimmed = content.trimStart().replace(/\r\n?/g, "\n");
  if (!trimmed.startsWith("---")) {
    return {
      metadata: { name: "" },
      body: content,
    };
  }

  const endIndex = trimmed.indexOf("\n---", 3);
  if (endIndex === -1) {
    return {
      metadata: { name: "" },
      body: content,
    };
  }

  const frontmatterRaw = trimmed.substring(3, endIndex).trim();
  const body = trimmed.substring(endIndex + 4).trim();

  const lines = frontmatterRaw.split("\n");
  const metadata: Record<string, string> = {};

  let currentKey: string | null = null;
  let multilineMode: "folded" | "literal" | null = null;
  let multilineLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (currentKey && multilineMode) {
      if (/^\s+/.test(line)) {
        multilineLines.push(line.trim());
        continue;
      } else {
        // End of multiline
        metadata[currentKey] = multilineMode === "folded" 
          ? multilineLines.join(" ").trim()
          : multilineLines.join("\n").trim();
        currentKey = null;
        multilineMode = null;
        multilineLines = [];
      }
    }

    const colonMatch = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)$/);
    if (colonMatch) {
      const key = colonMatch[1].trim();
      let value = colonMatch[2].trim();

      if (value === ">" || value === ">-") {
        currentKey = key;
        multilineMode = "folded";
        multilineLines = [];
      } else if (value === "|" || value === "|-") {
        currentKey = key;
        multilineMode = "literal";
        multilineLines = [];
      } else {
        // Strip surrounding single or double quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }
        metadata[key] = value;
      }
    }
  }

  if (currentKey && multilineMode) {
    metadata[currentKey] = multilineMode === "folded"
      ? multilineLines.join(" ").trim()
      : multilineLines.join("\n").trim();
  }

  return {
    metadata: {
      name: metadata.name || "",
      version: metadata.version,
      description: metadata.description,
    },
    body,
  };
}

/**
 * Clear in-memory cache
 */
export function clearSkillCache(): void {
  skillCache.clear();
}

/**
 * Load complete skill core along with all available references and prompts
 */
export async function loadSkillCore(skillName: string): Promise<LoadedSkill> {
  const cached = skillCache.get(skillName);
  if (cached?.coreSkill) {
    return cached.coreSkill;
  }

  const skillDir = validateSkillName(skillName);
  const skillFilePath = path.join(skillDir, "SKILL.md");

  let skillContent: string;
  try {
    skillContent = await fs.readFile(skillFilePath, "utf-8");
  } catch (err: any) {
    throw new Error(`Failed to load skill "${skillName}": SKILL.md not found at ${skillFilePath}. ${err.message}`);
  }

  const { metadata, body: coreInstruction } = parseYamlFrontmatter(skillContent);

  // Read references
  const referencesDir = path.join(skillDir, "references");
  const references: Record<string, string> = {};

  try {
    const refFiles = await fs.readdir(referencesDir);
    for (const file of refFiles) {
      if (file.endsWith(".md")) {
        const moduleKey = path.basename(file, ".md");
        const filePath = path.join(referencesDir, file);
        const content = await fs.readFile(filePath, "utf-8");
        references[moduleKey] = content;
      }
    }
  } catch {
    // References directory may be optional or empty
  }

  // Read prompts
  const promptsDir = path.join(skillDir, "prompts");
  const prompts: Record<string, string> = {};

  try {
    const promptFiles = await fs.readdir(promptsDir);
    for (const file of promptFiles) {
      if (file.endsWith(".md")) {
        const promptKey = path.basename(file, ".md");
        const filePath = path.join(promptsDir, file);
        const content = await fs.readFile(filePath, "utf-8");
        prompts[promptKey] = content;
      }
    }
  } catch {
    // Prompts directory may be optional or empty
  }

  const loaded: LoadedSkill = {
    metadata,
    coreInstruction,
    references,
    prompts,
  };

  if (!skillCache.has(skillName)) {
    skillCache.set(skillName, { modules: new Map() });
  }
  const entry = skillCache.get(skillName)!;
  entry.coreSkill = loaded;
  for (const [key, val] of Object.entries(references)) {
    entry.modules.set(key, val);
  }

  return loaded;
}

/**
 * Load ONLY requested skill modules (references)
 */
export async function loadSkillModules(
  skillName: string,
  moduleNames: SkillReferenceName[]
): Promise<Record<string, string>> {
  const skillDir = validateSkillName(skillName);
  const referencesDir = path.join(skillDir, "references");

  if (!skillCache.has(skillName)) {
    skillCache.set(skillName, { modules: new Map() });
  }
  const entry = skillCache.get(skillName)!;

  const result: Record<string, string> = {};

  for (const mod of moduleNames) {
    const safeModuleName = validateModuleName(mod);
    
    if (entry.modules.has(safeModuleName)) {
      result[safeModuleName] = entry.modules.get(safeModuleName)!;
      continue;
    }

    const modFilePath = path.join(referencesDir, `${safeModuleName}.md`);
    try {
      const content = await fs.readFile(modFilePath, "utf-8");
      entry.modules.set(safeModuleName, content);
      result[safeModuleName] = content;
    } catch (err: any) {
      throw new Error(`Module "${safeModuleName}" not found in skill "${skillName}" at ${modFilePath}. ${err.message}`);
    }
  }

  return result;
}
