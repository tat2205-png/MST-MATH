# MST-MATH Versioned Successor Governance V1.0

Status: **LOCKED / CANONICAL / APPROVED / HUMAN-APPROVED**  
Product display name: `MST-MATH`  
Governance ID: `MST-MATH-GOV-VERSIONED-SUCCESSOR-V1.0`

## Canonical rule

> LOCKED DOES NOT MEAN UNCHANGEABLE FOREVER.  
> LOCKED MEANS IMMUTABLE IN PLACE.  
> ALL CHANGES REQUIRE A VERSIONED SUCCESSOR.

## Required behavior

1. A `LOCKED / CANONICAL / APPROVED` artifact MUST NOT be edited in place to change its semantics, contract, pipeline, output rules, or normative requirements.
2. Every change MUST be introduced through a new versioned successor artifact.
3. The predecessor MUST remain available for history, reproducibility, compatibility, regression comparison, and migration.
4. A successor starts as `DRAFT` or `PROPOSED` and MUST pass:
   - Impact Analysis
   - Conflict Check
   - Regression Test
   - Human Approval
5. Only after explicit human approval may the successor transition through `APPROVED → CANONICAL → LOCKED`.
6. The predecessor becomes `SUPERSEDED` or `LEGACY / COMPATIBILITY` when appropriate. It is not deleted or overwritten.

## Version classification

- Patch / Errata: wording or non-semantic correction that does not change meaning or contract.
- Minor: additive, backward-compatible capability or rule extension.
- Major: breaking semantic, contract, pipeline, schema, renderer, or output behavior change.

## Brand migration compatibility

During the PiMath → MST-MATH migration, existing canonical machine IDs using `PIMATH-*` MAY remain unchanged when dependencies rely on them. Display naming may use `MST-MATH`. Migration MUST use aliases, compatibility maps, or versioned successors rather than destructive identifier replacement.

## Enforcement

Any task that attempts to mutate a locked artifact in place MUST be rejected with a governance failure and redirected to a versioned successor workflow.
