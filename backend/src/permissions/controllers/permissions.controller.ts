import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import type { AuthenticatedApp } from '../../common/guards/api-key.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CurrentApp } from '../../common/decorators/current-app.decorator';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CheckAccessDto,
  GrantPermissionDto,
} from '../dto/grant-permission.dto';
import { PermissionsService } from '../services/permissions.service';

@ApiTags('permissions')
@Controller('permissions')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  grant(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: GrantPermissionDto,
  ) {
    return this.permissionsService.grantPermission(user.userId, dto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.permissionsService.listMyGrants(user.userId);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  revoke(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.permissionsService.revokePermission(user.userId, id);
  }

  @Post('check')
  @ApiSecurity('api-key')
  @UseGuards(ApiKeyGuard)
  checkAccess(
    @CurrentApp() app: AuthenticatedApp,
    @Body() dto: CheckAccessDto,
  ) {
    return this.permissionsService.checkAccess(app.appId, dto);
  }
}
