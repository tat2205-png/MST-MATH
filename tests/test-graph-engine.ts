/**
 * Comprehensive 8-Test Suite for Programmatic Graph Engine
 */

import { GraphEngine } from "../src/lib/graphEngine/graphEngine.js";

const testCases = [
  {
    id: "TEST_1_LINEAR",
    name: "Linear Function: y = 2x - 3",
    input: "y = 2x - 3",
    expectedType: "linear",
    validate: (spec: any) => {
      const hasRoot = spec.features.xIntercepts.some((r: any) => Math.abs(r.x - 1.5) < 0.01);
      const hasYInt = spec.features.yIntercept && Math.abs(spec.features.yIntercept.y - (-3)) < 0.01;
      return hasRoot && hasYInt && spec.verification.status === "PASS";
    },
  },
  {
    id: "TEST_2_QUADRATIC",
    name: "Quadratic Equation: 2x^2 - 5x + 2 = 0",
    input: "2x^2 - 5x + 2 = 0",
    expectedType: "quadratic",
    validate: (spec: any) => {
      const hasRoots =
        spec.features.xIntercepts.some((r: any) => Math.abs(r.x - 0.5) < 0.01) &&
        spec.features.xIntercepts.some((r: any) => Math.abs(r.x - 2.0) < 0.01);
      const hasVertex =
        spec.features.vertex &&
        Math.abs(spec.features.vertex.x - 1.25) < 0.01 &&
        Math.abs(spec.features.vertex.y - (-1.125)) < 0.01;
      const hasYInt = spec.features.yIntercept && Math.abs(spec.features.yIntercept.y - 2) < 0.01;
      const openingUp = spec.features.openingDirection === "up";
      return hasRoots && hasVertex && hasYInt && openingUp && spec.verification.status === "PASS";
    },
  },
  {
    id: "TEST_3_CUBIC",
    name: "Cubic Function: y = x^3 - 3x + 1",
    input: "y = x^3 - 3x + 1",
    expectedType: "cubic",
    validate: (spec: any) => {
      const hasExtrema = spec.features.turningPoints.length === 2;
      const hasInflection = spec.features.inflectionPoints.length === 1 && Math.abs(spec.features.inflectionPoints[0].x - 0) < 0.01;
      return hasExtrema && hasInflection && spec.verification.status === "PASS";
    },
  },
  {
    id: "TEST_4_RATIONAL",
    name: "Rational Function: y = (x + 1)/(x - 2)",
    input: "y = (x + 1)/(x - 2)",
    expectedType: "rational",
    validate: (spec: any) => {
      const hasVA = spec.features.verticalAsymptotes.some((a: any) => Math.abs(a.position - 2) < 0.01);
      const hasHA = spec.features.horizontalAsymptotes.some((a: any) => Math.abs(a.position - 1) < 0.01);
      const hasRoot = spec.features.xIntercepts.some((r: any) => Math.abs(r.x - (-1)) < 0.01);
      const branchesSeparated = spec.sampling.branches.length >= 2;
      return hasVA && hasHA && hasRoot && branchesSeparated && spec.verification.status === "PASS";
    },
  },
  {
    id: "TEST_5_RADICAL",
    name: "Radical Function: y = sqrt(x + 2)",
    input: "y = sqrt(x + 2)",
    expectedType: "radical",
    validate: (spec: any) => {
      const hasStart = spec.features.criticalPoints.some((p: any) => Math.abs(p.x - (-2)) < 0.01);
      const validDomain = spec.domain.intervals[0]?.min === -2;
      return hasStart && validDomain && spec.verification.status === "PASS";
    },
  },
  {
    id: "TEST_6_LOGARITHM",
    name: "Logarithmic Function: y = ln(x - 1)",
    input: "y = ln(x - 1)",
    expectedType: "logarithmic",
    validate: (spec: any) => {
      const hasVA = spec.features.verticalAsymptotes.some((a: any) => Math.abs(a.position - 1) < 0.01);
      const hasRoot = spec.features.xIntercepts.some((r: any) => Math.abs(r.x - 2) < 0.01);
      const validDomain = spec.domain.intervals[0]?.min === 1;
      return hasVA && hasRoot && validDomain && spec.verification.status === "PASS";
    },
  },
  {
    id: "TEST_7_TRIGONOMETRIC",
    name: "Trigonometric Function: y = sin(x)",
    input: "y = sin(x)",
    expectedType: "trigonometric",
    validate: (spec: any) => {
      const hasYInt = spec.features.yIntercept && Math.abs(spec.features.yIntercept.y - 0) < 0.01;
      const validSampling = spec.sampling.totalPoints > 50;
      return hasYInt && validSampling && spec.verification.status === "PASS";
    },
  },
  {
    id: "TEST_8_ABSOLUTE_VALUE",
    name: "Absolute Value Function: y = |x - 1|",
    input: "y = |x - 1|",
    expectedType: "absolute_value",
    validate: (spec: any) => {
      const hasVertex = spec.features.vertex && Math.abs(spec.features.vertex.x - 1) < 0.01;
      const hasYInt = spec.features.yIntercept && Math.abs(spec.features.yIntercept.y - 1) < 0.01;
      return hasVertex && hasYInt && spec.verification.status === "PASS";
    },
  },
];

console.log("==================================================");
console.log("RUNNING PROGRAMMATIC GRAPH ENGINE 8-TEST SUITE");
console.log("==================================================");

let passedCount = 0;

for (const tc of testCases) {
  const spec = GraphEngine.generateGraphSpec(tc.input);
  const typeMatches = spec.graphType === tc.expectedType;
  const validationPassed = tc.validate(spec);

  if (typeMatches && validationPassed) {
    passedCount++;
    console.log(`✅ [PASS] ${tc.name}`);
    console.log(`   - Type: ${spec.graphType}`);
    console.log(`   - Domain: ${spec.domain.rawText}`);
    console.log(`   - Verification: ${spec.verification.status}`);
    console.log(`   - Branches: ${spec.sampling.branches.length} (${spec.sampling.totalPoints} points)`);
  } else {
    console.error(`❌ [FAIL] ${tc.name}`);
    console.error(`   - Expected Type: ${tc.expectedType}, Actual: ${spec.graphType}`);
    console.error(`   - Verification: ${spec.verification.status}`);
    console.error(`   - Error:`, spec.error);
  }
}

console.log("==================================================");
console.log(`TOTAL PASSED: ${passedCount} / ${testCases.length}`);
console.log("==================================================");

if (passedCount === testCases.length) {
  console.log("🎉 ALL 8 GRAPH TESTS PASSED WITH 100% MATHEMATICAL PRECISION!");
  process.exit(0);
} else {
  console.error("Some tests failed.");
  process.exit(1);
}
