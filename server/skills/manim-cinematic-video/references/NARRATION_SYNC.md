# Narration Synchronization

## Authority

Narration controls educational timing.

## Cue model

Maintain explicit cue IDs in deterministic order, for example:

- s01_01
- s01_02
- s02_01

Each cue should define or resolve:

- narration text;
- generated audio path;
- start/end or measured duration;
- corresponding visual action.

## Synchronization rule

Do not start a visual explanation substantially before its spoken introduction. Important symbols should appear when they are named or just before, not several seconds later.

## Pacing

For reading-heavy content:

`CAMERA SETTLE -> CONTENT APPEARS -> NARRATION -> SHORT HOLD -> MOVE`

## QA

Verify cue count, order, missing audio files, zero-duration files, and scene-to-cue mapping before final render.
