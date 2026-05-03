/**
 * Seed: Master Inspection Checklists
 *
 * Creates 9 root-level categories and their leaf items directly (no parent template).
 * Idempotent — skips creation if the first category code already exists at root level.
 */
import { seedPrisma as prisma } from './prisma-seed-client';

interface LeafItem {
  code: string;
  name: string;
  order: number;
}

interface Category {
  code: string;
  name: string;
  order: number;
  items: LeafItem[];
}

const categories: Category[] = [
  {
    code: '1',
    name: 'Required Document',
    order: 1,
    items: [
      { code: 'A', order: 1, name: 'Work Permit for non-routine work' },
      { code: 'B', order: 2, name: 'Special Permit (Hot Work, Working At Height, Confined Space)' },
      { code: 'C', order: 3, name: 'Operator/Technician License (elevator, manlift, scaffold, electrical, etc)' },
      { code: 'D', order: 4, name: 'ID Card' },
    ],
  },
  {
    code: '2',
    name: 'General Room & Floor Condition',
    order: 2,
    items: [
      { code: 'A', order: 1,  name: 'Availability of safety signs/warning signs' },
      { code: 'B', order: 2,  name: 'Availability of Fire Extinguisher' },
      { code: 'C', order: 3,  name: 'Hydrant Box' },
      { code: 'D', order: 4,  name: 'Access the evacuation route free from obstacles' },
      { code: 'E', order: 5,  name: 'Availability of Evacuation route map' },
      { code: 'F', order: 6,  name: 'Availability of Emergency Evacuation Procedure' },
      { code: 'G', order: 7,  name: 'Emergency response instructions' },
      { code: 'H', order: 8,  name: 'Emergency contact number' },
      { code: 'I', order: 9,  name: 'Emergency Exit Door can be opened from the inside without difficulty' },
      { code: 'J', order: 10, name: 'Illumination are quite suitable and make it easier to do work' },
      { code: 'K', order: 11, name: 'Hand Sanitizer' },
      { code: 'L', order: 12, name: 'Housekeeping' },
    ],
  },
  {
    code: '3',
    name: 'Work Station',
    order: 3,
    items: [
      { code: 'A', order: 1, name: 'Illumination are quite suitable and make it easier to do work' },
      { code: 'B', order: 2, name: 'Are there no exposed electrical cord in the walkways' },
      { code: 'C', order: 3, name: 'Access to the workspace/desk is free from obstacles' },
    ],
  },
  {
    code: '4',
    name: 'Elevator',
    order: 4,
    items: [
      { code: 'A', order: 1, name: 'Illumination are quite suitable and make it easier to do work' },
      { code: 'B', order: 2, name: 'Elevator buttons work' },
      { code: 'C', order: 3, name: 'Elevator emergency response instructions available' },
      { code: 'D', order: 4, name: 'Housekeeping' },
    ],
  },
  {
    code: '5',
    name: 'Electrical',
    order: 5,
    items: [
      { code: 'A', order: 1, name: 'Are electrical equipment in good condition' },
      { code: 'B', order: 2, name: 'Are there no broken sockets or switches' },
      { code: 'C', order: 3, name: 'Are there no exposed electrical cable' },
      { code: 'D', order: 4, name: 'The electric panel door is locked if there is no work in the panel room' },
      { code: 'E', order: 5, name: 'The lights are off in an empty/unused room' },
    ],
  },
  {
    code: '6',
    name: 'Personal Protective Equipment (PPE)',
    order: 6,
    items: [
      { code: 'A', order: 1,  name: 'Safety Helmet - Not damaged and worn' },
      { code: 'B', order: 2,  name: 'Safety Glasses - Scratch-free and wear' },
      { code: 'C', order: 3,  name: 'Safety gloves - not damaged and worn' },
      { code: 'D', order: 4,  name: 'Safety shoes - shoe soles are strong, do not tear and wear' },
      { code: 'E', order: 5,  name: 'Safety Harness is in good condition - no signs of tear/damage' },
      { code: 'F', order: 6,  name: 'Ear protection - in good condition and wear' },
      { code: 'G', order: 7,  name: 'Mask is in good condition and wear' },
      { code: 'H', order: 8,  name: 'Work attire / Safety Vest are in good condition and wear' },
      { code: 'I', order: 9,  name: 'Welder Apron' },
      { code: 'K', order: 10, name: 'Welder Helmet/Mask' },
    ],
  },
  {
    code: '7',
    name: 'Penggunaan Scaffolding',
    order: 7,
    items: [
      { code: 'A', order: 1, name: 'Scaffold Condition' },
      { code: 'B', order: 2, name: 'Availability of Safety Rope' },
      { code: 'C', order: 3, name: 'Availability of Safety Barricade' },
      { code: 'D', order: 4, name: 'Availability of Safety Signs / Scaffolding tag' },
    ],
  },
  {
    code: '8',
    name: '5 S (Sort, Set in order, Shine, Standardize, Sustain)',
    order: 8,
    items: [
      { code: 'A', order: 1, name: 'Sort — only the necessary items that are available at the workplace' },
      { code: 'B', order: 2, name: 'Set in order — items needed for work are stored neatly and not scattered' },
      { code: 'C', order: 3, name: 'Shine — the workplace is regularly cleaned and there is no litter' },
      { code: 'D', order: 4, name: 'Standardize — approved standards of work tools, equipment and PPE always be followed' },
      { code: 'E', order: 5, name: 'Sustain — inspection checklist/work report is always filled with updates' },
    ],
  },
  {
    code: '9',
    name: 'Environment',
    order: 9,
    items: [
      { code: 'A', order: 1, name: 'No Smoking at BSJ Area' },
      { code: 'B', order: 2, name: 'Availability of barricade or hoarding at construction site' },
      { code: 'C', order: 3, name: 'Availability of trash bin/can' },
      { code: 'D', order: 4, name: "Garbage is taken regularly so it doesn't overfill from the trash bin/can" },
      { code: 'E', order: 5, name: 'Air pollution (Dust, Smoke, Odor, Emission, etc)' },
      { code: 'F', order: 6, name: 'Water pollution (Oil, Paint, Grease, Pesticide, Chemical substain, etc)' },
      { code: 'G', order: 7, name: 'Noise Pollution' },
      { code: 'H', order: 8, name: 'Earth Pollution (Oil, paint, chemical substain spill, contaminated glove, mask, etc)' },
      { code: 'I', order: 9, name: 'Hazardous waste treatment' },
    ],
  },
];

export const seedInspectionChecklists = async () => {
  console.log('🌱 Seeding inspection checklists...');

  try {
    // Idempotent: skip if root categories already exist
    const existing = await prisma.inspectionChecklist.findFirst({
      where: { code: categories[0].code, parentId: null, deletedAt: null },
    });

    if (existing) {
      console.log(`   ⚠️  Categories already seeded. Skipping.`);
      return;
    }

    let totalLeaves = 0;

    for (const cat of categories) {
      // Create category at root level (no parent)
      const category = await prisma.inspectionChecklist.create({
        data: {
          code: cat.code,
          name: cat.name,
          order: cat.order,
          isActive: true,
        },
      });

      // Create leaf items
      for (const item of cat.items) {
        await prisma.inspectionChecklist.create({
          data: {
            parentId: category.id,
            code: item.code,
            name: item.name,
            order: item.order,
            isActive: true,
          },
        });
      }

      totalLeaves += cat.items.length;
      console.log(`   📁 Category ${cat.code}. ${cat.name} — ${cat.items.length} items`);
    }

    console.log(`   ✅ Done: ${categories.length} categories, ${totalLeaves} leaf items`);
  } catch (error) {
    console.error('❌ Error seeding inspection checklists:', error);
    throw error;
  }
};

export default seedInspectionChecklists;
