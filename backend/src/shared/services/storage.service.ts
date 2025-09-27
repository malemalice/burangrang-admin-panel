import { Injectable } from '@nestjs/common';

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  etag?: string;
}

export interface FileMetadata {
  size: number;
  lastModified: Date;
  contentType: string;
  etag?: string;
}

export interface StorageService {
  // File operations
  upload(file: Buffer, key: string, metadata?: any): Promise<UploadResult>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  
  // URL generation
  getPublicUrl(key: string): string;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  
  // Metadata
  getMetadata(key: string): Promise<FileMetadata>;
}

@Injectable()
export abstract class BaseStorageService implements StorageService {
  abstract upload(file: Buffer, key: string, metadata?: any): Promise<UploadResult>;
  abstract download(key: string): Promise<Buffer>;
  abstract delete(key: string): Promise<void>;
  abstract exists(key: string): Promise<boolean>;
  abstract getPublicUrl(key: string): string;
  abstract getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  abstract getMetadata(key: string): Promise<FileMetadata>;
}
