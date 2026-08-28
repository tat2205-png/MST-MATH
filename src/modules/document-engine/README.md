# Document Engine V1

Document Engine V1 implements the deterministic pipeline `DOCX package → Word AST → Math IR V1 → LaTeX`. It performs no AI inference, OCR, macro execution, embedded-object execution, external-link access, or filesystem extraction.

`parseDocx` reads bounded ZIP entries in memory, rejects unsafe paths, encrypted/unsupported entries, malformed archives, excessive expansion, CRC failures, DTD/entity declarations, and malformed XML. It reads `document.xml`, styles, numbering, relationships, content types, and embedded media while preserving Word body order in an internal AST.

The OMML converter supports runs, fractions, super/subscripts, radicals, delimiters and absolute values, functions, common Unicode operators and Greek symbols, sums/products/integrals, limits, and baseline matrices. Unsupported constructs produce `PARTIAL` with an explicit placeholder and report entry. OLE/legacy MathType returns `LEGACY_MATHTYPE_NEEDS_FALLBACK`; images are preserved as assets and reported as `IMAGE_MATH_NOT_PARSED`.

`docxAstToMathIR` maps ordered content to the existing `math-ir/v1` document blocks, expressions, assets, evidence, and deterministically delimited problems. It always runs `validateMathIR`. `mathIRToLatex` validates again and emits a minimal standard article with headings, paragraphs, inline/display math, lists, page breaks, images, and baseline tables. `convertDocxToLatex` never bypasses Math IR.

No PDF parsing, OCR, image geometry reconstruction, nested-table flattening, full Word layout fidelity, macro processing, full OMML coverage, or LaTeX-to-DOCX conversion is included in IA-2.
