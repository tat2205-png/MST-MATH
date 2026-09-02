import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const TIMEOUT_MS = 60_000;
if (process.argv[2] === '--version') { process.stdout.write('pimath-libreoffice-bridge-v1'); process.exit(0); }
const MAX_INPUT_BYTES = 100 * 1024 * 1024;

function executable() {
  const candidates = [
    process.env.PIMATH_SOFFICE_EXECUTABLE,
    'C:/Program Files/LibreOffice/program/soffice.exe',
    'C:/Program Files (x86)/LibreOffice/program/soffice.exe',
    'soffice.exe',
  ].filter(Boolean);
  return candidates.find((candidate) => candidate === 'soffice.exe' || existsSync(candidate));
}

function fail(message, issues = [message]) {
  return { payload: null, confidence: 0, issues };
}

async function main(request) {
  const source = request?.sourceDocument;
  const sourceHash = request?.sourceHash;
  if (typeof source !== 'string' || extname(source).toLowerCase() !== '.doc') return fail('sourceDocument must be an existing .doc file');
  const sourcePath = resolve(source);
  if (!existsSync(sourcePath) || !statSync(sourcePath).isFile()) return fail('sourceDocument does not exist');
  if (statSync(sourcePath).size > MAX_INPUT_BYTES) return fail('sourceDocument exceeds size limit');
  if (typeof sourceHash !== 'string' || !/^[a-f0-9]{64}$/i.test(sourceHash)) return fail('sourceHash must be a SHA-256 hex digest');
  const actualHash = createHash('sha256').update(await import('node:fs/promises').then(({ readFile }) => readFile(sourcePath))).digest('hex');
  if (actualHash.toLowerCase() !== sourceHash.toLowerCase()) return fail('sourceHash does not match sourceDocument');
  const soffice = executable();
  if (!soffice) return fail('LibreOffice soffice executable was not found');

  const outputDir = mkdtempSync(join(tmpdir(), 'pimath-docx-'));
  try {
    const args = ['--headless', '--convert-to', 'docx', '--outdir', outputDir, sourcePath];
    const child = spawn(soffice, args, { shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    const timer = setTimeout(() => child.kill(), TIMEOUT_MS);
    const [result] = await once(child, 'close');
    clearTimeout(timer);
    const convertedDocument = join(outputDir, `${basename(sourcePath, extname(sourcePath))}.docx`);
    if (result !== 0 || !existsSync(convertedDocument)) return fail(`LibreOffice conversion failed (exit ${result})`, [stderr.trim() || stdout.trim() || 'LibreOffice conversion failed']);
    return { payload: { convertedDocument, transformation: 'DOC_TO_DOCX_VIA_LIBREOFFICE', sourceHash }, confidence: 1, issues: [] };
  } catch (error) {
    return fail(error instanceof Error ? error.message : String(error));
  }
}

let input = process.argv[2] ?? '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', async () => {
  let result;
  try { result = await main(JSON.parse(input)); } catch (error) { result = fail(error instanceof Error ? error.message : String(error)); }
  process.stdout.write(JSON.stringify(result));
  process.exitCode = result.confidence === 1 ? 0 : 1;
});
if (process.argv[2]) process.stdin.emit('end');
