import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { EmailService } from '../../email/services/email.service';
import { PrismaService } from '../../prisma/services/prisma.service';
import { AuthService } from './auth.service';

/** Pulls the `token` query param out of the link in the last email sent. */
function tokenFromLastEmail(send: jest.Mock): string {
  const [, rendered] = send.mock.calls.at(-1) as [string, { html: string }];
  const match = /token=([^"&]+)/.exec(rendered.html);
  if (!match) throw new Error('no token link in email');
  return match[1];
}

describe('AuthService email verification + password reset', () => {
  let service: AuthService;
  let send: jest.Mock;
  let user: {
    id: string;
    email: string;
    passwordHash: string;
    emailVerifiedAt: Date | null;
  };
  let prisma: {
    user: { findUnique: jest.Mock; create: jest.Mock; update: jest.Mock };
  };

  beforeEach(async () => {
    user = {
      id: 'user-1',
      email: 'a@identiq.app',
      passwordHash: await bcrypt.hash('old-password', 4),
      emailVerifiedAt: null,
    };
    prisma = {
      user: {
        findUnique: jest.fn(
          ({ where }: { where: { id?: string; email?: string } }) =>
            where.id === user.id || where.email === user.email ? user : null,
        ),
        create: jest.fn(),
        update: jest.fn(({ data }: { data: Partial<typeof user> }) => {
          Object.assign(user, data);
          return user;
        }),
      },
    };
    send = jest.fn();

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: new JwtService({ secret: 'test' }) },
        { provide: EmailService, useValue: { send } },
        {
          provide: ConfigService,
          useValue: { get: () => 'https://web.identiq.test' },
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  it('emails a verification link on register', async () => {
    prisma.user.findUnique.mockReturnValueOnce(null);
    prisma.user.create.mockResolvedValue(user);

    const result = await service.register({
      email: user.email,
      password: 'password123',
    });

    expect(result.user.emailVerified).toBe(false);
    expect(send).toHaveBeenCalledWith(
      user.email,
      expect.objectContaining({
        html: expect.stringContaining(
          'https://web.identiq.test/verify-email?token=',
        ) as string,
      }),
    );
  });

  it('marks the email verified with a valid link', async () => {
    await service.resendVerification(user.email);
    await service.verifyEmail(tokenFromLastEmail(send));

    expect(user.emailVerifiedAt).toBeInstanceOf(Date);
  });

  it('rejects a reset token used as a verification token', async () => {
    await service.forgotPassword(user.email);

    await expect(
      service.verifyEmail(tokenFromLastEmail(send)),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('resets the password, and the same link cannot be reused', async () => {
    await service.forgotPassword(user.email);
    const token = tokenFromLastEmail(send);

    await service.resetPassword(token, 'new-password');
    expect(await bcrypt.compare('new-password', user.passwordHash)).toBe(true);

    await expect(
      service.resetPassword(token, 'another-password'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not reveal whether an account exists on forgot-password', async () => {
    await expect(
      service.forgotPassword('nobody@identiq.app'),
    ).resolves.toBeUndefined();
    expect(send).not.toHaveBeenCalled();
  });
});
