import { Module } from '@nestjs/common';
import { MailerModule, MailerOptions } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { SharedModule } from '../../shared/shared.module';
import { MailService } from './mail.service';
import { handlebarsHelpers } from './templates/helpers';
import { MailController } from './mail.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService): MailerOptions => {
        const provider = (
          config.get<string>('app.mail.provider') || 'smtp'
        ).toLowerCase();
        const from =
          config.get<string>('app.mail.from') ?? 'no-reply@example.com';

        // Provider defaults (can be overridden by generic MAIL_* vars)
        const defaults =
          provider === 'gmail'
            ? { host: 'smtp.gmail.com', port: 465, secure: true }
            : provider === 'mailgun'
            ? { host: 'smtp.mailgun.org', port: 587, secure: false }
            : { host: 'localhost', port: 1025, secure: false };

        const host = config.get<string>('app.mail.host') ?? defaults.host;
        const port = config.get<number>('app.mail.port') ?? defaults.port;
        const secure = config.get<boolean>('app.mail.secure') ?? defaults.secure;
        const user = config.get<string>('app.mail.user') ?? '';
        const pass = config.get<string>('app.mail.password') ?? '';

        // If no SMTP creds and using dev default (localhost:1025), use stream transport to avoid connection errors
        const useStreamTransport =
          (!user || !pass) && host === 'localhost' && port === 1025;

        const transport: Record<string, unknown> = useStreamTransport
          ? {
              streamTransport: true,
              buffer: true,
            }
          : {
              host,
              port,
              secure,
              auth: { user, pass },
            };

        const options: MailerOptions = {
          transport,
          defaults: { from },
          template: {
            dir: join(__dirname, 'templates'),
            adapter: new HandlebarsAdapter(handlebarsHelpers),
            options: { strict: true },
          },
        };
        return options;
      },
      inject: [ConfigService],
    }),
    SharedModule,
    PrismaModule,
  ],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailerModule, MailService],
})
export class MailModule {}
