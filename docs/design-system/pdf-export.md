> [← Design System Index](./index.md)
>
> *Client-side PDF export for entity detail/list pages: `react-to-pdf` template structure, hidden capture target, full-data fetch before capture, table-aware page breaks, and the digital "Verification and approval" section for entities using Master Approvals.*

## PDF Export (Detail Page) — Implementation Principles
Use these when adding "Export PDF" on entity detail pages (e.g. Risk Assessment, Inspection, Dispatch Order). Reference: `RiskAssessmentDetailPage`, `RiskAssessmentPDFTemplate`.

1. **Library**: `react-to-pdf` (`usePDF`). Client-side only; no backend PDF generation.
2. **Dedicated template**: One component only for PDF content (e.g. `[Entity]PDFTemplate`). Props: main entity + full list data + approval history (if applicable). Use print-safe layout: white bg, Arial, HTML tables with `borderCollapse: 'collapse'`, Tailwind for colors. No complex layout or portals.
3. **Full data before capture**: If the page shows paginated children, PDF must include all. On export: fetch all items (e.g. `page: 1`, `limit: 10000`) and refresh approval status in parallel; put results in state; wait ~200 ms for re-render; then call `generateTableAwarePdf(targetRef, buildPdfOptions({...}))` (see §8) so the captured DOM has the full dataset.
4. **Hidden target**: Render the template in a div with `ref={targetRef}`, off-screen (`position: 'absolute', left: '-9999px', top: '-9999px'`), fixed width (e.g. `210mm`), `aria-hidden="true"`. Only this div is used for PDF.
5. **Data fallback**: Pass to template: items = `allItemsForPDF.length ? allItemsForPDF : items`, approval = `approvalHistoryForPDF ?? approvalHistory` so PDF still works if the full fetch hasn't completed or fails.
6. **UX**: Filename = `{entityCode}-{yyyyMMdd-HHmmss}.pdf`. Disable export and show "Preparing PDF…" while loading; toast on success/error.
7. **Template structure**: Header (title + code + date) → Details (key fields; optional HTML with `dangerouslySetInnerHTML` in a constrained block) → Full data table(s) → **Verification and approval** (digital; see below) when the entity uses Master Approvals. Format dates with `date-fns`; use semantic colors for status.
8. **Table rows vs page breaks (html2canvas slicing)**: `react-to-pdf` tiles the screenshot at fixed page heights; long tables can look "cut" mid-row. Mark data tables with `data-pdf-table-splittable` and use `generateTableAwarePdf` from `@/core/lib/pdfExport` (clone + `prepareTableAwarePdfDom`) instead of `toPDF()` for detail/list exports that include long tables. Shared options remain `buildPdfOptions`.

## PDF — Verification and approval section (digital)

For entities integrated with **Master Approvals**, exported PDFs must include a **Verification and approval** section that reflects **digital approval** data from the backend. Do **not** rely on a standalone traditional "Persetujuan" table or wet-signature blocks as the only source of approval evidence—use the same pattern as **`EnvironmentalMeasurementPDFTemplate`** and **`WeightReportPDFTemplate`**.

**Data source**

- Load `ApprovalStatusHistory` via `approvalService.checkApprovalStatus(entityId, APPROVAL_ENTITIES.<ENTITY>)` (align entity with backend `m_approvals.entity`).
- Pass into the PDF template as `approvalHistory?: ApprovalStatusHistory | null`.
- **Detail export**: Prefer refreshing approval immediately before capture (e.g. `approvalHistoryForPDF` snapshot) so the PDF matches the latest `t_approvals` rows—same idea as `EnvironmentalMeasurementDetailPage` / `handleExportPDF`.
- **List / bulk export**: Fetch approval status **per record** in the export queue before calling `generateTableAwarePdf` / `toPDF()` for that row so each file embeds the correct workflow and log.

**Section structure** (order and labels)

1. **Section title**: `Verification and approval` (use this English heading for consistency across modules; introductory copy elsewhere on the PDF may stay bilingual per module).
2. **Summary line**
   - **Current approval status**: `approvalHistory.currentStatus`, or fallback to the entity's workflow status field if needed.
   - If the record is **not** in a terminal "done/closed" state and `approvalHistory.nextApprover` is set: append **Next responsible party**: organizational unit (`department.name`) — position (`jobPosition.name`), and **Step** using 1-based step index (`line + 1` from the API).
3. **Approval workflow (by step)** — render when `approvalHistory.allApprovalLines.length > 0`
   - One row per configured line from Master Approval.
   - Columns: Step no., Organizational unit, Position, Status (derive per line from `line.status` and the latest matching entry in `history` for the same `line`: e.g. completed / awaiting verification / pending), Action by (approver name when completed), Date and time (of the last action on that line, if any).
4. **Chronological approval log** — render when `approvalHistory.history.length > 0`
   - Sort by `createdAt` ascending.
   - Columns: No., Status, Action by, Organizational unit, Position, Date and time, Remarks (`notes`).
5. **No workflow**: If there are no approval lines and no history rows, show a short message such as: *No approval workflow is associated with this record.*

**Layout and capture**

- Prefer plain HTML `<table>` with `style={{ borderCollapse: 'collapse' }}`, borders `border-gray-300`, header row background `bg-gray-100` for reliable `react-to-pdf` / html2canvas output.
- Optional: root wrapper `style={{ fontFamily: 'Arial, sans-serif' }}` and `text-gray-900` / `bg-white` for print clarity.
- Status text may use semantic color classes (e.g. green for approved, red for rejected), matching the on-screen timeline where practical.

**References**: `EnvironmentalMeasurementPDFTemplate.tsx`, `WeightReportPDFTemplate.tsx`, `EnvironmentalMeasurementDetailPage` (PDF + `approvalHistoryForPDF` pattern).
