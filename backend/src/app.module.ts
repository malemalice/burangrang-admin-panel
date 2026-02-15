import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './shared/guards/jwt-auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { MenusModule } from './modules/menus/menus.module';
import { OfficesModule } from './modules/offices/offices.module';
import { PrismaModule } from './core/prisma/prisma.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import appConfig from './core/config/app.config';
import { Reflector } from '@nestjs/core';
import { DepartmentsModule } from './modules/departments/departments.module';
import { JobPositionsModule } from './modules/job-positions/job-positions.module';
import { RiskCategoriesModule } from './modules/risk-categories/risk-categories.module';
import { RisksModule } from './modules/risks/risks.module';
import { RiskMitigationsModule } from './modules/risk-mitigations/risk-mitigations.module';
import { RiskAssessmentModule } from './modules/risk-assessment/risk-assessment.module';
import { RiskMatrixModule } from './modules/risk-matrix/risk-matrix.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

import { MasterApprovalsModule } from './modules/approvals/master-approvals.module';
import { SettingsModule } from './modules/settings/settings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { PPEModule } from './modules/ppe/ppe.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { SharedModule } from './shared/shared.module';
import { ChaptersModule } from './modules/chapters/chapters.module';
import { CoursesModule } from './modules/courses/courses.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { ProgressModule } from './modules/progress/progress.module';
import { RemindersModule } from './modules/reminders/reminders.module';
import { QuizzesModule } from './modules/quizzes/quizzes.module';
import { WorkPermitsModule } from './modules/work-permits/work-permits.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { EnvironmentalMeasurementsModule } from './modules/environmental-measurements/environmental-measurements.module';
import { AreasModule } from './modules/areas/areas.module';
import { AssetsModule } from './modules/assets/assets.module';

import { WasteManagementModule } from './modules/waste-management/waste-management.module';
import { ManHoursModule } from './modules/man-hours/man-hours.module';
import { InspectionsModule } from './modules/inspections/inspections.module';
import { AuditPolicyModule } from './modules/audit-policy/audit-policy.module';
import { AuditSchedulesModule } from './modules/audit-schedules/audit-schedules.module';
import { ZohoWebhooksModule } from './modules/zoho-webhooks/zoho-webhooks.module';
import { RiskRegisterModule } from './modules/risk-register/risk-register.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { UserPermissionsModule } from './modules/user-permissions/user-permissions.module';
import { KpiModule } from './modules/kpi/kpi.module';
import { KpiHseTargetModule } from './modules/kpi-hse-target/kpi-hse-target.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    PrismaModule,
    SharedModule,
    AuthModule,
    UsersModule,
    RolesModule,
    MenusModule,
    OfficesModule,
    PermissionsModule,
    DepartmentsModule,
    JobPositionsModule,
    RiskCategoriesModule,
    RisksModule,
    RiskMitigationsModule,
    RiskAssessmentModule,
    RiskMatrixModule,
    DashboardModule,
    MasterApprovalsModule,
    SettingsModule,
    NotificationsModule,
    UploadsModule,
    PPEModule,
    ChaptersModule,
    CoursesModule,
    EnrollmentsModule,
    ProgressModule,
    RemindersModule,
    QuizzesModule,
    CertificatesModule,
    WorkPermitsModule,
    RoomsModule,
    EnvironmentalMeasurementsModule,
    AreasModule,
    AssetsModule,
    // Waste Management Module (consolidated - includes all waste-related features)
    WasteManagementModule,
    // Man Hours Module
    ManHoursModule,
    // Inspections Module
    InspectionsModule,
    // Audit Policy Module
    AuditPolicyModule,
    // Audit Schedules Module
    AuditSchedulesModule,
    // Zoho Webhooks Module
    ZohoWebhooksModule,
    // Risk Register Module
    RiskRegisterModule,
    // Incidents Module
    IncidentsModule,
    // User Permissions Module
    UserPermissionsModule,
    // KPI Module
    KpiModule,
    // KPI HSE Target Module
    KpiHseTargetModule,
  ],
  providers: [
    Reflector,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule { }
