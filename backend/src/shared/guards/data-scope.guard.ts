import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Request } from 'express';
import { UserContext } from '../types/user-context';
import { DATA_SCOPED_KEY } from '../decorators/data-scoped.decorator';

interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  userContext?: UserContext;
}

/**
 * Guard that enriches the request with userContext (userId, roleId, roleName, dataLevel, departmentId).
 * Only runs on controllers/methods that use @DataScoped() so that only the four data-scoped modules
 * (enrollments, work-permits, certificates, PPE withdrawals) pay the extra DB load.
 */
@Injectable()
export class DataScopeGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const entityName = this.reflector.getAllAndOverride<string>(DATA_SCOPED_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!entityName) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user?.id) {
      throw new ForbiddenException('User context required for data-scoped access');
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        role: true,
      },
    });

    if (!dbUser?.role) {
      throw new ForbiddenException('User or role not found');
    }

    const role = dbUser.role as { id: string; name: string; dataLevel?: string };
    const dataLevel = (role.dataLevel ?? 'SUPER') as UserContext['dataLevel'];

    request.userContext = {
      userId: dbUser.id,
      roleId: role.id,
      roleName: role.name,
      dataLevel: dataLevel === 'SELF' || dataLevel === 'DEPARTMENT' ? dataLevel : 'SUPER',
      departmentId: dbUser.departmentId ?? null,
    };

    return true;
  }
}
