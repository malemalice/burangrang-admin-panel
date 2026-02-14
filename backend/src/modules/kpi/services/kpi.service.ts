import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import {
  AbsenceEnum,
  IncidentActivitiesEnum,
  IncidentClassificationEnum,
  IncidentScopeEnum,
  IncidentTypeEnum,
  ManHourGroupEnum,
  MonthEnum,
} from '@prisma/client';
import { KpiDataPointDto } from '../dto/kpi-data-point.dto';

const MONTH_TO_NUM: Record<MonthEnum, number> = {
  [MonthEnum.JAN]: 1,
  [MonthEnum.FEB]: 2,
  [MonthEnum.MAR]: 3,
  [MonthEnum.APR]: 4,
  [MonthEnum.MAY]: 5,
  [MonthEnum.JUN]: 6,
  [MonthEnum.JUL]: 7,
  [MonthEnum.AUG]: 8,
  [MonthEnum.SEP]: 9,
  [MonthEnum.OCT]: 10,
  [MonthEnum.NOV]: 11,
  [MonthEnum.DEC]: 12,
};

/** Severity weights for TRSR calculation */
const SEVERITY_WEIGHTS: Record<IncidentClassificationEnum, number> = {
  [IncidentClassificationEnum.FATALITY]: 200,
  [IncidentClassificationEnum.MAJOR]: 10,
  [IncidentClassificationEnum.MINOR]: 1,
};

const RECORDABLE_INCIDENT_TYPES = [
  IncidentTypeEnum.ACCIDENT,
  IncidentTypeEnum.DANGEROUS_OR_HAZARDOUS_OCCURRENCE,
];

const RECORDABLE_CLASSIFICATIONS = [
  IncidentClassificationEnum.MAJOR,
  IncidentClassificationEnum.MINOR,
  IncidentClassificationEnum.FATALITY,
];

@Injectable()
export class KpiService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Parse period params and derive fiscal years to query.
   * Fiscal year YYYY-ZZZZ = Aug YYYY to Jul ZZZZ.
   * If no params, use last 6 fiscal years from current date.
   */
  private getFiscalYears(periodFrom?: string, periodTo?: string): string[] {
    const now = new Date();
    let startYear: number;
    let endYear: number;

    if (periodFrom && periodTo) {
      const [yFrom, mFrom] = periodFrom.split('-').map(Number);
      const [yTo, mTo] = periodTo.split('-').map(Number);
      // Convert to fiscal start/end years
      startYear = mFrom >= 8 ? yFrom : yFrom - 1;
      endYear = mTo >= 8 ? yTo + 1 : yTo;
    } else {
      const currentFY = now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1;
      startYear = currentFY - 5;
      endYear = currentFY + 1;
    }

    const years: string[] = [];
    for (let y = startYear; y <= endYear; y++) {
      years.push(`${y}-${y + 1}`);
    }
    return years;
  }

  /**
   * Aggregate man hours by fiscal year and group.
   * Man hours: month/year map to fiscal year (Aug YYYY to Jul ZZZZ).
   */
  private async getManHoursByFiscalYear(
    fiscalYears: string[],
  ): Promise<Map<string, { student: number; nonStudent: number }>> {
    const startYears = fiscalYears.map((fy) => Number(fy.split('-')[0]));
    const minYear = Math.min(...startYears);
    const maxYear = Math.max(...startYears) + 1;

    const allManHours = await this.prisma.manHour.findMany({
      where: {
        isActive: true,
        year: { gte: minYear, lte: maxYear },
      },
      select: { year: true, month: true, group: true, total: true },
    });

    const result = new Map<string, { student: number; nonStudent: number }>();
    for (const fy of fiscalYears) {
      result.set(fy, { student: 0, nonStudent: 0 });
    }

    for (const mh of allManHours) {
      const monthNum = MONTH_TO_NUM[mh.month];
      const academicYear =
        monthNum >= 8 ? `${mh.year}-${mh.year + 1}` : `${mh.year - 1}-${mh.year}`;
      if (!result.has(academicYear)) continue;
      const row = result.get(academicYear)!;
      const total = Number(mh.total);
      if (mh.group === ManHourGroupEnum.STUDENT) {
        row.student += total;
      } else {
        row.nonStudent += total;
      }
    }
    return result;
  }

  /**
   * Count recordable incidents per fiscal year, split by activities (STUDY/WORK).
   * Uses GENERAL type only, recordable = ACCIDENT/DANGEROUS_OR_HAZARDOUS_OCCURRENCE + MAJOR/MINOR/FATALITY.
   */
  private async getRecordableIncidentCounts(
    fiscalYears: string[],
  ): Promise<
    Map<
      string,
      { studyCount: number; workCount: number; studySeverityScore: number; workSeverityScore: number }
    >
  > {
    const incidents = await this.prisma.incident.findMany({
      where: {
        isActive: true,
        type: IncidentScopeEnum.GENERAL,
        incidentType: { in: RECORDABLE_INCIDENT_TYPES },
        incidentClassification: { in: RECORDABLE_CLASSIFICATIONS },
      },
      select: { incidentDate: true, activities: true, incidentClassification: true },
    });

    const result = new Map<
      string,
      { studyCount: number; workCount: number; studySeverityScore: number; workSeverityScore: number }
    >();
    for (const fy of fiscalYears) {
      result.set(fy, { studyCount: 0, workCount: 0, studySeverityScore: 0, workSeverityScore: 0 });
    }

    for (const i of incidents) {
      const d = i.incidentDate;
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      const academicYear = month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
      if (!result.has(academicYear)) continue;

      const row = result.get(academicYear)!;
      const weight = SEVERITY_WEIGHTS[i.incidentClassification];

      if (i.activities === IncidentActivitiesEnum.STUDY) {
        row.studyCount += 1;
        row.studySeverityScore += weight;
      } else {
        row.workCount += 1;
        row.workSeverityScore += weight;
      }
    }
    return result;
  }

  /**
   * Count LTI (Lost Time Injury) incidents per fiscal year, split by activities.
   * LTI = recordable GENERAL incident with absence='MORE_THAN_THREE_DAYS'.
   */
  private async getLtiIncidentCounts(
    fiscalYears: string[],
  ): Promise<Map<string, { studyCount: number; workCount: number }>> {
    const incidents = await this.prisma.incident.findMany({
      where: {
        isActive: true,
        type: IncidentScopeEnum.GENERAL,
        incidentType: { in: RECORDABLE_INCIDENT_TYPES },
        incidentClassification: { in: RECORDABLE_CLASSIFICATIONS },
        absence: AbsenceEnum.MORE_THAN_THREE_DAYS,
      },
      select: { incidentDate: true, activities: true },
    });

    const result = new Map<string, { studyCount: number; workCount: number }>();
    for (const fy of fiscalYears) {
      result.set(fy, { studyCount: 0, workCount: 0 });
    }

    for (const i of incidents) {
      const d = i.incidentDate;
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      const academicYear = month >= 8 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
      if (!result.has(academicYear)) continue;

      const row = result.get(academicYear)!;
      if (i.activities === IncidentActivitiesEnum.STUDY) {
        row.studyCount += 1;
      } else {
        row.workCount += 1;
      }
    }
    return result;
  }

  private round2(n: number): number {
    return Math.round(n * 100) / 100;
  }

  async getTrifr(periodFrom?: string, periodTo?: string): Promise<KpiDataPointDto[]> {
    const fiscalYears = this.getFiscalYears(periodFrom, periodTo);
    const [manHoursMap, incidentMap] = await Promise.all([
      this.getManHoursByFiscalYear(fiscalYears),
      this.getRecordableIncidentCounts(fiscalYears),
    ]);

    const MILLION = 1_000_000;
    return fiscalYears.map((fy) => {
      const mh = manHoursMap.get(fy) ?? { student: 0, nonStudent: 0 };
      const inc = incidentMap.get(fy) ?? { studyCount: 0, workCount: 0, studySeverityScore: 0, workSeverityScore: 0 };

      const studyRelated =
        mh.student > 0 ? (inc.studyCount * MILLION) / mh.student : 0;
      const workRelated =
        mh.nonStudent > 0 ? (inc.workCount * MILLION) / mh.nonStudent : 0;
      const totalMh = mh.student + mh.nonStudent;
      const totalIncidents = inc.studyCount + inc.workCount;
      const total = totalMh > 0 ? (totalIncidents * MILLION) / totalMh : 0;

      return {
        year: fy,
        studyRelated: this.round2(studyRelated),
        workRelated: this.round2(workRelated),
        total: this.round2(total),
      };
    });
  }

  async getTrsr(periodFrom?: string, periodTo?: string): Promise<KpiDataPointDto[]> {
    const fiscalYears = this.getFiscalYears(periodFrom, periodTo);
    const [manHoursMap, incidentMap] = await Promise.all([
      this.getManHoursByFiscalYear(fiscalYears),
      this.getRecordableIncidentCounts(fiscalYears),
    ]);

    const MILLION = 1_000_000;
    return fiscalYears.map((fy) => {
      const mh = manHoursMap.get(fy) ?? { student: 0, nonStudent: 0 };
      const inc = incidentMap.get(fy) ?? { studyCount: 0, workCount: 0, studySeverityScore: 0, workSeverityScore: 0 };

      const studyRelated =
        mh.student > 0 ? (inc.studySeverityScore * MILLION) / mh.student : 0;
      const workRelated =
        mh.nonStudent > 0 ? (inc.workSeverityScore * MILLION) / mh.nonStudent : 0;
      const totalMh = mh.student + mh.nonStudent;
      const totalSeverity = inc.studySeverityScore + inc.workSeverityScore;
      const total = totalMh > 0 ? (totalSeverity * MILLION) / totalMh : 0;

      return {
        year: fy,
        studyRelated: this.round2(studyRelated),
        workRelated: this.round2(workRelated),
        total: this.round2(total),
      };
    });
  }

  async getLticr(periodFrom?: string, periodTo?: string): Promise<KpiDataPointDto[]> {
    const fiscalYears = this.getFiscalYears(periodFrom, periodTo);
    const [manHoursMap, incidentMap] = await Promise.all([
      this.getManHoursByFiscalYear(fiscalYears),
      this.getLtiIncidentCounts(fiscalYears),
    ]);

    const MILLION = 1_000_000;
    return fiscalYears.map((fy) => {
      const mh = manHoursMap.get(fy) ?? { student: 0, nonStudent: 0 };
      const lti = incidentMap.get(fy) ?? { studyCount: 0, workCount: 0 };

      const studyRelated =
        mh.student > 0 ? (lti.studyCount * MILLION) / mh.student : 0;
      const workRelated =
        mh.nonStudent > 0 ? (lti.workCount * MILLION) / mh.nonStudent : 0;
      const totalMh = mh.student + mh.nonStudent;
      const totalLti = lti.studyCount + lti.workCount;
      const total = totalMh > 0 ? (totalLti * MILLION) / totalMh : 0;

      return {
        year: fy,
        studyRelated: this.round2(studyRelated),
        workRelated: this.round2(workRelated),
        total: this.round2(total),
      };
    });
  }
}
