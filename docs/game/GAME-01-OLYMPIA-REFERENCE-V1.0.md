# GAME-01-OLYMPIA-REFERENCE-V1.0

## Approval record

- artifact_id: `GAME-01-OLYMPIA-REFERENCE-V1.0`
- governing_standard: `NA-MATH_CLASSROOM_GAME_REFERENCE_OLYMPIA_STYLE_V1.0`
- artifact_status: `APPROVED`
- approval_status: `APPROVED_BY_HUMAN_PRODUCT_OWNER`
- approval_date: `2026-08-31`
- integration_status: `READY_FOR_IMPLEMENTATION`
- source: Human-supplied “NA-MATH CLASSROOM GAME REFERENCE — OLYMPIA-STYLE V1.0”, marked `FINAL / READY FOR INTEGRATION`.

This is the authoritative PiMath GAME-01 reference. It adopts gameshow pacing, round structure, feedback functions, and tension curves without copying protected Olympia branding, logos, music, audio, graphics, or exact UI.

## Locked identity and architecture

- `GAME_SYSTEM=MULTI_GAME_POWERED_BY_QUESTION_BANK`
- `GAME_ID=GAME-01`
- `GAME_NAME=OLYMPIA`
- `CORE_ENGINE=ClassroomGameEngine`
- `DEFAULT_PRESET=MATH_CHALLENGE`
- displayed preset name: `MATH CHALLENGE`
- `QUESTION_SOURCE=NA_MATH_QUESTION_BANK`
- `AUDIO_SYSTEM=EVENT_DRIVEN`
- `AUDIO_ASSETS=ORIGINAL_ONLY`
- GAME-01 is one Game Registry preset/reference layer; it is not the entire Game subsystem.
- No `OlympiaGameEngine`, separate Game question database, or duplicate Question records are permitted.

Conceptual flow:

```text
NA-MATH Question Bank
→ GameSpec
→ ClassroomGameEngine
→ Round / Timer / Score / State engines
→ Game Events
→ UI / Animation / Audio
→ Classroom Display
```

## Core primitives

```text
QUIZ
ROUND_BASED
SPEED_ROUND
SEQUENTIAL
CLUE_GRID
RISK_REWARD
TEAM_BATTLE
```

## Approved default rounds

1. `WARMUP` — KHỞI ĐỘNG: recall, understanding, and reaction; supports MCQ, True/False, short answer, quick calculation, formula/graph recognition, and prerequisite knowledge.
2. `OBSTACLE` — CHƯỚNG NGẠI VẬT: `CLUE_GRID` with four clues and a hidden target; early answers are permitted.
3. `SPEED` — TĂNG TỐC: simultaneous responses ranked by correctness, response time, and rank.
4. `FINISH` — VỀ ĐÍCH: `RISK_REWARD` with configurable packages such as basic/application/challenge or 10/20/30.

Timer durations, warning thresholds, scores, speed/rank bonuses, negative-score policy, and FINISH packages are deterministic configuration in `GameSpec`; they are not hard-coded in UI. The approved reference defines the policy mechanism rather than one universal numeric profile.

## Deterministic state model

```text
CREATED
→ READY
→ ROUND_INTRO
→ QUESTION_OPEN
→ QUESTION_ACTIVE
→ ANSWER_LOCKED
→ ANSWER_REVEALED
→ SCORE_UPDATED
→ ROUND_COMPLETE
→ NEXT_ROUND
→ GAME_COMPLETE
```

UI, animation, and audio react to state/events but do not mutate authoritative state directly.

## Approved event model

```text
GAME_CREATED
GAME_STARTED
ROUND_STARTED
QUESTION_OPENED
TIMER_STARTED
TIMER_WARNING
TIME_UP
ANSWER_LOCKED
ANSWER_REVEALED
ANSWER_CORRECT
ANSWER_WRONG
SCORE_UPDATED
RANK_CHANGED
CLUE_REVEALED
ROUND_COMPLETED
GAME_COMPLETED
WINNER_REVEALED
```

## Screens and layout

Minimum screens:

```text
Game Lobby
Player Introduction
Round Intro
Question
Timer
Answer Lock
Answer Reveal
Score Update
Leaderboard
Clue Grid
Speed Ranking
Finish Selection
Final Leaderboard
Winner
```

Approved question-screen composition for TV/projector readability:

```text
┌───────────────────────────────────────────┐
│ ROUND TITLE                      TIMER    │
├──────────────┬────────────────────────────┤
│ SCOREBOARD   │         QUESTION           │
│ players/     │       FORMULA / IMAGE      │
│ teams        │                            │
├──────────────┴────────────────────────────┤
│               RESPONSE STATE              │
└───────────────────────────────────────────┘
```

Mathematical readability takes priority over decoration.

## Modes and information isolation

Classroom modes:

```text
PLAYER_MODE
TEAM_MODE
CLASS_MODE
TEACHER_HOST_MODE
```

Display modes:

```text
TEACHER_VIEW
CLASSROOM_VIEW
PLAYER_VIEW
```

Classroom View does not reveal answers before reveal, solutions, internal metadata, provenance, or teacher controls. Teacher View may show answers, response states, timer controls, score override, next-question controls, and answer reveal. Teacher Host Mode may open/lock/reveal questions and control rounds; Score Engine remains authoritative while explicit teacher score overrides are auditable.

## Question Bank and math rendering

```text
NA-MATH Question Bank
→ questionRef
→ GameRound
→ Question Resolver
→ Game UI
```

Resolved packages may contain question, answer, options, image, diagram, math, difficulty, skill, grade, topic, source, and provenance. Game stores references, not copied question records.

All mathematical expressions pass through the Math Engine. Supported rendering includes LaTeX, MathJax/KaTeX, SVG, and semantic geometry. Raw Unicode is not the canonical formula renderer. Spatial geometry follows the NA-MATH Geometry Standard.

Answer reveal displays only the required answer by default. A long solution appears only after the teacher explicitly selects `SHOW_SOLUTION`.

## Timer and score contracts

```typescript
interface TimePolicy {
  durationSeconds: number;
  warningAtSeconds?: number;
  autoLockOnTimeout: boolean;
}

interface ScorePolicy {
  correctScore: number;
  wrongScore?: number;
  timeoutScore?: number;
  speedBonus?: boolean;
  rankBonus?: number[];
  allowNegative?: boolean;
}
```

Timer and Score engines are independent of UI. UI renders engine state only.

## Game round and specification contracts

```typescript
interface GameRound {
  id: string;
  type: "QUIZ" | "CLUE_GRID" | "SPEED_ROUND" | "RISK_REWARD";
  title: string;
  questionRefs: string[];
  timePolicy: TimePolicy;
  scorePolicy: ScorePolicy;
  orderPolicy?: { mode: "fixed" | "random" };
}

interface GameSpec {
  id: string;
  title: string;
  preset: string;
  players: PlayerSpec[];
  rounds: GameRound[];
  audioProfile?: string;
  visualProfile?: string;
}
```

Approved preset:

```json
{
  "id": "math-challenge-v1",
  "name": "MATH CHALLENGE",
  "engine": "ClassroomGameEngine",
  "rounds": ["WARMUP", "OBSTACLE", "SPEED", "FINISH"],
  "audioProfile": "math-challenge-audio-v1",
  "visualProfile": "na-math-game-v1"
}
```

## Animation contract

```text
QUESTION_REVEAL
TIMER_START
TIMER_WARNING
ANSWER_LOCK
ANSWER_REVEAL
CORRECT_FLASH
WRONG_FLASH
SCORE_COUNT
RANK_MOVE
CLUE_REVEAL
ROUND_TRANSITION
WINNER_REVEAL
```

Each action produces at most one purposeful animation conveying one new piece of information. Decorative-only motion is excluded.

## Audio contract

```text
Game Engine → Game Event → Audio Event → Audio Manager → Audio Asset
```

Layers are independently controlled:

```text
AUDIO_LAYER_1 = MUSIC BED
AUDIO_LAYER_2 = GAME / UI SFX
AUDIO_LAYER_3 = VOICE / MC / TTS
```

Audio Manager supports `masterVolume`, `musicVolume`, `sfxVolume`, `voiceVolume`, `mute`, `ducking`, `fadeIn`, and `fadeOut`. Voice/TTS ducks music. Runtime prefers WAV masters, with OGG/MP3 derivatives permitted for web optimization.

Approved audio events include game/player/round intros, question open, clue reveal, countdown tick/warning, time up, answer lock/correct/wrong, score up/down, rank change, package select, round complete, final results, and winner reveal.

Only original PiMath/Math AI audio or otherwise properly licensed assets may be used.

## Accessibility

```text
MUTE AUDIO
REDUCED MOTION
HIGH CONTRAST
LARGE TEXT
```

Audio is never the sole signal; for example `TIME_UP` requires both audio and visible state.

## QA contract

- Engine: state, round, timer, score, event order, determinism.
- Question: reference resolution, answer isolation, math rendering, image assets, Question Bank integration.
- UI: classroom readability, TV display, overflow, responsive behavior, math layout.
- Audio: event mapping, missing assets, overlap, volume, TTS ducking, copyright.
- Gameplay: WARMUP, OBSTACLE, SPEED, FINISH, final score, and winner.

V1 completion requires PASS for engine, four rounds, Question Bank integration, math rendering, timer, scoring, leaderboard, event-driven audio, original-audio policy, classroom display, teacher controls, and deterministic state.

## Non-goals

- online public multiplayer;
- global leaderboard;
- social networking;
- commercial tournament platform;
- exact Olympia clone;
- Olympia branding, audio, music, graphics, or exact UI.

## Final design principle

```text
MATH FIRST
GAME SECOND
DECORATION THIRD
```

`GAME_01_REFERENCE_STATUS=APPROVED`

Implementation may proceed only within this contract, with independent Agency QA and later human visual acceptance.
