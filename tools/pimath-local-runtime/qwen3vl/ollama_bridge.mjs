import { readFileSync, statSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
const req = JSON.parse(process.argv[2] ?? '{}');
const fail = (issues) => ({ payload: {}, confidence: 0, issues });
if (typeof req.sourceDocument !== 'string' || !existsSync(req.sourceDocument) || statSync(req.sourceDocument).size > 50 * 1024 * 1024) { console.log(JSON.stringify(fail(['SOURCE_NOT_ALLOWED']))); process.exit(0); }
const bytes = readFileSync(req.sourceDocument); const hash = createHash('sha256').update(bytes).digest('hex');
if (hash !== req.sourceHash) { console.log(JSON.stringify(fail(['SOURCE_HASH_MISMATCH']))); process.exit(0); }
const body = { model: req.model, prompt: req.prompt ?? 'Describe this document for teacher review.', stream: false, ...(req.includeImage ? { images: [bytes.toString('base64')] } : {}) };
const response = await fetch('http://127.0.0.1:11434/api/generate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(req.timeoutMs ?? 120000) });
if (!response.ok) { console.log(JSON.stringify(fail(['OLLAMA_RUNTIME_UNAVAILABLE']))); process.exit(0); }
const result = await response.json(); console.log(JSON.stringify({ payload: { sourceDocument: req.sourceDocument, sourceHash: hash, text: result.response ?? '' }, confidence: 0, issues: ['AI_SEMANTIC_AUTHORITY=NO','TEACHER_REVIEW_REQUIRED_FOR_AMBIGUOUS_AI=YES'], provider: 'ollama-qwen3-vl', providerVersion: req.model }));
