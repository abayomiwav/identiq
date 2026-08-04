import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AppsService } from './apps.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateAppDto } from './dto/create-app.dto';

@ApiTags('apps')
@Controller('apps')
export class AppsController {
  constructor(private readonly appsService: AppsService) {}

  /** Unauthenticated — backs the consent screen, which any signed-in user (not just the app owner) must be able to load. */
  @Get(':id/public')
  getPublic(@Param('id') id: string) {
    return this.appsService.getPublicApp(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  register(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAppDto) {
    return this.appsService.registerApp(user.userId, dto);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.appsService.listMyApps(user.userId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  get(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.appsService.getMyApp(user.userId, id);
  }

  @Post(':id/rotate-key')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  rotateKey(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.appsService.regenerateApiKey(user.userId, id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.appsService.deleteApp(user.userId, id);
  }
}
