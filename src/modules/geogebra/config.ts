/** Official GeoGebra ES-module entry point for the 3D applet. */
import { resolveConsumerProfile } from "../../config/mstMathBrandRoot.js";

export const MST_MATH_GEOGEBRA_OUTPUT_PROFILE = resolveConsumerProfile("GEOGEBRA");
/** @deprecated Compatibility alias for pre-MST-MATH callers. */
export const PIMATH_GEOGEBRA_OUTPUT_PROFILE = MST_MATH_GEOGEBRA_OUTPUT_PROFILE;

export const GEOGEBRA_WEB3D_MODULE_URL =
  "https://www.geogebra.org/apps/latest/web3d/web3d.nocache.mjs";
