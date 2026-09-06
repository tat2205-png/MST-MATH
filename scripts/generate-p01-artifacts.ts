import { writeP01OutputBundle } from "../src/modules/learning-material/index.js";
import { bundle } from "../tests/test-p01-learning-material-v1.ts";

const outputDirectory = process.argv[2];
if (!outputDirectory) throw new Error("Usage: generate-p01-artifacts.ts <output-directory>");
const paths = writeP01OutputBundle(bundle, outputDirectory, "mst-math-p01-synthetic-fixture");
console.log(JSON.stringify({ fixture: "SYNTHETIC_CONTRACT_FIXTURE_ONLY", paths }, null, 2));
