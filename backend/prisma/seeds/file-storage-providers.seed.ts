import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedFileStorageProviders() {
  console.log('🌱 Seeding file storage providers...');

  const providers = [
    {
      name: 'local',
      config: {
        uploadDir: './uploads',
        publicUrl: process.env.PUBLIC_URL || 'http://localhost:3000',
      },
      isDefault: true,
    },
    {
      name: 'aws-s3',
      config: {
        region: process.env.AWS_REGION || 'us-east-1',
        bucket: process.env.AWS_S3_BUCKET || 'your-bucket-name',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
      isDefault: false,
    },
    {
      name: 'google-cloud',
      config: {
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || '',
        bucket: process.env.GOOGLE_CLOUD_BUCKET || 'your-bucket-name',
        keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE || '',
      },
      isDefault: false,
    },
  ];

  for (const provider of providers) {
    await prisma.fileStorageProvider.upsert({
      where: { name: provider.name },
      update: {
        config: provider.config,
        isDefault: provider.isDefault,
        isActive: true,
      },
      create: {
        name: provider.name,
        config: provider.config,
        isDefault: provider.isDefault,
        isActive: true,
      },
    });
  }

  console.log('✅ File storage providers seeded successfully');
}
