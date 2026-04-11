import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateFileUploadDto } from './dto/create-file-upload.dto';
import { UpdateFileUploadDto } from './dto/update-file-upload.dto';
import { FileUploadDto } from './dto/file-upload.dto';
import { FindFileUploadsDto } from './dto/find-file-uploads.dto';
import { Prisma } from '@prisma/client';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import {
  StorageFactoryService,
  StorageProviderName,
} from '../../shared/services/storage-factory.service';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import { FileCategoryDto } from './dto/file-category.dto';
import { UserDto } from '../users/dto/user.dto';

@Injectable()
export class UploadsService {
  private fileUploadMapper: (fileUpload: any) => FileUploadDto;
  private fileUploadArrayMapper: (fileUploads: any[]) => FileUploadDto[];
  private fileUploadPaginatedMapper: (data: { data: any[]; meta: any }) => { data: FileUploadDto[]; meta: any };

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
    private readonly storageFactory: StorageFactoryService,
  ) {
    this.fileUploadMapper = (entity: any) => {
      const baseDto = this.dtoMapper.mapToDto(FileUploadDto, entity, {
        relations: {
          category: {
            mapper: this.dtoMapper.createSimpleMapper(FileCategoryDto),
          },
          uploader: {
            mapper: this.dtoMapper.createSimpleMapper(UserDto),
          },
        },
        transform: {
          size: (value: any) => Number(value), // Convert BigInt to number
        },
      });

      // Add computed fields manually
      const mediaUrl =
        process.env.MEDIA_URL ||
        process.env.PUBLIC_URL ||
        'http://localhost:3000';
      baseDto.downloadUrl = entity.isPublic 
        ? `${mediaUrl}/uploads/public/${entity.id}`
        : `${mediaUrl}/uploads/private/${entity.accessToken}`;
      baseDto.fileExtension = entity.originalName?.split('.').pop() || '';
      baseDto.isExpired = entity.expiresAt ? new Date() > entity.expiresAt : false;

      return baseDto;
    };
    this.fileUploadArrayMapper = (entities: any[]) => {
      return entities.map(this.fileUploadMapper);
    };
    this.fileUploadPaginatedMapper = (paginatedData: { data: any[]; meta: any }) => {
      return {
        data: this.fileUploadArrayMapper(paginatedData.data),
        meta: paginatedData.meta
      };
    };
  }

  async uploadFile(
    file: any,
    categoryId: string,
    uploadedBy: string,
    isPublic: boolean = false,
    expiresAt?: Date,
    metadata?: any,
  ): Promise<FileUploadDto> {
    // Validate category
    const category = await this.prisma.fileCategory.findUnique({
      where: { id: categoryId },
    });
    this.errorHandler.throwIfNotFoundById('FileCategory', categoryId, category);

    // Validate file type and size
    this.validateFile(file, category);

    // Generate file hash for deduplication
    const hash = this.generateFileHash(file.buffer);

    // Check for existing file with same hash
    const existingFile = await this.prisma.fileUpload.findFirst({
      where: { hash, isActive: true },
    });

    if (existingFile) {
      // Return existing file if found
      return this.findOne(existingFile.id);
    }

    // Get default storage provider
    const storageService = await this.storageFactory.getDefaultStorageService();

    // Generate unique filename
    const fileExtension = this.getFileExtension(file.originalname);
    const storedName = `${uuidv4()}${fileExtension}`;

    // Upload file to storage
    const uploadResult = await storageService.upload(file.buffer, storedName, {
      originalName: file.originalname,
      mimeType: file.mimetype,
      uploadedBy,
    });

    const providerName = this.storageFactory.getDefaultProviderName();

    // Create file upload record
    const createDto: CreateFileUploadDto = {
      originalName: file.originalname,
      storedName,
      mimeType: file.mimetype,
      size: file.size,
      hash,
      storageProvider: providerName,
      categoryId,
      isPublic,
      expiresAt,
      metadata,
    };

    return this.create(createDto, uploadedBy);
  }

  async create(createFileUploadDto: CreateFileUploadDto, uploadedBy: string): Promise<FileUploadDto> {
    const fileUpload = await this.prisma.fileUpload.create({
      data: {
        ...createFileUploadDto,
        uploadedBy,
        accessToken: uuidv4(), // Generate access token for private files
      },
      include: {
        category: true,
        uploader: {
          include: {
            role: true,
            office: true,
            department: true,
            jobPosition: true,
          },
        },
      },
    });

    return this.fileUploadMapper(fileUpload);
  }

  async findAll(options?: FindFileUploadsDto): Promise<{
    data: FileUploadDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive,
      isPublic,
      search,
      storageProvider,
      categoryId,
      uploadedBy,
      mimeType,
    } = options || {};

    const where: Prisma.FileUploadWhereInput = {};

    if (search) {
      const searchTerm = search.trim();
      if (searchTerm.length > 0) {
        where.OR = [
          { originalName: { contains: searchTerm, mode: 'insensitive' } },
          { storedName: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (isPublic !== undefined) {
      where.isPublic = isPublic;
    }

    if (storageProvider) {
      where.storageProvider = storageProvider;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (uploadedBy) {
      where.uploadedBy = uploadedBy;
    }

    if (mimeType) {
      where.mimeType = mimeType;
    }

    const [fileUploads, total] = await Promise.all([
      this.prisma.fileUpload.findMany({
        where,
        include: {
          category: true,
          uploader: {
            include: {
              role: true,
              office: true,
              department: true,
              jobPosition: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.fileUpload.count({ where }),
    ]);

    return this.fileUploadPaginatedMapper({
      data: fileUploads,
      meta: { total, page, limit },
    });
  }

  async findOne(id: string): Promise<FileUploadDto> {
    const fileUpload = await this.prisma.fileUpload.findUnique({
      where: { id },
      include: {
        category: true,
        uploader: {
          include: {
            role: true,
            office: true,
            department: true,
            jobPosition: true,
          },
        },
      },
    });

    this.errorHandler.throwIfNotFoundById('FileUpload', id, fileUpload);

    return this.fileUploadMapper(fileUpload);
  }

  async findByAccessToken(accessToken: string): Promise<FileUploadDto> {
    const fileUpload = await this.prisma.fileUpload.findUnique({
      where: { accessToken },
      include: {
        category: true,
        uploader: {
          include: {
            role: true,
            office: true,
            department: true,
            jobPosition: true,
          },
        },
      },
    });

    this.errorHandler.throwIfNotFoundByField('FileUpload', 'accessToken', accessToken, fileUpload);

    return this.fileUploadMapper(fileUpload);
  }

  async update(id: string, updateFileUploadDto: UpdateFileUploadDto): Promise<FileUploadDto> {
    const existingFileUpload = await this.prisma.fileUpload.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('FileUpload', id, existingFileUpload);

    const updatedFileUpload = await this.prisma.fileUpload.update({
      where: { id },
      data: updateFileUploadDto,
      include: {
        category: true,
        uploader: {
          include: {
            role: true,
            office: true,
            department: true,
            jobPosition: true,
          },
        },
      },
    });

    return this.fileUploadMapper(updatedFileUpload);
  }

  async remove(id: string): Promise<void> {
    const existingFileUpload = await this.prisma.fileUpload.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('FileUpload', id, existingFileUpload);

    const storageService = this.storageFactory.getStorageServiceByName(
      existingFileUpload.storageProvider as StorageProviderName,
    );
    await storageService.delete(existingFileUpload.storedName);

    // Delete database record
    await this.prisma.fileUpload.delete({
      where: { id },
    });
  }

  async getCategories(): Promise<any[]> {
    const categories = await this.prisma.fileCategory.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return categories.map(category => ({
      id: category.id,
      name: category.name,
      allowedTypes: category.allowedTypes,
      maxSize: Number(category.maxSize), // Convert BigInt to number
      isActive: category.isActive,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    }));
  }

  async downloadFile(id: string, accessedBy?: string, ipAddress?: string, userAgent?: string): Promise<Buffer> {
    const fileUpload = await this.findOne(id);

    // Log access
    await this.logFileAccess(fileUpload.id, accessedBy, ipAddress, userAgent, 'download');

    const storageService = this.storageFactory.getStorageServiceByName(
      fileUpload.storageProvider as StorageProviderName,
    );
    return storageService.download(fileUpload.storedName);
  }

  async downloadFileByToken(
    accessToken: string,
    accessedBy?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<Buffer> {
    const fileUpload = await this.findByAccessToken(accessToken);

    // Log access
    await this.logFileAccess(fileUpload.id, accessedBy, ipAddress, userAgent, 'download');

    const storageService = this.storageFactory.getStorageServiceByName(
      fileUpload.storageProvider as StorageProviderName,
    );
    return storageService.download(fileUpload.storedName);
  }

  private async logFileAccess(
    fileId: string,
    accessedBy?: string,
    ipAddress?: string,
    userAgent?: string,
    accessType: string = 'download',
  ): Promise<void> {
    await this.prisma.fileAccessLog.create({
      data: {
        fileId,
        accessedBy,
        ipAddress: ipAddress || 'unknown',
        userAgent: userAgent || 'unknown',
        accessType,
      },
    });
  }

  private validateFile(file: any, category: any): void {
    // Check file size
    if (file.size > category.maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${category.maxSize} bytes`);
    }

    // Check file type
    const allowedTypes = category.allowedTypes as string[];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} is not allowed for this category`);
    }
  }

  private generateFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  private getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf('.');
    return lastDotIndex !== -1 ? filename.substring(lastDotIndex) : '';
  }
}
