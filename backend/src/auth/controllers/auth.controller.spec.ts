import { INestApplication } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import request from 'supertest';
import { App } from 'supertest/types';
import { AuthService } from '../services/auth.service';
import { AuthController } from './auth.controller';

describe('AuthController rate limiting', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }])],
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            login: jest.fn().mockResolvedValue({ accessToken: 't' }),
            register: jest.fn().mockResolvedValue({ accessToken: 't' }),
          },
        },
        { provide: APP_GUARD, useClass: ThrottlerGuard },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterEach(() => app.close());

  it('rejects the 6th rapid login with 429', async () => {
    const body = { email: 'a@identiq.app', password: 'password123' };
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send(body)
        .expect(200);
    }
    await request(app.getHttpServer())
      .post('/auth/login')
      .send(body)
      .expect(429);
  });

  it('rejects the 6th rapid registration with 429', async () => {
    const body = { email: 'a@identiq.app', password: 'password123' };
    for (let i = 0; i < 5; i++) {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send(body)
        .expect(201);
    }
    await request(app.getHttpServer())
      .post('/auth/register')
      .send(body)
      .expect(429);
  });
});
