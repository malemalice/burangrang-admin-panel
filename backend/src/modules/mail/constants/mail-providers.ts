/**
 * Mail provider identifiers used in mail configuration.
 */
export const MAIL_PROVIDERS = {
  GMAIL: 'gmail',
  MAILGUN: 'mailgun',
} as const;

export type MailProvider = (typeof MAIL_PROVIDERS)[keyof typeof MAIL_PROVIDERS];
