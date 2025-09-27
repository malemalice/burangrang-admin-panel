import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { StorageService } from './storage.service';
import { LocalStorageService } from './local-storage.service';

@Injectable()
export class StorageFactoryService {
  private storageServices: Map<string, StorageService> = new Map();

  constructor(
    private readonly prisma: PrismaService,
    private readonly localStorageService: LocalStorageService,
  ) {
    this.initializeStorageServices();
  }

  private initializeStorageServices(): void {
    // Register local storage service
    this.storageServices.set('local', this.localStorageService);
    
    // TODO: Register other storage services (S3, Google Cloud, etc.)
    // this.storageServices.set('aws-s3', this.s3StorageService);
    // this.storageServices.set('google-cloud', this.googleCloudStorageService);
  }

  async getStorageService(providerId: string): Promise<StorageService> {
    // Get provider from database
    const provider = await this.prisma.fileStorageProvider.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new Error(`Storage provider with ID ${providerId} not found`);
    }

    if (!provider.isActive) {
      throw new Error(`Storage provider ${provider.name} is not active`);
    }

    const service = this.storageServices.get(provider.name);
    if (!service) {
      throw new Error(`Storage service for provider ${provider.name} not implemented`);
    }

    return service;
  }

  async getDefaultStorageService(): Promise<StorageService> {
    const defaultProvider = await this.prisma.fileStorageProvider.findFirst({
      where: { isDefault: true, isActive: true },
    });

    if (!defaultProvider) {
      // Fallback to local storage
      return this.localStorageService;
    }

    return this.getStorageService(defaultProvider.id);
  }

  getStorageServiceByName(name: string): StorageService {
    const service = this.storageServices.get(name);
    if (!service) {
      throw new Error(`Storage service ${name} not implemented`);
    }
    return service;
  }
}
