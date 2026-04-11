import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { S3CompatibleStorageService } from './s3-compatible-storage.service';

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-s3', () => {
  const actual = jest.requireActual('@aws-sdk/client-s3');
  return {
    ...actual,
    S3Client: jest.fn().mockImplementation(() => ({
      send: (...args: unknown[]) => mockSend(...args),
    })),
  };
});

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest
    .fn()
    .mockResolvedValue('https://example.com/presigned-get-url'),
}));

describe('S3CompatibleStorageService', () => {
  let service: S3CompatibleStorageService;

  const configMap: Record<string, string> = {
    AWS_S3_BUCKET: 'test-bucket',
    AWS_REGION: 'us-east-1',
    AWS_ACCESS_KEY_ID: 'test-access-key',
    AWS_SECRET_ACCESS_KEY: 'test-secret-key',
  };

  beforeEach(async () => {
    mockSend.mockReset();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3CompatibleStorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => configMap[key]),
          },
        },
      ],
    }).compile();

    service = module.get(S3CompatibleStorageService);
  });

  it('upload sends PutObjectCommand and returns result', async () => {
    mockSend.mockResolvedValueOnce({ ETag: '"abc123"' });

    const buf = Buffer.from('hello');
    const result = await service.upload(buf, 'file-key.bin', {
      mimeType: 'application/octet-stream',
    });

    expect(mockSend).toHaveBeenCalledTimes(1);
    expect(mockSend.mock.calls[0][0]).toBeInstanceOf(PutObjectCommand);
    expect(result.key).toBe('file-key.bin');
    expect(result.size).toBe(5);
    expect(result.etag).toBe('abc123');
    expect(result.url).toBe('s3://test-bucket/file-key.bin');
  });

  it('download returns buffer from GetObject body', async () => {
    mockSend.mockResolvedValueOnce({
      Body: {
        transformToByteArray: async () => new Uint8Array([10, 20, 30]),
      },
    });

    const buf = await service.download('k');
    expect(mockSend.mock.calls[0][0]).toBeInstanceOf(GetObjectCommand);
    expect(buf.equals(Buffer.from([10, 20, 30]))).toBe(true);
  });

  it('delete sends DeleteObjectCommand', async () => {
    mockSend.mockResolvedValueOnce({});
    await service.delete('k2');
    expect(mockSend.mock.calls[0][0]).toBeInstanceOf(DeleteObjectCommand);
  });

  it('exists returns false on 404 HeadObject', async () => {
    mockSend.mockRejectedValueOnce({
      name: 'NotFound',
      $metadata: { httpStatusCode: 404 },
    });
    await expect(service.exists('missing')).resolves.toBe(false);
  });

  it('exists returns true when HeadObject succeeds', async () => {
    mockSend.mockResolvedValueOnce({});
    await expect(service.exists('present')).resolves.toBe(true);
    expect(mockSend.mock.calls[0][0]).toBeInstanceOf(HeadObjectCommand);
  });

  it('getMetadata maps HeadObject response', async () => {
    const lastMod = new Date('2020-01-01T00:00:00.000Z');
    mockSend.mockResolvedValueOnce({
      ContentLength: 42,
      LastModified: lastMod,
      ContentType: 'image/png',
      ETag: '"etagval"',
    });

    const meta = await service.getMetadata('img.png');
    expect(meta.size).toBe(42);
    expect(meta.lastModified).toEqual(lastMod);
    expect(meta.contentType).toBe('image/png');
    expect(meta.etag).toBe('etagval');
  });

  it('getSignedUrl delegates to presigner', async () => {
    const presigner = jest.requireMock('@aws-sdk/s3-request-presigner');
    const url = await service.getSignedUrl('key', 120);
    expect(presigner.getSignedUrl).toHaveBeenCalled();
    expect(url).toBe('https://example.com/presigned-get-url');
  });

  it('getPublicUrl uses S3_PUBLIC_BASE_URL when set', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3CompatibleStorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'S3_PUBLIC_BASE_URL') {
                return 'https://cdn.example.com/media';
              }
              return configMap[key];
            }),
          },
        },
      ],
    }).compile();

    const svc = module.get(S3CompatibleStorageService);
    expect(svc.getPublicUrl('a/b.png')).toBe(
      'https://cdn.example.com/media/a/b.png',
    );
  });

  it('throws when bucket is not configured', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3CompatibleStorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(() => undefined),
          },
        },
      ],
    }).compile();

    const svc = module.get(S3CompatibleStorageService);
    await expect(svc.upload(Buffer.from('x'), 'k')).rejects.toThrow(
      /AWS_S3_BUCKET or S3_BUCKET/,
    );
  });
});
