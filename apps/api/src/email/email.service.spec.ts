import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import * as nodemailer from 'nodemailer';
import { EmailService } from './email.service';

jest.mock('nodemailer');

describe('EmailService', () => {
  const sendMail = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });
  });

  async function buildService(
    config: Record<string, unknown>,
  ): Promise<EmailService> {
    const moduleRef = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: { get: (key: string) => config[key] },
        },
      ],
    }).compile();

    const service = moduleRef.get(EmailService);
    service.onModuleInit();
    return service;
  }

  it('logs instead of sending when SMTP is not configured, and never throws', async () => {
    const service = await buildService({});

    await expect(
      service.send('a@identiq.app', { subject: 'Hi', html: '<p>Hi</p>' }),
    ).resolves.toBeUndefined();
    expect(sendMail).not.toHaveBeenCalled();
  });

  it('sends via the configured SMTP transport when SMTP_HOST is set', async () => {
    const service = await buildService({
      'email.smtpHost': 'smtp.example.test',
      'email.smtpPort': 587,
    });

    await service.send('a@identiq.app', { subject: 'Hi', html: '<p>Hi</p>' });

    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'a@identiq.app',
        subject: 'Hi',
        html: '<p>Hi</p>',
      }),
    );
  });

  it('does not throw when the transport rejects — email delivery is best-effort', async () => {
    sendMail.mockRejectedValueOnce(new Error('connection refused'));
    const service = await buildService({
      'email.smtpHost': 'smtp.example.test',
    });

    await expect(
      service.send('a@identiq.app', { subject: 'Hi', html: '<p>Hi</p>' }),
    ).resolves.toBeUndefined();
  });
});
