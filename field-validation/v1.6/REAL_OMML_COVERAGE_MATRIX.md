# V1.6 real DOCX OMML coverage matrix

Source: `SELF-01/PILOT-01/source/Full-Toán thực tế 10.docx` (SHA-256 `7f26811b8588672cbb9029af3d43b7752ba36c149ec2e9e4caf9c01153c0c23d`).

The importer now routes question-bank OMML through the canonical XML parser and preserves unsupported structures as `UNSUPPORTED`/review-required. Samples below are taken from the immutable source reimport.

| Question | Structure / source output | XML pattern / location | Failure mechanism found | Post-fix result |
|---|---|---|---|---|
| q34 | `y=a{x}^{2}+bx+c` | `m:sSup`, `m:e`, `m:sup` | Previous regex path did not use canonical nested XML conversion | PRESERVED |
| q34, q37 | `-\frac{43}{1520}` | `m:f`, `m:num`, `m:den` | Same weaker regex conversion path | PRESERVED |
| q8 | `\left|A\right|` | `m:d`, `m:dPr`, `m:begChr`, `m:endChr` | `m:d` was unsupported in question-bank converter | PRESERVED |
| q4, q6 | `\left(x,y\in{N}^{*}\right)` | `m:d`, nested `m:sSup` | Nested delimiter/superscript handling was flattened by old path | PRESERVED |
| q34 | quadratic/polynomial | `m:sSup` plus ordinary `m:r/m:t` | Run ordering depended on regex extraction | PRESERVED |
| q1, q34 | Vietnamese prose + inline math | alternating `w:r/w:t` and `m:oMath` | adjacent text runs were emitted separately | PRESERVED_ORDER |
| q11 and other MC items | mathematical answer options | `m:oMath` following label runs | option parser filtered math-only blocks | PRESERVED |
| q93 | `\overline{ab}` | `m:bar`, `m:e` | canonical converter lacked `bar` | PRESERVED |
| q119 | vector accent | `m:acc`, `m:accPr`, `m:chr` | canonical converter lacked `acc` | PRESERVED |
| q50 | upper limit | `m:limUpp`, `m:e`, `m:lim` | canonical converter lacked `limUpp` | PRESERVED |
| q158 | boxed/grouped expression | `m:box`, `m:groupChr` | canonical converter lacked pass-through cases | PRESERVED |
| q68 | equation array | `m:eqArr`, nested `m:e` | conversion is not specified safely by current contract | REVIEW_REQUIRED / UNSUPPORTED_FAIL_CLOSED |

`eqArr` cases: 2. They remain explicitly unsupported, are represented with converter warnings, and are not treated as approved parsed math. No silent flattening is used.

Canonical path: DOCX XML → `parseXml` → `ommlToLatex` → question-bank `MathNode` → Question IR → persistence/API.
