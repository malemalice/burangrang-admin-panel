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
  { key: 'app.name', value: 'Office Nexus' },
  { key: 'app.language', value: 'en' },

  // Pagination defaults
  { key: 'pagination.default_limit', value: '10' },
  { key: 'pagination.max_limit', value: '100' },
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
