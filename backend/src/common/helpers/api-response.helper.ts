import { ApiResponse } from '../interfaces/api-response.interface';

export function apiResponse<T>(
  data: T,
  message = 'Success',
): ApiResponse<T> {
  return {
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}
