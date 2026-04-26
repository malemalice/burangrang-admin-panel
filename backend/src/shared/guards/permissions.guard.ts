import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { ALLOW_OPTIONS_BYPASS_KEY } from '../decorators/allow-options-bypass.decorator';
import { Role } from '../types/role.enum';
import { PrismaService } from '../../core/prisma/prisma.service';
import { Request } from 'express';

interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if @Roles decorator exists - if so, skip permission check (roles take precedence)
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (requiredRoles) {
      // Role-based authorization is present, skip permission check
      return true;
    }

    // Check if @AllowOptionsBypass decorator exists and ?options=true is present
    const allowOptionsBypass = this.reflector.getAllAndOverride<boolean>(
      ALLOW_OPTIONS_BYPASS_KEY,
      [context.getHandler(), context.getClass()],
    );
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;
    if (allowOptionsBypass && request.query?.options === 'true' && user) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }


    if (!user) {
      return false;
    }

    // Super Admin always has access (do not rely on seed-assigned permissions)
    if (user.role === (Role.SUPER_ADMIN as string)) {
      return true;
    }

    // Get user's role with permissions and direct permissions
    const userWithRole = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: {
        permissions: true, // Direct permissions
        role: {
          include: {
            permissions: true, // Role permissions
          },
        },
      },
    });

    if (!userWithRole?.role) {
      return false;
    }

    if ((userWithRole as { deletedAt?: Date | null }).deletedAt) {
      return false;
    }

    // Check if user has all required permissions (from role OR direct assignment)
    const rolePermissions = userWithRole.role.permissions
      .filter((p) => p.isActive && (p as { deletedAt?: Date | null }).deletedAt == null)
      .map((p) => p.name);
    const directPermissions = userWithRole.permissions
      .filter((p) => p.isActive && (p as { deletedAt?: Date | null }).deletedAt == null)
      .map((p) => p.name);
    
    // Merge and deduplicate permissions
    const allPermissions = new Set([...rolePermissions, ...directPermissions]);

    return requiredPermissions.every((permission) =>
      allPermissions.has(permission),
    );
  }
}
