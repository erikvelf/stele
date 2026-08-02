export interface AppError {
  code: string;
  cause?: string;
}

export type Result<T> =
  { success: true; data: T } | { success: false; error: AppError };

export function ok<T>(data: T): Result<T> {
  return { success: true, data };
}

export function err(code: string, cause?: string): Result<never> {
  return { success: false, error: { code, cause } };
}

// Array.filter narrows element types only when its callback is a type predicate.
export function isOk<T>(
  result: Result<T>
): result is Extract<Result<T>, { success: true }> {
  return result.success;
}
