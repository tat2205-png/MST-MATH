import type { Mat4, Vec2, Vec3 } from "./types.js";

export const EPSILON = 1e-8;
export const add3 = (a: Vec3,b: Vec3): Vec3 => [a[0]+b[0],a[1]+b[1],a[2]+b[2]];
export const sub3 = (a: Vec3,b: Vec3): Vec3 => [a[0]-b[0],a[1]-b[1],a[2]-b[2]];
export const scale3 = (a: Vec3,s: number): Vec3 => [a[0]*s,a[1]*s,a[2]*s];
export const dot3 = (a: Vec3,b: Vec3) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
export const cross3 = (a: Vec3,b: Vec3): Vec3 => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
export const length3 = (a: Vec3) => Math.hypot(a[0],a[1],a[2]);
export const normalize3 = (a: Vec3): Vec3 => { const length=length3(a); if (!Number.isFinite(length)||length<EPSILON) throw new Error("INVALID_VECTOR"); return scale3(a,1/length); };
export const distance3 = (a: Vec3,b: Vec3) => length3(sub3(a,b));
export const distance2 = (a: Vec2,b: Vec2) => Math.hypot(a[0]-b[0],a[1]-b[1]);

export const identity4 = (): Mat4 => [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
export function multiply4(a: Mat4,b: Mat4): Mat4 { const output=Array(16).fill(0); for(let row=0;row<4;row++)for(let col=0;col<4;col++)for(let k=0;k<4;k++)output[row*4+col]+=a[row*4+k]*b[k*4+col]; return output as Mat4; }
export function transformPoint(matrix: Mat4,p: Vec3): Vec3 { return [matrix[0]*p[0]+matrix[1]*p[1]+matrix[2]*p[2]+matrix[3],matrix[4]*p[0]+matrix[5]*p[1]+matrix[6]*p[2]+matrix[7],matrix[8]*p[0]+matrix[9]*p[1]+matrix[10]*p[2]+matrix[11]]; }
export function rotationAroundAxis(pivot: Vec3,axisInput: Vec3,angle: number): Mat4 {
  const [x,y,z]=normalize3(axisInput), c=Math.cos(angle),s=Math.sin(angle),t=1-c;
  const rotation: Mat4=[t*x*x+c,t*x*y-s*z,t*x*z+s*y,0, t*x*y+s*z,t*y*y+c,t*y*z-s*x,0, t*x*z-s*y,t*y*z+s*x,t*z*z+c,0, 0,0,0,1];
  const rotated=transformPoint(rotation,pivot); rotation[3]=pivot[0]-rotated[0]; rotation[7]=pivot[1]-rotated[1]; rotation[11]=pivot[2]-rotated[2]; return rotation;
}
export const normal3 = (points: Vec3[]): Vec3 => normalize3(cross3(sub3(points[1],points[0]),sub3(points[2],points[0])));
export const normal2As3 = (points: Vec2[]): Vec3 => [0,0,Math.sign((points[1][0]-points[0][0])*(points[2][1]-points[0][1])-(points[1][1]-points[0][1])*(points[2][0]-points[0][0]))||1];
export const orientedAngle = (a: Vec3,b: Vec3,axis: Vec3) => Math.atan2(dot3(normalize3(axis),cross3(a,b)),Math.max(-1,Math.min(1,dot3(a,b))));
export const normalizeAngle = (angle:number) => { while(angle<=-Math.PI)angle+=2*Math.PI; while(angle>Math.PI)angle-=2*Math.PI; return angle; };
export const finiteMatrix = (matrix: Mat4) => matrix.every(Number.isFinite);
