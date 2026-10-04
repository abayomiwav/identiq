import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  ApiCreatedResponse,
  ApiTooManyRequestsResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthResult, AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';

/** Credential endpoints are brute-force targets: 5 requests/minute per client. */
const AUTH_THROTTLE = { default: { ttl: 60_000, limit: 5 } };

@ApiTags('auth')
@Controller('auth')
@Throttle(AUTH_THROTTLE)
@ApiTooManyRequestsResponse({ description: 'Rate limit exceeded.' })
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
}
