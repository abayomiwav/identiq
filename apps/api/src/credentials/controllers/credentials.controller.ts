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
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CredentialsService } from './credentials.service';
import { IssueCredentialDto } from './dto/issue-credential.dto';

@ApiTags('credentials')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('credentials')
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  @Post()
  issue(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: IssueCredentialDto,
  ) {
    return this.credentialsService.issueCredential(user.userId, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.credentialsService.listMyCredentials(user.userId);
  }

  @Delete(':id')
  revoke(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.credentialsService.revokeCredential(user.userId, id);
  }
}
