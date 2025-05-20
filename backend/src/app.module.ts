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
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    PrismaModule,
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
  ],
  providers: [
    Reflector,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
