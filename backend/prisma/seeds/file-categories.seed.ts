import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedFileCategories() {
  console.log('🌱 Seeding file categories...');

  const categories = [
    {
      name: 'profile-images',
      allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
      maxSize: 5 * 1024 * 1024, // 5MB
    },
    {
      name: 'documents',
      allowedTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
      ],
      maxSize: 50 * 1024 * 1024, // 50MB
    },
    {
      name: 'course-materials',
      allowedTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ],
      maxSize: 100 * 1024 * 1024, // 100MB
    },
    {
      name: 'system-assets',
      allowedTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
      ],
      maxSize: 10 * 1024 * 1024, // 10MB
    },
    {
      name: 'videos',
      allowedTypes: [
        'video/mp4',
        'video/avi',
        'video/mov',
        'video/wmv',
        'video/flv',
        'video/webm',
      ],
      maxSize: 500 * 1024 * 1024, // 500MB
    },
    {
      name: 'audio',
      allowedTypes: [
        'audio/mpeg',
        'audio/wav',
        'audio/ogg',
        'audio/mp4',
        'audio/aac',
      ],
      maxSize: 50 * 1024 * 1024, // 50MB
    },
    {
      name: 'ppe-withdrawal-letter',
      allowedTypes: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      maxSize: 10 * 1024 * 1024, // 10MB
    },
    {
      name: 'certificate-documents',
      allowedTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
      ],
      maxSize: 50 * 1024 * 1024, // 50MB
    },
    {
      name: 'work-permit-documents',
      allowedTypes: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
      maxSize: 10 * 1024 * 1024, // 10MB
    },
  ];

  for (const category of categories) {
    await prisma.fileCategory.upsert({
      where: { name: category.name },
      update: {
        allowedTypes: category.allowedTypes,
        maxSize: category.maxSize,
        isActive: true,
      },
      create: {
        name: category.name,
        allowedTypes: category.allowedTypes,
        maxSize: category.maxSize,
        isActive: true,
      },
    });
  }

  console.log('✅ File categories seeded successfully');
}
