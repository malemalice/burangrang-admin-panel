import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';
import { AccessLogInterceptor } from './access-log.interceptor';
import { AccessLogsService } from '../services/access-logs.service';

const createMockContext = (path: string, method: string, user?: { id: string }) => {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        path,
        method,
        originalUrl: path,
        ip: '127.0.0.1',
        socket: { remoteAddress: '127.0.0.1' },
        get: (name: string) => (name === 'User-Agent' ? 'test-agent' : undefined),
        query: {},
        params: {},
        body: {},
        user,
      }),
      getResponse: () => ({ statusCode: 200 }),
    }),
  } as unknown as ExecutionContext;
};

describe('AccessLogInterceptor', () => {
  let interceptor: AccessLogInterceptor;
  let accessLogsService: { createAccessLog: jest.Mock };

  beforeEach(() => {
    accessLogsService = {
      createAccessLog: jest.fn().mockResolvedValue(undefined),
    };
    interceptor = new AccessLogInterceptor(
      accessLogsService as unknown as AccessLogsService,
    );
  });

  it('should call createAccessLog for non-excluded path', (done) => {
    const context = createMockContext('/users', 'GET', { id: 'user-1' });
    const next: CallHandler = { handle: () => of('ok') };

    interceptor.intercept(context, next).subscribe({
      next: () => {
        expect(accessLogsService.createAccessLog).toHaveBeenCalledTimes(1);
        expect(accessLogsService.createAccessLog).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'user-1',
            method: 'GET',
            endpoint: '/users',
            payload: expect.any(Object),
            ipAddress: '127.0.0.1',
            userAgent: 'test-agent',
          }),
        );
        done();
      },
    });
  });

  it('should not call createAccessLog for excluded path /', (done) => {
    const context = createMockContext('/', 'GET');
    const next: CallHandler = { handle: () => of('ok') };

    interceptor.intercept(context, next).subscribe({
      next: () => {
        expect(accessLogsService.createAccessLog).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('should not call createAccessLog for excluded path /health', (done) => {
    const context = createMockContext('/health', 'GET');
    const next: CallHandler = { handle: () => of('ok') };

    interceptor.intercept(context, next).subscribe({
      next: () => {
        expect(accessLogsService.createAccessLog).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('should not call createAccessLog for uploads/public path', (done) => {
    const context = createMockContext('/uploads/public/abc-123', 'GET');
    const next: CallHandler = { handle: () => of('ok') };

    interceptor.intercept(context, next).subscribe({
      next: () => {
        expect(accessLogsService.createAccessLog).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('should not call createAccessLog for uploads/private path', (done) => {
    const context = createMockContext('/uploads/private/token-xyz', 'GET');
    const next: CallHandler = { handle: () => of('ok') };

    interceptor.intercept(context, next).subscribe({
      next: () => {
        expect(accessLogsService.createAccessLog).not.toHaveBeenCalled();
        done();
      },
    });
  });

  it('should pass through the response', (done) => {
    const context = createMockContext('/access-logs', 'GET');
    const next: CallHandler = { handle: () => of({ data: [] }) };

    interceptor.intercept(context, next).subscribe({
      next: (value) => {
        expect(value).toEqual({ data: [] });
        done();
      },
    });
  });
});
