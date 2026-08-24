import fs from "node:fs/promises";
import path from "node:path";
import { buildGoldenCubeNet } from "../server/geometry/goldenCube.js";
import { LuaDrawEngine } from "../server/geometry/luadrawEngine.js";

const output = path.resolve(process.cwd(), "local_bridge", "runs", "luadraw_g01_cube_net");
const spec = buildGoldenCubeNet();
const result = await new LuaDrawEngine().render(spec, output);
if (result.status !== "PASS" || !result.pdfPath || !result.svgPath || !result.metadataPath || !result.qaPath) throw new Error(result.error || "LuaDraw smoke failed.");
for (const file of [result.pdfPath, result.svgPath, result.metadataPath, result.qaPath]) if ((await fs.stat(file)).size <= 0) throw new Error(`Empty artifact: ${file}`);
const metadata = JSON.parse(await fs.readFile(result.metadataPath, "utf8"));
if (metadata.sourceFingerprint !== spec.sourceFingerprint || metadata.faces.length !== 6 || metadata.labels.length !== 8 || metadata.dimensions.length !== 3) throw new Error("Geometry metadata was not preserved.");
console.log(JSON.stringify({ LUADRAW_REAL_TASK: "PASS", output, result }, null, 2));
