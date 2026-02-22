import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Delete,
    Param,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiParam,
    ApiQuery,
    ApiBody,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { PPEService } from './ppe.service';
import { CreatePPEStockDto } from './dto/create-ppe-stock.dto';
import { UpdatePPEStockDto } from './dto/update-ppe-stock.dto';
import { PPEStockDto } from './dto/ppe-stock.dto';
import { CreatePPEWithdrawalDto } from './dto/create-ppe-withdrawal.dto';
import { UpdatePPEWithdrawalDto } from './dto/update-ppe-withdrawal.dto';
import { PPEWithdrawalDto } from './dto/ppe-withdrawal.dto';
import { PPEStockItemDto } from './dto/ppe-stock-item.dto';
import { FindPPEStockDto } from './dto/find-ppe-stock.dto';
import { FindPPEWithdrawalDto } from './dto/find-ppe-withdrawal.dto';
import { FindPPEStockItemDto } from './dto/find-ppe-stock-item.dto';
import { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';
import { CreateSafetyEquipmentTypeDto } from './dto/create-safety-equipment-type.dto';
import { UpdateSafetyEquipmentTypeDto } from './dto/update-safety-equipment-type.dto';
import { SafetyEquipmentTypeDto } from './dto/safety-equipment-type.dto';
import { FindSafetyEquipmentTypeDto } from './dto/find-safety-equipment-type.dto';
import { CreateSafetyEquipmentDto } from './dto/create-safety-equipment.dto';
import { UpdateSafetyEquipmentDto } from './dto/update-safety-equipment.dto';
import { SafetyEquipmentDto } from './dto/safety-equipment.dto';
import { FindSafetyEquipmentDto } from './dto/find-safety-equipment.dto';
import { FindMovementsDto } from './dto/find-movements.dto';
import { StockMovementDto } from './dto/stock-movement.dto';
import { UpdateStockItemDto } from './dto/update-stock-item.dto';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { PermissionsGuard } from '../../shared/guards/permissions.guard';
import { DataScopeGuard } from '../../shared/guards/data-scope.guard';
import { Permissions } from '../../shared/decorators/permissions.decorator';
import { AllowOptionsBypass } from '../../shared/decorators/allow-options-bypass.decorator';
import { DataScoped } from '../../shared/decorators/data-scoped.decorator';

@ApiTags('ppe')
@ApiBearerAuth()
@Controller('ppe')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard, DataScopeGuard)
export class PPEController {
    constructor(private readonly ppeService: PPEService) { }

    // ============================================================================
    // STOCK ITEMS ENDPOINTS (Master Data)
    // ============================================================================

    @Get('stock-items/available')
    @ApiOperation({ summary: 'Get available stock items for withdrawal' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
    @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Field to sort by' })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for equipment name, type, or size' })
    @ApiQuery({ name: 'status', required: false, enum: ['AVAILABLE', 'RESERVED', 'ISSUED', 'EXPIRED', 'DISPOSED'], description: 'Filter by stock item status' })
    @ApiQuery({ name: 'stockId', required: false, type: String, description: 'Filter by stock ID' })
    @ApiQuery({ name: 'availableOnly', required: false, type: Boolean, description: 'Only return available items with quantity > 0' })
    @ApiQuery({ name: 'groupBySafetyEquipment', required: false, type: Boolean, description: 'Group items by safety equipment and aggregate quantities' })
    @ApiQuery({ name: 'includeExpired', required: false, type: Boolean, description: 'Include expired items for disposal' })
    @ApiResponse({
        status: 200,
        description: 'Return paginated list of available stock items.',
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/PPEStockItemDto' },
                },
                meta: {
                    type: 'object',
                    properties: {
                        total: { type: 'number', description: 'Total number of stock items' },
                        page: { type: 'number', description: 'Current page number' },
                        limit: { type: 'number', description: 'Number of items per page' },
                        totalPages: { type: 'number', description: 'Total number of pages' },
                    },
                },
            },
        },
    })
    @Permissions('ppe:read')
    getAvailableStockItems(@Query() query: FindPPEStockItemDto) {
        return this.ppeService.getAvailableStockItems(query);
    }

    @Get('stock-items')
    @ApiOperation({ summary: 'Get stock items with filtering' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
    @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Field to sort by' })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for equipment name, type, or size' })
    @ApiQuery({ name: 'status', required: false, enum: ['AVAILABLE', 'RESERVED', 'ISSUED', 'EXPIRED', 'DISPOSED'], description: 'Filter by stock item status' })
    @ApiQuery({ name: 'stockId', required: false, type: String, description: 'Filter by stock ID' })
    @ApiQuery({ name: 'availableOnly', required: false, type: Boolean, description: 'Only return available items with quantity > 0' })
    @ApiResponse({
        status: 200,
        description: 'Return paginated list of stock items.',
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/PPEStockItemDto' },
                },
                meta: {
                    type: 'object',
                    properties: {
                        total: { type: 'number', description: 'Total number of stock items' },
                        page: { type: 'number', description: 'Current page number' },
                        limit: { type: 'number', description: 'Number of items per page' },
                        totalPages: { type: 'number', description: 'Total number of pages' },
                    },
                },
            },
        },
    })
    @Permissions('ppe:read')
    getStockItems(@Query() query: FindPPEStockItemDto) {
        return this.ppeService.getAvailableStockItems({ ...query, availableOnly: false });
    }

    // ============================================================================
    // STOCK IN ENDPOINTS
    // ============================================================================

    @Post('stocks')
    @ApiOperation({ summary: 'Create new stock entry with items' })
    @ApiBody({ type: CreatePPEStockDto })
    @ApiResponse({
        status: 201,
        description: 'The stock has been successfully created.',
        type: PPEStockDto,
    })
    @ApiResponse({ status: 400, description: 'Bad request.' })
    @Permissions('ppe:create')
    createStock(@Body() createStockDto: CreatePPEStockDto, @Req() req: any): Promise<PPEStockDto> {
        return this.ppeService.createStock(createStockDto, req.user.id);
    }

    @Get('stocks')
    @ApiOperation({ summary: 'Get all stocks with pagination and filtering' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
    @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Field to sort by' })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for stock code' })
    @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
    @ApiQuery({ name: 'receivedDateFrom', required: false, type: String, description: 'Filter by received date from (ISO date string)' })
    @ApiQuery({ name: 'receivedDateTo', required: false, type: String, description: 'Filter by received date to (ISO date string)' })
    @ApiResponse({
        status: 200,
        description: 'Return paginated list of stocks.',
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/PPEStockDto' },
                },
                meta: {
                    type: 'object',
                    properties: {
                        total: { type: 'number', description: 'Total number of stocks' },
                        page: { type: 'number', description: 'Current page number' },
                        limit: { type: 'number', description: 'Number of items per page' },
                        totalPages: { type: 'number', description: 'Total number of pages' },
                    },
                },
            },
        },
    })
    @AllowOptionsBypass()
    @Permissions('ppe:list')
    @ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Set to true to bypass permission check (requires JWT auth only)' })
    findAllStocks(@Query() query: FindPPEStockDto) {
        return this.ppeService.findAllStocks(query);
    }

    @Get('stocks/:id')
    @ApiOperation({ summary: 'Get stock by ID' })
    @ApiParam({ name: 'id', type: String, description: 'Stock ID' })
    @ApiResponse({
        status: 200,
        description: 'Return the stock.',
        type: PPEStockDto,
    })
    @ApiResponse({ status: 404, description: 'Stock not found.' })
    @Permissions('ppe:read')
    findStockById(@Param('id') id: string): Promise<PPEStockDto> {
        return this.ppeService.findStockById(id);
    }

    @Patch('stocks/:id')
    @ApiOperation({ summary: 'Update stock' })
    @ApiParam({ name: 'id', type: String, description: 'Stock ID' })
    @ApiBody({ type: UpdatePPEStockDto })
    @ApiResponse({
        status: 200,
        description: 'The stock has been successfully updated.',
        type: PPEStockDto,
    })
    @ApiResponse({ status: 404, description: 'Stock not found.' })
    @Permissions('ppe:update')
    updateStock(@Param('id') id: string, @Body() updateStockDto: UpdatePPEStockDto): Promise<PPEStockDto> {
        return this.ppeService.updateStock(id, updateStockDto);
    }

    @Patch('stocks/:id/items/:itemId')
    @ApiOperation({ summary: 'Update stock item' })
    @ApiParam({ name: 'id', type: String, description: 'Stock ID' })
    @ApiParam({ name: 'itemId', type: String, description: 'Stock Item ID' })
    @ApiBody({ type: UpdateStockItemDto, required: false })
    @ApiResponse({
        status: 200,
        description: 'The stock item has been successfully updated.',
        type: PPEStockItemDto,
    })
    @ApiResponse({ status: 404, description: 'Stock item not found.' })
    @Permissions('ppe:update')
    updateStockItem(
        @Param('id') stockId: string,
        @Param('itemId') itemId: string,
        @Body() updateData: UpdateStockItemDto,
    ): Promise<PPEStockItemDto> {
        return this.ppeService.updateStockItem(stockId, itemId, {
            ...updateData,
            expiryDate: updateData.expiryDate ? new Date(updateData.expiryDate) : undefined,
        });
    }

    @Post('stocks/:id/items/:itemId/adjust')
    @ApiOperation({ summary: 'Create stock adjustment (audit trail)' })
    @ApiParam({ name: 'id', type: String, description: 'Stock ID' })
    @ApiParam({ name: 'itemId', type: String, description: 'Stock Item ID' })
    @ApiBody({ type: CreateStockAdjustmentDto })
    @ApiResponse({
        status: 200,
        description: 'Stock adjustment has been successfully created.',
    })
    @ApiResponse({ status: 404, description: 'Stock item not found.' })
    @Permissions('ppe:update')
    adjustStockItem(
        @Param('id') stockId: string,
        @Param('itemId') itemId: string,
        @Body() adjustmentDto: CreateStockAdjustmentDto,
        @Req() req: any,
    ): Promise<void> {
        return this.ppeService.adjustStockItem(stockId, itemId, adjustmentDto, req.user.id);
    }

    // ============================================================================
    // WITHDRAWAL ENDPOINTS
    // ============================================================================

    @Post('withdrawals')
    @ApiOperation({ summary: 'Create withdrawal request' })
    @ApiBody({ type: CreatePPEWithdrawalDto })
    @ApiResponse({
        status: 201,
        description: 'The withdrawal has been successfully created.',
        type: PPEWithdrawalDto,
    })
    @ApiResponse({ status: 400, description: 'Bad request - insufficient stock or invalid data.' })
    @Permissions('ppe:create')
    createWithdrawal(@Body() createWithdrawalDto: CreatePPEWithdrawalDto, @Req() req: any): Promise<PPEWithdrawalDto> {
        return this.ppeService.createWithdrawal(createWithdrawalDto, req.user.id);
    }

    @Get('withdrawals')
    @ApiOperation({ summary: 'Get all withdrawals with pagination and filtering' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
    @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Field to sort by' })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for withdrawal code' })
    @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'COLLECTED', 'CANCELLED'], description: 'Filter by withdrawal status' })
    @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
    @ApiQuery({ name: 'departmentId', required: false, type: String, description: 'Filter by department ID' })
    @ApiQuery({ name: 'withdrawalDateFrom', required: false, type: String, description: 'Filter by withdrawal date from (ISO date string)' })
    @ApiQuery({ name: 'withdrawalDateTo', required: false, type: String, description: 'Filter by withdrawal date to (ISO date string)' })
    @ApiResponse({
        status: 200,
        description: 'Return paginated list of withdrawals.',
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/PPEWithdrawalDto' },
                },
                meta: {
                    type: 'object',
                    properties: {
                        total: { type: 'number', description: 'Total number of withdrawals' },
                        page: { type: 'number', description: 'Current page number' },
                        limit: { type: 'number', description: 'Number of items per page' },
                        totalPages: { type: 'number', description: 'Total number of pages' },
                    },
                },
            },
        },
    })
    @AllowOptionsBypass()
    @Permissions('ppe:list')
    @ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Set to true to bypass permission check (requires JWT auth only)' })
    @DataScoped('PPEWithdrawal')
    findAllWithdrawals(@Query() query: FindPPEWithdrawalDto, @Req() req: any) {
        return this.ppeService.findAllWithdrawals(query, req.userContext);
    }

    @Get('withdrawals/:id')
    @ApiOperation({ summary: 'Get withdrawal by ID' })
    @ApiParam({ name: 'id', type: String, description: 'Withdrawal ID' })
    @ApiResponse({
        status: 200,
        description: 'Return the withdrawal.',
        type: PPEWithdrawalDto,
    })
    @ApiResponse({ status: 403, description: 'Forbidden - no access to this record' })
    @ApiResponse({ status: 404, description: 'Withdrawal not found.' })
    @Permissions('ppe:read')
    @DataScoped('PPEWithdrawal')
    findWithdrawalById(@Param('id') id: string, @Req() req: any): Promise<PPEWithdrawalDto> {
        return this.ppeService.findWithdrawalById(id, req.userContext);
    }

    @Patch('withdrawals/:id')
    @ApiOperation({ summary: 'Update withdrawal (only if status is PENDING)' })
    @ApiParam({ name: 'id', type: String, description: 'Withdrawal ID' })
    @ApiBody({ type: CreatePPEWithdrawalDto })
    @ApiResponse({
        status: 200,
        description: 'The withdrawal has been successfully updated.',
        type: PPEWithdrawalDto,
    })
    @ApiResponse({ status: 400, description: 'Bad request - withdrawal cannot be updated.' })
    @ApiResponse({ status: 403, description: 'Forbidden - no access to this record' })
    @ApiResponse({ status: 404, description: 'Withdrawal not found.' })
    @Permissions('ppe:update')
    @DataScoped('PPEWithdrawal')
    updateWithdrawal(@Param('id') id: string, @Body() updateDto: CreatePPEWithdrawalDto, @Req() req: any): Promise<PPEWithdrawalDto> {
        return this.ppeService.updateWithdrawal(id, updateDto, req.userContext);
    }

    @Post('withdrawals/:id/submit')
    @ApiOperation({ summary: 'Submit withdrawal for approval' })
    @ApiParam({ name: 'id', type: String, description: 'Withdrawal ID' })
    @ApiResponse({
        status: 200,
        description: 'The withdrawal has been submitted for approval.',
        type: PPEWithdrawalDto,
    })
    @ApiResponse({ status: 400, description: 'Bad request - withdrawal cannot be submitted.' })
    @ApiResponse({ status: 403, description: 'Forbidden - no access to this record' })
    @ApiResponse({ status: 404, description: 'Withdrawal not found.' })
    @Permissions('ppe:update')
    @DataScoped('PPEWithdrawal')
    submitWithdrawal(@Param('id') id: string, @Req() req: any): Promise<PPEWithdrawalDto> {
        return this.ppeService.submitWithdrawal(id, req.user.id, req.userContext);
    }

    @Patch('withdrawals/:id/approve')
    @ApiOperation({ summary: 'Approve withdrawal' })
    @ApiParam({ name: 'id', type: String, description: 'Withdrawal ID' })
    @ApiBody({ type: UpdatePPEWithdrawalDto })
    @ApiResponse({
        status: 200,
        description: 'The withdrawal has been successfully approved.',
        type: PPEWithdrawalDto,
    })
    @ApiResponse({ status: 400, description: 'Bad request - withdrawal cannot be approved.' })
    @ApiResponse({ status: 403, description: 'Forbidden - no access to this record' })
    @ApiResponse({ status: 404, description: 'Withdrawal not found.' })
    @Permissions('ppe:update')
    @DataScoped('PPEWithdrawal')
    approveWithdrawal(@Param('id') id: string, @Body() updateDto: UpdatePPEWithdrawalDto, @Req() req: any): Promise<PPEWithdrawalDto> {
        return this.ppeService.approveWithdrawal(id, updateDto, req.user.id, req.userContext);
    }

    @Patch('withdrawals/:id/collect')
    @ApiOperation({ summary: 'Collect withdrawal (deduct stock)' })
    @ApiParam({ name: 'id', type: String, description: 'Withdrawal ID' })
    @ApiBody({ type: UpdatePPEWithdrawalDto })
    @ApiResponse({
        status: 200,
        description: 'The withdrawal has been successfully collected and stock deducted.',
        type: PPEWithdrawalDto,
    })
    @ApiResponse({ status: 400, description: 'Bad request - withdrawal cannot be collected.' })
    @ApiResponse({ status: 403, description: 'Forbidden - no access to this record' })
    @ApiResponse({ status: 404, description: 'Withdrawal not found.' })
    @Permissions('ppe:update')
    @DataScoped('PPEWithdrawal')
    collectWithdrawal(@Param('id') id: string, @Body() updateDto: UpdatePPEWithdrawalDto, @Req() req: any): Promise<PPEWithdrawalDto> {
        return this.ppeService.collectWithdrawal(id, updateDto, req.userContext);
    }

    @Patch('withdrawals/:id/cancel')
    @ApiOperation({ summary: 'Cancel withdrawal' })
    @ApiParam({ name: 'id', type: String, description: 'Withdrawal ID' })
    @ApiBody({ type: UpdatePPEWithdrawalDto, required: false })
    @ApiResponse({
        status: 200,
        description: 'The withdrawal has been successfully cancelled.',
        type: PPEWithdrawalDto,
    })
    @ApiResponse({ status: 400, description: 'Bad request - withdrawal cannot be cancelled.' })
    @ApiResponse({ status: 403, description: 'Forbidden - no access to this record' })
    @ApiResponse({ status: 404, description: 'Withdrawal not found.' })
    @Permissions('ppe:update')
    @DataScoped('PPEWithdrawal')
    cancelWithdrawal(@Param('id') id: string, @Body() updateDto: UpdatePPEWithdrawalDto | undefined, @Req() req: any): Promise<PPEWithdrawalDto> {
        return this.ppeService.cancelWithdrawal(id, updateDto ?? undefined, req.userContext);
    }

    @Delete('stocks/:id')
    @ApiOperation({ summary: 'Soft delete stock' })
    @ApiParam({ name: 'id', type: String, description: 'Stock ID' })
    @ApiResponse({
        status: 200,
        description: 'The stock has been successfully deleted.',
    })
    @ApiResponse({ status: 400, description: 'Bad request - stock cannot be deleted.' })
    @ApiResponse({ status: 404, description: 'Stock not found.' })
    @Permissions('ppe:delete')
    deleteStock(@Param('id') id: string): Promise<void> {
        return this.ppeService.deleteStock(id);
    }

    @Delete('withdrawals/:id')
    @ApiOperation({ summary: 'Soft delete withdrawal' })
    @ApiParam({ name: 'id', type: String, description: 'Withdrawal ID' })
    @ApiResponse({
        status: 200,
        description: 'The withdrawal has been successfully deleted.',
    })
    @ApiResponse({ status: 400, description: 'Bad request - withdrawal cannot be deleted.' })
    @ApiResponse({ status: 403, description: 'Forbidden - no access to this record' })
    @ApiResponse({ status: 404, description: 'Withdrawal not found.' })
    @Permissions('ppe:delete')
    @DataScoped('PPEWithdrawal')
    deleteWithdrawal(@Param('id') id: string, @Req() req: any): Promise<void> {
        return this.ppeService.deleteWithdrawal(id, req.userContext);
    }

    // ============================================================================
    // SAFETY EQUIPMENT TYPES ENDPOINTS
    // ============================================================================

    @Post('safety-equipment-types')
    @ApiOperation({ summary: 'Create a new safety equipment type' })
    @ApiBody({ type: CreateSafetyEquipmentTypeDto })
    @ApiResponse({
        status: 201,
        description: 'The safety equipment type has been successfully created.',
        type: SafetyEquipmentTypeDto,
    })
    @ApiResponse({ status: 400, description: 'Bad request.' })
    @Permissions('safety-equipment-type:create')
    createSafetyEquipmentType(
        @Body() createSafetyEquipmentTypeDto: CreateSafetyEquipmentTypeDto,
    ): Promise<SafetyEquipmentTypeDto> {
        return this.ppeService.createSafetyEquipmentType(createSafetyEquipmentTypeDto);
    }

    @Get('safety-equipment-types')
    @ApiOperation({ summary: 'Get all safety equipment types with pagination and filtering' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
    @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Field to sort by' })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
    @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for name, code, or description' })
    @ApiResponse({
        status: 200,
        description: 'Return paginated list of safety equipment types.',
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/SafetyEquipmentTypeDto' },
                },
                meta: {
                    type: 'object',
                    properties: {
                        total: { type: 'number', description: 'Total number of safety equipment types' },
                        page: { type: 'number', description: 'Current page number' },
                        limit: { type: 'number', description: 'Number of items per page' },
                        totalPages: { type: 'number', description: 'Total number of pages' },
                    },
                },
            },
        },
    })
    @AllowOptionsBypass()
    @Permissions('safety-equipment-type:list')
    @ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Set to true to bypass permission check (requires JWT auth only)' })
    findAllSafetyEquipmentTypes(
        @Query() query: FindSafetyEquipmentTypeDto,
        @Req() req: any,
    ): Promise<{ data: SafetyEquipmentTypeDto[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
        // Fix isActive if it was incorrectly converted
        if (req.query.isActive !== undefined && typeof req.query.isActive === 'string') {
            if (req.query.isActive === 'false') {
                query.isActive = false;
            } else if (req.query.isActive === 'true') {
                query.isActive = true;
            }
        }

        return this.ppeService.findAllSafetyEquipmentTypes(query);
    }

    @Get('safety-equipment-types/:id')
    @ApiOperation({ summary: 'Get a safety equipment type by id' })
    @ApiParam({ name: 'id', type: String, description: 'Safety Equipment Type ID' })
    @ApiResponse({
        status: 200,
        description: 'Return the safety equipment type.',
        type: SafetyEquipmentTypeDto,
    })
    @ApiResponse({ status: 404, description: 'Safety equipment type not found.' })
    @Permissions('safety-equipment-type:read')
    findOneSafetyEquipmentType(@Param('id') id: string): Promise<SafetyEquipmentTypeDto> {
        return this.ppeService.findOneSafetyEquipmentType(id);
    }

    @Patch('safety-equipment-types/:id')
    @ApiOperation({ summary: 'Update a safety equipment type' })
    @ApiParam({ name: 'id', type: String, description: 'Safety Equipment Type ID' })
    @ApiBody({ type: UpdateSafetyEquipmentTypeDto })
    @ApiResponse({
        status: 200,
        description: 'The safety equipment type has been successfully updated.',
        type: SafetyEquipmentTypeDto,
    })
    @ApiResponse({ status: 404, description: 'Safety equipment type not found.' })
    @Permissions('safety-equipment-type:update')
    updateSafetyEquipmentType(
        @Param('id') id: string,
        @Body() updateSafetyEquipmentTypeDto: UpdateSafetyEquipmentTypeDto,
    ): Promise<SafetyEquipmentTypeDto> {
        return this.ppeService.updateSafetyEquipmentType(id, updateSafetyEquipmentTypeDto);
    }

    @Delete('safety-equipment-types/:id')
    @ApiOperation({ summary: 'Delete a safety equipment type' })
    @ApiParam({ name: 'id', type: String, description: 'Safety Equipment Type ID' })
    @ApiResponse({
        status: 200,
        description: 'The safety equipment type has been successfully deleted.',
    })
    @ApiResponse({ status: 404, description: 'Safety equipment type not found.' })
    @Permissions('safety-equipment-type:delete')
    removeSafetyEquipmentType(@Param('id') id: string): Promise<void> {
        return this.ppeService.removeSafetyEquipmentType(id);
    }

    @Get('safety-equipment-types/code/:code')
    @ApiOperation({ summary: 'Get a safety equipment type by code' })
    @ApiParam({ name: 'code', type: String, description: 'Safety Equipment Type Code' })
    @ApiResponse({
        status: 200,
        description: 'Return the safety equipment type.',
        type: SafetyEquipmentTypeDto,
    })
    @ApiResponse({ status: 404, description: 'Safety equipment type not found.' })
    @Permissions('safety-equipment-type:read')
    findSafetyEquipmentTypeByCode(@Param('code') code: string): Promise<SafetyEquipmentTypeDto> {
        return this.ppeService.findSafetyEquipmentTypeByCode(code);
    }

    // ============================================================================
    // SAFETY EQUIPMENTS ENDPOINTS
    // ============================================================================

    @Post('safety-equipments')
    @ApiOperation({ summary: 'Create a new safety equipment' })
    @ApiBody({ type: CreateSafetyEquipmentDto })
    @ApiResponse({
        status: 201,
        description: 'The safety equipment has been successfully created.',
        type: SafetyEquipmentDto,
    })
    @ApiResponse({ status: 400, description: 'Bad request.' })
    @Permissions('safety-equipment:create')
    createSafetyEquipment(
        @Body() createSafetyEquipmentDto: CreateSafetyEquipmentDto,
    ): Promise<SafetyEquipmentDto> {
        return this.ppeService.createSafetyEquipment(createSafetyEquipmentDto);
    }

    @Get('safety-equipments')
    @ApiOperation({ summary: 'Get all safety equipments with pagination and filtering' })
    @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (starts from 1)' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
    @ApiQuery({ name: 'sortBy', required: false, type: String, description: 'Field to sort by' })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
    @ApiQuery({ name: 'isActive', required: false, type: Boolean, description: 'Filter by active status' })
    @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term for name, code, or description' })
    @ApiQuery({ name: 'name', required: false, type: String, description: 'Filter by equipment name' })
    @ApiQuery({ name: 'code', required: false, type: String, description: 'Filter by equipment code' })
    @ApiQuery({ name: 'category', required: false, enum: ['PERSONAL_PROTECTIVE_EQUIPMENT', 'SAFETY_EQUIPMENT', 'EMERGENCY_EQUIPMENT'], description: 'Filter by equipment category' })
    @ApiQuery({ name: 'safetyEquipmentTypeId', required: false, type: String, description: 'Filter by safety equipment type ID' })
    @ApiResponse({
        status: 200,
        description: 'Return paginated list of safety equipments.',
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/SafetyEquipmentDto' },
                },
                meta: {
                    type: 'object',
                    properties: {
                        total: { type: 'number', description: 'Total number of safety equipments' },
                        page: { type: 'number', description: 'Current page number' },
                        limit: { type: 'number', description: 'Number of items per page' },
                        totalPages: { type: 'number', description: 'Total number of pages' },
                    },
                },
            },
        },
    })
    @AllowOptionsBypass()
    @Permissions('safety-equipment:list')
    @ApiQuery({ name: 'options', required: false, type: Boolean, description: 'Set to true to bypass permission check (requires JWT auth only)' })
    findAllSafetyEquipments(
        @Query() query: FindSafetyEquipmentDto,
    ): Promise<{ data: SafetyEquipmentDto[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
        return this.ppeService.findAllSafetyEquipments(query);
    }

    @Get('safety-equipments/:id')
    @ApiOperation({ summary: 'Get a safety equipment by id' })
    @ApiParam({ name: 'id', type: String, description: 'Safety Equipment ID' })
    @ApiResponse({
        status: 200,
        description: 'Return the safety equipment.',
        type: SafetyEquipmentDto,
    })
    @ApiResponse({ status: 404, description: 'Safety equipment not found.' })
    @Permissions('safety-equipment:read')
    findOneSafetyEquipment(@Param('id') id: string): Promise<SafetyEquipmentDto> {
        return this.ppeService.findOneSafetyEquipment(id);
    }

    @Patch('safety-equipments/:id')
    @ApiOperation({ summary: 'Update a safety equipment' })
    @ApiParam({ name: 'id', type: String, description: 'Safety Equipment ID' })
    @ApiBody({ type: UpdateSafetyEquipmentDto })
    @ApiResponse({
        status: 200,
        description: 'The safety equipment has been successfully updated.',
        type: SafetyEquipmentDto,
    })
    @ApiResponse({ status: 404, description: 'Safety equipment not found.' })
    @Permissions('safety-equipment:update')
    updateSafetyEquipment(
        @Param('id') id: string,
        @Body() updateSafetyEquipmentDto: UpdateSafetyEquipmentDto,
    ): Promise<SafetyEquipmentDto> {
        return this.ppeService.updateSafetyEquipment(id, updateSafetyEquipmentDto);
    }

    @Delete('safety-equipments/:id')
    @ApiOperation({ summary: 'Delete a safety equipment' })
    @ApiParam({ name: 'id', type: String, description: 'Safety Equipment ID' })
    @ApiResponse({
        status: 200,
        description: 'The safety equipment has been successfully deleted.',
    })
    @ApiResponse({ status: 404, description: 'Safety equipment not found.' })
    @Permissions('safety-equipment:delete')
    removeSafetyEquipment(@Param('id') id: string): Promise<void> {
        return this.ppeService.removeSafetyEquipment(id);
    }

    @Get('safety-equipments/code/:code')
    @ApiOperation({ summary: 'Get a safety equipment by code' })
    @ApiParam({ name: 'code', type: String, description: 'Safety Equipment Code' })
    @ApiResponse({
        status: 200,
        description: 'Return the safety equipment.',
        type: SafetyEquipmentDto,
    })
    @ApiResponse({ status: 404, description: 'Safety equipment not found.' })
    @Permissions('safety-equipment:read')
    findSafetyEquipmentByCode(@Param('code') code: string): Promise<SafetyEquipmentDto> {
        return this.ppeService.findSafetyEquipmentByCode(code);
    }

    @Get('safety-equipments/:id/movements')
    @ApiOperation({ summary: 'Get stock movement history for a specific safety equipment' })
    @ApiParam({ name: 'id', type: String, description: 'Safety Equipment ID' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'movementType', required: false, enum: ['STOCK_IN', 'WITHDRAWAL', 'ADJUSTMENT'] })
    @ApiQuery({ name: 'dateFrom', required: false, type: String })
    @ApiQuery({ name: 'dateTo', required: false, type: String })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiResponse({
        status: 200,
        description: 'Return paginated stock movements with summary.',
    })
    @Permissions('safety-equipment:read')
    findMovementsBySafetyEquipmentId(
        @Param('id') id: string,
        @Query() query: FindMovementsDto,
    ) {
        return this.ppeService.findMovementsBySafetyEquipmentId(id, query);
    }
}

