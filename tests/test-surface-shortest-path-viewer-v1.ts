import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const source=readFileSync(new URL("../src/components/dev/Fold3DViewer.tsx",import.meta.url),"utf8");
for(const text of ["SELECT_START","SELECT_END","ADD_WAYPOINT","Select Start","Select End","Add Waypoint","Remove Last","Clear Waypoints","Find Shortest Path","Unfold Selected Route","Show Candidates","CLOCKWISE","COUNTERCLOCKWISE","polyhedralIntersectionToSurfacePoint","curvedIntersectionToSurfacePoint","solveSurfaceShortestPath","shortest-path-overlay","canonicalPointId"])assert.ok(source.includes(text),text);
assert.match(source,/geometry\?\.dispose\(\)/);assert.match(source,/material\?\.dispose\(\)/);assert.match(source,/removeEventListener\("click"/);
console.log("SURFACE_SHORTEST_PATH_VIEWER_V1_TESTS=PASS");
