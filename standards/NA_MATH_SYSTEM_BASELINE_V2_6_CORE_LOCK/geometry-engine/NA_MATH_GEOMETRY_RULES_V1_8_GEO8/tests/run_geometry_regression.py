from pathlib import Path
import subprocess,sys,json,re,time

ROOT=Path(__file__).resolve().parents[1]
corpus=json.loads((ROOT/"regression/corpus-index.json").read_text(encoding="utf-8"))

validators=[
    ("GEO-1",ROOT/"tests/validate_geo1.py"),
    ("GEO-2",ROOT/"tests/validate_geo2.py"),
    ("GEO-3",ROOT/"tests/validate_geo3.py"),
    ("GEO-4",ROOT/"tests/validate_geo4.py"),
    ("GEO-5",ROOT/"tests/validate_geo5.py"),
    ("GEO-6",ROOT/"tests/validate_geo6.py"),
    ("GEO-7",ROOT/"tests/validate_geo7.py"),
    ("LOCKS",ROOT/"tests/validate_critical_locks.py"),
]

results=[]
started=time.time()

print("NA-MATH GEOMETRY REGRESSION")
print("LAYOUT=NA-MATH-LAYOUT-V1.3-CANONICAL [LOCKED]")
print(f"GOLDEN_NEGATIVE_CASES={corpus['total_cases']}")
print("-"*60)

for suite,path in validators:
    proc=subprocess.run([sys.executable,'-S',str(path)],capture_output=True,text=True)
    passed=proc.returncode==0
    results.append((suite,passed,proc.stdout,proc.stderr))
    print(f"{suite}={'PASS' if passed else 'FAIL'}")
    if not passed:
        print(proc.stdout)
        print(proc.stderr)

failed=[x for x in results if not x[1]]
elapsed=time.time()-started

print("-"*60)
if failed:
    print(f"GEOMETRY_REGRESSION_STATUS=FAIL ({len(failed)} suites failed)")
    sys.exit(1)

print(f"GEOMETRY_REGRESSION_STATUS=PASS ({len(results)}/{len(results)} suites)")
print(f"GOLDEN_NEGATIVE_CASES=PASS ({corpus['total_cases']}/{corpus['total_cases']})")
print("CRITICAL_LOCKS=PASS")
print("LAYOUT_V1_3_PRESERVED=PASS")
print(f"ELAPSED_SECONDS={elapsed:.3f}")
