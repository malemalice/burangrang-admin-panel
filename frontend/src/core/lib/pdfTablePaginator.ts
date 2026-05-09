/**
 * Table-aware DOM preparation for react-to-pdf (html2canvas + fixed-height canvas slicing).
 * Inserts spacer rows so logical page boundaries align with row edges, reducing mid-row cropping.
 *
 * Matches slice math from react-to-pdf Converter (node_modules/react-to-pdf/dist/index.mjs):
 * MM_TO_PX, page available height, horizontal fit factor vs content width.
 *
 * Use on a detached clone (see generateTableAwarePdf in pdfExport.ts) so React’s live tree is untouched.
 */

import { jsPDF } from 'jspdf';
import type { Options } from 'react-to-pdf';

const MM_TO_PX = 3.77952755906;
const SPACER_ATTR = 'data-pdf-page-spacer';
const SPLIT_ATTR = 'data-pdf-row-split';
const SPLITTABLE_SELECTOR = 'table[data-pdf-table-splittable]';
const MAX_LOOPS = 2000;

function normalizeMarginMm(margin: unknown): { top: number; right: number; bottom: number; left: number } {
  const m = margin as number | Record<string, number> | undefined;
  if (m == null) return { top: 0, right: 0, bottom: 0, left: 0 };
  if (typeof m === 'number') return { top: m, right: m, bottom: m, left: m };
  return {
    top: Number((m as { top?: number }).top ?? 0),
    right: Number((m as { right?: number }).right ?? 0),
    bottom: Number((m as { bottom?: number }).bottom ?? 0),
    left: Number((m as { left?: number }).left ?? 0),
  };
}

function getPageSizeMm(options: Options): { widthMm: number; heightMm: number } {
  const format = options.page?.format ?? 'a4';
  const orientation = options.page?.orientation ?? 'portrait';
  const pdf = new jsPDF({ unit: 'mm', format: format as string, orientation });
  return {
    widthMm: pdf.internal.pageSize.getWidth(),
    heightMm: pdf.internal.pageSize.getHeight(),
  };
}

/** Content height in CSS px per slice (matches Converter when canvas Y ≈ domY * scale). */
export function getPdfPageContentHeightPx(root: HTMLElement, options: Options): number {
  const { widthMm, heightMm } = getPageSizeMm(options);
  const m = normalizeMarginMm(options.page?.margin);
  const pageHeightPx = heightMm * MM_TO_PX;
  const pageWidthPx = widthMm * MM_TO_PX;
  const marginTopPx = m.top * MM_TO_PX;
  const marginBottomPx = m.bottom * MM_TO_PX;
  const marginLeftPx = m.left * MM_TO_PX;
  const marginRightPx = m.right * MM_TO_PX;
  const pageAvailableHeightPx = pageHeightPx - (marginTopPx + marginBottomPx);
  const pageAvailableWidthPx = pageWidthPx - (marginLeftPx + marginRightPx);

  const contentWidth = Math.max(root.scrollWidth, root.getBoundingClientRect().width);
  const horizontalFitFactor =
    pageAvailableWidthPx > 0 && contentWidth > pageAvailableWidthPx ? contentWidth / pageAvailableWidthPx : 1;

  return pageAvailableHeightPx * horizontalFitFactor;
}

function getOffsetTopRelativeToRoot(el: HTMLElement, root: HTMLElement): number {
  const er = el.getBoundingClientRect();
  const rr = root.getBoundingClientRect();
  return er.top - rr.top + root.scrollTop;
}

function getTableColspan(table: HTMLTableElement): number {
  const headRow = table.querySelector('thead tr');
  if (headRow) {
    let sum = 0;
    headRow.querySelectorAll('th, td').forEach((cell) => {
      sum += parseInt(cell.getAttribute('colspan') || '1', 10) || 1;
    });
    return Math.max(sum, 1);
  }
  const firstBody = table.querySelector('tbody tr, tr');
  if (firstBody) {
    let sum = 0;
    firstBody.querySelectorAll('td, th').forEach((cell) => {
      sum += parseInt(cell.getAttribute('colspan') || '1', 10) || 1;
    });
    return Math.max(sum, 1);
  }
  return 1;
}

function getDataRows(table: HTMLTableElement): HTMLTableRowElement[] {
  const out: HTMLTableRowElement[] = [];
  for (const row of Array.from(table.rows)) {
    if (row.closest('thead') || row.closest('tfoot')) continue;
    if (row.hasAttribute(SPACER_ATTR)) continue;
    out.push(row);
  }
  return out;
}

function splitCellLines(cell: HTMLTableCellElement): string[] {
  const html = cell.innerHTML;
  const brParts = html
    .split(/<br\s*\/?\s*>/gi)
    .map((s) => s.trim())
    .filter(Boolean);
  if (brParts.length > 1) return brParts;
  const t = cell.innerText || '';
  if (t.includes('\n')) return t.split(/\n/).map((s) => s.trim()).filter(Boolean);
  return [html];
}

function splitRowByLines(row: HTMLTableRowElement): HTMLTableRowElement[] {
  const cells = Array.from(row.cells);
  if (cells.length === 0) return [row];
  const lineGroups = cells.map((c) => splitCellLines(c));
  const maxLines = Math.max(1, ...lineGroups.map((l) => l.length));
  if (maxLines <= 1) return [row];

  const out: HTMLTableRowElement[] = [];
  for (let li = 0; li < maxLines; li++) {
    const tr = document.createElement('tr');
    tr.setAttribute(SPLIT_ATTR, 'true');
    cells.forEach((cell, ci) => {
      const tag = cell.tagName.toLowerCase() === 'th' ? 'th' : 'td';
      const nc = document.createElement(tag);
      nc.colSpan = cell.colSpan;
      nc.rowSpan = 1;
      nc.className = cell.className;
      const line = lineGroups[ci][li];
      if (line === undefined || line === '') {
        nc.innerHTML = '&nbsp;';
      } else {
        nc.innerHTML = line;
      }
      tr.appendChild(nc);
    });
    out.push(tr);
  }
  return out;
}

function splitRowByCharChunks(row: HTMLTableRowElement, chunkSize: number): HTMLTableRowElement[] {
  const cells = Array.from(row.cells);
  if (cells.length === 0) return [row];

  const lineGroups = cells.map((c) => {
    const lines = splitCellLines(c);
    if (lines.length > 1) return lines;
    const t = c.innerText || '';
    if (t.length <= chunkSize) return [c.innerHTML];
    const chunks: string[] = [];
    for (let i = 0; i < t.length; i += chunkSize) {
      chunks.push(t.slice(i, i + chunkSize));
    }
    return chunks;
  });

  const maxLines = Math.max(1, ...lineGroups.map((l) => l.length));
  if (maxLines <= 1) return [row];

  const out: HTMLTableRowElement[] = [];
  for (let li = 0; li < maxLines; li++) {
    const tr = document.createElement('tr');
    tr.setAttribute(SPLIT_ATTR, 'true');
    cells.forEach((cell, ci) => {
      const tag = cell.tagName.toLowerCase() === 'th' ? 'th' : 'td';
      const nc = document.createElement(tag);
      nc.colSpan = cell.colSpan;
      nc.rowSpan = 1;
      nc.className = cell.className;
      const line = lineGroups[ci][li];
      if (line === undefined || line === '') nc.innerHTML = '&nbsp;';
      else {
        const raw = line;
        if (raw.includes('<')) nc.innerHTML = raw;
        else nc.textContent = raw;
      }
      tr.appendChild(nc);
    });
    out.push(tr);
  }
  return out;
}

function replaceRowWithRows(row: HTMLTableRowElement, newRows: HTMLTableRowElement[]): void {
  if (newRows.length <= 1) return;
  const parent = row.parentElement;
  if (!parent) return;
  for (const r of newRows) {
    parent.insertBefore(r, row);
  }
  parent.removeChild(row);
}

function insertPageSpacerBefore(
  table: HTMLTableElement,
  beforeRow: HTMLTableRowElement,
  heightPx: number,
  colspan: number,
): HTMLTableRowElement {
  const tbody = beforeRow.parentElement;
  const parent: HTMLElement = tbody?.tagName === 'TBODY' ? tbody : table;
  const tr = document.createElement('tr');
  tr.setAttribute(SPACER_ATTR, 'true');
  const td = document.createElement('td');
  td.colSpan = colspan;
  const h = Math.max(0, heightPx);
  td.setAttribute(
    'style',
    `height:${h}px;padding:0;border:none;line-height:0;font-size:0;vertical-align:top;overflow:hidden;`,
  );
  td.innerHTML = '&nbsp;';
  tr.appendChild(td);
  tr.style.height = `${h}px`;
  parent.insertBefore(tr, beforeRow);
  return tr;
}

/**
 * Mutates `root` in place (use a clone for PDF capture). Splits oversized rows and inserts spacer rows.
 */
export function prepareTableAwarePdfDom(root: HTMLElement, options: Options): void {
  const pageH = getPdfPageContentHeightPx(root, options);
  if (pageH < 40) return;

  const tables = Array.from(root.querySelectorAll(SPLITTABLE_SELECTOR)) as HTMLTableElement[];

  for (const table of tables) {
    let guard = 0;
    while (guard++ < MAX_LOOPS) {
      const rows = getDataRows(table);
      let changed = false;
      for (const row of rows) {
        const h = row.offsetHeight;
        if (h <= pageH + 2) continue;

        let parts = splitRowByLines(row);
        if (parts.length === 1) {
          parts = splitRowByCharChunks(row, 320);
        }
        if (parts.length <= 1) continue;

        replaceRowWithRows(row, parts);
        changed = true;
        break;
      }
      if (!changed) break;
    }
  }

  let spacerGuard = 0;
  while (spacerGuard++ < MAX_LOOPS) {
    let inserted: HTMLTableRowElement | null = null;

    outer: for (const table of tables) {
      const colspan = getTableColspan(table);
      const rows = getDataRows(table);
      for (const row of rows) {
        const y = getOffsetTopRelativeToRoot(row, root);
        const h = row.offsetHeight;
        const yInPage = y - Math.floor(y / pageH) * pageH;

        if (h > pageH + 2) {
          const parts = splitRowByCharChunks(row, 200);
          if (parts.length > 1) {
            replaceRowWithRows(row, parts);
            inserted = parts[0];
            break outer;
          }
        }

        if (yInPage + h > pageH + 1 && yInPage > 1) {
          const pad = pageH - yInPage;
          if (pad > 0.5) {
            inserted = insertPageSpacerBefore(table, row, pad, colspan);
            break outer;
          }
        }
      }
    }

    if (!inserted) break;
  }
}
