import type { ApiError } from '../../../shared/api/index.ts';

export function createApiError(code: string, message: string): ApiError {
  return {
    error: {
      code,
      message,
    },
  };
}
