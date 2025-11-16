import { Module } from '@nestjs/common';
import { MailerModule, MailerOptions } from '@nestjs-modules/mailer';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { SharedModule } from '../../shared/shared.module';
import { SettingsModule } from '../settings/settings.module';
import { SettingsHelperService } from '../../shared/services/settings.service';
import { MailService } from './mail.service';
import { handlebarsHelpers } from './templates/helpers';
import { MailController } from './mail.controller';
import { PrismaModule } from '../../core/prisma/prisma.module';

@Module({
  imports: [
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    MailerModule.forRootAsync({
      imports: [ConfigModule, SettingsModule],
      useFactory: async (
        config: ConfigService,
        settings: SettingsHelperService,
      ): Promise<MailerOptions> => {
        // Prefer DB settings; fallback to env-based config
        const provider =
          (await settings.getWithDefault(
            'mail.provider',
            (config.get<string>('app.mail.provider') || 'smtp').toLowerCase(),
          )) || 'smtp';
        const from =
          (await settings.getWithDefault(
            'mail.from',
            config.get<string>('app.mail.from') ?? 'no-reply@example.com',
          )) ?? 'no-reply@example.com';

        // Provider defaults (can be overridden by generic MAIL_* vars)
        let defaults: { host: string; port: number; secure: boolean };
        if (provider === 'gmail') {
          defaults = { host: 'smtp.gmail.com', port: 465, secure: true };
        } else if (provider === 'mailgun') {
          defaults = { host: 'smtp.mailgun.org', port: 587, secure: false };
        } else {
          defaults = { host: 'localhost', port: 1025, secure: false };
        }

        const host =
          (await settings.getWithDefault(
            'mail.host',
            config.get<string>('app.mail.host') ?? defaults.host,
          )) ?? defaults.host;
        const port =
          (await settings.getNumber(
            'mail.port',
            config.get<number>('app.mail.port') ?? defaults.port,
          )) ?? defaults.port;
        const secure =
          (await settings.getBoolean(
            'mail.secure',
            config.get<boolean>('app.mail.secure') ?? defaults.secure,
          )) ?? defaults.secure;
        const user =
          (await settings.getWithDefault(
            'mail.user',
            config.get<string>('app.mail.user') ?? '',
          )) ?? '';
        const pass =
          (await settings.getWithDefault(
            'mail.password',
            config.get<string>('app.mail.password') ?? '',
          )) ?? '';

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
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
            adapter: new HandlebarsAdapter(handlebarsHelpers),
            options: { strict: true },
          },
        };
        return options;
      },
      inject: [ConfigService, SettingsHelperService],
    }),
    SharedModule,
    SettingsModule,
    PrismaModule,
  ],
  controllers: [MailController],
  providers: [MailService],
  exports: [MailerModule, MailService],
})
export class MailModule {}
