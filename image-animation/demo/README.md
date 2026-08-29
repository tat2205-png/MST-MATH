# IA V1 deterministic demo

From the repository root, run:

```powershell
npm run ia:task-test -- IA-10.1
npx tsx image-animation/demo/v1-demo.ts
```

The second command prints the complete reproducible demo artifact as canonical formatted JSON. Repeating it with the same source produces byte-identical output.

The artifact demonstrates all V1 policy boundaries:

- an exact-geometry request asks for generative rendering but is routed to Manim;
- a non-authoritative visual request may use generative motion only because policy enables it;
- the generative artifact is explicitly marked `authoritative: false` and has no geometry authority;
- Frame QA passes only with RGBA pixel evidence for every required frame.

To save the artifact without changing application state:

```powershell
npx tsx image-animation/demo/v1-demo.ts | Out-File -LiteralPath .\ia-v1-demo-artifact.json -Encoding utf8
```
