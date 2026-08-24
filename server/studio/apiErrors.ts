export type StudioApiErrorCode =
  | "INVALID_REQUEST"
  | "CAPABILITY_DISABLED"
  | "ENGINE_UNAVAILABLE"
  | "RUNTIME_MISSING"
  | "PLANNING_FAILED"
  | "ROUTING_FAILED"
  | "VALIDATION_FAILED"
  | "EXECUTION_FAILED";

export class StudioApiError extends Error {
  constructor(
    readonly code: StudioApiErrorCode,
    message: string,
    readonly httpStatus: number,
  ) {
    super(message);
    this.name = "StudioApiError";
  }
}
