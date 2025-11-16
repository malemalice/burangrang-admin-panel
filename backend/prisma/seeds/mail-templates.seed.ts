import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join } from 'path';

function readTemplate(fileName: string): string {
  const filePath = join(
    __dirname,
    '..',
    '..',
    'src',
    'modules',
    'mail',
    'templates',
    `${fileName}.hbs`,
  );
  return readFileSync(filePath, 'utf-8');
}

export async function seedMailTemplates(prisma: PrismaClient): Promise<void> {
  // Temporary type extension to support execution before prisma generate runs
  const client = prisma as unknown as {
    emailTemplate: {
      upsert: (args: any) => Promise<any>;
    };
  };

  const templates = [
    {
      code: 'verification',
      name: 'Email Verification',
      subjectTemplate: 'Verify your email, {{default name ""}}',
      bodyTemplate: readTemplate('verification'),
    },
    {
      code: 'password-reset',
      name: 'Password Reset',
      subjectTemplate: 'Password Reset Instructions',
      bodyTemplate: readTemplate('password-reset'),
    },
    {
      code: 'team-invitation',
      name: 'Team Invitation',
      subjectTemplate:
        'You\'re invited to join {{default teamName "our team"}}',
      bodyTemplate: readTemplate('team-invitation'),
    },
    {
      code: 'password-change',
      name: 'Password Change Notification',
      subjectTemplate: 'Your password was changed',
      bodyTemplate: readTemplate('password-change'),
    },
  ];

  for (const tpl of templates) {
    await client.emailTemplate.upsert({
      where: { code: tpl.code },
      update: {
        name: tpl.name,
        subjectTemplate: tpl.subjectTemplate,
        bodyTemplate: tpl.bodyTemplate,
        isActive: true,
      },
      create: {
        code: tpl.code,
        name: tpl.name,
        subjectTemplate: tpl.subjectTemplate,
        bodyTemplate: tpl.bodyTemplate,
        isActive: true,
      },
    });
  }
}
