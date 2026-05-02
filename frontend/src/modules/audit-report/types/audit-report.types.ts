export interface AuditReportCriteriaGroup {
  total: number;
  comply: number;
  notComplyMinor: number;
  notComplyMajor: number;
  notAssessed: number;
}

export interface AuditReportElement {
  elementId: string;
  elementCode: string;
  elementName: string;
  hasAudit: boolean;
  initial: AuditReportCriteriaGroup;
  transitionLevel: AuditReportCriteriaGroup;
  advanceLevel: AuditReportCriteriaGroup;
}

export interface AuditReportSummary {
  initial: AuditReportCriteriaGroup;
  transitionLevel: AuditReportCriteriaGroup;
  advanceLevel: AuditReportCriteriaGroup;
}

export interface AuditReportPeriod {
  id: string;
  month: number;
  year: number;
}

export interface AuditReport {
  period: AuditReportPeriod | null;
  elements: AuditReportElement[];
  summary: AuditReportSummary;
}

export interface AuditPeriodOption {
  id: string;
  month: number;
  year: number;
}
