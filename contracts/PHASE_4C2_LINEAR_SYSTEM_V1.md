# PHASE 4C.2 — DETERMINISTIC LINEAR SYSTEM 2×2 V1
Status: AUTHORITATIVE / HUMAN-APPROVED
Policy: fail-closed, exact rational, zero inference

## 1. Supported scope

Only accept a system containing exactly two linear equations in exactly two real variables `x` and `y`.

Each equation is normalized to:

`a*x + b*y = c`

where `a`, `b`, `c` are exact integers or exact rational numbers.

All determinant, solution, equality, and substitution decisions must use exact rational arithmetic. Floating-point arithmetic must not decide mathematical truth.

## 2. Source grammar

The complete source must contain exactly one `;`, producing exactly two non-empty equation segments.

Each equation must contain exactly one `=`.

Do not silently:
- remove empty segments,
- discard extra equations,
- remove an extra equals sign,
- repair malformed source,
- infer a missing variable/equation,
- convert unsupported symbolic expressions into a supported system.

Any such input is `UNSUPPORTED`.

## 3. Unsupported examples — locked expectations

All of the following MUST return `UNSUPPORTED`:

- `x^2+y=2;x-y=0`
- `x+y+z=2;x-y=0`
- `mx+y=2;x-y=0`
- `x+y=2`
- `x+y=2;;x-y=0`
- `x+y==2;x-y=0`

Also unsupported:
- nonlinear terms,
- `xy`,
- radicals,
- trigonometric expressions,
- a third variable,
- symbolic parameters,
- one equation,
- more than two equations,
- non-numeric coefficients,
- malformed syntax.

## 4. Determinant and classification

For normalized equations:

`a1*x + b1*y = c1`
`a2*x + b2*y = c2`

compute exactly:

`D = a1*b2 - a2*b1`

Classification is exactly one of:

- `UNIQUE_SOLUTION`
- `NO_SOLUTION`
- `INFINITE_SOLUTIONS`

## 5. Canonical candidate contract

Candidate data must be read only from:

`solution.verification_data.systemSolution`

Unique solution:

`{ type: "POINT", x: "<exact rational>", y: "<exact rational>" }`

No solution:

`{ type: "NO_SOLUTION" }`

Infinite solutions:

`{ type: "INFINITE_SOLUTIONS" }`

Legacy labels such as `UNIQUE`, `NONE`, and `INFINITE` are not canonical and must never produce `DETERMINISTIC_PASS`.

## 6. Unique-solution verification

For `UNIQUE_SOLUTION`:

- compute exact `x`, `y`,
- compare coordinates by variable identity (`x` and `y`), never by array order,
- substitute the candidate point into BOTH original source equations,
- both substitutions must pass exactly,
- wrong, missing, malformed, or extra candidate coordinates cannot pass.

Canonical required examples:

- `x+y=5;x-y=1` -> `(x,y)=(3,2)`
- `2x+y=2;x-y=0` -> `(x,y)=(2/3,2/3)`

A point that satisfies only one source equation must fail.

## 7. No-solution verification

Example:

`x+y=2;2x+2y=5`

must classify as `NO_SOLUTION`.

Candidate must be `{type:"NO_SOLUTION"}`.

Any point candidate must fail.

## 8. Infinite-solutions verification

Example:

`x+y=2;2x+2y=4`

must classify as `INFINITE_SOLUTIONS`.

Candidate must be `{type:"INFINITE_SOLUTIONS"}`.

A single point candidate must fail.

## 9. Source protection

Protect the ordered pair of source equations.

A source fingerprint must cover both source equations in order.

Changing either source equation after deterministic verification must cause Math Gate to block because of source mismatch.

Do not reconstruct or infer source equations from provider output.

## 10. Provenance

Both original source equations are `SOURCE_LITERAL`.

Normalized equations, determinant, classification, exact solution, and substitution evidence are `DETERMINISTIC_DERIVED`.

Every deterministic derived record must include `derivedFrom`.

Provider-inferred facts must never become trusted automation source facts.

## 11. Derivation trace

Minimum trace:

1. `NORMALIZE_EQUATION_1`
2. `NORMALIZE_EQUATION_2`
3. `COMPUTE_DETERMINANT`
4. `CLASSIFY_SYSTEM`

For unique solutions also require:

5. `SOLVE_EXACT_RATIONAL`
6. `SUBSTITUTE_EQUATION_1`
7. `SUBSTITUTE_EQUATION_2`

## 12. Provider rule

Provider verification is advisory.

Provider PASS must never override:
- `DETERMINISTIC_FAIL`
- `UNSUPPORTED`
- `HUMAN_REVIEW_REQUIRED`

Provider disagreement must be surfaced.

## 13. Math Gate

Math Gate may allow the system only when all required runtime structure is valid and deterministic verification is `DETERMINISTIC_PASS`.

For a 2×2 linear system, the gate must also require:
- valid current source fingerprint,
- trusted source provenance for both source equations,
- valid deterministic derivation trace,
- canonical candidate structure.

## 14. Regression policy

Regression tests are contract evidence.

During a math-regression repair turn:
- existing tests are frozen,
- expected mathematical values must not be changed to make QA pass,
- implementation may be repaired automatically,
- if test and contract genuinely conflict, return `HUMAN_REVIEW_REQUIRED`.

All existing Math Core 4B and inequality 4C.1 regressions must remain passing.
