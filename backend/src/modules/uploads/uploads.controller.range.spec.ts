/**
 * Focused unit tests for byte-range serving logic in UploadsController.
 * Tests the private serveFileWithRangeSupport method via a thin subclass
 * so we don't need to wire up the full NestJS DI graph.
 */

import { Request, Response } from 'express';

// Pull the private method out via a testable subclass
import { UploadsController } from './uploads.controller';

class TestableUploadsController extends UploadsController {
  public testServe(
    req: Partial<Request>,
    res: Partial<Response>,
    buf: Buffer,
    meta: { mimeType: string; originalName: string },
  ) {
    return (this as any).serveFileWithRangeSupport(req, res, buf, meta);
  }
}

function makeRes() {
  const headers: Record<string, string | number> = {};
  let statusCode = 200;
  let sentBody: Buffer | undefined;

  const res: Partial<Response> = {
    setHeader(name: string, value: string | number) {
      headers[name.toLowerCase()] = value;
      return this as Response;
    },
    status(code: number) {
      statusCode = code;
      return this as Response;
    },
    send(body?: any) {
      sentBody = body;
      return this as Response;
    },
    end() {
      return this as Response;
    },
  };

  return { res, getHeaders: () => headers, getStatus: () => statusCode, getBody: () => sentBody };
}

function makeReq(rangeHeader?: string): Partial<Request> {
  return {
    headers: rangeHeader ? { range: rangeHeader } : {},
    ip: '127.0.0.1',
    get: (name: string) => (name === 'User-Agent' ? 'test-agent' : undefined),
  } as any;
}

const FILE_META = { mimeType: 'video/mp4', originalName: 'test.mp4' };

describe('UploadsController – serveFileWithRangeSupport', () => {
  let ctrl: TestableUploadsController;

  beforeEach(() => {
    // Minimal mock for UploadsService — not used by serveFileWithRangeSupport
    ctrl = new TestableUploadsController(null as any);
  });

  const buf = Buffer.alloc(1000, 0x41); // 1000 bytes of 'A'

  describe('no Range header', () => {
    it('returns 200 with full buffer and Accept-Ranges header', () => {
      const { res, getHeaders, getStatus, getBody } = makeRes();
      ctrl.testServe(makeReq(), res, buf, FILE_META);

      expect(getStatus()).toBe(200);
      expect(getHeaders()['accept-ranges']).toBe('bytes');
      expect(getHeaders()['content-length']).toBe(1000);
      expect(getHeaders()['content-type']).toBe('video/mp4');
      expect(getBody()?.length).toBe(1000);
    });
  });

  describe('valid Range header', () => {
    it('returns 206 for bytes=0-499', () => {
      const { res, getHeaders, getStatus, getBody } = makeRes();
      ctrl.testServe(makeReq('bytes=0-499'), res, buf, FILE_META);

      expect(getStatus()).toBe(206);
      expect(getHeaders()['content-range']).toBe('bytes 0-499/1000');
      expect(getHeaders()['content-length']).toBe(500);
      expect(getBody()?.length).toBe(500);
    });

    it('returns 206 for bytes=500- (open-ended)', () => {
      const { res, getHeaders, getStatus, getBody } = makeRes();
      ctrl.testServe(makeReq('bytes=500-'), res, buf, FILE_META);

      expect(getStatus()).toBe(206);
      expect(getHeaders()['content-range']).toBe('bytes 500-999/1000');
      expect(getHeaders()['content-length']).toBe(500);
      expect(getBody()?.length).toBe(500);
    });

    it('returns 206 for suffix range bytes=-200', () => {
      const { res, getHeaders, getStatus, getBody } = makeRes();
      ctrl.testServe(makeReq('bytes=-200'), res, buf, FILE_META);

      expect(getStatus()).toBe(206);
      expect(getHeaders()['content-range']).toBe('bytes 800-999/1000');
      expect(getHeaders()['content-length']).toBe(200);
      expect(getBody()?.length).toBe(200);
    });

    it('clamps end beyond file size', () => {
      const { res, getHeaders, getStatus } = makeRes();
      ctrl.testServe(makeReq('bytes=0-9999'), res, buf, FILE_META);

      expect(getStatus()).toBe(206);
      expect(getHeaders()['content-range']).toBe('bytes 0-999/1000');
      expect(getHeaders()['content-length']).toBe(1000);
    });

    it('returns single byte for bytes=0-0', () => {
      const { res, getHeaders, getStatus, getBody } = makeRes();
      ctrl.testServe(makeReq('bytes=0-0'), res, buf, FILE_META);

      expect(getStatus()).toBe(206);
      expect(getHeaders()['content-range']).toBe('bytes 0-0/1000');
      expect(getHeaders()['content-length']).toBe(1);
      expect(getBody()?.length).toBe(1);
    });
  });

  describe('invalid Range header → 416', () => {
    it('rejects start > end', () => {
      const { res, getHeaders, getStatus } = makeRes();
      ctrl.testServe(makeReq('bytes=500-100'), res, buf, FILE_META);

      expect(getStatus()).toBe(416);
      expect(getHeaders()['content-range']).toBe('bytes */1000');
    });

    it('rejects start >= file size', () => {
      const { res, getHeaders, getStatus } = makeRes();
      ctrl.testServe(makeReq('bytes=1000-1999'), res, buf, FILE_META);

      expect(getStatus()).toBe(416);
      expect(getHeaders()['content-range']).toBe('bytes */1000');
    });

    it('rejects malformed range header', () => {
      const { res, getHeaders, getStatus } = makeRes();
      ctrl.testServe(makeReq('bytes=abc-def'), res, buf, FILE_META);

      expect(getStatus()).toBe(416);
      expect(getHeaders()['content-range']).toBe('bytes */1000');
    });

    it('rejects non-bytes unit', () => {
      const { res, getHeaders, getStatus } = makeRes();
      ctrl.testServe(makeReq('chunks=0-499'), res, buf, FILE_META);

      expect(getStatus()).toBe(416);
      expect(getHeaders()['content-range']).toBe('bytes */1000');
    });
  });
});
