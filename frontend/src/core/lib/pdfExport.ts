import { Resolution, type Options } from 'react-to-pdf';

export const DEFAULT_PDF_MARGIN_MM = 12;

const BASE_PDF_OPTIONS: Options = {
  method: 'open',
  resolution: Resolution.MEDIUM,
  page: {
    margin: DEFAULT_PDF_MARGIN_MM,
    format: 'a4',
    orientation: 'portrait',
  },
  canvas: {
    // jpeg is substantially smaller than png for typical report UIs
    mimeType: 'image/jpeg',
    qualityRatio: 1,
    useCORS: true,
    logging: false,
  },
};

/**
 * Shared react-to-pdf option builder.
 *
 * Important: `react-to-pdf` treats page margin in **millimeters** (mm).
 */
export function buildPdfOptions(overrides: Options = {}): Options {
  return {
    ...BASE_PDF_OPTIONS,
    ...overrides,
    page: {
      ...BASE_PDF_OPTIONS.page,
      ...overrides.page,
    },
    canvas: {
      ...BASE_PDF_OPTIONS.canvas,
      ...overrides.canvas,
    },
    overrides: {
      ...BASE_PDF_OPTIONS.overrides,
      ...overrides.overrides,
      pdf: {
        ...BASE_PDF_OPTIONS.overrides?.pdf,
        ...overrides.overrides?.pdf,
      },
      canvas: {
        ...BASE_PDF_OPTIONS.overrides?.canvas,
        ...overrides.overrides?.canvas,
      },
    },
  };
}

