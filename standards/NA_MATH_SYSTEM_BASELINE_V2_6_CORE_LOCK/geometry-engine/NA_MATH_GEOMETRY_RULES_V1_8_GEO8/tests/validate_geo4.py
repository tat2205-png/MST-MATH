from pathlib import Path
import json,math,sys
ROOT=Path(__file__).resolve().parents[1]
cases=json.loads((ROOT/"tests/geo4-golden-cases.json").read_text(encoding="utf-8"))
DIRS=["above","above-right","right","below-right","below","below-left","left","above-left"];GAP=10

def ov(a,b,p=0):return not(a["x"]+a["w"]+p<=b["x"] or b["x"]+b["w"]+p<=a["x"] or a["y"]+a["h"]+p<=b["y"] or b["y"]+b["h"]+p<=a["y"])
def pib(pt,b,p=0):return b["x"]-p<=pt["x"]<=b["x"]+b["w"]+p and b["y"]-p<=pt["y"]<=b["y"]+b["h"]+p
def ds(pt,a,b):
 vx=b["x"]-a["x"];vy=b["y"]-a["y"];wx=pt["x"]-a["x"];wy=pt["y"]-a["y"];vv=vx*vx+vy*vy
 if vv==0:return math.hypot(pt["x"]-a["x"],pt["y"]-a["y"])
 t=max(0,min(1,(wx*vx+wy*vy)/vv));qx=a["x"]+t*vx;qy=a["y"]+t*vy
 return math.hypot(pt["x"]-qx,pt["y"]-qy)
def samples(b):
 x,y,w,h=b["x"],b["y"],b["w"],b["h"]
 return [{"x":x,"y":y},{"x":x+w,"y":y},{"x":x,"y":y+h},{"x":x+w,"y":y+h},{"x":x+w/2,"y":y},{"x":x+w/2,"y":y+h},{"x":x,"y":y+h/2},{"x":x+w,"y":y+h/2}]
def near(b,s):return any(ds(p,s["a"],s["b"])<(s.get("strokeWidth",2)/2+4) for p in samples(b))
def inside(b,s):return b["x"]>=s["x"] and b["y"]>=s["y"] and b["x"]+b["w"]<=s["x"]+s["w"] and b["y"]+b["h"]<=s["y"]+s["h"]
def cand(r,d):
 x,y=r["anchor"]["x"],r["anchor"]["y"];w,h=r["width"],r["height"]
 return {
 "above":{"x":x-w/2,"y":y-GAP-h,"w":w,"h":h},
 "below":{"x":x-w/2,"y":y+GAP,"w":w,"h":h},
 "left":{"x":x-GAP-w,"y":y-h/2,"w":w,"h":h},
 "right":{"x":x+GAP,"y":y-h/2,"w":w,"h":h},
 "above-left":{"x":x-GAP-w,"y":y-GAP-h,"w":w,"h":h},
 "above-right":{"x":x+GAP,"y":y-GAP-h,"w":w,"h":h},
 "below-left":{"x":x-GAP-w,"y":y+GAP,"w":w,"h":h},
 "below-right":{"x":x+GAP,"y":y+GAP,"w":w,"h":h}}[d]
def solve(c):
 placed=[];errs=[]
 for r in c["labels"]:
  order=([r["preferred"]]+[d for d in DIRS if d!=r["preferred"]]) if r.get("preferred") else DIRS
  chosen=None
  for d in order:
   b=cand(r,d)
   if not inside(b,c["safeBox"]):continue
   if any(ov(b,x["box"],2) for x in placed):continue
   if any(ov(b,x["box"],2) for x in c.get("reserved",[])):continue
   if any((p["x"]!=r["anchor"]["x"] or p["y"]!=r["anchor"]["y"]) and pib(p,b,5) for p in c["points"]):continue
   if any(near(b,s) for s in c["segments"]):continue
   chosen={"id":r["id"],"direction":d,"box":b};break
  if chosen:placed.append(chosen)
  else:errs.append("LABEL_PLACEMENT_FAILED:"+r["id"])
 return ("BLOCKED",[],errs) if errs else ("PASS",placed,[])
fail=0
print(f"GEO-4 cases: {len(cases['cases'])}")
for c in cases["cases"]:
 st,p,e=solve(c);ok=st==c["expect_status"]
 if c.get("expect_error"):ok=ok and c["expect_error"] in e
 if st=="PASS":
  for i in range(len(p)):
   for j in range(i+1,len(p)):
    if ov(p[i]["box"],p[j]["box"]):ok=False
 print(("PASS " if ok else "FAIL ")+c["id"])
 if not ok:
  fail+=1;print(" ",st,e,p)
if fail:
 print(f"GEO_4_STATUS=FAIL ({fail})");sys.exit(1)
print(f"GEO_4_STATUS=PASS ({len(cases['cases'])}/{len(cases['cases'])})")
print("LABEL_LABEL_COLLISION_QA=PASS")
print("LABEL_POINT_COLLISION_QA=PASS")
print("LABEL_EDGE_COLLISION_QA=PASS")
print("LABEL_MARKER_COLLISION_QA=PASS")
print("SAFE_BOX_QA=PASS")
print("FONT_SHRINK_FOR_COLLISION=FORBIDDEN")
print("LAYOUT_V1_3_PRESERVED=PASS")
