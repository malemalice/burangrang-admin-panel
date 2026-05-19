import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  Req,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Response, Request } from 'express';
import { UploadsService } from './uploads.service';
import { UpdateFileUploadDto } from './dto/update-file-upload.dto';
import { FindFileUploadsDto } from './dto/find-file-uploads.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../shared/decorators/allow-options-bypass.decorator';
import { Public } from '../../shared/decorators/public.decorator';

@ApiTags('uploads')
@ApiBearerAuth()
@Controller('uploads')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) { }

  @Post('upload')
  @Permissions('upload:create')
  @ApiOperation({ summary: 'Upload a file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        categoryId: {
          type: 'string',
          description: 'File category ID',
        },
        isPublic: {
          type: 'boolean',
          description: 'Whether the file should be public',
          default: false,
        },
        expiresAt: {
          type: 'string',
          format: 'date-time',
          description: 'Optional expiration date',
        },
        metadata: {
          type: 'object',
          description: 'Additional metadata',
        },
      },
      required: ['file', 'categoryId'],
    },
  })
  @ApiResponse({ status: 201, description: 'File uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file or category' })
  
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: any,
    @Body('categoryId') categoryId: string,
    @Body('isPublic') isPublic: string = 'false',
    @Body('expiresAt') expiresAt?: string,
    @Body('metadata') metadata?: string,
    @Req() req?: Request,
  ) {
    const uploadedBy = (req as any).user?.id;
    const isPublicBool = isPublic === 'true';
    const expiresAtDate = expiresAt ? new Date(expiresAt) : undefined;
    const metadataObj = metadata ? JSON.parse(metadata) : undefined;

    return this.uploadsService.uploadFile(
      file,
      categoryId,
      uploadedBy,
      isPublicBool,
      expiresAtDate,
      metadataObj,
    );
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all file categories' })
  @ApiResponse({
    status: 200,
    description: 'File categories retrieved successfully',
  })
  @Public()
  async getCategories() {
    return await this.uploadsService.getCategories();
  }

  @Get()
  @AllowOptionsBypass()
  @Permissions('upload:list')
  @ApiOperation({
    summary: 'Get all file uploads with pagination and filtering',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'isPublic', required: false, type: Boolean })
  @ApiQuery({ name: 'storageProviderId', required: false, type: String })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'uploadedBy', required: false, type: String })
  @ApiQuery({ name: 'mimeType', required: false, type: String })
  @ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Set to true to bypass permission check (requires JWT auth only)' })
  @ApiResponse({
    status: 200,
    description: 'File uploads retrieved successfully',
  })
  
  async findAll(@Query() query: FindFileUploadsDto) {
    return this.uploadsService.findAll(query);
  }

  @Get('public/:id')
  @ApiOperation({ summary: 'Download public file by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'File downloaded successfully' })
  @ApiResponse({ status: 206, description: 'Partial content (range request)' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiResponse({ status: 416, description: 'Range not satisfiable' })
  @Public()
  async downloadPublicFile(
    @Param('id') id: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const [fileBuffer, fileUpload] = await Promise.all([
      this.uploadsService.downloadFile(id, undefined, req.ip, req.get('User-Agent')),
      this.uploadsService.findOne(id),
    ]);

    return this.serveFileWithRangeSupport(req, res, fileBuffer, fileUpload);
  }

  @Get('private/:accessToken')
  @ApiOperation({ summary: 'Download private file by access token' })
  @ApiParam({ name: 'accessToken', type: String })
  @ApiResponse({ status: 200, description: 'File downloaded successfully' })
  @ApiResponse({ status: 206, description: 'Partial content (range request)' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiResponse({ status: 416, description: 'Range not satisfiable' })
  @Public()
  async downloadPrivateFile(
    @Param('accessToken') accessToken: string,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    const [fileBuffer, fileUpload] = await Promise.all([
      this.uploadsService.downloadFileByToken(accessToken, undefined, req.ip, req.get('User-Agent')),
      this.uploadsService.findByAccessToken(accessToken),
    ]);

    return this.serveFileWithRangeSupport(req, res, fileBuffer, fileUpload);
  }

  /**
   * Serves a file buffer with HTTP byte-range support so browser <video> elements
   * can seek and stream without downloading the entire file first.
   *
   * Behaviour:
   *  - No Range header  → 200 OK, full file, Accept-Ranges: bytes
   *  - Valid Range      → 206 Partial Content, sliced buffer
   *  - Invalid Range    → 416 Range Not Satisfiable
   */
  private serveFileWithRangeSupport(
    req: Request,
    res: Response,
    fileBuffer: Buffer,
    fileUpload: { mimeType: string; originalName: string },
  ): void {
    const totalSize = fileBuffer.length;
    const mimeType = fileUpload.mimeType;
    const fileName = fileUpload.originalName;
    const rangeHeader = req.headers['range'] as string | undefined;

    // Always advertise range support
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);

    if (!rangeHeader) {
      // Full file response
      res.setHeader('Content-Length', totalSize);
      res.status(200).send(fileBuffer);
      return;
    }

    // Parse "bytes=start-end" — only single range supported
    const match = rangeHeader.match(/^bytes=(\d*)-(\d*)$/);
    if (!match) {
      res.setHeader('Content-Range', `bytes */${totalSize}`);
      res.status(416).end();
      return;
    }

    const rawStart = match[1];
    const rawEnd = match[2];

    let start: number;
    let end: number;

    if (rawStart === '') {
      const suffixLength = parseInt(rawEnd, 10);
      if (isNaN(suffixLength) || suffixLength <= 0) {
        res.setHeader('Content-Range', `bytes */${totalSize}`);
        res.status(416).end();
        return;
      }

      start = Math.max(totalSize - suffixLength, 0);
      end = totalSize - 1;
    } else {
      start = parseInt(rawStart, 10);
      end = rawEnd !== '' ? parseInt(rawEnd, 10) : totalSize - 1;
      end = Math.min(end, totalSize - 1);
    }

    if (isNaN(start) || isNaN(end) || start > end || start < 0 || start >= totalSize) {
      res.setHeader('Content-Range', `bytes */${totalSize}`);
      res.status(416).end();
      return;
    }

    const chunkSize = end - start + 1;
    const chunk = fileBuffer.slice(start, end + 1);

    res.setHeader('Content-Range', `bytes ${start}-${end}/${totalSize}`);
    res.setHeader('Content-Length', chunkSize);
    res.status(206).send(chunk);
  }

  @Get(':id')
  @Permissions('upload:read')
  @ApiOperation({ summary: 'Get file upload by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'File upload retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'File upload not found' })
  
  async findOne(@Param('id') id: string) {
    return this.uploadsService.findOne(id);
  }

  @Patch(':id')
  @Permissions('upload:update')
  @ApiOperation({ summary: 'Update file upload' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateFileUploadDto })
  @ApiResponse({ status: 200, description: 'File upload updated successfully' })
  @ApiResponse({ status: 404, description: 'File upload not found' })
  
  async update(
    @Param('id') id: string,
    @Body() updateFileUploadDto: UpdateFileUploadDto,
  ) {
    return this.uploadsService.update(id, updateFileUploadDto);
  }

  @Delete(':id')
  @Permissions('upload:delete')
  @ApiOperation({ summary: 'Delete file upload' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: 'File upload deleted successfully' })
  @ApiResponse({ status: 404, description: 'File upload not found' })
  
  async remove(@Param('id') id: string) {
    await this.uploadsService.remove(id);
    return { message: 'File upload deleted successfully' };
  }
}
