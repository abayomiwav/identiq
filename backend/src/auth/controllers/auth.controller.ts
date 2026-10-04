/** Account endpoints: register and log in, both returning a JWT. */

import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthResult, AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import {
  EmailOnlyDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from '../dto/token.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiCreatedResponse({
    description: 'Account created. Returns a JWT access token.',
  })
  register(@Body() dto: RegisterDto): Promise<AuthResult> {
    return this.authService.register(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Returns a JWT access token.' })
  @ApiUnauthorizedResponse({ description: 'Invalid email or password.' })
  login(@Body() dto: LoginDto): Promise<AuthResult> {
    return this.authService.login(dto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Email address marked as verified.' })
  verifyEmail(@Body() dto: VerifyEmailDto): Promise<{ emailVerified: true }> {
    return this.authService.verifyEmail(dto.token);
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({
    description: 'Sends a new link if the account exists and is unverified.',
  })
  resendVerification(@Body() dto: EmailOnlyDto): Promise<void> {
    return this.authService.resendVerification(dto.email);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({
    description: 'Emails a reset link if the account exists.',
  })
  forgotPassword(@Body() dto: EmailOnlyDto): Promise<void> {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Password updated.' })
  resetPassword(@Body() dto: ResetPasswordDto): Promise<void> {
    return this.authService.resetPassword(dto.token, dto.password);
  }
}
