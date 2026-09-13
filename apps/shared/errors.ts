// Standard error response shape matching API contracts
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export const ErrorCode = {
  AUTH_REQUIRED: "AUTH_REQUIRED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  AI_PROVIDER_ERROR: "AI_PROVIDER_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;
