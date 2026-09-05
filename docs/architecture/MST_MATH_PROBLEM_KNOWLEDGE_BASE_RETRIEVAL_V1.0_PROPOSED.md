# MST-MATH Problem Knowledge Base + Retrieval Architecture V1.0

STATUS=DRAFT / PROPOSED
AUTHORITY_LEVEL=SUCCESSOR_PROPOSAL
BASELINE=fix/mst-math-canonical-question-integrity-v1
NON_DESTRUCTIVE=true

## 1. Purpose

Define the production architecture for managing and retrieving THPT mathematics problems without modifying existing LOCKED/CANONICAL QuestionIR semantics in place.

Core principle:

> CANONICAL PROBLEM DATA != SEARCH INDEX

PostgreSQL is the Source of Truth. Search artifacts are derived projections and must be rebuildable.

## 2. Compatibility constraints

This proposal MUST preserve the existing QuestionIR authority and its discriminated variants:
- MULTIPLE_CHOICE
- TRUE_FALSE
- SHORT_ANSWER
- ESSAY
- UNKNOWN as compatibility boundary only

It MUST preserve:
- deterministic question identity
- sourceDocumentId / sourceObjectIds
- mathObjectIds
- assetIds / tableIds
- provenance
- qaStatus / issues
- answer vs response-semantics separation
- asset and math preservation gates

No existing LOCKED/CANONICAL contract is modified in place.

## 3. Target architecture

```text
Applications / AI
       |
       v
Problem Retrieval API
       |
       +-- Exact / ID retrieval
       +-- Metadata retrieval
       +-- Lexical retrieval
       +-- Mathematical-structure retrieval
       +-- Semantic vector retrieval
       |
       v
Hybrid Fusion + Domain Reranker
       |
       v
Version / QA / Authority Filter
       |
       v
Canonical Problem Store
       |
       +-- PostgreSQL (Source of Truth)
       +-- Object Storage (assets / source artifacts)
       +-- Audit/Event history
```

## 4. Canonical storage model

Recommended core entities:
- problem
- problem_version
- problem_content
- answer
- solution
- problem_classification
- curriculum_node
- problem_curriculum_link
- asset
- source
- problem_relation
- quality_assessment

Later/derived entities:
- problem_embedding
- problem_search_document
- problem_math_signature
- problem_statistics
- student_attempt
- generation_record

QuestionIR remains the semantic interchange/processing authority. Persistence may project QuestionIR into relational tables, but must remain lossless and traceable to its source/version.

## 5. PostgreSQL-first policy

V1 should use a PostgreSQL-centric design:
- relational columns for stable/high-value fields
- JSONB for extensible metadata
- full-text search for lexical retrieval
- pg_trgm for fuzzy Vietnamese search
- unaccent-compatible normalized search projection
- pgvector for semantic retrieval when enabled

Do NOT introduce Qdrant, OpenSearch/Elasticsearch, or Neo4j in V1 unless measured production requirements justify independent scaling or advanced search behavior.

## 6. Search projection rules

The following are DERIVED and rebuildable:
- normalized_text
- accentless_text
- search_vector
- embedding
- mathematical signature
- lexical index
- vector index

Loss of any derived search index MUST NOT cause loss of canonical mathematical content.

## 7. Mathematical Retrieval Engine

MST-MATH search must not be vector-only.

Retrieval pipeline:

```text
QUERY
  -> query understanding
  -> hard filters
  -> parallel candidate retrieval
       * exact/id
       * metadata
       * lexical/fuzzy
       * mathematical structure
       * semantic vector
  -> fusion
  -> domain reranking
  -> QA/version authority gate
  -> result
```

### 7.1 Math Signature

Each approved problem may derive a machine-readable mathematical signature, e.g.:

```json
{
  "objects": ["FUNCTION", "DERIVATIVE"],
  "function_family": "RATIONAL",
  "degrees": {"numerator": 2, "denominator": 1},
  "operations": ["DERIVATIVE", "SIGN_ANALYSIS"],
  "target": ["MONOTONICITY"]
}
```

This signature is derived from canonical math representation / Math IR and MUST NOT replace original LaTeX or source math objects.

## 8. Ranking policy

Do not combine heterogeneous retrieval scores by arbitrary raw weighted addition.

Preferred V1:
1. hard authority/curriculum filters
2. candidate retrieval from multiple channels
3. rank fusion (e.g. RRF-style approach)
4. MST-MATH domain reranker
5. duplicate/diversity penalty

Reranking features may include:
- curriculum match
- mathematical-structure match
- question-type compatibility
- difficulty compatibility
- source quality
- QA confidence
- estimated time
- duplicate-cluster penalty
- recent-use penalty

Weights remain configurable and must be calibrated by real usage data; they are not canonical constants.

## 9. Deduplication architecture

At ingestion derive:
- original-content hash
- normalized-text hash
- normalized-math hash
- math signature
- semantic embedding (optional)

Classify matches as:
- EXACT_DUPLICATE
- NORMALIZED_DUPLICATE
- STRUCTURAL_NEAR_DUPLICATE
- SEMANTIC_NEAR_DUPLICATE

Do not delete source copies automatically. Preserve provenance and group them using duplicate_cluster_id or equivalent relation.

## 10. Versioning and governance

LOCKED means immutable in place.

Any semantic/storage-contract change requires a versioned successor:
DRAFT/PROPOSED -> Impact Analysis -> Conflict Check -> Regression Test -> Human Approval -> APPROVED -> CANONICAL -> LOCKED.

Existing canonical versions remain preserved as SUPERSEDED or LEGACY/COMPATIBILITY when a successor is approved.

Search projections and indexes are not canonical versions and can be rebuilt without changing problem semantics.

## 11. AI generation boundary

AI-generated content must not be written directly into the canonical store as APPROVED.

Required path:

```text
AI_GENERATED
  -> MATH_QA
  -> PEDAGOGY_QA
  -> DATA/REALITY_QA when applicable
  -> HUMAN_REVIEW
  -> APPROVED successor/version
```

Generation metadata should include model/version, parent problem(s), generation strategy, timestamp, and human-verification state.

## 12. Unified Retrieval API

Target logical interface:

`POST /api/v1/problems/search`

Example request:

```json
{
  "query": "cực trị hàm phân thức mức vận dụng",
  "filters": {
    "grade": [12],
    "status": ["APPROVED"],
    "question_type": ["MULTIPLE_CHOICE", "TRUE_FALSE"]
  },
  "search": {
    "lexical": true,
    "semantic": true,
    "math_structure": true
  },
  "limit": 20
}
```

Every MST-MATH consumer (Question Bank UI, Exam Builder, Worksheet/Learning Material, Video, AI Assistant, Analytics) should call the same retrieval service rather than implementing separate search rules.

## 13. Retrieval audit

Each retrieval should be traceable through an audit record containing at minimum:
- request_id
- query
- parsed intent
- filters
- candidate ids
- retrieval channels
- ranking version
- selected ids
- search/index version
- timestamp

This enables explanation of why a problem was selected for a test, worksheet, lesson, or AI response.

## 14. Implementation phases

### Phase A — contracts and schema
- persistence schema proposal
- QuestionIR -> persistence projection contract
- source/provenance preservation
- problem/version identity rules
- migration strategy

### Phase B — deterministic retrieval
- exact ID
- metadata filters
- FTS
- Vietnamese fuzzy search
- QA/status/version filters

### Phase C — mathematical retrieval
- Math IR normalization
- structural signature
- math fingerprint
- structural candidate search

### Phase D — semantic/hybrid retrieval
- embeddings as derived projection
- pgvector index
- fusion
- domain reranker

### Phase E — analytics and adaptive retrieval
- empirical difficulty
- discrimination
- average response time
- misconception statistics
- personalized retrieval

## 15. Required gates before canonical approval

- QUESTION_IR_BACKWARD_COMPATIBILITY_GATE
- SOURCE_PROVENANCE_PRESERVATION_GATE
- MATH_OBJECT_PRESERVATION_GATE
- ASSET_PROVENANCE_GATE
- PERSISTENCE_ROUNDTRIP_GATE
- SEARCH_EXACTNESS_GATE
- SEARCH_FILTER_AUTHORITY_GATE
- MATH_RETRIEVAL_REGRESSION_GATE
- DEDUP_PROVENANCE_GATE
- INDEX_REBUILDABILITY_GATE
- RETRIEVAL_AUDIT_GATE
- ARCHITECTURE_BOUNDARY_GATE

## 16. Decision summary

Recommended V1 decision:

> PostgreSQL-centric Canonical Problem Store + Object Storage + Mathematical Retrieval Engine + Hybrid Retrieval + Domain Reranking + immutable/versioned governance.

Out of scope for V1 unless justified by measured requirements:
- dedicated vector database
- dedicated search cluster
- graph database
- automatic AI promotion to canonical data

This document is a PROPOSED successor architecture and does not modify any existing canonical authority in place.
