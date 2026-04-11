import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';
import { LocalStorageService } from './local-storage.service';
import { S3CompatibleStorageService } from './s3-compatible-storage.service';

export type StorageProviderName = 'local' | 'aws-s3';

@Injectable()
export class StorageFactoryService {
  private storageServices: Map<StorageProviderName, StorageService> = new Map();

  constructor(
    private readonly config: ConfigService,
    private readonly localStorageService: LocalStorageService,
    private readonly s3CompatibleStorageService: S3CompatibleStorageService,
  ) {
    this.initializeStorageServices();
  }

  private initializeStorageServices(): void {
    this.storageServices.set('local', this.localStorageService);
    this.storageServices.set('aws-s3', this.s3CompatibleStorageService);
  }

  /** Resolves DEFAULT_STORAGE_PROVIDER env (or ConfigService); defaults to local. */
  getDefaultProviderName(): StorageProviderName {
    const raw = (
      this.config.get<string>('DEFAULT_STORAGE_PROVIDER') ??
      process.env.DEFAULT_STORAGE_PROVIDER ??
      'local'
    ).toLowerCase();
    return raw === 'aws-s3' ? 'aws-s3' : 'local';
  }

  getStorageServiceByName(name: StorageProviderName): StorageService {
    const service = this.storageServices.get(name);
    if (!service) {
      throw new Error(`Storage service ${name} not implemented`);
    }
    return service;
  }

  async getDefaultStorageService(): Promise<StorageService> {
    return this.getStorageServiceByName(this.getDefaultProviderName());
  }
}
