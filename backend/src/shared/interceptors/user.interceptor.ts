import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../../core/prisma/prisma.service';

@Injectable()
export class UserInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;

    if (userId) {
      // Get complete user data with relations
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          departmentId: true,
          jobPositionId: true,
          department: {
            select: {
              id: true,
              name: true,
            },
          },
          jobPosition: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // Update request user with complete data
      request.user = user;
    }

    return next.handle();
  }
} 