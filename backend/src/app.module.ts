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
import { HseCategoriesModule } from './modules/hse-categories/hse-categories.module';
import { ThreatsModule } from './modules/threats/threats.module';
import { ThreatMitigationsModule } from './modules/threat-mitigations/threat-mitigations.module';
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
    HseCategoriesModule,
    ThreatsModule,
    ThreatMitigationsModule,
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
