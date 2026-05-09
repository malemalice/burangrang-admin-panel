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
import { MasterApprovalsModule } from './modules/approvals/master-approvals.module';
import { ApprovalsModule } from './modules/approvals/approvals.module';
import { SettingsModule } from './modules/settings/settings.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { SharedModule } from './shared/shared.module';
import { AccessLogsModule } from './modules/access-logs/access-logs.module';
import { RemindersModule } from './modules/reminders/reminders.module';
import { UserPermissionsModule } from './modules/user-permissions/user-permissions.module';

const remindersEnabled =
  String(process.env.REMINDERS_ENABLED || 'false').toLowerCase() === 'true';

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
    MasterApprovalsModule,
    ApprovalsModule,
    SettingsModule,
    NotificationsModule,
    UploadsModule,
    AccessLogsModule,
    ...(remindersEnabled ? [RemindersModule] : []),
    UserPermissionsModule,
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
