/** Account registration and login: bcrypt password hashing and JWT issuing. */

import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash } from 'node:crypto';
import { EmailService } from '../../email/services/email.service';
import {
  renderPasswordResetEmail,
  renderVerifyEmail,
} from '../../email/templates/email-templates';
import { PrismaService } from '../../prisma/services/prisma.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';

const BCRYPT_ROUNDS = 12;
const VERIFY_EMAIL_TTL = '24h';
const RESET_PASSWORD_TTL = '30m';

export interface AuthResult {
  accessToken: string;
  user: { id: string; email: string; emailVerified: boolean };
}

interface EmailTokenPayload {
  sub: string;
  purpose: 'verify-email' | 'reset-password';
  /** verify-email: the address being verified, so changing it invalidates old links. */
  email?: string;
  /** reset-password: fingerprint of the current hash, so a used link stops working. */
  pwd?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { email: dto.email, passwordHash },
    });

    await this.sendVerificationEmail(user.id, user.email);
    return this.buildAuthResult(user.id, user.email, false);
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResult(user.id, user.email, !!user.emailVerifiedAt);
  }

  async verifyEmail(token: string): Promise<{ emailVerified: true }> {
    const payload = this.readToken(token, 'verify-email');
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || user.email !== payload.email) {
      throw new BadRequestException('Invalid or expired verification link');
    }
    if (!user.emailVerifiedAt) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      });
    }
    return { emailVerified: true };
  }

  /** Always resolves, whether or not the account exists, so it can't be used to probe emails. */
  async resendVerification(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && !user.emailVerifiedAt) {
      await this.sendVerificationEmail(user.id, user.email);
    }
  }

  /** Always resolves, whether or not the account exists, so it can't be used to probe emails. */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return;

    const token = this.jwtService.sign(
      {
        sub: user.id,
        purpose: 'reset-password',
        pwd: fingerprint(user.passwordHash),
      } satisfies EmailTokenPayload,
      { expiresIn: RESET_PASSWORD_TTL },
    );
    await this.emailService.send(
      user.email,
      renderPasswordResetEmail({
        resetUrl: `${this.webUrl()}/reset-password?token=${token}`,
      }),
    );
  }

  async resetPassword(token: string, password: string): Promise<void> {
    const payload = this.readToken(token, 'reset-password');
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || payload.pwd !== fingerprint(user.passwordHash)) {
      throw new BadRequestException('Invalid or expired reset link');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
        // Receiving the reset email proves ownership of the address.
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
      },
    });
  }

  private async sendVerificationEmail(
    userId: string,
    email: string,
  ): Promise<void> {
    const token = this.jwtService.sign(
      {
        sub: userId,
        purpose: 'verify-email',
        email,
      } satisfies EmailTokenPayload,
      { expiresIn: VERIFY_EMAIL_TTL },
    );
    await this.emailService.send(
      email,
      renderVerifyEmail({
        verifyUrl: `${this.webUrl()}/verify-email?token=${token}`,
      }),
    );
  }

  private readToken(
    token: string,
    purpose: EmailTokenPayload['purpose'],
  ): EmailTokenPayload {
    try {
      const payload = this.jwtService.verify<EmailTokenPayload>(token);
      if (payload.purpose === purpose) return payload;
    } catch {
      // fall through
    }
    throw new BadRequestException(
      purpose === 'verify-email'
        ? 'Invalid or expired verification link'
        : 'Invalid or expired reset link',
    );
  }

  private webUrl(): string {
    return this.configService.get<string>('webUrl') ?? 'http://localhost:3001';
  }

  private buildAuthResult(
    userId: string,
    email: string,
    emailVerified: boolean,
  ): AuthResult {
    const accessToken = this.jwtService.sign({ sub: userId, email });
    return { accessToken, user: { id: userId, email, emailVerified } };
  }
}

function fingerprint(passwordHash: string): string {
  return createHash('sha256').update(passwordHash).digest('hex').slice(0, 16);
}
