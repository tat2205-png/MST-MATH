import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.join(process.cwd(), "src", "App.tsx"), "utf8");
const verifyRequest = source.indexOf('fetch("/api/pipeline/verify"');
const verifyResult = source.indexOf("const currentVerification = verifyData.verification");
const visualRequest = source.indexOf('fetch("/api/pipeline/visuals"');
const videoRequest = source.indexOf('fetch("/api/pipeline/video"');

if (verifyRequest < 0 || verifyResult < 0 || visualRequest < 0 || videoRequest < 0) {
  throw new Error("Production UI pipeline stages are missing.");
}
if (!(verifyRequest < verifyResult && verifyResult < visualRequest && visualRequest < videoRequest)) {
  throw new Error("Production UI must verify math before visual and video planning.");
}

const verifiedDownstreamPayloads = source.match(/verification:\s*currentVerification/g) || [];
if (verifiedDownstreamPayloads.length < 2) {
  throw new Error("Visual and video planning must both receive the verified artifact.");
}
if (!source.includes("!verifyRes.ok") || !source.includes("!visualRes.ok") || !source.includes("!videoRes.ok")) {
  throw new Error("Production UI must fail closed on unsuccessful pipeline responses.");
}

console.log("PRODUCTION_UI_AUTHORITY_CHAIN: PASS");
