/**
 * Viewport Engine
 * Automatically calculates optimal Cartesian bounding box containing all mathematical features.
 */

import { GraphFeatures, GraphViewport } from "../../types/graphSchema.js";

export class ViewportEngine {
  public static calculateViewport(features: GraphFeatures, defaultSpan: number = 4): GraphViewport {
    const xPoints: number[] = [-defaultSpan, defaultSpan];
    const yPoints: number[] = [-defaultSpan, defaultSpan];

    // Collect all key feature coordinates
    if (features.yIntercept) {
      yPoints.push(features.yIntercept.y);
    }

    features.xIntercepts.forEach((pt) => {
      xPoints.push(pt.x);
    });

    if (features.vertex) {
      xPoints.push(features.vertex.x);
      yPoints.push(features.vertex.y);
    }

    features.turningPoints.forEach((pt) => {
      xPoints.push(pt.x);
      yPoints.push(pt.x);
    });

    features.inflectionPoints.forEach((pt) => {
      xPoints.push(pt.x);
      yPoints.push(pt.y);
    });

    features.criticalPoints.forEach((pt) => {
      xPoints.push(pt.x);
      yPoints.push(pt.y);
    });

    features.verticalAsymptotes.forEach((asymp) => {
      xPoints.push(asymp.position - 3);
      xPoints.push(asymp.position + 3);
    });

    features.horizontalAsymptotes.forEach((asymp) => {
      yPoints.push(asymp.position);
    });

    // Calculate raw min/max
    const rawXMin = Math.min(...xPoints);
    const rawXMax = Math.max(...xPoints);
    const rawYMin = Math.min(...yPoints);
    const rawYMax = Math.max(...yPoints);

    // Add padding
    const xPadding = Math.max(1.5, (rawXMax - rawXMin) * 0.25);
    const yPadding = Math.max(1.5, (rawYMax - rawYMin) * 0.25);

    let xMin = Math.floor(rawXMin - xPadding);
    let xMax = Math.ceil(rawXMax + xPadding);
    let yMin = Math.floor(rawYMin - yPadding);
    let yMax = Math.ceil(rawYMax + yPadding);

    // Limit extreme viewport sizes
    xMin = Math.max(-20, Math.min(-2, xMin));
    xMax = Math.min(20, Math.max(2, xMax));
    yMin = Math.max(-25, Math.min(-2, yMin));
    yMax = Math.min(25, Math.max(2, yMax));

    // Choose appropriate tick steps
    const xRange = xMax - xMin;
    const yRange = yMax - yMin;

    const xStep = xRange > 16 ? 2 : 1;
    const yStep = yRange > 16 ? 2 : 1;

    return {
      xMin,
      xMax,
      yMin,
      yMax,
      xStep,
      yStep,
    };
  }
}
