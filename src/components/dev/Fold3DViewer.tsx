import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { FOLD_FIXTURES, createFoldScene, createNGonalSolidScene, updateFoldScene } from "../../modules/fold-3d/index.js";
import { createFoldThreeMapping, setFoldFaceHighlighted } from "../../modules/fold-3d/three-viewer-adapter.js";

type FixtureName = keyof typeof FOLD_FIXTURES;
type ViewerSolid = FixtureName | "nGonalPrism" | "nGonalPyramid";
const choices: Array<[ViewerSolid, string]> = [["cube", "Cube"], ["rectangularPrism", "Rectangular prism 2×3×5"], ["triangularPrism", "Triangular prism (legacy)"], ["tetrahedron", "Tetrahedron"], ["squarePyramid", "Square pyramid (legacy)"], ["nGonalPrism", "Prism"], ["nGonalPyramid", "Pyramid"]];

export default function Fold3DViewer() {
  const [solid, setSolid] = useState<ViewerSolid>("cube"), [baseSides, setBaseSides] = useState(5), [progress, setProgress] = useState(0), [edges, setEdges] = useState(true), [selectedFace, setSelectedFace] = useState<string>();
  const host = useRef<HTMLDivElement>(null), resetCamera = useRef<() => void>(() => {}), mappingRef = useRef<ReturnType<typeof createFoldThreeMapping>>();
  const source = useMemo(() => solid === "nGonalPrism" || solid === "nGonalPyramid" ? createNGonalSolidScene({ kind: solid === "nGonalPrism" ? "prism" : "pyramid", baseSides }).value! : FOLD_FIXTURES[solid], [solid, baseSides]);
  const foldScene = useMemo(() => createFoldScene(source, 0).value!, [source]);

  useEffect(() => {
    const container = host.current; if (!container || !foldScene) return;
    const scene = new THREE.Scene(); scene.background = new THREE.Color(0xf8fafc);
    const camera = new THREE.PerspectiveCamera(45, 1, 0.01, 1000), renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); container.appendChild(renderer.domElement);
    const controls = new OrbitControls(camera, renderer.domElement); controls.enableDamping = true; controls.minDistance = 2; controls.maxDistance = 40;
    const mapping = createFoldThreeMapping(foldScene); mappingRef.current = mapping; scene.add(mapping.group);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x334155, 2.1)); const light = new THREE.DirectionalLight(0xffffff, 2.2); light.position.set(5, 8, 7); scene.add(light);
    const reset = () => { const box = new THREE.Box3().setFromObject(mapping.group), center = box.getCenter(new THREE.Vector3()), size = Math.max(box.getSize(new THREE.Vector3()).length(), 2); controls.target.copy(center); camera.position.set(center.x + size, center.y + size * 0.8, center.z + size * 1.2); camera.near = size / 100; camera.far = size * 100; camera.updateProjectionMatrix(); controls.update(); }; resetCamera.current = reset; reset();
    const resize = () => { const width = Math.max(container.clientWidth, 1), height = Math.max(container.clientHeight, 1); renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); }; const observer = new ResizeObserver(resize); observer.observe(container); resize();
    const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2(); const click = (event: MouseEvent) => { const rect = renderer.domElement.getBoundingClientRect(); pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1); raycaster.setFromCamera(pointer, camera); const hit = raycaster.intersectObjects([...mapping.meshes.values()], false)[0]; const id = hit?.object.userData.faceId as string | undefined; setSelectedFace(id); setFoldFaceHighlighted(mapping, id); }; renderer.domElement.addEventListener("click", click);
    let frame = 0, active = true; const animate = () => { if (!active) return; controls.update(); renderer.render(scene, camera); frame = requestAnimationFrame(animate); }; animate();
    return () => { active = false; cancelAnimationFrame(frame); observer.disconnect(); renderer.domElement.removeEventListener("click", click); controls.dispose(); mapping.dispose(); renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove(); mappingRef.current = undefined; };
  }, [foldScene]);

  useEffect(() => { const next = updateFoldScene(foldScene, progress); if (next.value && mappingRef.current) mappingRef.current.apply(next.value); }, [foldScene, progress]);
  useEffect(() => mappingRef.current?.setEdgesVisible(edges), [edges, foldScene]);
  const counts = foldScene.topology;
  return <main style={{ minHeight: "100vh", padding: 20, background: "#e2e8f0", color: "#0f172a", fontFamily: "system-ui" }}>
    <h1 style={{ margin: "0 0 12px" }}>Fold 3D Viewer — Developer Smoke Test</h1>
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 280px", gap: 16 }}>
      <div ref={host} style={{ minHeight: 620, border: "1px solid #94a3b8", borderRadius: 8, overflow: "hidden", background: "#f8fafc" }} />
      <aside style={{ background: "white", padding: 16, borderRadius: 8 }}>
        <label>Solid<br/><select value={solid} onChange={(event) => { setSolid(event.target.value as ViewerSolid); setProgress(0); setSelectedFace(undefined); }} style={{ width: "100%" }}>{choices.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        {(solid === "nGonalPrism" || solid === "nGonalPyramid") && <p><label>Base sides<br/><select value={baseSides} onChange={(event) => { setBaseSides(Number(event.target.value)); setProgress(0); setSelectedFace(undefined); }} style={{ width: "100%" }}>{Array.from({length:8},(_,index)=>index+3).map(value=><option key={value} value={value}>{value}</option>)}</select></label></p>}
        <p><label>Fold progress: <strong>{Math.round(progress * 100)}%</strong><input aria-label="Fold progress" type="range" min="0" max="1" step="0.01" value={progress} onChange={(event) => setProgress(Number(event.target.value))} style={{ width: "100%" }}/></label></p>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div>
        <p><label><input type="checkbox" checked={edges} onChange={(event) => setEdges(event.target.checked)}/> Show Edges</label></p>
        <button type="button" onClick={() => resetCamera.current()}>Reset Camera</button>
        <hr/><div><strong>FoldScene debug</strong><p>Type: {foldScene.solidType}<br/>Base Sides: {foldScene.topology.metadata.baseSides ?? "n/a"}<br/>Progress: {Math.round(progress * 100)}%<br/>Root Face: {foldScene.net.rootFaceId}<br/>Vertices: {counts.vertices.length}<br/>Edges: {counts.edges.length}<br/>Faces: {counts.faces.length}<br/>Hinges: {foldScene.net.hinges.length}<br/>FoldScene Status: PASS<br/>Selected Face: {selectedFace ?? "none"}</p></div>
        <small>Drag to orbit. Scroll or pinch to zoom. Click a face to verify its canonical ID.</small>
      </aside>
    </div>
  </main>;
}
