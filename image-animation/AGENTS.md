# Image Animation Automation Rules

PROJECT=MATH-AI-IMAGE-ANIMATION
BASELINE=IA-V1.0
ARCHITECTURE_LOCKED=true
FAIL_CLOSED=true
AUTO_CODE=true
AUTO_TEST=true
AUTO_REPAIR=true
MAX_AUTO_REPAIR=3
AUTO_COMMIT=PASS_ONLY
AUTO_MERGE=false
AI_IS_NOT_TEST_AUTHORITY=true

## Scope

This project is isolated under `image-animation/`. IA-0A.1 provides automation policy and deterministic QA gates only. It does not implement scene graphs, geometry reconstruction or lock, vision, rendering, generative video, or new UI.

## Forbidden

- changing locked architecture without explicit human approval
- modifying unrelated Math AI modules
- weakening, skipping, deleting, or rewriting existing tests or expected outputs
- bypassing a QA gate or declaring PASS from AI judgement alone
- inventing or automatically changing geometry truth
- silently modifying files outside allowed task paths
- using `git reset --hard`, `git clean -fd`, or `git stash`
- switching the main Math AI workspace branch