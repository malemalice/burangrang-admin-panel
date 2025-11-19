import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { CreatePPEStockDto } from './dto/create-ppe-stock.dto';
import { UpdatePPEStockDto } from './dto/update-ppe-stock.dto';
import { PPEStockDto } from './dto/ppe-stock.dto';
import { PPEStockItemDto } from './dto/ppe-stock-item.dto';
import { CreatePPEWithdrawalDto } from './dto/create-ppe-withdrawal.dto';
import { UpdatePPEWithdrawalDto } from './dto/update-ppe-withdrawal.dto';
import { PPEWithdrawalDto } from './dto/ppe-withdrawal.dto';
import { FindPPEStockDto } from './dto/find-ppe-stock.dto';
import { FindPPEWithdrawalDto } from './dto/find-ppe-withdrawal.dto';
import { FindPPEStockItemDto } from './dto/find-ppe-stock-item.dto';
import { CreateStockAdjustmentDto } from './dto/create-stock-adjustment.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PPEService {
    private ppeStockMapper: (stock: any) => PPEStockDto;
    private ppeStockArrayMapper: (stocks: any[]) => PPEStockDto[];
    private ppeStockPaginatedMapper: (data: { data: any[]; meta: any }) => { data: PPEStockDto[]; meta: any };
    private ppeStockItemMapper: (item: any) => PPEStockItemDto;
    private ppeStockItemArrayMapper: (items: any[]) => PPEStockItemDto[];
    private ppeWithdrawalMapper: (withdrawal: any) => PPEWithdrawalDto;
    private ppeWithdrawalArrayMapper: (withdrawals: any[]) => PPEWithdrawalDto[];
    private ppeWithdrawalPaginatedMapper: (data: { data: any[]; meta: any }) => { data: PPEWithdrawalDto[]; meta: any };

    constructor(
        private readonly prisma: PrismaService,
        private readonly errorHandler: ErrorHandlingService,
        private readonly dtoMapper: DtoMapperService,
    ) {
        // Initialize mappers
        this.ppeStockMapper = this.dtoMapper.createSimpleMapper(PPEStockDto);
        this.ppeStockArrayMapper = this.dtoMapper.createSimpleArrayMapper(PPEStockDto);
        this.ppeStockPaginatedMapper = this.dtoMapper.createPaginatedMapper(PPEStockDto);
        this.ppeStockItemMapper = this.dtoMapper.createSimpleMapper(PPEStockItemDto);
        this.ppeStockItemArrayMapper = this.dtoMapper.createSimpleArrayMapper(PPEStockItemDto);
        this.ppeWithdrawalMapper = this.dtoMapper.createSimpleMapper(PPEWithdrawalDto);
        this.ppeWithdrawalArrayMapper = this.dtoMapper.createSimpleArrayMapper(PPEWithdrawalDto);
        this.ppeWithdrawalPaginatedMapper = this.dtoMapper.createPaginatedMapper(PPEWithdrawalDto);
    }

    /**
     * Generate unique stock code: PPE-STK-YYYYMMDD-XXXX
     */
    private async generateStockCode(): Promise<string> {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const prefix = `PPE-STK-${dateStr}-`;

        // Find the last stock code for today
        const lastStock = await (this.prisma as any).pPEStock.findFirst({
            where: {
                stockCode: {
                    startsWith: prefix,
                },
            },
            orderBy: {
                stockCode: 'desc',
            },
        });

        let sequence = 1;
        if (lastStock) {
            const lastSequence = parseInt(lastStock.stockCode.slice(-4), 10);
            sequence = lastSequence + 1;
        }

        return `${prefix}${sequence.toString().padStart(4, '0')}`;
    }

    /**
     * Generate unique withdrawal code: PPE-WD-YYYYMMDD-XXXX
     */
    private async generateWithdrawalCode(): Promise<string> {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const prefix = `PPE-WD-${dateStr}-`;

        // Find the last withdrawal code for today
        const lastWithdrawal = await (this.prisma as any).pPEWithdrawal.findFirst({
            where: {
                withdrawalCode: {
                    startsWith: prefix,
                },
            },
            orderBy: {
                withdrawalCode: 'desc',
            },
        });

        let sequence = 1;
        if (lastWithdrawal) {
            const lastSequence = parseInt(lastWithdrawal.withdrawalCode.slice(-4), 10);
            sequence = lastSequence + 1;
        }

        return `${prefix}${sequence.toString().padStart(4, '0')}`;
    }

    // ============================================================================
    // STOCK MANAGEMENT METHODS
    // ============================================================================

    /**
     * Create new stock entry with items
     */
    async createStock(createStockDto: CreatePPEStockDto, createdBy: string): Promise<PPEStockDto> {
        const stockCode = await this.generateStockCode();

        return await this.prisma.$transaction(async (tx) => {
            // Create stock header
            const stock = await (tx as any).pPEStock.create({
                data: {
                    stockCode,
                    receivedDate: new Date(createStockDto.receivedDate),
                    notes: createStockDto.notes,
                    createdBy,
                },
            });

            // Create stock items
            const items = await Promise.all(
                createStockDto.items.map((item, index) =>
                    (tx as any).pPEStockItem.create({
                        data: {
                            stockId: stock.id,
                            safetyEquipmentId: item.safetyEquipmentId || null,
                            equipmentName: item.equipmentName || null,
                            equipmentType: item.equipmentType || null,
                            equipmentSize: item.equipmentSize || null,
                            expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
                            initialQuantity: item.initialQuantity,
                            currentQuantity: item.initialQuantity,
                            reservedQuantity: 0,
                            status: 'AVAILABLE' as any,
                            order: item.order || index + 1,
                        },
                    }),
                ),
            );

            // Fetch with relations
            const stockWithItems = await (tx as any).pPEStock.findUnique({
                where: { id: stock.id },
                include: {
                    items: {
                        orderBy: { order: 'asc' },
                    },
                    creator: true,
                },
            });

            return this.ppeStockMapper(stockWithItems);
        });
    }

    /**
     * Find all stocks with pagination and filtering
     */
    async findAllStocks(options?: FindPPEStockDto): Promise<{
        data: PPEStockDto[];
        meta: { total: number; page: number; limit: number };
    }> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'receivedDate',
            sortOrder = 'desc',
            isActive,
            search,
            receivedDateFrom,
            receivedDateTo,
        } = options || {};

        const where: any = {};

        if (search) {
            where.stockCode = {
                contains: search,
                mode: 'insensitive',
            };
        }

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        if (receivedDateFrom || receivedDateTo) {
            where.receivedDate = {};
            if (receivedDateFrom) {
                where.receivedDate.gte = new Date(receivedDateFrom);
            }
            if (receivedDateTo) {
                where.receivedDate.lte = new Date(receivedDateTo);
            }
        }

        const orderBy: any = {};
        if (sortBy) {
            orderBy[sortBy] = sortOrder || 'desc';
        }

        const [stocks, total] = await Promise.all([
            (this.prisma as any).pPEStock.findMany({
                where,
                include: {
                    items: {
                        orderBy: { order: 'asc' },
                    },
                    creator: true,
                },
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
            }),
            (this.prisma as any).pPEStock.count({ where }),
        ]);

        return this.ppeStockPaginatedMapper({
            data: stocks,
            meta: { total, page, limit },
        });
    }

    /**
     * Find stock by ID
     */
    async findStockById(id: string): Promise<PPEStockDto> {
        const stock = await (this.prisma as any).pPEStock.findUnique({
            where: { id },
            include: {
                items: {
                    orderBy: { order: 'asc' },
                },
                creator: true,
            },
        });

        this.errorHandler.throwIfNotFoundById('PPEStock', id, stock);

        return this.ppeStockMapper(stock);
    }

    /**
     * Update stock
     */
    async updateStock(id: string, updateStockDto: UpdatePPEStockDto): Promise<PPEStockDto> {
        const existingStock = await (this.prisma as any).pPEStock.findUnique({
            where: { id },
        });

        this.errorHandler.throwIfNotFoundById('PPEStock', id, existingStock);

        const stock = await (this.prisma as any).pPEStock.update({
            where: { id },
            data: {
                receivedDate: updateStockDto.receivedDate ? new Date(updateStockDto.receivedDate) : undefined,
                notes: updateStockDto.notes,
                isActive: updateStockDto.isActive,
            },
            include: {
                items: {
                    orderBy: { order: 'asc' },
                },
                creator: true,
            },
        });

        return this.ppeStockMapper(stock);
    }

    /**
     * Update stock item
     */
    async updateStockItem(
        stockId: string,
        itemId: string,
        updateData: Partial<{
            currentQuantity: number;
            reservedQuantity: number;
            status: string;
            expiryDate: Date;
        }>,
    ): Promise<PPEStockItemDto> {
        const stockItem = await (this.prisma as any).pPEStockItem.findFirst({
            where: {
                id: itemId,
                stockId,
            },
        });

        this.errorHandler.throwIfNotFoundById('PPEStockItem', itemId, stockItem);

        const updatedItem = await (this.prisma as any).pPEStockItem.update({
            where: { id: itemId },
            data: updateData,
        });

        return this.ppeStockItemMapper(updatedItem);
    }

    /**
     * Create stock adjustment (audit trail)
     */
    async adjustStockItem(
        stockId: string,
        itemId: string,
        adjustmentDto: CreateStockAdjustmentDto,
        adjustedBy: string,
    ): Promise<void> {
        const stockItem = await (this.prisma as any).pPEStockItem.findFirst({
            where: {
                id: itemId,
                stockId,
            },
        });

        this.errorHandler.throwIfNotFoundById('PPEStockItem', itemId, stockItem);

        const quantityBefore = stockItem.currentQuantity;
        const quantityAfter = adjustmentDto.quantityAfter;
        const quantityChange = quantityAfter - quantityBefore;

        await this.prisma.$transaction(async (tx) => {
            // Update stock item
            await (tx as any).pPEStockItem.update({
                where: { id: itemId },
                data: {
                    currentQuantity: quantityAfter,
                },
            });

            // Create adjustment record
            await (tx as any).pPEStockAdjustment.create({
                data: {
                    stockItemId: itemId,
                    adjustmentType: adjustmentDto.adjustmentType,
                    quantityBefore,
                    quantityAfter,
                    quantityChange,
                    reason: adjustmentDto.reason,
                    adjustedBy,
                },
            });
        });
    }

    // ============================================================================
    // STOCK ITEMS METHODS (Master Data)
    // ============================================================================

    /**
     * Get available stock items for withdrawal
     */
    async getAvailableStockItems(options?: FindPPEStockItemDto): Promise<{
        data: PPEStockItemDto[];
        meta: { total: number; page: number; limit: number };
    }> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            search,
            status,
            stockId,
            availableOnly = true,
        } = options || {};

        const where: any = {
            stock: {
                isActive: true,
            },
        };

        if (availableOnly) {
            where.status = 'AVAILABLE';
            where.currentQuantity = {
                gt: 0,
            };
        }

        if (status) {
            where.status = status;
        }

        if (stockId) {
            where.stockId = stockId;
        }

        if (search) {
            where.OR = [
                { equipmentName: { contains: search, mode: 'insensitive' } },
                { equipmentType: { contains: search, mode: 'insensitive' } },
                { equipmentSize: { contains: search, mode: 'insensitive' } },
            ];
        }

        const orderBy: any = {};
        if (sortBy) {
            orderBy[sortBy] = sortOrder || 'desc';
        }

        const [items, total] = await Promise.all([
            (this.prisma as any).pPEStockItem.findMany({
                where,
                include: {
                    stock: true,
                },
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
            }),
            (this.prisma as any).pPEStockItem.count({ where }),
        ]);

        return {
            data: this.ppeStockItemArrayMapper(items),
            meta: { total, page, limit },
        };
    }

    // ============================================================================
    // WITHDRAWAL MANAGEMENT METHODS
    // ============================================================================

    /**
     * Create withdrawal request
     */
    async createWithdrawal(createWithdrawalDto: CreatePPEWithdrawalDto, createdBy: string): Promise<PPEWithdrawalDto> {
        const withdrawalCode = await this.generateWithdrawalCode();

        // Validate stock items availability
        for (const item of createWithdrawalDto.items) {
            const stockItem = await (this.prisma as any).pPEStockItem.findUnique({
                where: { id: item.stockItemId },
            });

            this.errorHandler.throwIfNotFoundById('PPEStockItem', item.stockItemId, stockItem);

            if (stockItem.status !== 'AVAILABLE') {
                throw new BadRequestException(
                    `Stock item ${item.stockItemId} is not available for withdrawal. Current status: ${stockItem.status}`,
                );
            }

            const availableQuantity = stockItem.currentQuantity - stockItem.reservedQuantity;
            if (item.requestedQuantity > availableQuantity) {
                throw new BadRequestException(
                    `Insufficient stock for item ${item.stockItemId}. Available: ${availableQuantity}, Requested: ${item.requestedQuantity}`,
                );
            }
        }

        return await this.prisma.$transaction(async (tx) => {
            // Create withdrawal header
            const withdrawal = await (tx as any).pPEWithdrawal.create({
                data: {
                    withdrawalCode,
                    withdrawalDate: new Date(createWithdrawalDto.withdrawalDate),
                    requestedBy: createdBy,
                    requestedFor: createWithdrawalDto.requestedFor || null,
                    requestedForName: createWithdrawalDto.requestedForName || null,
                    departmentId: createWithdrawalDto.departmentId,
                    jobPositionId: createWithdrawalDto.jobPositionId || null,
                    jobPositionName: createWithdrawalDto.jobPositionName || null,
                    withdrawalLetterUrl: createWithdrawalDto.withdrawalLetterUrl || null,
                    notes: createWithdrawalDto.notes || null,
                    status: 'PENDING' as any,
                    createdBy,
                },
            });

            // Create withdrawal items and reserve stock
            const items = await Promise.all(
                createWithdrawalDto.items.map(async (item, index) => {
                    // Reserve stock
                    await (tx as any).pPEStockItem.update({
                        where: { id: item.stockItemId },
                        data: {
                            reservedQuantity: {
                                increment: item.requestedQuantity,
                            },
                        },
                    });

                    return (tx as any).pPEWithdrawalItem.create({
                        data: {
                            withdrawalId: withdrawal.id,
                            stockItemId: item.stockItemId,
                            requestedQuantity: item.requestedQuantity,
                            order: item.order || index + 1,
                            notes: item.notes || null,
                        },
                    });
                }),
            );

            // Fetch with relations
            const withdrawalWithItems = await (tx as any).pPEWithdrawal.findUnique({
                where: { id: withdrawal.id },
                include: {
                    items: {
                        include: {
                            stockItem: {
                                include: {
                                    stock: true,
                                },
                            },
                        },
                        orderBy: { order: 'asc' },
                    },
                    requester: true,
                    requestedForUser: true,
                    department: true,
                    jobPosition: true,
                    creator: true,
                },
            });

            return this.ppeWithdrawalMapper(withdrawalWithItems);
        });
    }

    /**
     * Find all withdrawals with pagination and filtering
     */
    async findAllWithdrawals(options?: FindPPEWithdrawalDto): Promise<{
        data: PPEWithdrawalDto[];
        meta: { total: number; page: number; limit: number };
    }> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            isActive,
            search,
            status,
            departmentId,
            withdrawalDateFrom,
            withdrawalDateTo,
        } = options || {};

        const where: any = {};

        if (search) {
            where.withdrawalCode = {
                contains: search,
                mode: 'insensitive',
            };
        }

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        if (status) {
            where.status = status;
        }

        if (departmentId) {
            where.departmentId = departmentId;
        }

        if (withdrawalDateFrom || withdrawalDateTo) {
            where.withdrawalDate = {};
            if (withdrawalDateFrom) {
                where.withdrawalDate.gte = new Date(withdrawalDateFrom);
            }
            if (withdrawalDateTo) {
                where.withdrawalDate.lte = new Date(withdrawalDateTo);
            }
        }

        const orderBy: any = {};
        if (sortBy) {
            orderBy[sortBy] = sortOrder || 'desc';
        }

        const [withdrawals, total] = await Promise.all([
            (this.prisma as any).pPEWithdrawal.findMany({
                where,
                include: {
                    items: {
                        include: {
                            stockItem: {
                                include: {
                                    stock: true,
                                },
                            },
                        },
                        orderBy: { order: 'asc' },
                    },
                    requester: true,
                    requestedForUser: true,
                    department: true,
                    jobPosition: true,
                    creator: true,
                },
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
            }),
            (this.prisma as any).pPEWithdrawal.count({ where }),
        ]);

        return this.ppeWithdrawalPaginatedMapper({
            data: withdrawals,
            meta: { total, page, limit },
        });
    }

    /**
     * Find withdrawal by ID
     */
    async findWithdrawalById(id: string): Promise<PPEWithdrawalDto> {
        const withdrawal = await (this.prisma as any).pPEWithdrawal.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        stockItem: {
                            include: {
                                stock: true,
                            },
                        },
                    },
                    orderBy: { order: 'asc' },
                },
                requester: true,
                requestedForUser: true,
                department: true,
                jobPosition: true,
                collector: true,
                creator: true,
            },
        });

        this.errorHandler.throwIfNotFoundById('PPEWithdrawal', id, withdrawal);

        return this.ppeWithdrawalMapper(withdrawal);
    }

    /**
     * Approve withdrawal
     */
    async approveWithdrawal(id: string, updateDto: UpdatePPEWithdrawalDto): Promise<PPEWithdrawalDto> {
        const withdrawal = await (this.prisma as any).pPEWithdrawal.findUnique({
            where: { id },
            include: {
                items: true,
            },
        });

        this.errorHandler.throwIfNotFoundById('PPEWithdrawal', id, withdrawal);

        if (withdrawal.status !== 'PENDING') {
            throw new BadRequestException(`Withdrawal ${id} cannot be approved. Current status: ${withdrawal.status}`);
        }

        return await this.prisma.$transaction(async (tx) => {
            // Update withdrawal items with approved quantities
            if (updateDto.approvedQuantities) {
                await Promise.all(
                    withdrawal.items.map(async (item) => {
                        const approvedQty = updateDto.approvedQuantities![item.id];
                        if (approvedQty !== undefined) {
                            // Validate approved quantity
                            if (approvedQty > item.requestedQuantity) {
                                throw new BadRequestException(
                                    `Approved quantity (${approvedQty}) cannot exceed requested quantity (${item.requestedQuantity}) for item ${item.id}`,
                                );
                            }

                            // Update reserved quantity if approved is less than requested
                            if (approvedQty < item.requestedQuantity) {
                                const difference = item.requestedQuantity - approvedQty;
                                await (tx as any).pPEStockItem.update({
                                    where: { id: item.stockItemId },
                                    data: {
                                        reservedQuantity: {
                                            decrement: difference,
                                        },
                                    },
                                });
                            }

                            await (tx as any).pPEWithdrawalItem.update({
                                where: { id: item.id },
                                data: {
                                    approvedQuantity: approvedQty,
                                },
                            });
                        }
                    }),
                );
            }

            // Update withdrawal status
            const updatedWithdrawal = await (tx as any).pPEWithdrawal.update({
                where: { id },
                data: {
                    status: 'APPROVED' as any,
                    notes: updateDto.notes || withdrawal.notes,
                },
                include: {
                    items: {
                        include: {
                            stockItem: {
                                include: {
                                    stock: true,
                                },
                            },
                        },
                        orderBy: { order: 'asc' },
                    },
                    requester: true,
                    requestedForUser: true,
                    department: true,
                    jobPosition: true,
                    creator: true,
                },
            });

            return this.ppeWithdrawalMapper(updatedWithdrawal);
        });
    }

    /**
     * Collect withdrawal (deduct stock)
     */
    async collectWithdrawal(id: string, updateDto: UpdatePPEWithdrawalDto): Promise<PPEWithdrawalDto> {
        const withdrawal = await (this.prisma as any).pPEWithdrawal.findUnique({
            where: { id },
            include: {
                items: true,
            },
        });

        this.errorHandler.throwIfNotFoundById('PPEWithdrawal', id, withdrawal);

        if (withdrawal.status !== 'APPROVED') {
            throw new BadRequestException(`Withdrawal ${id} cannot be collected. Current status: ${withdrawal.status}`);
        }

        return await this.prisma.$transaction(async (tx) => {
            // Process each withdrawal item
            await Promise.all(
                withdrawal.items.map(async (item) => {
                    const issuedQty = updateDto.issuedQuantities?.[item.id] || item.approvedQuantity || item.requestedQuantity;

                    // Validate issued quantity
                    if (issuedQty > (item.approvedQuantity || item.requestedQuantity)) {
                        throw new BadRequestException(
                            `Issued quantity (${issuedQty}) cannot exceed approved quantity (${item.approvedQuantity || item.requestedQuantity}) for item ${item.id}`,
                        );
                    }

                    const stockItem = await (tx as any).pPEStockItem.findUnique({
                        where: { id: item.stockItemId },
                    });

                    if (!stockItem) {
                        throw new BadRequestException(`Stock item ${item.stockItemId} not found`);
                    }

                    // Deduct from stock
                    const newCurrentQuantity = stockItem.currentQuantity - issuedQty;
                    const newReservedQuantity = stockItem.reservedQuantity - issuedQty;

                    await (tx as any).pPEStockItem.update({
                        where: { id: item.stockItemId },
                        data: {
                            currentQuantity: newCurrentQuantity,
                            reservedQuantity: Math.max(0, newReservedQuantity),
                            status: newCurrentQuantity === 0 ? 'ISSUED' as any : stockItem.status,
                        },
                    });

                    // Create stock adjustment for audit trail
                    await (tx as any).pPEStockAdjustment.create({
                        data: {
                            stockItemId: item.stockItemId,
                            adjustmentType: 'RETURN', // Actually it's withdrawal, but using RETURN type
                            quantityBefore: stockItem.currentQuantity,
                            quantityAfter: newCurrentQuantity,
                            quantityChange: -issuedQty,
                            reason: `Withdrawal ${withdrawal.withdrawalCode} - Item collected`,
                            adjustedBy: updateDto.collectedBy || withdrawal.requestedBy,
                        },
                    });

                    // Update withdrawal item
                    await (tx as any).pPEWithdrawalItem.update({
                        where: { id: item.id },
                        data: {
                            issuedQuantity: issuedQty,
                        },
                    });
                }),
            );

            // Update withdrawal status
            const updatedWithdrawal = await (tx as any).pPEWithdrawal.update({
                where: { id },
                data: {
                    status: 'COLLECTED' as any,
                    collectedDate: new Date(),
                    collectedBy: updateDto.collectedBy || withdrawal.requestedBy,
                    notes: updateDto.notes || withdrawal.notes,
                },
                include: {
                    items: {
                        include: {
                            stockItem: {
                                include: {
                                    stock: true,
                                },
                            },
                        },
                        orderBy: { order: 'asc' },
                    },
                    requester: true,
                    requestedForUser: true,
                    department: true,
                    jobPosition: true,
                    collector: true,
                    creator: true,
                },
            });

            return this.ppeWithdrawalMapper(updatedWithdrawal);
        });
    }

    /**
     * Update withdrawal (only if status is PENDING)
     */
    async updateWithdrawal(id: string, updateDto: CreatePPEWithdrawalDto): Promise<PPEWithdrawalDto> {
        const withdrawal = await (this.prisma as any).pPEWithdrawal.findUnique({
            where: { id },
            include: {
                items: true,
            },
        });

        this.errorHandler.throwIfNotFoundById('PPEWithdrawal', id, withdrawal);

        if (withdrawal.status !== 'PENDING') {
            throw new BadRequestException(`Withdrawal ${id} cannot be updated. Current status: ${withdrawal.status}. Only PENDING withdrawals can be updated.`);
        }

        // Validate stock items availability
        for (const item of updateDto.items) {
            const stockItem = await (this.prisma as any).pPEStockItem.findUnique({
                where: { id: item.stockItemId },
            });

            this.errorHandler.throwIfNotFoundById('PPEStockItem', item.stockItemId, stockItem);

            if (stockItem.status !== 'AVAILABLE') {
                throw new BadRequestException(
                    `Stock item ${item.stockItemId} is not available for withdrawal. Current status: ${stockItem.status}`,
                );
            }

            // Calculate available quantity (considering current reserved quantity from this withdrawal)
            const currentReservedFromThis = withdrawal.items
                .filter((wi: any) => wi.stockItemId === item.stockItemId)
                .reduce((sum: number, wi: any) => sum + wi.requestedQuantity, 0);

            const availableQuantity = stockItem.currentQuantity - (stockItem.reservedQuantity - currentReservedFromThis);

            if (item.requestedQuantity > availableQuantity) {
                throw new BadRequestException(
                    `Insufficient stock for item ${item.stockItemId}. Available: ${availableQuantity}, Requested: ${item.requestedQuantity}`,
                );
            }
        }

        return await this.prisma.$transaction(async (tx) => {
            // Release reserved stock from old items
            for (const oldItem of withdrawal.items) {
                await (tx as any).pPEStockItem.update({
                    where: { id: oldItem.stockItemId },
                    data: {
                        reservedQuantity: {
                            decrement: oldItem.requestedQuantity,
                        },
                    },
                });
            }

            // Delete old items
            await (tx as any).pPEWithdrawalItem.deleteMany({
                where: { withdrawalId: id },
            });

            // Update withdrawal header
            await (tx as any).pPEWithdrawal.update({
                where: { id },
                data: {
                    withdrawalDate: new Date(updateDto.withdrawalDate),
                    requestedFor: updateDto.requestedFor || null,
                    requestedForName: updateDto.requestedForName || null,
                    departmentId: updateDto.departmentId,
                    jobPositionId: updateDto.jobPositionId || null,
                    jobPositionName: updateDto.jobPositionName || null,
                    withdrawalLetterUrl: updateDto.withdrawalLetterUrl || null,
                    notes: updateDto.notes || null,
                },
            });

            // Create new items and reserve stock
            const items = await Promise.all(
                updateDto.items.map(async (item, index) => {
                    // Reserve stock
                    await (tx as any).pPEStockItem.update({
                        where: { id: item.stockItemId },
                        data: {
                            reservedQuantity: {
                                increment: item.requestedQuantity,
                            },
                        },
                    });

                    return (tx as any).pPEWithdrawalItem.create({
                        data: {
                            withdrawalId: id,
                            stockItemId: item.stockItemId,
                            requestedQuantity: item.requestedQuantity,
                            order: item.order || index + 1,
                            notes: item.notes || null,
                        },
                    });
                }),
            );

            // Fetch updated withdrawal with relations
            const updatedWithdrawal = await (tx as any).pPEWithdrawal.findUnique({
                where: { id },
                include: {
                    items: {
                        include: {
                            stockItem: {
                                include: {
                                    stock: true,
                                },
                            },
                        },
                        orderBy: { order: 'asc' },
                    },
                    requester: true,
                    requestedForUser: true,
                    department: true,
                    jobPosition: true,
                    creator: true,
                },
            });

            return this.ppeWithdrawalMapper(updatedWithdrawal);
        });
    }

    /**
     * Cancel withdrawal
     */
    async cancelWithdrawal(id: string, updateDto?: UpdatePPEWithdrawalDto): Promise<PPEWithdrawalDto> {
        const withdrawal = await (this.prisma as any).pPEWithdrawal.findUnique({
            where: { id },
            include: {
                items: true,
            },
        });

        this.errorHandler.throwIfNotFoundById('PPEWithdrawal', id, withdrawal);

        if (withdrawal.status === 'COLLECTED') {
            throw new BadRequestException(`Withdrawal ${id} cannot be cancelled. It has already been collected.`);
        }

        return await this.prisma.$transaction(async (tx) => {
            // Release reserved stock
            await Promise.all(
                withdrawal.items.map(async (item) => {
                    const reservedQty = item.approvedQuantity || item.requestedQuantity;
                    await (tx as any).pPEStockItem.update({
                        where: { id: item.stockItemId },
                        data: {
                            reservedQuantity: {
                                decrement: reservedQty,
                            },
                        },
                    });
                }),
            );

            // Update withdrawal status
            const updatedWithdrawal = await (tx as any).pPEWithdrawal.update({
                where: { id },
                data: {
                    status: 'CANCELLED' as any,
                    notes: updateDto?.notes || withdrawal.notes,
                },
                include: {
                    items: {
                        include: {
                            stockItem: {
                                include: {
                                    stock: true,
                                },
                            },
                        },
                        orderBy: { order: 'asc' },
                    },
                    requester: true,
                    requestedForUser: true,
                    department: true,
                    jobPosition: true,
                    creator: true,
                },
            });

            return this.ppeWithdrawalMapper(updatedWithdrawal);
        });
    }
}

