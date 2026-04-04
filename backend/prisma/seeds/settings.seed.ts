import { PrismaClient, Setting } from '@prisma/client';

export const defaultSettings = [
  // Theme Settings
  { key: 'theme.color', value: 'blue' },
  { key: 'theme.mode', value: 'light' },

  // System Settings
  { key: 'system.name', value: 'Admin Panel' },
  { key: 'system.version', value: '1.0.0' },
  { key: 'system.timezone', value: 'UTC' },

  // App Settings
  { key: 'app.name', value: 'HSSE System' },
  { key: 'app.language', value: 'en' },

  // Pagination defaults
  { key: 'pagination.default_limit', value: '10' },
  { key: 'pagination.max_limit', value: '100' },

  // Mail Settings (Mailtrap sandbox)
  { key: 'mail.provider', value: 'smtp' },
  { key: 'mail.host', value: 'sandbox.smtp.mailtrap.io' },
  { key: 'mail.port', value: '2525' },
  { key: 'mail.secure', value: 'false' },
  { key: 'mail.user', value: '8e821863ade893' },
  { key: 'mail.password', value: '75223abde492c2' },
  { key: 'mail.from', value: 'Burangrang Admin <no-reply@burangrang.local>' },

  // Zoho Integration Settings
  { key: 'zoho.sync.enabled', value: 'true' },
  { key: 'zoho.webhook.enabled', value: 'true' },
  { key: 'zoho.webhook.auth_mode', value: 'secret' },
  { key: 'zoho.webhook.secret', value: '' },
  { key: 'zoho.webhook.jwt', value: '' },
  { key: 'zoho.sdp.base_url', value: 'https://servicedesk.hapfor.com' },
  { key: 'zoho.sdp.authtoken', value: '' },
  { key: 'zoho.sdp.api_version', value: 'v3' },
  { key: 'zoho.inbound.default_department_id', value: '' },
  { key: 'zoho.inbound.integration_user_id', value: '' },
  { key: 'zoho.inbound.default_status', value: 'OPEN' },
  {
    key: 'zoho.outbound.status_map',
    value:
      '{"DRAFT":"Open","OPEN":"On Hold","WAITING_APPROVAL":"On Hold","DONE":"Closed","CLOSE":"Closed","REJECTED":"Open"}',
  },
  { key: 'zoho.retry.max_retries', value: '6' },
  { key: 'zoho.retry.base_ms', value: '2000' },
  { key: 'zoho.retry.max_ms', value: '60000' },
  { key: 'zoho.worker.batch_size', value: '5' },
];

export async function seedSettings(prisma: PrismaClient): Promise<Setting[]> {
  console.log('Creating default settings...');

  const createdSettings: Setting[] = [];

  for (const setting of defaultSettings) {
    // Check if setting already exists
    const existingSetting = await prisma.setting.findUnique({
      where: { key: setting.key }
    });

    if (!existingSetting) {
      const created = await prisma.setting.create({
        data: setting
      });
      console.log(`✅ Created setting: ${created.key} = ${created.value}`);
      createdSettings.push(created);
    } else {
      console.log(`⚠️ Setting already exists: ${setting.key}`);
    }
  }

  console.log(`Settings seeding completed. Created ${createdSettings.length} new settings`);
  return createdSettings;
}
