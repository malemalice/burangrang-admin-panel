import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { AccessLogsService } from '../services/access-logs.service';

const EXCLUDED_PATHS = ['/', '/health'];

function shouldExclude(path: string, method: string): boolean {
  const normalizedPath = path.split('?')[0];
  if (EXCLUDED_PATHS.some((p) => normalizedPath === p || normalizedPath.startsWith(p + '/'))) {
    return true;
  }
  if (normalizedPath.startsWith('/uploads/public/') || normalizedPath.startsWith('/uploads/private/')) {
    return true;
  }
  return false;
}

function getPayload(req: Request): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  if (req.query && Object.keys(req.query).length > 0) {
    payload.query = req.query;
  }
  if (req.params && Object.keys(req.params).length > 0) {
    payload.params = req.params;
  }
  if (req.body !== undefined && req.body !== null && Object.keys(req.body).length > 0) {
    payload.body = req.body;
  }
  return Object.keys(payload).length > 0 ? payload : {};
}

@Injectable()
export class AccessLogInterceptor implements NestInterceptor {
  constructor(private readonly accessLogsService: AccessLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse();

    if (shouldExclude(req.path, req.method)) {
      return next.handle();
    }

    const startTime = Date.now();
    const userId = (req as any).user?.id;
    const method = req.method;
    const endpoint = req.originalUrl?.split('?')[0] ?? req.path;
    const ipAddress = req.ip ?? req.socket?.remoteAddress ?? undefined;
    const userAgent = req.get('User-Agent') ?? undefined;
    const payload = getPayload(req);

    return next.handle().pipe(
      tap({
        next: () => {
          const executionTime = Date.now() - startTime;
          const statusCode = res.statusCode;
          this.accessLogsService
            .createAccessLog({
              userId,
              method,
              endpoint,
              statusCode,
              payload,
              ipAddress,
              userAgent,
              executionTime,
            })
            .catch(() => {
              // Already logged inside createAccessLog
            });
        },
        error: () => {
          const executionTime = Date.now() - startTime;
          const statusCode = res.statusCode || 500;
          this.accessLogsService
            .createAccessLog({
              userId,
              method,
              endpoint,
              statusCode,
              payload,
              ipAddress,
              userAgent,
              executionTime,
            })
            .catch(() => {});
        },
      }),
    );
  }
}
