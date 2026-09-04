import assert from "node:assert/strict";
import { MST_MATH_DNA, resolveAccessibilityAuthority, resolveVoiceNarrationAuthority } from "../src/config/mstMathBrandRoot.ts";

const accessibility = resolveAccessibilityAuthority();
const voice = resolveVoiceNarrationAuthority();
assert.equal(MST_MATH_DNA.references.accessibility, "MST_MATH_ACCESSIBILITY_CANONICAL_V1.0");
assert.equal(MST_MATH_DNA.references.voice, "MST_MATH_VOICE_NARRATION_CANONICAL_V1.0");
assert.equal(accessibility.authority.role, "ACCESSIBILITY_AUTHORITY");
assert.equal(voice.authority.role, "VOICE_NARRATION_AUTHORITY");
assert.equal(accessibility.authority.overrideCoreDna, false);
assert.equal(voice.authority.overrideCoreDna, false);
assert.equal(accessibility.provenance.binding, "CANONICAL_BINDING");
assert.equal(voice.provenance.binding, "CANONICAL_BINDING");
assert.match(voice.authority.contract.ttsAdapterPolicy, /TTS_PROVIDER != VOICE_AUTHORITY/);
assert.equal(voice.authority.consumes.videoVisual, "MST_MATH_VIDEO_VISUAL_CANONICAL_V2.0");
console.log("MST_MATH_ACCESSIBILITY_VOICE_QA=PASS");
