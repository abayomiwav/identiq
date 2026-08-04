import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import { RenderedEmail } from '../templates/email-templates';

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;
  private from = 'Identiq <notifications@identiq.app>';

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const host = this.configService.get<string>('email.smtpHost');
    if (!host) {
      this.logger.warn(
        'SMTP_HOST not configured — emails will be logged, not sent.',
      );
      return;
    }

    this.from = this.configService.get<string>('email.from') ?? this.from;
    this.transporter = createTransport({
      host,
      port: this.configService.get<number>('email.smtpPort') ?? 587,
      auth: {
        user: this.configService.get<string>('email.smtpUser'),
        pass: this.configService.get<string>('email.smtpPassword'),
      },
    });
  }

  /** Best-effort — a failed email must never fail the request that triggered it. */
  async send(to: string, email: RenderedEmail): Promise<void> {
    if (!this.transporter) {
      this.logger.log(`[dev] Would send "${email.subject}" to ${to}`);
      return;
    }

    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject: email.subject,
        html: email.html,
      });
    } catch (error) {
      this.logger.warn(
        `Failed to send email to ${to}: ${(error as Error).message}`,
      );
    }
  }
}
