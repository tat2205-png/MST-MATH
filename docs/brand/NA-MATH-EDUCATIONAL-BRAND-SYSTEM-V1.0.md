# NA-MATH EDUCATIONAL BRAND SYSTEM V1.0

This is the single global brand root for the entire PiMath ecosystem. PiMath is the product, Math AI Studio is an application/workspace, and NA-MATH is the educational standards and publishing layer. This artifact governs by reference; it does not copy or replace locked child standards.

## One brand — many output profiles

The root is locked, canonical, approved, global, and the single source of truth. Output profiles inherit it and may define only output-specific semantic structure and renderer adapter behavior. They may not redefine fonts, colors, spacing philosophy, icons, components, naming, mathematics, or geometry.

The independent version axes remain intact: V2.6 system, V1.3 layout, V1.0 typography/textbook/video standards, V1.2 student workspace, and other child versions are not renamed or collapsed.

## Resolution and safety

Production resolution is `src/config/naMathBrandRoot.ts`. Missing authoritative references fail closed with `AUTHORITATIVE_BRAND_TOKEN_UNRESOLVED`; legacy and heuristic fallback cannot become canonical. The chain is semantic meaning → canonical child reference → output profile → module adapter → renderer.

## Governance and QA

Locked source artifacts remain read-only. Historical artifacts are retained for provenance and active legacy authorities must be disconnected through adapters. Mathematical truth, geometry topology, document semantics, and student answer isolation are never changed by brand presentation. Brand QA must verify root existence/canonicality, child references, profile validity, no bypass/parallel authority, fail-closed behavior, and consumer traceability.

Video human acceptance remains FAIL/PENDING; this consolidation does not remediate video visuals or authorize Fold development.
