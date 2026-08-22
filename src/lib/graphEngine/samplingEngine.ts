/**
 * Sampling Engine
 * Samples mathematical functions across valid domain intervals and vertical asymptotes.
 * Segregates branches to guarantee zero cross-asymptote drawing.
 */

import { GraphBranch, GraphDomain, GraphFeatures, GraphPoint, GraphViewport } from "../../types/graphSchema.js";
import { MathEvaluator } from "./evaluator.js";

export class SamplingEngine {
  public static sampleFunction(
    evaluator: MathEvaluator,
    domain: GraphDomain,
    features: GraphFeatures,
    viewport: GraphViewport,
    samplesPerBranch: number = 300
  ): { branches: GraphBranch[]; totalPoints: number } {
    const branches: GraphBranch[] = [];

    // 1. Identify all discontinuity points / vertical asymptotes inside viewport
    const verticalSingularities = features.verticalAsymptotes
      .map((a) => a.position)
      .concat(features.discontinuities)
      .filter((pos) => pos > viewport.xMin && pos < viewport.xMax)
      .sort((a, b) => a - b);

    // 2. Identify domain boundaries inside viewport
    let activeIntervals: { start: number; end: number }[] = [];

    if (domain.type === "all_reals") {
      activeIntervals.push({ start: viewport.xMin, end: viewport.xMax });
    } else {
      // Intersect domain intervals with viewport
      for (const interval of domain.intervals) {
        const iStart = interval.min === "-inf" ? viewport.xMin : Math.max(viewport.xMin, interval.min);
        const iEnd = interval.max === "inf" ? viewport.xMax : Math.min(viewport.xMax, interval.max);

        if (iStart < iEnd) {
          activeIntervals.push({
            start: interval.minInclusive ? iStart : iStart + 0.005,
            end: interval.maxInclusive ? iEnd : iEnd - 0.005,
          });
        }
      }
    }

    if (activeIntervals.length === 0) {
      activeIntervals.push({ start: viewport.xMin, end: viewport.xMax });
    }

    // 3. Subdivide intervals by vertical singularities (e.g. rational or log asymptotes)
    const subSegments: { start: number; end: number }[] = [];

    for (const interval of activeIntervals) {
      let currentStart = interval.start;

      const insideSingularities = verticalSingularities.filter(
        (s) => s > interval.start && s < interval.end
      );

      for (const sing of insideSingularities) {
        if (sing - 0.02 > currentStart) {
          subSegments.push({ start: currentStart, end: sing - 0.02 });
        }
        currentStart = sing + 0.02;
      }

      if (currentStart < interval.end) {
        subSegments.push({ start: currentStart, end: interval.end });
      }
    }

    // 4. Sample points within each subsegment
    let branchCounter = 0;
    let totalPointCount = 0;

    const yClampMin = viewport.yMin - (viewport.yMax - viewport.yMin) * 0.8;
    const yClampMax = viewport.yMax + (viewport.yMax - viewport.yMin) * 0.8;

    for (const segment of subSegments) {
      const points: GraphPoint[] = [];
      const step = (segment.end - segment.start) / samplesPerBranch;

      for (let i = 0; i <= samplesPerBranch; i++) {
        const x = segment.start + i * step;
        const y = evaluator.evaluateSafe(x);

        if (y !== null && !isNaN(y) && isFinite(y)) {
          // Check if y is within sensible drawing boundaries
          if (y >= yClampMin && y <= yClampMax) {
            points.push({
              x: Math.round(x * 10000) / 10000,
              y: Math.round(y * 10000) / 10000,
            });
          }
        }
      }

      if (points.length >= 2) {
        branches.push({
          branchId: branchCounter++,
          points,
          domainMin: segment.start,
          domainMax: segment.end,
        });
        totalPointCount += points.length;
      }
    }

    return {
      branches,
      totalPoints: totalPointCount,
    };
  }
}
