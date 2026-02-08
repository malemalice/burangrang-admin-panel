import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/services/prisma.service';
import { ErrorHandlingService } from '../../../shared/services/error-handling.service';

@Injectable()
export class UserPermissionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
  ) {}

  /**
   * Get all permissions directly assigned to a user
   */
  async getUserPermissions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        permissions: true,
      },
    });

    this.errorHandler.throwIfNotFoundById('User', userId, user);

    return user.permissions;
  }

  /**
   * Assign permissions to a user (additive)
   */
  async assignPermissions(userId: string, permissionNames: string[]) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    this.errorHandler.throwIfNotFoundById('User', userId, user);

    // Verify permissions exist
    const permissions = await this.prisma.permission.findMany({
      where: {
        name: { in: permissionNames },
      },
    });

    if (permissions.length !== permissionNames.length) {
      const foundNames = permissions.map((p) => p.name);
      const missingNames = permissionNames.filter((p) => !foundNames.includes(p));
      this.errorHandler.throwBadRequest(`Permissions not found: ${missingNames.join(', ')}`);
    }

    // Connect permissions
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        permissions: {
          connect: permissions.map((p) => ({ id: p.id })),
        },
      },
    });

    return this.getUserPermissions(userId);
  }

  /**
   * Remove a specific permission from a user
   */
  async removePermission(userId: string, permissionName: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    this.errorHandler.throwIfNotFoundById('User', userId, user);

    const permission = await this.prisma.permission.findUnique({
      where: { name: permissionName },
    });

    if (!permission) {
      this.errorHandler.throwBadRequest(`Permission '${permissionName}' not found`);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        permissions: {
          disconnect: { id: permission.id },
        },
      },
    });

    return { message: `Permission ${permissionName} removed from user` };
  }
}
