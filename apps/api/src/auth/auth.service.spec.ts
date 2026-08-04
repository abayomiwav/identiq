import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { findUnique: jest.Mock; create: jest.Mock } };
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    jwtService = { sign: jest.fn().mockReturnValue('signed.jwt.token') };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('register', () => {
    it('creates a user with a bcrypt-hashed password, never the plaintext', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }) => ({
        id: 'user-1',
        ...data,
      }));

      const result = await service.register({
        email: 'a@identiq.app',
        password: 'password123',
      });

      const createdData = prisma.user.create.mock.calls[0][0].data;
      expect(createdData.passwordHash).not.toBe('password123');
      expect(
        await bcrypt.compare('password123', createdData.passwordHash),
      ).toBe(true);
      expect(result.accessToken).toBe('signed.jwt.token');
      expect(result.user).toEqual({ id: 'user-1', email: 'a@identiq.app' });
    });

    it('rejects registration for an email already in use', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'existing',
        email: 'a@identiq.app',
      });

      await expect(
        service.register({ email: 'a@identiq.app', password: 'password123' }),
      ).rejects.toThrow(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('issues a token when the password matches', async () => {
      const passwordHash = await bcrypt.hash('password123', 4);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'a@identiq.app',
        passwordHash,
      });

      const result = await service.login({
        email: 'a@identiq.app',
        password: 'password123',
      });

      expect(result.accessToken).toBe('signed.jwt.token');
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'a@identiq.app',
      });
    });

    it('rejects an unknown email without revealing that the account does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@identiq.app', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects an incorrect password', async () => {
      const passwordHash = await bcrypt.hash('correct-password', 4);
      prisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'a@identiq.app',
        passwordHash,
      });

      await expect(
        service.login({ email: 'a@identiq.app', password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
