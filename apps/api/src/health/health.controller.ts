import { Controller, Get } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

@Controller('health')
export class HealthController {
  @Get()
  @ApiExcludeEndpoint()
  check() {
    return {
      status: 'ok',
      service: 'identiq-api',
      timestamp: new Date().toISOString(),
    };
  }
}
