import { useMemo, useState } from "react";
import { buildUnitCircleConstruction, exportUnitCircleGgb, type AngleUnit } from "../../modules/geogebra/unit-circle.js";

export default function GeoGebraUnitCircleView() {
  const [angle, setAngle] = useState("45");
  const [unit, setUnit] = useState<AngleUnit>("DEG");
  const [size, setSize] = useState(640);
  const construction = useMemo(() => { try { return buildUnitCircleConstruction(Number(angle), unit, { width: size, height: Math.round(size * .75) }); } catch { return undefined; } }, [angle, unit, size]);
  return <main data-geogebra-unit-circle style={{ padding: 24, fontFamily: "system-ui", maxWidth: 900, margin: "auto" }}>
    <h1>Đường tròn lượng giác đơn vị</h1>
    <p>Geometry authority: MST-MATH construction IR · GeoGebra là adapter hiển thị.</p>
    <label>Góc <input aria-label="Góc" value={angle} onChange={(e) => setAngle(e.target.value)} /></label>{" "}
    <label>Đơn vị <select aria-label="Đơn vị" value={unit} onChange={(e) => setUnit(e.target.value as AngleUnit)}><option value="DEG">Độ</option><option value="RAD">Radian</option></select></label>{" "}
    <label>Kích thước <input aria-label="Kích thước" type="number" min="240" value={size} onChange={(e) => setSize(Number(e.target.value))} /></label>
    {construction ? <><svg width={construction.view.width} height={construction.view.height} viewBox="-1.2 -1.2 2.4 2.4" style={{ maxWidth: "100%", border: "1px solid #ccd" }} role="img" aria-label="Đường tròn lượng giác"><circle cx="0" cy="0" r="1" fill="none" stroke="#345" /><line x1="0" y1="0" x2={construction.point.x} y2={-construction.point.y} stroke="#c33" /><circle cx={construction.point.x} cy={-construction.point.y} r=".035" fill="#c33" /><text x={construction.point.x + .05} y={-construction.point.y - .05} fontSize=".12">{construction.labelLatex}</text></svg><p data-unit-circle-point>{`P=(${construction.point.x.toFixed(6)}, ${construction.point.y.toFixed(6)}) · ${construction.labelPosition}`}</p><button onClick={() => { const blob = new Blob([exportUnitCircleGgb(construction)], { type: "application/vnd.geogebra.file" }); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "mst-math-unit-circle.ggb"; link.click(); URL.revokeObjectURL(link.href); }}>Export .ggb</button></> : <p role="alert">Góc hoặc kích thước không hợp lệ.</p>}
  </main>;
}
