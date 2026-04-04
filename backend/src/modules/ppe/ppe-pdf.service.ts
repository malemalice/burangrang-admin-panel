import { Injectable, Logger } from '@nestjs/common';
import { format } from 'date-fns';
import { PPEWithdrawalDto } from './dto/ppe-withdrawal.dto';
import { ApprovalStatusHistory } from '../approvals/dto/master-approval.dto';

@Injectable()
export class PpePdfService {
  private readonly logger = new Logger(PpePdfService.name);

  private na(v: unknown): string {
    return v != null && v !== '' ? String(v) : '—';
  }

  private formatDate(d: Date | string | null | undefined, fmt = 'dd MMMM yyyy'): string {
    if (!d) return '—';
    try {
      return format(new Date(d), fmt);
    } catch {
      return String(d);
    }
  }

  private workflowStepDisplay(line: number): number {
    return line + 1;
  }

  private formatWorkflowStatusLabel(
    lineStatus: 'completed' | 'current' | 'pending',
    lastApprovalStatus: string | undefined,
  ): string {
    if (lineStatus === 'completed') return lastApprovalStatus || 'Completed';
    if (lineStatus === 'current') return 'Awaiting verification';
    return 'Pending';
  }

  private buildHtml(
    withdrawal: PPEWithdrawalDto,
    approvalHistory: ApprovalStatusHistory | null,
    viewUrl: string,
  ): string {
    const statusLabel: Record<string, string> = {
      PENDING: 'Pending',
      WAITING_APPROVAL: 'Waiting Approval',
      APPROVED: 'Approved',
      COLLECTED: 'Collected',
      CANCELLED: 'Cancelled',
      REJECTED: 'Rejected',
    };

    const allApprovals = (approvalHistory?.history ?? [])
      .slice()
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const approvalLines = approvalHistory?.allApprovalLines ?? [];

    const isTerminal = ['COLLECTED', 'CANCELLED', 'REJECTED'].includes(withdrawal.status);

    // --- Info rows ---
    const infoRows: [string, string][] = [
      ['Withdrawal Code', this.na(withdrawal.withdrawalCode)],
      ['Withdrawal Date', this.formatDate(withdrawal.withdrawalDate)],
      ['Status', statusLabel[withdrawal.status] ?? withdrawal.status],
      ['Requested By', this.na(withdrawal.createdByName || withdrawal.createdBy)],
      ['Requested For', this.na(withdrawal.requestedForName)],
      ['Department', this.na(withdrawal.departmentName || withdrawal.departmentId)],
    ];
    if (withdrawal.jobPositionName) infoRows.push(['Job Position', this.na(withdrawal.jobPositionName)]);
    if (withdrawal.collectedDate) infoRows.push(['Collected Date', this.formatDate(withdrawal.collectedDate, 'dd MMMM yyyy HH:mm')]);
    if (withdrawal.collectedBy) infoRows.push(['Collected By', this.na(withdrawal.collectedBy)]);
    infoRows.push(['Created At', this.formatDate(withdrawal.createdAt, 'dd MMMM yyyy HH:mm')]);
    infoRows.push(['Last Updated', this.formatDate(withdrawal.updatedAt, 'dd MMMM yyyy HH:mm')]);
    if (withdrawal.notes) infoRows.push(['Notes', this.na(withdrawal.notes)]);

    const infoTableRows = infoRows
      .map(
        ([label, value], i) => `
      <tr style="background:${i % 2 === 0 ? '#fff' : '#f9f9f9'}">
        <td style="border:1px solid #ccc;padding:6px 10px;font-size:11px;font-weight:600;color:#555;width:30%;white-space:nowrap;">${label}</td>
        <td style="border:1px solid #ccc;padding:6px 10px;font-size:11px;color:#111;${label === 'Notes' ? 'white-space:pre-wrap;' : ''}">${value}</td>
      </tr>`,
      )
      .join('');

    // --- Items table ---
    const itemRows = (withdrawal.items ?? [])
      .map(
        (item, idx) => `
      <tr style="background:${idx % 2 === 0 ? '#fff' : '#f9f9f9'}">
        <td style="border:1px solid #ccc;padding:5px 8px;font-size:11px;color:#111;">${idx + 1}</td>
        <td style="border:1px solid #ccc;padding:5px 8px;font-size:11px;color:#111;word-break:break-word;">${this.na(item.stockItemEquipmentName || item.stockItemId)}</td>
        <td style="border:1px solid #ccc;padding:5px 8px;font-size:11px;color:#111;">${this.na(item.stockItemEquipmentType)}</td>
        <td style="border:1px solid #ccc;padding:5px 8px;font-size:11px;color:#111;">${this.na(item.stockItemEquipmentSize)}</td>
        <td style="border:1px solid #ccc;padding:5px 8px;font-size:11px;color:#111;text-align:center;">${item.requestedQuantity}</td>
        <td style="border:1px solid #ccc;padding:5px 8px;font-size:11px;color:#111;text-align:center;">${item.approvedQuantity ?? '—'}</td>
        <td style="border:1px solid #ccc;padding:5px 8px;font-size:11px;color:#111;text-align:center;">${item.issuedQuantity ?? '—'}</td>
      </tr>`,
      )
      .join('');

    const itemsSection =
      (withdrawal.items ?? []).length > 0
        ? `<table style="width:100%;border-collapse:collapse;border:1px solid #ccc;">
          <thead>
            <tr style="background:#e8e8e8;">
              <th style="border:1px solid #ccc;padding:6px 8px;font-size:10px;font-weight:700;text-align:left;color:#333;width:4%;">No.</th>
              <th style="border:1px solid #ccc;padding:6px 8px;font-size:10px;font-weight:700;text-align:left;color:#333;width:26%;">Equipment Name</th>
              <th style="border:1px solid #ccc;padding:6px 8px;font-size:10px;font-weight:700;text-align:left;color:#333;width:18%;">Type</th>
              <th style="border:1px solid #ccc;padding:6px 8px;font-size:10px;font-weight:700;text-align:left;color:#333;width:14%;">Size</th>
              <th style="border:1px solid #ccc;padding:6px 8px;font-size:10px;font-weight:700;text-align:left;color:#333;width:13%;">Requested Qty</th>
              <th style="border:1px solid #ccc;padding:6px 8px;font-size:10px;font-weight:700;text-align:left;color:#333;width:12%;">Approved Qty</th>
              <th style="border:1px solid #ccc;padding:6px 8px;font-size:10px;font-weight:700;text-align:left;color:#333;width:13%;">Issued Qty</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>`
        : '<p style="font-size:11px;color:#666;">No items found.</p>';

    // --- Approval workflow table ---
    const workflowRows = approvalLines
      .map((line) => {
        const approvalsForLine = allApprovals.filter((a) => a.line === line.line);
        const lastApproval = approvalsForLine.length > 0 ? approvalsForLine[approvalsForLine.length - 1] : null;
        const lineStatus = this.formatWorkflowStatusLabel(line.status, lastApproval?.status);
        return `
        <tr>
          <td style="border:1px solid #ccc;padding:5px 8px;font-size:11px;color:#111;">${this.workflowStepDisplay(line.line)}</td>
          <td style="border:1px solid #ccc;padding:5px 8px;font-size:11px;color:#111;word-break:break-word;">${line.department.name}</td>
          <td style="border:1px solid #ccc;padding:5px 8px;font-size:11px;color:#111;word-break:break-word;">${line.jobPosition.name}</td>
          <td style="border:1px solid #ccc;padding:5px 8px;font-size:11px;font-weight:600;color:#111;">${lineStatus}</td>
          <td style="border:1px solid #ccc;padding:5px 8px;font-size:11px;color:#111;word-break:break-word;">${lastApproval?.creator?.name || '—'}</td>
          <td style="border:1px solid #ccc;padding:5px 8px;font-size:11px;color:#111;white-space:nowrap;">${lastApproval?.createdAt ? this.formatDate(lastApproval.createdAt, 'dd MMMM yyyy, HH:mm') : '—'}</td>
        </tr>`;
      })
      .join('');

    const workflowSection =
      approvalLines.length > 0
        ? `<div style="margin-bottom:16px;">
          <p style="font-size:11px;font-weight:700;color:#333;margin-bottom:6px;">Approval workflow (by step)</p>
          <table style="width:100%;border-collapse:collapse;border:1px solid #ccc;">
            <thead>
              <tr style="background:#e8e8e8;">
                <th style="border:1px solid #ccc;padding:5px 8px;font-size:10px;font-weight:700;text-align:left;color:#333;">Step no.</th>
                <th style="border:1px solid #ccc;padding:5px 8px;font-size:10px;font-weight:700;text-align:left;color:#333;">Organizational unit</th>
                <th style="border:1px solid #ccc;padding:5px 8px;font-size:10px;font-weight:700;text-align:left;color:#333;">Position</th>
                <th style="border:1px solid #ccc;padding:5px 8px;font-size:10px;font-weight:700;text-align:left;color:#333;">Status</th>
                <th style="border:1px solid #ccc;padding:5px 8px;font-size:10px;font-weight:700;text-align:left;color:#333;">Action by</th>
                <th style="border:1px solid #ccc;padding:5px 8px;font-size:10px;font-weight:700;text-align:left;color:#333;">Date and time</th>
              </tr>
            </thead>
            <tbody>${workflowRows}</tbody>
          </table>
        </div>`
        : '';

    // --- Approval log ---
    const logRows = allApprovals
      .map(
        (approval, idx) => `
      <tr style="background:${idx % 2 === 0 ? '#fff' : '#f9f9f9'}">
        <td style="border:1px solid #ccc;padding:5px 8px;font-size:11px;color:#111;">${idx + 1}</td>
        <td style="border:1px solid #ccc;padding:5px 8px;font-size:11px;font-weight:600;color:#111;">${approval.status}</td>
        <td style="border:1px solid #ccc;padding:5px 8px;font-size:11px;color:#111;word-break:break-word;">${approval.creator?.name || '—'}</td>
        <td style="border:1px solid #ccc;padding:5px 8px;font-size:11px;color:#111;word-break:break-word;">${approval.department?.name || '—'}</td>
        <td style="border:1px solid #ccc;padding:5px 8px;font-size:11px;color:#111;word-break:break-word;">${approval.jobPosition?.name || '—'}</td>
        <td style="border:1px solid #ccc;padding:5px 8px;font-size:11px;color:#111;white-space:nowrap;">${approval.createdAt ? this.formatDate(approval.createdAt, 'dd MMMM yyyy, HH:mm') : '—'}</td>
        <td style="border:1px solid #ccc;padding:5px 8px;font-size:11px;color:#111;word-break:break-word;white-space:pre-wrap;">${approval.notes || '—'}${approval.isHistorical ? ' (Historical)' : ''}</td>
      </tr>`,
      )
      .join('');

    const logSection =
      allApprovals.length > 0
        ? `<div>
          <p style="font-size:11px;font-weight:700;color:#333;margin-bottom:6px;">Chronological approval log</p>
          <table style="width:100%;border-collapse:collapse;border:1px solid #ccc;">
            <thead>
              <tr style="background:#e8e8e8;">
                <th style="border:1px solid #ccc;padding:5px 8px;font-size:10px;font-weight:700;text-align:left;color:#333;">No.</th>
                <th style="border:1px solid #ccc;padding:5px 8px;font-size:10px;font-weight:700;text-align:left;color:#333;">Status</th>
                <th style="border:1px solid #ccc;padding:5px 8px;font-size:10px;font-weight:700;text-align:left;color:#333;">Action by</th>
                <th style="border:1px solid #ccc;padding:5px 8px;font-size:10px;font-weight:700;text-align:left;color:#333;">Organizational unit</th>
                <th style="border:1px solid #ccc;padding:5px 8px;font-size:10px;font-weight:700;text-align:left;color:#333;">Position</th>
                <th style="border:1px solid #ccc;padding:5px 8px;font-size:10px;font-weight:700;text-align:left;color:#333;">Date and time</th>
                <th style="border:1px solid #ccc;padding:5px 8px;font-size:10px;font-weight:700;text-align:left;color:#333;">Remarks</th>
              </tr>
            </thead>
            <tbody>${logRows}</tbody>
          </table>
        </div>`
        : approvalLines.length === 0
          ? '<p style="font-size:11px;color:#666;">No approval workflow is associated with this record.</p>'
          : '';

    const nextApproverInfo =
      !isTerminal && approvalHistory?.nextApprover
        ? ` &middot; <span style="font-weight:600;">Next responsible party:</span> ${approvalHistory.nextApprover.department.name} — ${approvalHistory.nextApprover.jobPosition.name} (Step ${this.workflowStepDisplay(approvalHistory.nextApprover.line)})`
        : '';

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>PPE Withdrawal ${this.na(withdrawal.withdrawalCode)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #fff; padding: 32px; color: #111; }
    @page { margin: 20mm; }
  </style>
</head>
<body>
  <!-- Document Header -->
  <div style="border-bottom:2px solid #111;padding-bottom:16px;margin-bottom:24px;display:flex;justify-content:space-between;align-items:flex-start;">
    <div>
      <p style="font-size:10px;font-weight:600;color:#666;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">Health, Safety &amp; Environment</p>
      <h1 style="font-size:22px;font-weight:bold;color:#111;letter-spacing:0.5px;">PPE WITHDRAWAL REQUEST</h1>
      <p style="font-size:13px;color:#444;margin-top:4px;font-weight:600;">${this.na(withdrawal.withdrawalCode)}</p>
    </div>
    <div style="text-align:right;font-size:11px;color:#555;">
      <p>Generated: ${format(new Date(), 'dd MMM yyyy HH:mm')}</p>
      <p style="margin-top:4px;">Status: <strong style="color:#111;">${statusLabel[withdrawal.status] ?? withdrawal.status}</strong></p>
    </div>
  </div>

  <!-- Withdrawal Information -->
  <div style="margin-bottom:24px;">
    <h2 style="font-size:14px;font-weight:bold;color:#111;border-bottom:1px solid #ccc;padding-bottom:4px;margin-bottom:12px;">Withdrawal Information</h2>
    <table style="width:100%;border-collapse:collapse;border:1px solid #ccc;">
      <tbody>${infoTableRows}</tbody>
    </table>
  </div>

  <!-- Withdrawal Items -->
  <div style="margin-bottom:24px;">
    <h2 style="font-size:14px;font-weight:bold;color:#111;border-bottom:1px solid #ccc;padding-bottom:4px;margin-bottom:12px;">Withdrawal Items</h2>
    ${itemsSection}
  </div>

  <!-- Verification and Approval -->
  <div style="margin-bottom:24px;">
    <h2 style="font-size:13px;font-weight:bold;color:#111;border-bottom:1px solid #ccc;padding-bottom:4px;margin-bottom:12px;text-transform:uppercase;letter-spacing:1px;">Verification and Approval</h2>
    <div style="font-size:12px;color:#333;line-height:1.5;margin-bottom:16px;">
      <span style="font-weight:600;">Current approval status:</span>
      <span>${approvalHistory?.currentStatus ?? statusLabel[withdrawal.status] ?? withdrawal.status}</span>
      ${nextApproverInfo}
    </div>
    ${workflowSection}
    ${logSection}
  </div>

  <!-- Footer -->
  <div style="border-top:1px solid #ccc;padding-top:16px;margin-top:24px;display:flex;justify-content:space-between;align-items:flex-end;">
    <p style="font-size:10px;color:#888;">This document is system-generated. Visit the URL below to verify online.</p>
    <div style="text-align:right;">
      <p style="font-size:9px;color:#666;word-break:break-all;max-width:220px;">${viewUrl}</p>
    </div>
  </div>
</body>
</html>`;
  }

  async generateWithdrawalPdf(
    withdrawal: PPEWithdrawalDto,
    approvalHistory: ApprovalStatusHistory | null,
    viewUrl: string,
  ): Promise<Buffer> {
    const html = this.buildHtml(withdrawal, approvalHistory, viewUrl);

    try {
      // Dynamic import to avoid startup failure if puppeteer is not yet installed
      const puppeteer = await import('puppeteer');
      const browser = await puppeteer.default.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
      });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
      });
      await browser.close();
      return Buffer.from(pdfBuffer);
    } catch (err) {
      this.logger.error(`Failed to generate PDF via puppeteer: ${String(err)}`);
      throw err;
    }
  }
}
