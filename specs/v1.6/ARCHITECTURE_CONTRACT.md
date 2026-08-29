# v1.6 Architecture Contract

Canonical flow:

`SOURCE / INGEST → Document IR → Math IR → Question / Exam QA → Geometry / Visual → Studio Orchestrator → Render / Export`

No alternate engine, direct bypass, circular dependency, or parallel pipeline may be introduced.
