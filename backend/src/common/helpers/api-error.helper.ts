import { ApiErrorResponse } from '../interfaces/api-error.interface';

export function apiError(
  message: string,
  errors?: unknown,
): ApiErrorResponse {
  return {
    message,
    errors,
    timestamp: new Date().toISOString(),
  };
}
