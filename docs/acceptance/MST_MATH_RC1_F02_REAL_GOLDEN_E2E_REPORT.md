# MST-MATH RC1 F02 real-golden E2E

PR_SCOPE=F01R production wiring plus F02 SVG cross-output fix.
F01_COMMIT_SCOPE=8604f5305a4a18bbe2ff46c5215510e1140bfda8.
F02_FIX_SCOPE=SVG PDF transcoding and its machine evidence.

## Source

REAL_SOURCE_PATH=tests/golden/docx/GOLDEN_03_GEOMETRY_SVG.docx
REAL_SOURCE_SHA256=46CD07E36CF1482702EE6F6FAF4DCA1878501DEDD08CEF887D8A5028817DBC04
SOURCE_BINDING=PASS
BLOCK_IDENTITY=PASS (word-block-0, word-block-1)
FIGURE_IDENTITY=PASS (asset-b1219a63f1b9)
ORIGINAL_SVG_SHA256=ACD21EE9E9245A16A366D838627854AD644BB43180BE65C27E0A346AB45F30EC

## Production route and outputs

Teacher Import → unified ingest → DocumentIR → normalization → canonical Math QA → P01 LessonIR → teacher workflow review state → HTML/DOCX/PDF output.

The exact source-backed P01 route passed and produced all three output formats. HTML and DOCX retain the original SVG. PDF uses only the derived in-memory PNG and records:

`P01_PDF_FIGURE_TRANSCODED:asset-b1219a63f1b9:SVG_TO_PNG:4f6ce26998e21c14d3e4f06ef6e9356ce2102296329dbf3dfc6a84cf04528a49`

HTML_MACHINE_QA=PASS
DOCX_MACHINE_QA=PASS
PDF_MACHINE_QA=PASS
CROSS_OUTPUT_SEMANTIC_SIGNATURE=2096270e324d5cf05ebb6793c9dba4c91a98c78b1df43b3a2ca67b46e780ba11
CANONICAL_MATH_QA=PASS
NO_SILENT_QUESTION_FABRICATION=PASS

The golden is a geometry/P01 visual source without question numbering. The runtime therefore returns `imported=0`; it does not fabricate QuestionBank questions. This proves the source-backed P01/output path, but does not claim a question-level teacher review or QuestionBank semantic E2E for this particular golden.

## Safety checks

Valid SVG, legacy PNG/JPEG/PDF behavior, external-resource rejection, invalid SVG fail-closed behavior, original figure identity, derived hash, and cross-output semantic signature are covered by `tests/test-p01-svg-pdf-transcode.ts`. The real-golden route is covered by `tests/test-f02-real-golden-svg.ts`.

REAL_P01_GOLDEN=PASS
REAL_P01_OUTPUT_E2E=PASS
QUESTION_LEVEL_TEACHER_REVIEW_FOR_THIS_GOLDEN=NOT_APPLICABLE_NO_QUESTION_NUMBERING
INPUT_IMPLEMENTATION_MUTATED=FALSE
CANONICAL_CONTRACT_MUTATED=FALSE
OUT_OF_SCOPE_IMPLEMENTATION_ADDED=FALSE_FOR_THIS_PR_SCOPE_ONLY

