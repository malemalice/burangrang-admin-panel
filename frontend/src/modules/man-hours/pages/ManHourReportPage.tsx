import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { BarChart3, Download, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button, ThemeButton } from '@/core/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import PageHeader from '@/core/components/ui/PageHeader';
import manHourService from '../services/manHourService';
import {
  ManHourReport,
  ManHourGroup,
  MONTH_SHORT_LABELS,
  GROUP_LABELS,
  MONTHS,
  Month,
} from '../types/man-hour.types';

export default function ManHourReportPage() {
  const [report, setReport] = useState<ManHourReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const currentYear = new Date().getFullYear();

  // Filter states
  const [startYear, setStartYear] = useState(currentYear - 1);
  const [endYear, setEndYear] = useState(currentYear);
  const [groupFilter, setGroupFilter] = useState<ManHourGroup | 'ALL'>('ALL');

  // Generate year options
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  // Generate column headers based on year range
  const columnHeaders = useMemo(() => {
    const headers: { key: string; label: string; month: Month; year: number }[] = [];

    for (let year = startYear; year <= endYear; year++) {
      for (const month of MONTHS) {
        headers.push({
          key: `${month}_${year}`,
          label: `${MONTH_SHORT_LABELS[month]} ${year}`,
          month,
          year,
        });
      }
    }

    return headers;
  }, [startYear, endYear]);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const data = await manHourService.getReport({
        startYear,
        endYear,
        group: groupFilter === 'ALL' ? undefined : groupFilter,
      });
      setReport(data);
    } catch (error) {
      console.error('Failed to fetch report:', error);
      toast.error('Failed to load man hour report');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [startYear, endYear, groupFilter]);

  // Calculate totals for each column
  const columnTotals = useMemo(() => {
    if (!report) return {};
    const totals: Record<string, number> = {};

    columnHeaders.forEach(({ key }) => {
      totals[key] = report.rows.reduce((sum, row) => {
        return sum + (row.monthlyData[key]?.total || 0);
      }, 0);
    });

    return totals;
  }, [report, columnHeaders]);

  // Export to Excel
  const handleExportExcel = () => {
    if (!report || report.rows.length === 0) {
      toast.error('No data to export');
      return;
    }

    setIsExporting(true);
    try {
      // Prepare data for Excel
      const excelData: any[] = [];

      // Add header row
      const headerRow = ['Classes', 'Group', 'Study Hour'];
      columnHeaders.forEach(({ label }) => headerRow.push(label));
      headerRow.push('Total');
      excelData.push(headerRow);

      // Add data rows
      report.rows.forEach((row) => {
        const dataRow: any[] = [
          row.name,
          GROUP_LABELS[row.group],
          row.studyHour,
        ];
        columnHeaders.forEach(({ key }) => {
          dataRow.push(row.monthlyData[key]?.total || 0);
        });
        dataRow.push(row.yearlyTotal);
        excelData.push(dataRow);
      });

      // Add totals row
      const totalsRow: any[] = ['Total', '', ''];
      columnHeaders.forEach(({ key }) => {
        totalsRow.push(columnTotals[key] || 0);
      });
      totalsRow.push(report.totalAccumulationStudentHour);
      excelData.push(totalsRow);

      // Add empty row and summary
      excelData.push([]);
      excelData.push(['Summary']);
      excelData.push(['Total Student Hour', report.totalStudentHour]);
      excelData.push(['Total Accumulation', report.totalAccumulationStudentHour]);
      excelData.push(['Number of Classes', report.rows.length]);

      // Create workbook and worksheet
      const ws = XLSX.utils.aoa_to_sheet(excelData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Man Hour Report');

      // Set column widths
      const colWidths = [
        { wch: 20 }, // Classes
        { wch: 12 }, // Group
        { wch: 12 }, // Study Hour
        ...columnHeaders.map(() => ({ wch: 10 })),
        { wch: 12 }, // Total
      ];
      ws['!cols'] = colWidths;

      // Generate filename with date range
      const filename = `man_hour_report_${startYear}-${endYear}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Failed to export:', error);
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Man Hour Report"
        subtitle="View aggregated man hour data"
        actions={
          <ThemeButton onClick={handleExportExcel} disabled={isExporting || isLoading || !report}>
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export Excel'}
          </ThemeButton>
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">From Year:</span>
              <Select
                value={String(startYear)}
                onValueChange={(val) => setStartYear(parseInt(val))}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">To Year:</span>
              <Select
                value={String(endYear)}
                onValueChange={(val) => setEndYear(parseInt(val))}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Group:</span>
              <Select
                value={groupFilter}
                onValueChange={(val) => setGroupFilter(val as ManHourGroup | 'ALL')}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Groups</SelectItem>
                  <SelectItem value="STUDENT">{GROUP_LABELS.STUDENT}</SelectItem>
                  <SelectItem value="NON_STUDENT">{GROUP_LABELS.NON_STUDENT}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : !report || report.rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mb-4" />
              <p>No data available for the selected period</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0">
                  <tr className="bg-blue-600 text-white">
                    <th className="sticky left-0 bg-blue-600 px-4 py-3 text-left font-semibold min-w-[150px] border-r border-blue-500">
                      Classes
                    </th>
                    <th className="px-4 py-3 text-right font-semibold min-w-[80px] border-r border-blue-500">
                      Study Hour
                    </th>
                    {columnHeaders.map(({ key, label }) => (
                      <th
                        key={key}
                        className="px-3 py-3 text-right font-semibold min-w-[80px] whitespace-nowrap border-r border-blue-500"
                      >
                        {label}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right font-semibold min-w-[100px]">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {report.rows.map((row, index) => (
                    <tr
                      key={`${row.name}-${row.group}`}
                      className={index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-800'}
                    >
                      <td className="sticky left-0 px-4 py-2 font-medium border-b border-r bg-inherit">
                        {row.name}
                      </td>
                      <td className="px-4 py-2 text-right border-b border-r">
                        {row.studyHour}
                      </td>
                      {columnHeaders.map(({ key }) => (
                        <td key={key} className="px-3 py-2 text-right border-b border-r">
                          {row.monthlyData[key]?.total
                            ? row.monthlyData[key].total.toLocaleString()
                            : '-'}
                        </td>
                      ))}
                      <td className="px-4 py-2 text-right font-semibold border-b bg-blue-50 dark:bg-blue-900/30">
                        {row.yearlyTotal.toLocaleString()}
                      </td>
                    </tr>
                  ))}

                  {/* Totals Row */}
                  <tr className="bg-blue-100 dark:bg-blue-900/50 font-bold sticky bottom-0">
                    <td className="sticky left-0 bg-blue-100 dark:bg-blue-900/50 px-4 py-3 border-t-2 border-r">
                      Total
                    </td>
                    <td className="px-4 py-3 text-right border-t-2 border-r">-</td>
                    {columnHeaders.map(({ key }) => (
                      <td key={key} className="px-3 py-3 text-right border-t-2 border-r">
                        {columnTotals[key]
                          ? columnTotals[key].toLocaleString()
                          : '-'}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right border-t-2 bg-blue-200 dark:bg-blue-800">
                      {report.totalAccumulationStudentHour.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {report && report.rows.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Total Student Hour</div>
              <div className="text-2xl font-bold text-blue-600">
                {report.totalStudentHour.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Total Accumulation</div>
              <div className="text-2xl font-bold text-green-600">
                {report.totalAccumulationStudentHour.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Number of Classes</div>
              <div className="text-2xl font-bold text-purple-600">
                {report.rows.length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
