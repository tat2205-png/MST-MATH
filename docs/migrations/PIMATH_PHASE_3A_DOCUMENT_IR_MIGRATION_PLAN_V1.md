# PiMath Phase 3A — Document IR Ownership Migration Plan V1

Status: IMPLEMENTATION CANDIDATE
Mode: BOUNDED / COMPATIBILITY-FIRST / NON-DESTRUCTIVE

## Goal

Transfer canonical ownership of generic document interchange types from Question Bank
to Document Engine without breaking existing Question Bank public APIs.

## Current legacy owner

src/modules/question-bank/types.ts

## Target canonical owner

src/modules/document-engine/document-ir.ts

## Canonical shared type group

- ParseStatus
- MathNode
- ContentBlock
- AssetSemanticRole
- VmlLayout
- AssetDerivation
- FigureRecord
- DocumentBlock
- DocumentIR

## Compatibility rule

src/modules/question-bank/types.ts must continue to export all migrated type names.

Existing Question Bank consumers must remain source-compatible during Phase 3A.

## Migration order

1. Add canonical document-ir.ts.
2. Export it from document-engine/index.ts.
3. Replace local definitions in question-bank/types.ts with compatibility import/re-export.
4. Migrate document-ingest to canonical Document IR.
5. Migrate document-export to canonical Document IR.
6. Keep Question Bank internal imports unchanged initially.
7. Run TypeScript/build and targeted regressions.
8. Migrate Question Bank internal imports only in a later bounded step if useful.
9. Remove compatibility only under a separately authorized future migration.

## Forbidden

- Bulk source moves.
- Breaking Question Bank exports.
- Silent schema changes.
- Changes to field names or unions.
- Mutation of locked standards.
- Changes to Foundation V1 or Phase 2 architecture artifacts.
- Declaring migration DONE before regression PASS.
