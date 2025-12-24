import { Controller, Get } from '@nestjs/common';
import type { ApiResponse } from '../../../common/interfaces/api-response.interface';
import { apiResponse } from '../../../common/helpers/api-response.helper';

@Controller('auth')
export class AuthController {

  @Get('test')
  test(): ApiResponse<string> {
    return apiResponse('Auth module works');
  }
}
