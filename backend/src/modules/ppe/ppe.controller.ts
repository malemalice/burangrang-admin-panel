import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
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
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/types/role.enum';

@ApiTags('ppe')
@ApiBearerAuth()
@Controller('ppe')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PPEController {
    constructor(private readonly ppeService: PPEService) { }

    // ============================================================================
    // STOCK ITEMS ENDPOINTS (Master Data)
    // ============================================================================

    @Get('stock-items/available')
    @ApiOperation({ summary: 'Get available stock items for withdrawal' })
    @ApiResponse({
        status: 200,
        description: 'Return available stock items.',
        type: [PPEStockItemDto],
    })
    @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
    getAvailableStockItems(@Query() query: FindPPEStockItemDto) {
        return this.ppeService.getAvailableStockItems(query);
    }

    @Get('stock-items')
    @ApiOperation({ summary: 'Get stock items with filtering' })
    @ApiResponse({
        status: 200,
        description: 'Return stock items.',
        type: [PPEStockItemDto],
    })
    @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
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
    @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
    createStock(@Body() createStockDto: CreatePPEStockDto, @Req() req: any): Promise<PPEStockDto> {
        return this.ppeService.createStock(createStockDto, req.user.id);
    }

    @Get('stocks')
    @ApiOperation({ summary: 'Get all stocks with pagination and filtering' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'sortBy', required: false, type: String })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'isActive', required: false, type: Boolean })
    @ApiQuery({ name: 'receivedDateFrom', required: false, type: String })
    @ApiQuery({ name: 'receivedDateTo', required: false, type: String })
    @ApiResponse({
        status: 200,
        description: 'Return all stocks.',
        type: [PPEStockDto],
    })
    @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
    findAllStocks(@Query() query: FindPPEStockDto) {
        return this.ppeService.findAllStocks(query);
    }

    @Get('stocks/:id')
    @ApiOperation({ summary: 'Get stock by ID' })
    @ApiParam({ name: 'id', type: String })
    @ApiResponse({
        status: 200,
        description: 'Return the stock.',
        type: PPEStockDto,
    })
    @ApiResponse({ status: 404, description: 'Stock not found.' })
    @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
    findStockById(@Param('id') id: string): Promise<PPEStockDto> {
        return this.ppeService.findStockById(id);
    }

    @Patch('stocks/:id')
    @ApiOperation({ summary: 'Update stock' })
    @ApiParam({ name: 'id', type: String })
    @ApiBody({ type: UpdatePPEStockDto })
    @ApiResponse({
        status: 200,
        description: 'The stock has been successfully updated.',
        type: PPEStockDto,
    })
    @ApiResponse({ status: 404, description: 'Stock not found.' })
    @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
    updateStock(@Param('id') id: string, @Body() updateStockDto: UpdatePPEStockDto): Promise<PPEStockDto> {
        return this.ppeService.updateStock(id, updateStockDto);
    }

    @Patch('stocks/:id/items/:itemId')
    @ApiOperation({ summary: 'Update stock item' })
    @ApiParam({ name: 'id', type: String })
    @ApiParam({ name: 'itemId', type: String })
    @ApiResponse({
        status: 200,
        description: 'The stock item has been successfully updated.',
        type: PPEStockItemDto,
    })
    @ApiResponse({ status: 404, description: 'Stock item not found.' })
    @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
    updateStockItem(
        @Param('id') stockId: string,
        @Param('itemId') itemId: string,
        @Body() updateData: Partial<{ currentQuantity: number; reservedQuantity: number; status: string; expiryDate: string }>,
    ): Promise<PPEStockItemDto> {
        return this.ppeService.updateStockItem(stockId, itemId, {
            ...updateData,
            expiryDate: updateData.expiryDate ? new Date(updateData.expiryDate) : undefined,
        });
    }

    @Post('stocks/:id/items/:itemId/adjust')
    @ApiOperation({ summary: 'Create stock adjustment (audit trail)' })
    @ApiParam({ name: 'id', type: String })
    @ApiParam({ name: 'itemId', type: String })
    @ApiBody({ type: CreateStockAdjustmentDto })
    @ApiResponse({
        status: 200,
        description: 'Stock adjustment has been successfully created.',
    })
    @ApiResponse({ status: 404, description: 'Stock item not found.' })
    @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
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
    @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
    createWithdrawal(@Body() createWithdrawalDto: CreatePPEWithdrawalDto, @Req() req: any): Promise<PPEWithdrawalDto> {
        return this.ppeService.createWithdrawal(createWithdrawalDto, req.user.id);
    }

    @Get('withdrawals')
    @ApiOperation({ summary: 'Get all withdrawals with pagination and filtering' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiQuery({ name: 'sortBy', required: false, type: String })
    @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'status', required: false, enum: ['PENDING', 'APPROVED', 'COLLECTED', 'CANCELLED'] })
    @ApiQuery({ name: 'isActive', required: false, type: Boolean })
    @ApiQuery({ name: 'departmentId', required: false, type: String })
    @ApiQuery({ name: 'withdrawalDateFrom', required: false, type: String })
    @ApiQuery({ name: 'withdrawalDateTo', required: false, type: String })
    @ApiResponse({
        status: 200,
        description: 'Return all withdrawals.',
        type: [PPEWithdrawalDto],
    })
    @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
    findAllWithdrawals(@Query() query: FindPPEWithdrawalDto) {
        return this.ppeService.findAllWithdrawals(query);
    }

    @Get('withdrawals/:id')
    @ApiOperation({ summary: 'Get withdrawal by ID' })
    @ApiParam({ name: 'id', type: String })
    @ApiResponse({
        status: 200,
        description: 'Return the withdrawal.',
        type: PPEWithdrawalDto,
    })
    @ApiResponse({ status: 404, description: 'Withdrawal not found.' })
    @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
    findWithdrawalById(@Param('id') id: string): Promise<PPEWithdrawalDto> {
        return this.ppeService.findWithdrawalById(id);
    }

    @Patch('withdrawals/:id')
    @ApiOperation({ summary: 'Update withdrawal (only if status is PENDING)' })
    @ApiParam({ name: 'id', type: String })
    @ApiBody({ type: CreatePPEWithdrawalDto })
    @ApiResponse({
        status: 200,
        description: 'The withdrawal has been successfully updated.',
        type: PPEWithdrawalDto,
    })
    @ApiResponse({ status: 400, description: 'Bad request - withdrawal cannot be updated.' })
    @ApiResponse({ status: 404, description: 'Withdrawal not found.' })
    @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
    updateWithdrawal(@Param('id') id: string, @Body() updateDto: CreatePPEWithdrawalDto): Promise<PPEWithdrawalDto> {
        return this.ppeService.updateWithdrawal(id, updateDto);
    }

    @Patch('withdrawals/:id/approve')
    @ApiOperation({ summary: 'Approve withdrawal' })
    @ApiParam({ name: 'id', type: String })
    @ApiBody({ type: UpdatePPEWithdrawalDto })
    @ApiResponse({
        status: 200,
        description: 'The withdrawal has been successfully approved.',
        type: PPEWithdrawalDto,
    })
    @ApiResponse({ status: 400, description: 'Bad request - withdrawal cannot be approved.' })
    @ApiResponse({ status: 404, description: 'Withdrawal not found.' })
    @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
    approveWithdrawal(@Param('id') id: string, @Body() updateDto: UpdatePPEWithdrawalDto): Promise<PPEWithdrawalDto> {
        return this.ppeService.approveWithdrawal(id, updateDto);
    }

    @Patch('withdrawals/:id/collect')
    @ApiOperation({ summary: 'Collect withdrawal (deduct stock)' })
    @ApiParam({ name: 'id', type: String })
    @ApiBody({ type: UpdatePPEWithdrawalDto })
    @ApiResponse({
        status: 200,
        description: 'The withdrawal has been successfully collected and stock deducted.',
        type: PPEWithdrawalDto,
    })
    @ApiResponse({ status: 400, description: 'Bad request - withdrawal cannot be collected.' })
    @ApiResponse({ status: 404, description: 'Withdrawal not found.' })
    @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER)
    collectWithdrawal(@Param('id') id: string, @Body() updateDto: UpdatePPEWithdrawalDto): Promise<PPEWithdrawalDto> {
        return this.ppeService.collectWithdrawal(id, updateDto);
    }

    @Patch('withdrawals/:id/cancel')
    @ApiOperation({ summary: 'Cancel withdrawal' })
    @ApiParam({ name: 'id', type: String })
    @ApiBody({ type: UpdatePPEWithdrawalDto, required: false })
    @ApiResponse({
        status: 200,
        description: 'The withdrawal has been successfully cancelled.',
        type: PPEWithdrawalDto,
    })
    @ApiResponse({ status: 400, description: 'Bad request - withdrawal cannot be cancelled.' })
    @ApiResponse({ status: 404, description: 'Withdrawal not found.' })
    @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MANAGER, Role.USER)
    cancelWithdrawal(@Param('id') id: string, @Body() updateDto?: UpdatePPEWithdrawalDto): Promise<PPEWithdrawalDto> {
        return this.ppeService.cancelWithdrawal(id, updateDto);
    }
}

