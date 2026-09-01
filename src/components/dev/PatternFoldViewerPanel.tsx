import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { createMidpoint, describeDynamicGeometry, evaluateSelection, normalizeDynamicGeometry, renameDynamicObject } from "../../modules/dynamic-geometry/index.js";
import {
  addConstructionCircle,
  addConstructionPoint,
  addConstructionSegment,
  addStraightCrease,
  addStraightCut,
  addSymmetryGuide,
  applyDiscard,
  assignSegmentSemantic,
  cancelDiscard,
  createPatternFoldScene,
  createPatternThreeMapping,
  createPlanarPattern,
  deleteAuthoredCrease,
  geometryContainsPoint,
  mirrorConstructionPoint,
  mirrorConstructionSegment,
  moveSequenceItem,
  previewDiscardRegion,
  resolveGridType,
  snapConstructionPoint,
  updateAuthoredCrease,
  updateCreaseFoldSide,
  updateGrid,
  updatePatternFoldScene,
} from "../../modules/pattern-fold/index.js";
import type {
  FoldAssignment,
  PatternFoldScene,
  PatternFoldSequence,
  PatternSheet,
} from "../../modules/pattern-fold/index.js";
import PatternAuthoringCompletionPanel from "./PatternAuthoringCompletionPanel.js";
type Shape = "square" | "rectangle" | "circle" | "triangle";
type Tool =
  | "SELECT"
  | "POINT"
  | "SEGMENT"
  | "CIRCLE"
  | "SELECT_REGION"
  | "DRAW_CREASE"
  | "DRAW_CUT";
const TV = {
  background: "#101B3D",
  surface: "#4EA8DE",
  boundary: "#F7F9FC",
  cut: "#FF5A5F",
  crease: "#4DE3FF",
  valley: "#B8A1FF",
  symmetry: "#6EE7A8",
  guide: "#AAB4C8",
  selected: "#FFE45E",
  discard: "#FF8A80",
  ghost: "#9DB2CE",
} as const;
const box = {
  background: "#172554",
  color: "#fff",
  padding: 14,
  borderRadius: 8,
  border: "1px solid #334e80",
} as const;
export default function PatternFoldViewerPanel({
  onExit,
}: {
  onExit: () => void;
}) {
  const [shape, setShape] = useState<Shape>("square"),
    [dims, setDims] = useState([6, 6, 5]),
    [tool, setTool] = useState<Tool>("SELECT"),
    [sheet, setSheet] = useState<PatternSheet>(
      () => createPlanarPattern({ kind: "square", side: 6 }).value!,
    ),
    [sequence, setSequence] = useState<PatternFoldSequence>({
      id: "authored:sequence",
      steps: [],
    }),
    [selected, setSelected] = useState<string>(),
    [selectedSegment, setSelectedSegment] = useState<string>(),
    [selectedRegion, setSelectedRegion] = useState<string>(),
    [pendingPoint, setPendingPoint] = useState<string>(),
    [preview, setPreview] = useState<[number, number]>(),
    [view, setView] = useState<"2D" | "3D">("2D"),
    [step, setStep] = useState(-1),
    [progress, setProgress] = useState(0),
    [showRemoved, setShowRemoved] = useState(true),
    [showLabels, setShowLabels] = useState(true),
    [selectedPoint, setSelectedPoint] = useState<string>(),
    [message, setMessage] = useState(
      "Construct points and segments, then assign Guide, Cut, or Crease.",
    );
  const host = useRef<HTMLDivElement>(null),
    mappingRef = useRef<ReturnType<typeof createPatternThreeMapping>>(),
    drawStart = useRef<[number, number]>();
  const normalizedSheet = useMemo(
    () => normalizeDynamicGeometry(sheet),
    [sheet],
  );
  const objects = useMemo(
    () => describeDynamicGeometry(normalizedSheet),
    [normalizedSheet],
  );
  const selectedObjectId =
    selectedPoint ?? selectedSegment ?? selectedRegion ?? selected;
  const selectedObject = objects.find(
    (object) => object.id === selectedObjectId,
  );
  const selectionContext = useMemo(
    () =>
      evaluateSelection(
        normalizedSheet,
        selectedObjectId ? [selectedObjectId] : [],
      ),
    [normalizedSheet, selectedObjectId],
  );
  const selectedCrease = sheet.creases.find((c) => c.id === selected),
    extent = useMemo(() => {
      const g = sheet.boundary.geometry;
      return (
        1.25 *
          (g.kind === "circle"
            ? g.radius
            : Math.max(...g.vertices.flatMap((p) => p.map(Math.abs)))) || 5
      );
    }, [sheet]);
  const activateTool = (next: Tool) => {
    drawStart.current = undefined;
    setPendingPoint(undefined);
    setPreview(undefined);
    setTool(next);
  };
  const makeInput = () =>
    shape === "square"
      ? { kind: "square" as const, side: dims[0] }
      : shape === "rectangle"
        ? { kind: "rectangle" as const, width: dims[0], height: dims[1] }
        : shape === "circle"
          ? { kind: "circle" as const, radius: dims[0] }
          : { kind: "triangle" as const, a: dims[0], b: dims[1], c: dims[2] };
  const reset = () => {
    drawStart.current = undefined;
    const result = createPlanarPattern(makeInput());
    if (!result.value) {
      setMessage(`${result.issues[0].code}: ${result.issues[0].message}`);
      return;
    }
    setSheet(normalizeDynamicGeometry(result.value));
    setSequence({ id: "authored:sequence", steps: [] });
    setSelected(undefined);
    setSelectedPoint(undefined);
    setSelectedSegment(undefined);
    setSelectedRegion(undefined);
    setPendingPoint(undefined);
    setPreview(undefined);
    setStep(-1);
    setProgress(0);
    setView("2D");
    setMessage(
      `${result.value.sourceShape?.type} source created and fit to view.`,
    );
  };
  const point = (e: ReactPointerEvent<SVGSVGElement>): [number, number] => {
    const r = e.currentTarget.getBoundingClientRect();
    return [
      -extent + (2 * extent * (e.clientX - r.left)) / r.width,
      extent - (2 * extent * (e.clientY - r.top)) / r.height,
    ];
  };
  const finish = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!drawStart.current || tool === "SELECT") return;
    const start = drawStart.current,
      end = point(e);
    drawStart.current = undefined;
    const result =
      tool === "DRAW_CUT"
        ? addStraightCut(sheet, start, end)
        : addStraightCrease(sheet, start, end, "UNASSIGNED", 90, "B");
    if (!result.value) {
      setMessage(`${result.issues[0].code}: ${result.issues[0].message}`);
      return;
    }
    setSheet(result.value);
    if (tool === "DRAW_CREASE") {
      const id = result.value.creases.at(-1)!.id;
      setSequence((s) => ({ ...s, steps: [...s.steps, { creaseId: id }] }));
      setSelected(id);
    }
    setMessage(
      tool === "DRAW_CUT"
        ? "CUT_THROUGH clipped and material connectivity updated."
        : "Crease clipped and fold regions repartitioned.",
    );
  };
  const constructionClick = (e: ReactPointerEvent<SVGSVGElement>) => {
    if (!["POINT", "SEGMENT", "CIRCLE"].includes(tool)) return;
    const raw = point(e),
      snapped = snapConstructionPoint(sheet, raw),
      added = addConstructionPoint(sheet, snapped);
    if (!added.value) {
      setMessage(added.issues[0].message);
      return;
    }
    const current = added.value,
      pointId = current.construction?.points.find(
        (p) =>
          Math.hypot(p.position[0] - snapped[0], p.position[1] - snapped[1]) <
          1e-6,
      )?.id;
    if (!pointId) return;
    if (tool === "POINT") {
      const next = normalizeDynamicGeometry(current);
      setSheet(next);
      setSelectedPoint(pointId);
      setSelectedSegment(undefined);
      setMessage(
        `${next.construction?.points.find((p) => p.id === pointId)?.label} created.`,
      );
      return;
    }
    if (!pendingPoint) {
      setSheet(current);
      setPendingPoint(pointId);
      setPreview(snapped);
      setMessage(`${pointId} selected; choose the second point.`);
      return;
    }
    const result =
      tool === "SEGMENT"
        ? addConstructionSegment(current, [pendingPoint, pointId])
        : addConstructionCircle(
            current,
            pendingPoint,
            Math.hypot(
              snapped[0] -
                (current.construction?.points.find((p) => p.id === pendingPoint)
                  ?.position[0] ?? 0),
              snapped[1] -
                (current.construction?.points.find((p) => p.id === pendingPoint)
                  ?.position[1] ?? 0),
            ),
          );
    if (!result.value) {
      setMessage(result.issues[0].message);
      return;
    }
    setSheet(normalizeDynamicGeometry(result.value));
    if (tool === "SEGMENT") {
      setSelectedSegment(result.value.construction?.segments.at(-1)?.id);
      setSelectedPoint(undefined);
      setSelectedRegion(undefined);
      setSelected(undefined);
    }
    setPendingPoint(undefined);
    setPreview(undefined);
    setMessage(
      tool === "SEGMENT"
        ? "Neutral construction segment created; assign its semantic role."
        : "Analytic construction circle created.",
    );
  };
  const semantic = (role: "GUIDE" | "CUT" | "CREASE") => {
    if (!selectedSegment) return;
    const result = assignSegmentSemantic(sheet, selectedSegment, role);
    if (!result.value) {
      setMessage(`${result.issues[0].code}: ${result.issues[0].message}`);
      return;
    }
    setSheet(result.value);
    if (role === "CREASE") {
      const id = result.value.creases.at(-1)!.id;
      setSelected(id);
      setSequence((s) => ({ ...s, steps: [...s.steps, { creaseId: id }] }));
    }
    setMessage(`${selectedSegment} assigned as ${role}.`);
  };
  const edit = (patch: {
    assignment?: FoldAssignment;
    targetAngleRadians?: number;
  }) => {
    if (!selected) return;
    const result = updateAuthoredCrease(sheet, selected, patch);
    if (result.value) setSheet(result.value);
    else setMessage(result.issues[0].message);
  };
  const remove = () => {
    if (!selected) return;
    const result = deleteAuthoredCrease(sheet, selected);
    if (!result.value) return;
    setSheet(result.value);
    setSequence((s) => ({
      ...s,
      steps: s.steps.filter((x) => x.creaseId !== selected),
    }));
    setSelected(undefined);
    setStep(-1);
    setProgress(0);
  };
  const move = (direction: -1 | 1) => {
    if (!selected) return;
    const result = moveSequenceItem(sequence, selected, direction);
    if (result.value) setSequence(result.value);
    else setMessage(result.issues[0].message);
  };
  const scene = useMemo(
    () => createPatternFoldScene(sheet, 0, sequence).value,
    [sheet, sequence],
  );
  useEffect(() => {
    if (view !== "3D" || !scene) return;
    const container = host.current;
    if (!container) return;
    const world = new THREE.Scene(),
      camera = new THREE.PerspectiveCamera(45, 1, 0.01, 100),
      renderer = new THREE.WebGLRenderer({ antialias: true }),
      controls = new OrbitControls(camera, renderer.domElement),
      mapping = createPatternThreeMapping(scene);
    world.background = new THREE.Color(0xf8fafc);
    container.appendChild(renderer.domElement);
    world.add(mapping.group, new THREE.HemisphereLight(0xffffff, 0x334155, 2));
    camera.position.set(extent, extent, extent * 1.5);
    mappingRef.current = mapping;
    const resize = () => {
      renderer.setSize(container.clientWidth, container.clientHeight, false);
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    let frame = 0,
      active = true;
    const draw = () => {
      if (!active) return;
      controls.update();
      renderer.render(world, camera);
      frame = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      active = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      mapping.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
      mappingRef.current = undefined;
    };
  }, [view, scene, extent]);
  useEffect(() => {
    if (!scene || !mappingRef.current) return;
    const next = updatePatternFoldScene(
      scene,
      Math.max(0, step),
      progress,
    ).value;
    if (next) mappingRef.current.apply(next);
  }, [scene, step, progress]);
  const play = () => {
      if (!scene) return;
      setView("3D");
      setStep(Math.max(0, sequence.steps.length - 1));
      setProgress(1);
    },
    reverse = () => {
      setView("3D");
      setStep(0);
      setProgress(0);
    };
  const g = sheet.boundary.geometry,
    outline =
      g.kind === "polygon"
        ? g.vertices.map((p) => `${p[0]},${-p[1]}`).join(" ")
        : "",
    patternFixtureCompatibility = "Pattern fixture";
  void patternFixtureCompatibility;
  return (
    <main
      data-dynamic-geometry-workspace
      style={{
        minHeight: "100vh",
        padding: 20,
        background: TV.background,
        color: "#fff",
        fontFamily: "system-ui",
      }}
    >
      <style>{`[data-dynamic-geometry-workspace] button{background:#223d70;color:#fff;border:1px solid #6f89ba;border-radius:6px;padding:8px 11px;margin:3px;cursor:pointer;font-weight:650}[data-dynamic-geometry-workspace] button:hover{background:#2f5591}[data-dynamic-geometry-workspace] button:focus-visible{outline:3px solid #FFE45E;outline-offset:2px}[data-dynamic-geometry-workspace] button[aria-pressed=true]{background:#FFE45E;color:#101B3D;border-color:#fff}[data-dynamic-geometry-workspace] button:disabled{opacity:.42;cursor:not-allowed}[data-dynamic-geometry-workspace] input,[data-dynamic-geometry-workspace] select{background:#0e1837;color:#fff;border:1px solid #6f89ba;border-radius:5px;padding:7px;max-width:100%}[data-dynamic-geometry-workspace] details{margin-top:12px;border-top:1px solid #405b8a;padding-top:10px}[data-dynamic-geometry-workspace] summary{cursor:pointer;font-weight:750}`}</style>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div><h1 style={{ margin: 0, fontSize: 25 }}>Pattern / Cut-Fold Authoring</h1><small>Dynamic Geometry workspace</small></div>
        <button onClick={onExit}>Solid / Surface mode</button>
      </header>
      <nav aria-label="Mathematical tool families" style={{ ...box, display: "flex", alignItems: "center", flexWrap: "wrap", marginTop: 12, padding: 8 }}>
        {(["SELECT", "POINT", "SEGMENT", "CIRCLE"] as Tool[]).map((name)=><button key={`toolbar-${name}`} aria-pressed={tool===name} onClick={()=>activateTool(name)}>{name}</button>)}
        <button disabled={!selectionContext.validCommands.includes("SET_CUT")} title={selectionContext.invalidCommandReasons.SET_CUT} onClick={()=>semantic("CUT")}>Set as Cut</button>
        <button disabled={!selectionContext.validCommands.includes("SET_CREASE")} title={selectionContext.invalidCommandReasons.SET_CREASE} onClick={()=>semantic("CREASE")}>Set as Crease</button>
        <button aria-pressed={sheet.construction?.grid.visible??false} onClick={()=>setSheet(updateGrid(sheet,{visible:!(sheet.construction?.grid.visible??false)}).value!)}>Grid</button>
        <button aria-pressed={showLabels} onClick={()=>setShowLabels(value=>!value)}>Labels</button>
        <button aria-pressed={view==="2D"} onClick={()=>setView("2D")}>2D</button><button aria-pressed={view==="3D"} disabled={!scene} onClick={()=>setView("3D")}>3D</button>
        <strong style={{ marginLeft: "auto", padding: "8px 12px", border: `1px solid ${TV.selected}`, borderRadius: 6 }}>ACTIVE TOOL · {tool.replaceAll("_", " ")}</strong>
      </nav>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(240px,280px) minmax(560px,1fr) minmax(280px,330px)",
          gap: 14,
          marginTop: 12,
        }}
      >
        <aside aria-label="Toolbox" style={box}>
          <section>
            <strong>SOURCE</strong>
            <p>
              <select
                aria-label="Pattern shape"
                value={shape}
                onChange={(e) => setShape(e.target.value as Shape)}
              >
                <option value="square">Square</option>
                <option value="rectangle">Rectangle</option>
                <option value="circle">Circle</option>
                <option value="triangle">Triangle</option>
              </select>
            </p>
            {shape === "square" || shape === "circle" ? (
              <label>
                {shape === "square" ? "Side" : "Radius"}{" "}
                <input
                  aria-label={shape === "square" ? "Side" : "Radius"}
                  type="number"
                  value={dims[0]}
                  onChange={(e) =>
                    setDims([Number(e.target.value), dims[1], dims[2]])
                  }
                />
              </label>
            ) : shape === "rectangle" ? (
              <>
                <label>
                  Width{" "}
                  <input
                    aria-label="Width"
                    type="number"
                    value={dims[0]}
                    onChange={(e) =>
                      setDims([Number(e.target.value), dims[1], dims[2]])
                    }
                  />
                </label>
                <p>
                  <label>
                    Height{" "}
                    <input
                      aria-label="Height"
                      type="number"
                      value={dims[1]}
                      onChange={(e) =>
                        setDims([dims[0], Number(e.target.value), dims[2]])
                      }
                    />
                  </label>
                </p>
              </>
            ) : (
              ["A", "B", "C"].map((x, i) => (
                <p key={x}>
                  <label>
                    Side {x}{" "}
                    <input
                      aria-label={`Side ${x}`}
                      type="number"
                      value={dims[i]}
                      onChange={(e) =>
                        setDims(
                          dims.map((n, j) =>
                            j === i ? Number(e.target.value) : n,
                          ),
                        )
                      }
                    />
                  </label>
                </p>
              ))
            )}
            <p>
              <button onClick={reset}>Create Pattern</button>{" "}
              <button onClick={reset}>Reset Pattern</button>
            </p>
          </section>
          <hr />
          <section>
            <strong>GRID &amp; SNAP</strong>
            <p>
              <label>
                <input
                  type="checkbox"
                  checked={sheet.construction?.grid.visible ?? false}
                  onChange={(e) =>
                    setSheet(
                      updateGrid(sheet, { visible: e.target.checked }).value!,
                    )
                  }
                />{" "}
                Show Grid
              </label>
            </p>
            <label>
              Grid Type{" "}
              <select
                value={sheet.construction?.grid.type ?? "AUTO"}
                onChange={(e) =>
                  setSheet(
                    updateGrid(sheet, {
                      type: e.target.value as
                        | "AUTO"
                        | "CARTESIAN"
                        | "TRIANGULAR_60"
                        | "POLAR_REFERENCE",
                    }).value!,
                  )
                }
              >
                <option>AUTO</option>
                <option>CARTESIAN</option>
                <option>TRIANGULAR_60</option>
                <option>POLAR_REFERENCE</option>
              </select>
            </label>
            <p>
              <label>
                Grid Spacing{" "}
                <input
                  aria-label="Grid Spacing"
                  type="number"
                  min=".1"
                  step=".1"
                  value={sheet.construction?.grid.spacing ?? 1}
                  onChange={(e) => {
                    const r = updateGrid(sheet, {
                      spacing: Number(e.target.value),
                    });
                    if (r.value) setSheet(r.value);
                  }}
                />
              </label>
            </p>
            <label>
              <input
                type="checkbox"
                checked={sheet.construction?.grid.snapGrid ?? false}
                onChange={(e) =>
                  setSheet(
                    updateGrid(sheet, { snapGrid: e.target.checked }).value!,
                  )
                }
              />{" "}
              Snap Grid
            </label>
          </section>
          <hr />
          <section>
            <strong>CONSTRUCTION</strong>
            <p>
              {(
                [
                  "SELECT",
                  "POINT",
                  "SEGMENT",
                  "CIRCLE",
                  "SELECT_REGION",
                ] as Tool[]
              ).map((x) => (
                <button
                  key={x}
                  aria-pressed={tool === x}
                  onClick={() => {
                    drawStart.current = undefined;
                    setPendingPoint(undefined);
                    setPreview(undefined);
                    setTool(x);
                  }}
                >
                  {x.replaceAll("_", " ")}
                </button>
              ))}
            </p>
            <small>Point and Segment are the primary authoring workflow.</small>
          </section>
          {selectedSegment && (
            <>
              <hr />
              <section>
                <strong>SEMANTICS</strong>
                <p>Selected: {selectedSegment}</p>
                <button onClick={() => semantic("GUIDE")}>
                  Set as Guide
                </button>{" "}
                <button onClick={() => semantic("CUT")}>Set as Cut</button>{" "}
                <button onClick={() => semantic("CREASE")}>
                  Set as Crease
                </button>
              </section>
            </>
          )}
          {selectedCrease && (
            <>
              <hr />
              <section>
                <strong>SELECTED CREASE</strong>
                <p>{selectedCrease.id}</p>
                <label>
                  Assignment{" "}
                  <select
                    value={selectedCrease.assignment}
                    onChange={(e) =>
                      edit({ assignment: e.target.value as FoldAssignment })
                    }
                  >
                    <option>UNASSIGNED</option>
                    <option>MOUNTAIN</option>
                    <option>VALLEY</option>
                  </select>
                </label>
                <p>
                  Fold Side{" "}
                  <button
                    aria-pressed={selectedCrease.foldSide === "A"}
                    onClick={() => {
                      const r = updateCreaseFoldSide(
                        sheet,
                        selectedCrease.id,
                        "A",
                      );
                      if (r.value) setSheet(r.value);
                    }}
                  >
                    Side A
                  </button>{" "}
                  <button
                    aria-pressed={(selectedCrease.foldSide ?? "B") === "B"}
                    onClick={() => {
                      const r = updateCreaseFoldSide(
                        sheet,
                        selectedCrease.id,
                        "B",
                      );
                      if (r.value) setSheet(r.value);
                    }}
                  >
                    Side B
                  </button>
                </p>
                <label>
                  Target Angle{" "}
                  <input
                    type="range"
                    min="0"
                    max="180"
                    value={Math.round(
                      ((selectedCrease.targetAngleRadians ?? 0) * 180) /
                        Math.PI,
                    )}
                    onChange={(e) =>
                      edit({
                        targetAngleRadians:
                          (Number(e.target.value) * Math.PI) / 180,
                      })
                    }
                  />
                </label>
                <input
                  aria-label="Target angle"
                  type="number"
                  min="0"
                  max="180"
                  value={Math.round(
                    ((selectedCrease.targetAngleRadians ?? 0) * 180) / Math.PI,
                  )}
                  onChange={(e) =>
                    edit({
                      targetAngleRadians:
                        (Number(e.target.value) * Math.PI) / 180,
                    })
                  }
                />
                <p>
                  <button onClick={remove}>Delete Crease</button>
                </p>
              </section>
            </>
          )}
        </aside>
        <section style={{ ...box, minHeight: 620 }}>
          <p>
            <button onClick={() => setView("2D")}>2D Pattern</button>{" "}
            <button disabled={!scene} onClick={() => setView("3D")}>
              3D Folded
            </button>{" "}
            <button onClick={() => setView("2D")}>Fit to View</button>
          </p>
          {view === "2D" ? (
            <svg
              aria-label="Editable pattern canvas"
              data-source-shape={sheet.sourceShape?.type}
              data-grid-type={resolveGridType(
                sheet,
                sheet.construction?.grid.type ?? "AUTO",
              )}
              viewBox={`${-extent} ${-extent} ${2 * extent} ${2 * extent}`}
              style={{
                width: "100%",
                height: 520,
                touchAction: "none",
                background: TV.background,
              }}
              onPointerMove={(e) => {
                if (pendingPoint)
                  setPreview(snapConstructionPoint(sheet, point(e)));
              }}
              onPointerDown={(e) => {
                if (["POINT", "SEGMENT", "CIRCLE"].includes(tool)) {
                  constructionClick(e);
                  return;
                }
                if (tool === "DRAW_CREASE" || tool === "DRAW_CUT") {
                  drawStart.current = point(e);
                  e.currentTarget.setPointerCapture(e.pointerId);
                }
              }}
              onPointerUp={finish}
              onPointerCancel={() => {
                drawStart.current = undefined;
                setPendingPoint(undefined);
                setPreview(undefined);
              }}
            >
              {sheet.construction?.grid.visible &&
                Array.from(
                  { length: 21 },
                  (_, i) => -extent + (i * extent) / 10,
                ).flatMap((n, i) => (
                  <g key={i} opacity=".3">
                    <line
                      x1={n}
                      y1={-extent}
                      x2={n}
                      y2={extent}
                      stroke={TV.guide}
                      strokeWidth={extent / 400}
                    />
                    <line
                      x1={-extent}
                      y1={n}
                      x2={extent}
                      y2={n}
                      stroke={TV.guide}
                      strokeWidth={extent / 400}
                    />
                  </g>
                ))}
              {g.kind === "circle" ? (
                <circle
                  data-source-material="CIRCLE"
                  cx={g.center[0]}
                  cy={-g.center[1]}
                  r={g.radius}
                  fill={TV.surface}
                  fillOpacity=".85"
                  stroke={TV.boundary}
                  strokeWidth={extent / 80}
                />
              ) : (
                <polygon
                  data-source-material={
                    sheet.sourceShape?.type ?? g.kind.toUpperCase()
                  }
                  points={outline}
                  fill={TV.surface}
                  fillOpacity=".85"
                  stroke={TV.boundary}
                  strokeWidth={extent / 80}
                />
              )}{" "}
              {sheet.regions
                .filter((r) => r.status === "DISCARD_PREVIEW")
                .map((r) => (
                  <polygon
                    key={r.id}
                    points={r.vertices.map((p) => `${p[0]},${-p[1]}`).join(" ")}
                    fill={TV.discard}
                    fillOpacity=".35"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      setSelectedRegion(r.id);
                    }}
                  />
                ))}
              {showRemoved &&
                sheet.removedRegions?.map((r) => (
                  <polygon
                    key={`removed-${r.id}`}
                    points={r.vertices.map((p) => `${p[0]},${-p[1]}`).join(" ")}
                    fill={TV.ghost}
                    fillOpacity=".22"
                  />
                ))}
              {sheet.construction?.symmetryGuides.map((s) => (
                <line
                  key={s.id}
                  x1={s.points[0][0]}
                  y1={-extent}
                  x2={s.points[1][0]}
                  y2={extent}
                  stroke={TV.symmetry}
                  strokeDasharray={`${extent / 18} ${extent / 40} ${extent / 80} ${extent / 40}`}
                />
              ))}
              {sheet.construction?.segments.map((s) => {
                const a = sheet.construction!.points.find(
                    (p) => p.id === s.pointIds[0],
                  )!,
                  b = sheet.construction!.points.find(
                    (p) => p.id === s.pointIds[1],
                  )!;
                return (
                  <line
                    key={s.id}
                    x1={a.position[0]}
                    y1={-a.position[1]}
                    x2={b.position[0]}
                    y2={-b.position[1]}
                    stroke={
                      selectedSegment === s.id
                        ? TV.selected
                        : s.semantic === "GUIDE"
                          ? TV.guide
                          : s.semantic === "CUT"
                            ? TV.cut
                            : s.semantic === "CREASE"
                              ? TV.crease
                              : "#fff"
                    }
                    strokeWidth={
                      selectedSegment === s.id ? extent / 45 : extent / 80
                    }
                    strokeDasharray={
                      s.semantic === "GUIDE" || s.semantic === "CREASE"
                        ? `${extent / 30} ${extent / 45}`
                        : undefined
                    }
                    onPointerDown={(e) => {
                      if (tool === "SELECT") {
                        e.stopPropagation();
                        setSelectedSegment(s.id);
                      }
                    }}
                  />
                );
              })}
              {sheet.construction?.circles.map((c) => {
                const center = sheet.construction!.points.find(
                  (p) => p.id === c.centerPointId,
                )!;
                return (
                  <circle
                    key={c.id}
                    data-construction-circle={c.id}
                    cx={center.position[0]}
                    cy={-center.position[1]}
                    r={c.radius}
                    fill="none"
                    stroke={c.semantic === "CUT" ? TV.cut : TV.guide}
                    strokeDasharray={`${extent / 30} ${extent / 45}`}
                  />
                );
              })}
              {pendingPoint && preview && (
                <line
                  data-preview="construction"
                  x1={
                    sheet.construction?.points.find(
                      (p) => p.id === pendingPoint,
                    )?.position[0]
                  }
                  y1={
                    -(
                      sheet.construction?.points.find(
                        (p) => p.id === pendingPoint,
                      )?.position[1] ?? 0
                    )
                  }
                  x2={preview[0]}
                  y2={-preview[1]}
                  stroke={TV.selected}
                  strokeDasharray={`${extent / 40} ${extent / 50}`}
                  pointerEvents="none"
                />
              )}
              {sheet.construction?.points.map((p) => (
                <g key={p.id} data-point-label={normalizedSheet.construction?.points.find(x=>x.id===p.id)?.label} onPointerDown={(event)=>{if(tool==="SELECT"){event.stopPropagation();setSelectedPoint(p.id);setSelectedSegment(undefined);setSelectedRegion(undefined);setSelected(undefined);}}}>
                  <circle cx={p.position[0]} cy={-p.position[1]} r={selectedPoint===p.id?extent/48:extent/70} fill={selectedPoint===p.id?TV.selected:TV.boundary} stroke={TV.background} strokeWidth={extent/180}/>
                  {showLabels && (normalizedSheet.construction?.points.find(x=>x.id===p.id)?.labelVisible??true) && <text x={p.position[0]+extent/45} y={-p.position[1]-extent/45} fill="#fff" stroke={TV.background} strokeWidth={extent/260} paintOrder="stroke" fontSize={extent/18} fontWeight="700">{normalizedSheet.construction?.points.find(x=>x.id===p.id)?.label}</text>}
                </g>
              ))}
              {sheet.cuts.map((c) => (
                <line
                  key={c.id}
                  x1={c.points[0][0]}
                  y1={-c.points[0][1]}
                  x2={c.points.at(-1)![0]}
                  y2={-c.points.at(-1)![1]}
                  stroke={TV.cut}
                  strokeWidth={extent / 55}
                />
              ))}
              {sheet.creases.map((c) => (
                <line
                  key={c.id}
                  data-symmetry-pair={c.symmetryPairId}
                  x1={c.points[0][0]}
                  y1={-c.points[0][1]}
                  x2={c.points[1][0]}
                  y2={-c.points[1][1]}
                  stroke={
                    selectedCrease?.symmetryPairId &&
                    selectedCrease.symmetryPairId === c.symmetryPairId
                      ? TV.selected
                      : c.symmetryPairId
                        ? "#32C2B5"
                        : selected === c.id
                          ? TV.selected
                          : c.assignment === "VALLEY"
                            ? TV.valley
                            : TV.crease
                  }
                  strokeWidth={
                    selectedCrease?.symmetryPairId === c.symmetryPairId
                      ? extent / 45
                      : extent / 65
                  }
                  strokeDasharray={`${extent / 20} ${extent / 30}`}
                  onPointerDown={(e) => {
                    if (tool === "SELECT") {
                      e.stopPropagation();
                      setSelected(c.id);
                    }
                  }}
                />
              ))}
            </svg>
          ) : scene ? (
            <div ref={host} style={{ height: 520 }} />
          ) : (
            <p>
              Current cut components have no fold scene until a supported crease
              topology is present.
            </p>
          )}
          <p role="status">{message}</p>
        </section>
        <aside aria-label="Contextual inspector" style={box}>
          <section data-contextual-inspector>
            <strong>INSPECTOR</strong>
            {!selectedObject ? <p>Select an object to inspect its mathematical definition and valid actions.</p> : <>
              <h2 style={{fontSize:20,marginBottom:6}}>{selectedObject.type} {selectedObject.label}</h2>
              {selectedObject.type==="POINT" && <>
                <label>Name <input aria-label="Point name" key={`${selectedObject.id}-${selectedObject.label}`} defaultValue={selectedObject.label} onBlur={(event)=>{const result=renameDynamicObject(sheet,selectedObject.id,event.currentTarget.value);if(result.value){setSheet(result.value);setMessage(`Point renamed to ${event.currentTarget.value.trim()}. Internal identity preserved.`);}else setMessage(`${result.issues[0].code}: ${result.issues[0].message}`);}}/></label>
                <p>Coordinates: {(selectedObject.metadata.position as number[]).map(value=>value.toFixed(2)).join(", ")}<br/>Freedom: <strong>{selectedObject.freedom}</strong></p>
              </>}
              {selectedObject.type==="SEGMENT" && <p>Endpoints: {selectedObject.parents.map(id=>normalizedSheet.construction?.points.find(p=>p.id===id)?.label??id).join(" – ")}<br/>Role: <strong>{String(selectedObject.metadata.semantic)}</strong></p>}
              {selectedObject.type==="REGION" && <p>Status: <strong>{String(selectedObject.metadata.status)}</strong></p>}
              {selectedObject.type==="CREASE" && <p>Assignment: <strong>{String(selectedObject.metadata.assignment)}</strong><br/>Fold side: {String(selectedObject.metadata.foldSide??"B")}</p>}
              <p>Parents: {selectedObject.parents.map(id=>objects.find(x=>x.id===id)?.label??id).join(", ")||"none"}<br/>Children: {selectedObject.children.map(id=>objects.find(x=>x.id===id)?.label??id).join(", ")||"none"}</p>
              <details><summary>Advanced / Debug</summary><p>Internal ID: {selectedObject.id}<br/>Construction: {selectedObject.constructionKind}</p></details>
            </>}
          </section>
          <details open><summary>OBJECTS</summary><div data-object-list>{objects.map(object=><p key={`object-${object.id}`} style={{margin:"4px 0"}}><button aria-pressed={selectedObjectId===object.id} onClick={()=>{setSelectedPoint(object.type==="POINT"?object.id:undefined);setSelectedSegment(object.type==="SEGMENT"?object.id:undefined);setSelectedRegion(object.type==="REGION"?object.id:undefined);setSelected(object.type==="CREASE"?object.id:undefined);}}>{object.type==="POINT"?"●":object.type==="CIRCLE"?"○":"—"} {object.label}</button></p>)}</div></details>
          <details><summary>CONSTRUCTION HISTORY</summary><ol data-construction-history>{(normalizedSheet.construction?.operations??[]).map((operation,index)=><li key={operation.id}><button onClick={()=>{const id=operation.outputs[0];const object=objects.find(x=>x.id===id);if(object?.type==="POINT")setSelectedPoint(id);if(object?.type==="SEGMENT")setSelectedSegment(id);}}>{String(index+1).padStart(2,"0")} {operation.type.replaceAll("_"," ")}</button></li>)}</ol><button disabled={(normalizedSheet.construction?.points.length??0)<2} onClick={()=>{const points=normalizedSheet.construction!.points;const result=createMidpoint(normalizedSheet,points[0].id,points[1].id);if(result.value){setSheet(result.value);setSelectedPoint(result.value.construction!.points.at(-1)!.id);setMessage("Midpoint created with dependent freedom.");}}}>Midpoint of A–B</button></details>
          <hr />
          <section>
            <strong>REGIONS</strong>
            {sheet.regions.map((r) => (
              <p key={r.id}>
                <button
                  aria-pressed={selectedRegion === r.id}
                  onClick={() => setSelectedRegion(r.id)}
                >
                  {r.id}
                </button>{" "}
                — {r.status ?? "KEEP"}
              </p>
            ))}
            {selectedRegion && (
              <p>
                <button
                  onClick={() => {
                    const r = previewDiscardRegion(sheet, selectedRegion);
                    if (r.value) setSheet(r.value);
                  }}
                >
                  Discard Region
                </button>
              </p>
            )}
            <button
              onClick={() => {
                const r = applyDiscard(sheet);
                if (r.value) {
                  setSheet(r.value);
                  setSelectedRegion(undefined);
                } else setMessage(r.issues[0].message);
              }}
            >
              Apply Discard
            </button>{" "}
            <button onClick={() => setSheet(cancelDiscard(sheet).value!)}>
              Cancel Discard
            </button>
            <p>
              <label>
                <input
                  type="checkbox"
                  checked={showRemoved}
                  onChange={(e) => setShowRemoved(e.target.checked)}
                />{" "}
                Show Removed Material
              </label>
            </p>
          </section>
          <hr />
          <section>
            <strong>SYMMETRY</strong>
            <p>
              <button
                onClick={() => {
                  const r = addSymmetryGuide(sheet, "VERTICAL_AXIS");
                  if (r.value) setSheet(r.value);
                }}
              >
                Vertical
              </button>{" "}
              <button
                onClick={() => {
                  const r = addSymmetryGuide(sheet, "HORIZONTAL_AXIS");
                  if (r.value) setSheet(r.value);
                }}
              >
                Horizontal
              </button>
            </p>
            {sheet.construction?.symmetryGuides[0] && (
              <>
                <button
                  disabled={!sheet.construction?.points.length}
                  onClick={() => {
                    const p = sheet.construction!.points.at(-1)!;
                    const r = mirrorConstructionPoint(
                      sheet,
                      p.id,
                      sheet.construction!.symmetryGuides[0].id,
                    );
                    if (r.value) setSheet(r.value);
                  }}
                >
                  Mirror Last Point
                </button>{" "}
                <button
                  disabled={!selectedSegment}
                  onClick={() => {
                    const r = mirrorConstructionSegment(
                      sheet,
                      selectedSegment!,
                      sheet.construction!.symmetryGuides[0].id,
                    );
                    if (r.value) setSheet(r.value);
                    else setMessage(r.issues[0].message);
                  }}
                >
                  Mirror Segment
                </button>
              </>
            )}
          </section>
          <details>
            <summary>ADVANCED FOLD TARGETS &amp; ASSEMBLY</summary>
            <PatternAuthoringCompletionPanel
              sheet={sheet}
              onSheet={setSheet}
              sequence={sequence}
              onSequence={setSequence}
            />
          </details>
          <hr />
          <section>
            <strong>FOLD SEQUENCE</strong>
            <ol>
              {sequence.steps.map((s, i) => (
                <li key={s.creaseId}>
                  <button onClick={() => setSelected(s.creaseId)}>
                    {i + 1}. {s.creaseId}
                  </button>
                </li>
              ))}
            </ol>
            <p>
              <button onClick={() => move(-1)}>Move Up</button>{" "}
              <button onClick={() => move(1)}>Move Down</button>
            </p>
            <p>
              <button
                onClick={() => {
                  setView("3D");
                  setStep((x) => Math.max(-1, x - 1));
                  setProgress((x) => (x === 0 ? 1 : x));
                }}
              >
                Previous
              </button>{" "}
              <button
                onClick={() => {
                  setView("3D");
                  setStep((x) => Math.min(sequence.steps.length - 1, x + 1));
                  setProgress(1);
                }}
              >
                Next
              </button>
            </p>
            <button onClick={play}>Play</button>{" "}
            <button onClick={reverse}>Reverse</button>{" "}
            <button
              onClick={() => {
                setStep(-1);
                setProgress(0);
                setView("2D");
              }}
            >
              Reset Flat
            </button>
            <p>
              <label>
                Global Fold Progress {Math.round(progress * 100)}%
                <input
                  type="range"
                  min="0"
                  max="1"
                  step=".01"
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                />
              </label>
            </p>
          </section>
          <details>
            <summary>DEBUG</summary>
          <section>
            <p>
              Source:{" "}
              {sheet.sourceShape?.type ?? sheet.boundary.kind.toUpperCase()}
              <br />
              Grid:{" "}
              {resolveGridType(sheet, sheet.construction?.grid.type ?? "AUTO")}
              <br />
              Points: {sheet.construction?.points.length ?? 0}
              <br />
              Segments: {sheet.construction?.segments.length ?? 0}
              <br />
              Regions: {sheet.regions.map((r) => r.id).join(", ")}
              <br />
              Cuts: {sheet.cuts.length}
              <br />
              Creases: {sheet.creases.length}
            </p>
          </section>
          </details>
        </aside>
      </div>
    </main>
  );
}
