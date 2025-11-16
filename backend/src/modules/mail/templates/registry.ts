export type MailTemplateKey =
  | 'verification'
  | 'password-reset'
  | 'team-invitation'
  | 'password-change';

type SubjectBuilder = string | ((context: Record<string, unknown>) => string);

type TemplateEntry = {
  file: string;
  subject: SubjectBuilder;
};

export const templateRegistry: Record<MailTemplateKey, TemplateEntry> = {
  'verification': {
    file: 'verification',
    subject: (ctx) => `Verify your email, ${String((ctx as any).name ?? '')}`,
  },
  'password-reset': {
    file: 'password-reset',
    subject: 'Password Reset Instructions',
  },
  'team-invitation': {
    file: 'team-invitation',
    subject: (ctx) =>
      `You're invited to join ${(ctx as any).teamName ?? 'our team'}`,
  },
  'password-change': {
    file: 'password-change',
    subject: 'Your password was changed',
  },
};


