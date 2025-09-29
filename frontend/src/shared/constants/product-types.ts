/**
 * Global Product Type Constants
 * Based on backend seed data from product-types.seed.ts
 * These constants ensure consistency between frontend and backend
 */

export const PRODUCT_TYPE_NAMES = {
  E_BOOK: 'E-Book',
  COURSE: 'Course',
  VIDEO: 'Video',
  BUNDLE: 'Bundle',
  SOFTWARE: 'Software',
  TEMPLATE: 'Template',
  AUDIO: 'Audio',
  DOCUMENT: 'Document',
} as const;

export const PRODUCT_TYPE_DESCRIPTIONS = {
  [PRODUCT_TYPE_NAMES.E_BOOK]: 'Digital books and publications',
  [PRODUCT_TYPE_NAMES.COURSE]: 'Online courses and educational content',
  [PRODUCT_TYPE_NAMES.VIDEO]: 'Video content and tutorials',
  [PRODUCT_TYPE_NAMES.BUNDLE]: 'Package of multiple products',
  [PRODUCT_TYPE_NAMES.SOFTWARE]: 'Digital software and applications',
  [PRODUCT_TYPE_NAMES.TEMPLATE]: 'Design templates and resources',
  [PRODUCT_TYPE_NAMES.AUDIO]: 'Audio content and music',
  [PRODUCT_TYPE_NAMES.DOCUMENT]: 'PDF documents and reports',
} as const;

// Product type options for forms and dropdowns
export const PRODUCT_TYPE_OPTIONS = [
  {
    value: PRODUCT_TYPE_NAMES.E_BOOK,
    label: PRODUCT_TYPE_NAMES.E_BOOK,
    description: PRODUCT_TYPE_DESCRIPTIONS[PRODUCT_TYPE_NAMES.E_BOOK],
  },
  {
    value: PRODUCT_TYPE_NAMES.COURSE,
    label: PRODUCT_TYPE_NAMES.COURSE,
    description: PRODUCT_TYPE_DESCRIPTIONS[PRODUCT_TYPE_NAMES.COURSE],
  },
  {
    value: PRODUCT_TYPE_NAMES.VIDEO,
    label: PRODUCT_TYPE_NAMES.VIDEO,
    description: PRODUCT_TYPE_DESCRIPTIONS[PRODUCT_TYPE_NAMES.VIDEO],
  },
  {
    value: PRODUCT_TYPE_NAMES.BUNDLE,
    label: PRODUCT_TYPE_NAMES.BUNDLE,
    description: PRODUCT_TYPE_DESCRIPTIONS[PRODUCT_TYPE_NAMES.BUNDLE],
  },
  {
    value: PRODUCT_TYPE_NAMES.SOFTWARE,
    label: PRODUCT_TYPE_NAMES.SOFTWARE,
    description: PRODUCT_TYPE_DESCRIPTIONS[PRODUCT_TYPE_NAMES.SOFTWARE],
  },
  {
    value: PRODUCT_TYPE_NAMES.TEMPLATE,
    label: PRODUCT_TYPE_NAMES.TEMPLATE,
    description: PRODUCT_TYPE_DESCRIPTIONS[PRODUCT_TYPE_NAMES.TEMPLATE],
  },
  {
    value: PRODUCT_TYPE_NAMES.AUDIO,
    label: PRODUCT_TYPE_NAMES.AUDIO,
    description: PRODUCT_TYPE_DESCRIPTIONS[PRODUCT_TYPE_NAMES.AUDIO],
  },
  {
    value: PRODUCT_TYPE_NAMES.DOCUMENT,
    label: PRODUCT_TYPE_NAMES.DOCUMENT,
    description: PRODUCT_TYPE_DESCRIPTIONS[PRODUCT_TYPE_NAMES.DOCUMENT],
  },
] as const;

// Type definitions for TypeScript support
export type ProductTypeName = typeof PRODUCT_TYPE_NAMES[keyof typeof PRODUCT_TYPE_NAMES];
export type ProductTypeOption = typeof PRODUCT_TYPE_OPTIONS[number];

// Helper functions
export const getProductTypeDescription = (name: ProductTypeName): string => {
  return PRODUCT_TYPE_DESCRIPTIONS[name] || '';
};

export const getProductTypeOption = (name: ProductTypeName): ProductTypeOption | undefined => {
  return PRODUCT_TYPE_OPTIONS.find(option => option.value === name);
};

export const isValidProductType = (value: string): value is ProductTypeName => {
  return Object.values(PRODUCT_TYPE_NAMES).includes(value as ProductTypeName);
};
