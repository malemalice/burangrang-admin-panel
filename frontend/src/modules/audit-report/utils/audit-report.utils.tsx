import { AuditReport, AuditReportCriteriaGroup } from '../types/audit-report.types';

export type ComplianceStatus = 'comply' | 'notComplyMinor' | 'notComplyMajor' | 'notAssessed';

export interface DetailCriteriaRow {
  key: string;
  clauseCode: string;
  clauseName: string;
  criteriaCode: string;
  criteriaName: string;
  criteriaDescription: string | null;
  initial: ComplianceStatus | null;
  transitionLevel: ComplianceStatus | null;
  advanceLevel: ComplianceStatus | null;
}

export interface DetailElementGroup {
  elementId: string;
  elementCode: string;
  elementName: string;
  hasAudit: boolean;
  rows: DetailCriteriaRow[];
}

export const STATUS_CONFIG: Record<ComplianceStatus, { label: string; className: string }> = {
  comply: {
    label: 'Comply',
    className: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  },
  notComplyMinor: {
    label: 'Minor',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  },
  notComplyMajor: {
    label: 'Major',
    className: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  },
  notAssessed: {
    label: 'Not Assessed',
    className: 'bg-muted text-muted-foreground',
  },
};

export const compliancePercent = (group: AuditReportCriteriaGroup): number => {
  const assessed = group.total - group.notAssessed;
  if (assessed === 0) return 0;
  return Math.round((group.comply / assessed) * 100);
};

export const buildDetailGroups = (report: AuditReport): DetailElementGroup[] => {
  const STATUS_GROUPS = [
    { groupKey: 'complyItems', status: 'comply' },
    { groupKey: 'notComplyMinorItems', status: 'notComplyMinor' },
    { groupKey: 'notComplyMajorItems', status: 'notComplyMajor' },
    { groupKey: 'notAssessedItems', status: 'notAssessed' },
  ] as const;
  const LEVELS = ['initial', 'transitionLevel', 'advanceLevel'] as const;

  return report.elements.map((element) => {
    const map = new Map<string, DetailCriteriaRow>();

    for (const levelKey of LEVELS) {
      const group = element[levelKey];
      for (const { groupKey, status } of STATUS_GROUPS) {
        for (const item of group[groupKey]) {
          if (!map.has(item.criteriaId)) {
            map.set(item.criteriaId, {
              key: item.criteriaId,
              clauseCode: item.clauseCode,
              clauseName: item.clauseName,
              criteriaCode: item.criteriaCode,
              criteriaName: item.criteriaName,
              criteriaDescription: item.criteriaDescription,
              initial: null,
              transitionLevel: null,
              advanceLevel: null,
            });
          }
          map.get(item.criteriaId)![levelKey] = status;
        }
      }
    }

    return {
      elementId: element.elementId,
      elementCode: element.elementCode,
      elementName: element.elementName,
      hasAudit: element.hasAudit,
      rows: Array.from(map.values()),
    };
  });
};

export const StatusBadge = ({ status }: { status: ComplianceStatus | null }) => {
  if (!status) return <span className="text-muted-foreground text-xs">—</span>;
  const { label, className } = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium ${className}`}>
      {label}
    </span>
  );
};
