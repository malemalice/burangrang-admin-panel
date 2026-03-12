import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { PrismaService } from '../../core/prisma/prisma.service';
import { ALLOW_OPTIONS_BYPASS_KEY } from '../decorators/allow-options-bypass.decorator';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { PermissionsGuard } from './permissions.guard';

describe('PermissionsGuard', () => {
    const mockReflector = {
        getAllAndOverride: jest.fn(),
    } as unknown as Reflector;

    const mockPrisma = {
        user: {
            findUnique: jest.fn(),
        },
    } as unknown as PrismaService;

    let guard: PermissionsGuard;

    const createExecutionContext = (request: Record<string, unknown>): ExecutionContext =>
        ({
            getHandler: jest.fn(),
            getClass: jest.fn(),
            switchToHttp: () => ({
                getRequest: () => request,
            }),
        }) as unknown as ExecutionContext;

    beforeEach(() => {
        jest.resetAllMocks();
        guard = new PermissionsGuard(mockReflector, mockPrisma);
    });

    it('allows access when a user inherits quiz permissions from their role', async () => {
        (
            mockReflector.getAllAndOverride as jest.MockedFunction<
                Reflector['getAllAndOverride']
            >
        ).mockImplementation((metadataKey) => {
            if (metadataKey === ROLES_KEY) return undefined;
            if (metadataKey === ALLOW_OPTIONS_BYPASS_KEY) return false;
            if (metadataKey === PERMISSIONS_KEY) return ['quiz:attempt'];
            return undefined;
        });
        (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 'user-1',
            permissions: [],
            role: {
                permissions: [{ name: 'quiz:attempt' }],
            },
        });

        const context = createExecutionContext({
            user: {
                id: 'user-1',
                email: 'user@example.com',
                role: 'User',
            },
            query: {},
        });

        await expect(guard.canActivate(context)).resolves.toBe(true);
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
            where: { id: 'user-1' },
            include: {
                permissions: true,
                role: {
                    include: {
                        permissions: true,
                    },
                },
            },
        });
    });

    it('denies access when quiz permission is not assigned to the role or user', async () => {
        (
            mockReflector.getAllAndOverride as jest.MockedFunction<
                Reflector['getAllAndOverride']
            >
        ).mockImplementation((metadataKey) => {
            if (metadataKey === ROLES_KEY) return undefined;
            if (metadataKey === ALLOW_OPTIONS_BYPASS_KEY) return false;
            if (metadataKey === PERMISSIONS_KEY) return ['quiz:view-attempts'];
            return undefined;
        });
        (mockPrisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 'user-2',
            permissions: [],
            role: {
                permissions: [{ name: 'quiz:read' }],
            },
        });

        const context = createExecutionContext({
            user: {
                id: 'user-2',
                email: 'user2@example.com',
                role: 'User',
            },
            query: {},
        });

        await expect(guard.canActivate(context)).resolves.toBe(false);
    });
});
