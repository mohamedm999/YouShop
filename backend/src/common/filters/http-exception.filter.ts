import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { apiError } from '../helpers/api-error.helper';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        // Safe type assertion for standard NestJS exception response
        const resp = exceptionResponse as { message?: string | string[]; errors?: unknown };
        
        // Handle array of messages (e.g. from ValidationPipe)
        if (Array.isArray(resp.message)) {
          message = 'Validation Error';
          errors = resp.message;
        } else {
          message = (resp.message as string) || message;
          errors = resp.errors || null;
        }
      }
    }

    response.status(status).json(
      apiError(message, errors),
    );
  }
}
