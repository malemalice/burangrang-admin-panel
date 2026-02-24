export interface AdminOverviewData {
  lms: {
    overdueEnrollments: number;
    totalEnrollments: number;
    courseCompletionRate: number;
    quizPassRate: number;
  };
  certificates: {
    expiringIn30Days: number;
    totalActive: number;
    renewalBacklog: number;
    categoriesCount: number;
  };
  ppe: {
    lowStockItems: number;
    expiringItems: number;
    withdrawalsPending: number;
    topEquipmentByWithdrawal: string;
  };
  workPermits: {
    pendingApproval: number;
    totalActive: number;
    activePermits: number;
    rejectionRate: number;
  };
  environmental: {
    roomsNotMeasured: number;
    totalRooms: number;
    coveragePercent: number;
    avgReadingsRecorded: number;
  };
  wasteManagement: {
    reportsPendingReview: number;
    totalReports: number;
    missingReports: number;
    totalWasteWeightKg: number;
  };
  manHours: {
    totalManHours: number;
    currentPeriod: string;
    studentManHours: number;
    nonStudentManHours: number;
    yoyChangePercent: number;
  };
}
