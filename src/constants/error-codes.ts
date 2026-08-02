export const COMMON_ERRORS = {
  UNDEFINED: 'UNDEFINED_ERROR',
} as const;

export type CommonErrorCode =
  (typeof COMMON_ERRORS)[keyof typeof COMMON_ERRORS];
