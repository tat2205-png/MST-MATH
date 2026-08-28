export type StudioCapabilityStatus =
  | "AVAILABLE"
  | "UNAVAILABLE"
  | "OPTIONAL_RUNTIME_MISSING"
  | "DISABLED";

export interface StudioCapability {
  readonly id: string;
  readonly status: StudioCapabilityStatus;
  readonly reason?: string;
}

export interface StudioEngineRequest {
  readonly capability: string;
  readonly input: unknown;
}

export type StudioEngineResult =
  | {
      readonly status: "COMPLETED";
      readonly engineId: string;
      readonly capability: string;
      readonly output: unknown;
    }
  | {
      readonly status: "UNAVAILABLE" | "DENIED" | "FAILED";
      readonly engineId: string;
      readonly capability: string;
      readonly error: string;
    };

export interface StudioEngine {
  readonly id: string;
  capabilities(): Promise<readonly StudioCapability[]> | readonly StudioCapability[];
  execute(request: StudioEngineRequest): Promise<StudioEngineResult>;
}

export type StudioEngineFactory = () => Promise<StudioEngine> | StudioEngine;
