# DQBK-W01A Canonical Document/Question Contract

- `WORD_FIRST`: DOCX is the first ingestion surface; PDF is deferred.
- `ONE_DOCUMENT_IR`: the existing document-engine `DocumentIR` remains canonical.
- `ONE_QUESTION_IR`: `QuestionIR` references DocumentIR object IDs rather than copying source objects.
- `FAIL_CLOSED`: ambiguous or unsupported content is `REVIEW`, `QUARANTINED`, or `UNSUPPORTED`; it cannot silently become `PASS`.
- `MATH_LEDGER_REQUIRED`: math counts and stable identity mappings are retained through package creation.
- `ASSET_LEDGER_REQUIRED`: assets retain relationship, anchor, identity, status, and issues.
- `PDF_DEFERRED`: PDF ingestion and work are outside this task.
