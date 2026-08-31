# CANONICAL LAYOUT QA GATES

Use this checklist as a deterministic acceptance contract.

## VIDEO — QSG profile

- [ ] Canonical profile resolves to `NA_MATH_VIDEO_QSG_V1`.
- [ ] Question is in the top region.
- [ ] Solution is in the lower-left region.
- [ ] Geometry/graph/animation is in the lower-right region.
- [ ] Question is above both lower regions.
- [ ] Solution is left of geometry.
- [ ] No region overlap.
- [ ] No text/text collision.
- [ ] No text/figure collision.
- [ ] No text/axis collision.
- [ ] No text/table-border collision.
- [ ] All visible content remains within safe bounds.
- [ ] No font shrinking below the locked readable minimum to hide overflow.
- [ ] Geometry is provenance-driven.
- [ ] No point/edge/label/relationship is invented for visual balance.
- [ ] Source mathematical meaning is unchanged.
- [ ] No silent generic/adaptive-template fallback.

Any unchecked mandatory item => `FAIL`.

## DOCUMENT

- [ ] A4.
- [ ] Layout V1.3 retained.
- [ ] Textbook Style V1.0 retained.
- [ ] Student Workspace V1.2 retained where applicable.
- [ ] V2.6 is treated as system baseline, not as a replacement layout version.
- [ ] Typography V1.0 changes font-role resolution only.
- [ ] Content-type color identity retained.
- [ ] Answer key placement rules retained.
- [ ] No collision/overflow hidden by unsafe font shrinking.
- [ ] Deterministic figures and source fidelity retained.

## GOVERNANCE

- [ ] `MASTER > APPROVED ARTIFACT > ORCHESTRATOR > MODULE TASK`.
- [ ] `AUTOMATE EXECUTION, NOT AUTHORITY`.
- [ ] Unverified historical versions remain `UNVERIFIED/UNKNOWN/NEEDS_REVALIDATION`.
