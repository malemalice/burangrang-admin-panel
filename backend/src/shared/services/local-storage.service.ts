import { Injectable } from '@nestjs/common';
import { BaseStorageService, UploadResult, FileMetadata } from './storage.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LocalStorageService extends BaseStorageService {
  private readonly uploadDir: string;
  private readonly publicUrl: string;

  constructor() {
    super();
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
    this.publicUrl = process.env.PUBLIC_URL || 'http://localhost:3000';
    this.ensureUploadDir();
  }

  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async upload(file: Buffer, key: string, metadata?: any): Promise<UploadResult> {
    const filePath = path.join(this.uploadDir, key);
    const dir = path.dirname(filePath);
    
    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });
    
    // Write file
    await fs.writeFile(filePath, file);
    
    return {
      key,
      url: this.getPublicUrl(key),
      size: file.length,
      etag: `"${uuidv4()}"`,
    };
  }

  async download(key: string): Promise<Buffer> {
    const filePath = path.join(this.uploadDir, key);
    return fs.readFile(filePath);
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.uploadDir, key);
    try {
      await fs.unlink(filePath);
    } catch (error) {
      // File might not exist, ignore error
    }
  }

  async exists(key: string): Promise<boolean> {
    const filePath = path.join(this.uploadDir, key);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  getPublicUrl(key: string): string {
    return `${this.publicUrl}/uploads/${key}`;
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    // For local storage, signed URLs are the same as public URLs
    // In production, you might want to implement token-based access
    return this.getPublicUrl(key);
  }

  async getMetadata(key: string): Promise<FileMetadata> {
    const filePath = path.join(this.uploadDir, key);
    const stats = await fs.stat(filePath);
    
    return {
      size: stats.size,
      lastModified: stats.mtime,
      contentType: this.getContentType(key),
      etag: `"${stats.mtime.getTime()}"`,
    };
  }

  private getContentType(key: string): string {
    const ext = path.extname(key).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }
}
