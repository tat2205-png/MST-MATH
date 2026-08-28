import type { DevelopableFoldScene, FoldTopology, RouteStripLayout, Vec2, Vec3 } from "../fold-3d/index.js";

export type PathExactness="EXACT_SUPPORTED"|"PARTIAL_SUPPORTED"|"UNSUPPORTED";
export type AttachmentType="VERTEX"|"EDGE"|"FACE"|"CURVED_SURFACE"|"DISK";
export interface CanonicalSurfacePoint{id:string;solidId:string;surfaceId:string;attachmentType:AttachmentType;localCoordinates:{kind:"face_barycentric";vertexIds:string[];weights:number[]}|{kind:"curved";theta:number;longitudinal:number}|{kind:"disk_xy";x:number;y:number};incidentSurfaceIds?:string[];worldCoordinates?:Vec3;provenance:"source"|"user"|"derived";metadata?:Record<string,unknown>;}
export interface PathWaypoint extends CanonicalSurfacePoint{order:number;required:true;}
export interface UnfoldDirective{mode:"AUTO"|"MANUAL";rootSurfaceId?:string;surfaceSequence?:string[];seamTheta?:number;direction?:"CLOCKWISE"|"COUNTERCLOCKWISE";}
export interface SurfaceCrossing{id:string;type:"SURFACE_CROSSING";edgeId?:string;surfaceFrom:string;surfaceTo:string;point2D:Vec2;worldCoordinates?:Vec3;pathParameter:number;}
export interface PathCandidate{id:string;surfaceSequence:string[];path2D:Vec2[];path3D:Vec3[];crossingPoints:SurfaceCrossing[];length:number;valid:boolean;rejectionReason?:string;exactness:PathExactness;periodicCopy?:number;unfoldedScene?:RouteStripLayout;}
export interface ShortestPathSegment{startPoint:CanonicalSurfacePoint;endPoint:CanonicalSurfacePoint;candidates:PathCandidate[];selectedCandidate?:PathCandidate;length:number;}
export interface ShortestPathResult{status:"PASS"|"FAIL"|"PARTIAL_SUPPORTED"|"UNSUPPORTED";exactness:PathExactness;startPoint:CanonicalSurfacePoint;endPoint:CanonicalSurfacePoint;waypoints:PathWaypoint[];segments:ShortestPathSegment[];selectedRoute:string[];candidateRoutes:PathCandidate[];tiedMinimumCandidateIds:string[];path2D:Vec2[];path3D:Vec3[];crossingPoints:SurfaceCrossing[];length:number;unfoldDirective:UnfoldDirective;metadata:{candidateCount:number;validCandidateCount:number;orderedWaypointsPreserved:boolean;periodicSearchRange?:[-2,2]};issues:Array<{code:string;message:string}>;}
export type ShortestPathSurface={kind:"polyhedral";topology:FoldTopology}|{kind:"developable";scene:DevelopableFoldScene};
export interface ShortestPathRequest{surface:ShortestPathSurface;startPoint:CanonicalSurfacePoint;endPoint:CanonicalSurfacePoint;waypoints?:PathWaypoint[];directive?:UnfoldDirective;maxCandidates?:number;}
