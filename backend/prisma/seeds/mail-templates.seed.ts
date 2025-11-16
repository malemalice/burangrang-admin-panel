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
  const templates = [
    {
      key: 'verification',
      name: 'Email Verification',
      subjectTemplate: 'Verify your email, {{default name ""}}',
      bodyTemplate: readTemplate('verification'),
    },
    {
      key: 'password-reset',
      name: 'Password Reset',
      subjectTemplate: 'Password Reset Instructions',
      bodyTemplate: readTemplate('password-reset'),
    },
    {
      key: 'team-invitation',
      name: 'Team Invitation',
      subjectTemplate: "You're invited to join {{default teamName \"our team\"}}",
      bodyTemplate: readTemplate('team-invitation'),
    },
    {
      key: 'password-change',
      name: 'Password Change Notification',
      subjectTemplate: 'Your password was changed',
      bodyTemplate: readTemplate('password-change'),
    },
  ];

  for (const tpl of templates) {
    await prisma.emailTemplate.upsert({
      where: { key: tpl.key },
      update: {
        name: tpl.name,
        subjectTemplate: tpl.subjectTemplate,
        bodyTemplate: tpl.bodyTemplate,
        isActive: true,
      },
      create: {
        key: tpl.key,
        name: tpl.name,
        subjectTemplate: tpl.subjectTemplate,
        bodyTemplate: tpl.bodyTemplate,
        isActive: true,
      },
    });
  }
}


