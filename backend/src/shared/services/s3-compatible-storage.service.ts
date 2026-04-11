import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BaseStorageService, FileMetadata, UploadResult } from './storage.service';

@Injectable()
export class S3CompatibleStorageService extends BaseStorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicBaseUrl: string | undefined;

  constructor(private readonly config: ConfigService) {
    super();
    this.bucket =
      this.config.get<string>('AWS_S3_BUCKET') ??
      this.config.get<string>('S3_BUCKET') ??
      '';
    this.publicBaseUrl =
      this.config.get<string>('S3_PUBLIC_BASE_URL') ??
      this.config.get<string>('AWS_S3_PUBLIC_BASE_URL') ??
      undefined;

    // Omit AWS_REGION / S3_REGION to use us-east-1 (SigV4 default). Empty .env values count as unset.
    const rawRegion =
      this.config.get<string>('AWS_REGION')?.trim() ||
      this.config.get<string>('S3_REGION')?.trim() ||
      '';
    const region = rawRegion || 'us-east-1';
    const endpoint =
      this.config.get<string>('S3_ENDPOINT') ??
      this.config.get<string>('AWS_S3_ENDPOINT') ??
      undefined;
    const accessKeyId =
      this.config.get<string>('AWS_ACCESS_KEY_ID') ??
      this.config.get<string>('S3_ACCESS_KEY_ID');
    const secretAccessKey =
      this.config.get<string>('AWS_SECRET_ACCESS_KEY') ??
      this.config.get<string>('S3_SECRET_ACCESS_KEY');
    const forcePathStyleRaw = this.config.get<string>('S3_FORCE_PATH_STYLE');
    const forcePathStyle =
      forcePathStyleRaw === 'true' || forcePathStyleRaw === '1';

    this.client = new S3Client({
      region,
      ...(endpoint ? { endpoint } : {}),
      ...(accessKeyId && secretAccessKey
        ? { credentials: { accessKeyId, secretAccessKey } }
        : {}),
      ...(forcePathStyle ? { forcePathStyle: true } : {}),
    });
  }

  private ensureConfigured(): void {
    if (!this.bucket) {
      throw new Error(
        'S3 object storage is not configured: set AWS_S3_BUCKET or S3_BUCKET',
      );
    }
  }

  async upload(
    file: Buffer,
    key: string,
    metadata?: { mimeType?: string; originalName?: string; uploadedBy?: string },
  ): Promise<UploadResult> {
    this.ensureConfigured();
    const response = await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ...(metadata?.mimeType ? { ContentType: metadata.mimeType } : {}),
      }),
    );
    const etag = response.ETag?.replace(/^"|"$/g, '');
    return {
      key,
      url: this.getPublicUrl(key),
      size: file.length,
      etag,
    };
  }

  async download(key: string): Promise<Buffer> {
    this.ensureConfigured();
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
    if (!response.Body) {
      throw new Error(`S3 GetObject returned empty body for key: ${key}`);
    }
    return Buffer.from(await response.Body.transformToByteArray());
  }

  async delete(key: string): Promise<void> {
    this.ensureConfigured();
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  async exists(key: string): Promise<boolean> {
    this.ensureConfigured();
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        }),
      );
      return true;
    } catch (err: unknown) {
      if (this.isNotFoundError(err)) {
        return false;
      }
      throw err;
    }
  }

  getPublicUrl(key: string): string {
    const base = this.publicBaseUrl?.replace(/\/$/, '');
    if (base) {
      return `${base}/${key}`;
    }
    if (this.bucket) {
      return `s3://${this.bucket}/${key}`;
    }
    return `s3:///${key}`;
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    this.ensureConfigured();
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.client, command, { expiresIn });
  }

  async getMetadata(key: string): Promise<FileMetadata> {
    this.ensureConfigured();
    const response = await this.client.send(
      new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
    const size = response.ContentLength ?? 0;
    const lastModified = response.LastModified ?? new Date();
    const contentType =
      response.ContentType ?? 'application/octet-stream';
    const etag = response.ETag?.replace(/^"|"$/g, '');
    return {
      size,
      lastModified,
      contentType,
      etag,
    };
  }

  private isNotFoundError(err: unknown): boolean {
    if (err && typeof err === 'object') {
      const e = err as {
        name?: string;
        $metadata?: { httpStatusCode?: number };
        Code?: string;
      };
      if (e.name === 'NotFound' || e.Code === 'NotFound') {
        return true;
      }
      if (e.$metadata?.httpStatusCode === 404) {
        return true;
      }
    }
    return false;
  }
}
