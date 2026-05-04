export interface AuditReportCriteriaInfo {
  criteriaId: string;
  criteriaCode: string;
  criteriaName: string;
  criteriaDescription: string | null;
  clauseCode: string;
  clauseName: string;
}

export interface AuditReportCriteriaGroup {
  total: number;
  comply: number;
  notComplyMinor: number;
  notComplyMajor: number;
  notAssessed: number;
  complyItems: AuditReportCriteriaInfo[];
  notComplyMinorItems: AuditReportCriteriaInfo[];
  notComplyMajorItems: AuditReportCriteriaInfo[];
  notAssessedItems: AuditReportCriteriaInfo[];
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
