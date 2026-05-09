import type { MutableRefObject } from 'react';
import generatePDF, { Resolution, type Options } from 'react-to-pdf';

import { prepareTableAwarePdfDom } from './pdfTablePaginator';

export { getPdfPageContentHeightPx, prepareTableAwarePdfDom } from './pdfTablePaginator';

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

/**
 * Runs react-to-pdf on a detached clone with table-aware spacer rows so page slices align with table rows.
 * Does not mutate the React-managed export node (targetRef).
 */
export async function generateTableAwarePdf(
  targetRef: MutableRefObject<HTMLElement | null>,
  options?: Options,
): Promise<Awaited<ReturnType<typeof generatePDF>> | undefined> {
  const merged = buildPdfOptions(options);
  const root = targetRef.current;
  if (!root) {
    console.error('Unable to get the target element.');
    return undefined;
  }

  const clone = root.cloneNode(true) as HTMLElement;
  clone.style.cssText = root.style.cssText;
  clone.style.position = 'absolute';
  clone.style.left = '-9999px';
  clone.style.top = '0px';
  if (!clone.style.width) {
    clone.style.width = '210mm';
  }
  clone.setAttribute('aria-hidden', 'true');
  document.body.appendChild(clone);
  prepareTableAwarePdfDom(clone, merged);

  try {
    return await generatePDF(() => clone, merged);
  } finally {
    clone.remove();
  }
}

