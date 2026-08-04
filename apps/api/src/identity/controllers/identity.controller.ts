import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ConfirmRegistrationDto } from '../dto/confirm-registration.dto';
import { CreateIdentityDto } from '../dto/create-identity.dto';
import { IdentityService } from '../services/identity.service';

@ApiTags('identity')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('identity')
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateIdentityDto,
  ) {
    return this.identityService.createIdentity(user.userId, dto);
  }

  @Post('confirm')
  confirm(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ConfirmRegistrationDto,
  ) {
    return this.identityService.confirmRegistration(user.userId, dto);
  }

  @Get('me')
  getMine(@CurrentUser() user: AuthenticatedUser) {
    return this.identityService.getMyIdentity(user.userId);
  }

  @Get('me/reputation')
  getMyReputation(@CurrentUser() user: AuthenticatedUser) {
    return this.identityService.getReputation(user.userId);
  }
}
