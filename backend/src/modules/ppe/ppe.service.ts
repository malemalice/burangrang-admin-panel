import { Injectable } from '@nestjs/common';
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
import { CreateSafetyEquipmentTypeDto } from './dto/create-safety-equipment-type.dto';
import { UpdateSafetyEquipmentTypeDto } from './dto/update-safety-equipment-type.dto';
import { SafetyEquipmentTypeDto } from './dto/safety-equipment-type.dto';
import { CreateSafetyEquipmentDto } from './dto/create-safety-equipment.dto';
import { UpdateSafetyEquipmentDto } from './dto/update-safety-equipment.dto';
import { SafetyEquipmentDto } from './dto/safety-equipment.dto';
import { FindSafetyEquipmentTypeDto } from './dto/find-safety-equipment-type.dto';
import { FindSafetyEquipmentDto } from './dto/find-safety-equipment.dto';
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
    private safetyEquipmentTypeMapper: (type: any) => SafetyEquipmentTypeDto;
    private safetyEquipmentTypeArrayMapper: (types: any[]) => SafetyEquipmentTypeDto[];
    private safetyEquipmentTypePaginatedMapper: (data: { data: any[]; meta: any }) => { data: SafetyEquipmentTypeDto[]; meta: any };
    private safetyEquipmentMapper: (equipment: any) => SafetyEquipmentDto;
    private safetyEquipmentArrayMapper: (equipments: any[]) => SafetyEquipmentDto[];
    private safetyEquipmentPaginatedMapper: (data: { data: any[]; meta: any }) => { data: SafetyEquipmentDto[]; meta: any };

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
        this.safetyEquipmentTypeMapper = this.dtoMapper.createSimpleMapper(SafetyEquipmentTypeDto);
        this.safetyEquipmentTypeArrayMapper = this.dtoMapper.createSimpleArrayMapper(SafetyEquipmentTypeDto);
        this.safetyEquipmentTypePaginatedMapper = this.dtoMapper.createPaginatedMapper(SafetyEquipmentTypeDto);
        this.safetyEquipmentMapper = this.dtoMapper.createSimpleMapper(SafetyEquipmentDto);
        this.safetyEquipmentArrayMapper = this.dtoMapper.createSimpleArrayMapper(SafetyEquipmentDto);
        this.safetyEquipmentPaginatedMapper = this.dtoMapper.createPaginatedMapper(SafetyEquipmentDto);
    }

    /**
     * Generate unique stock code: PPE-STK-YYYYMMDD-XXXX
     */
    private async generateStockCode(): Promise<string> {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const prefix = `PPE-STK-${dateStr}-`;

        // Find the last stock code for today
        const lastStock = await this.prisma['pPEStock'].findFirst({
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
        const lastWithdrawal = await this.prisma['pPEWithdrawal'].findFirst({
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
     * Check and update expired stock items
     * This method should be called periodically or before fetching stocks
     */
    /**
     * Helper: Populate requestedForName from requestedForUser if not already set
     * Also populate departmentName and stockItem details
     */
    private populateRequestedForName(withdrawal: any): any {
        let requestedForName = withdrawal.requestedForName;

        // If requestedForName is not set, get it from requestedForUser
        if (!requestedForName && withdrawal.requestedForUser) {
            const firstName = withdrawal.requestedForUser.firstName || '';
            const lastName = withdrawal.requestedForUser.lastName || '';
            requestedForName = `${firstName} ${lastName}`.trim() || null;
        }

        // Populate department name
        const departmentName = withdrawal.department?.name || null;

        // Populate stockItem details for each withdrawal item
        const items = withdrawal.items?.map((item: any) => {
            const stockItem = item.stockItem;
            return {
                ...item,
                stockItemEquipmentName: stockItem?.equipmentName || null,
                stockItemEquipmentType: stockItem?.equipmentType || null,
                stockItemEquipmentSize: stockItem?.equipmentSize || null,
            };
        });

        return {
            ...withdrawal,
            requestedForName: requestedForName || null,
            departmentName,
            items: items || withdrawal.items,
        };
    }

    async checkAndUpdateExpiredItems(): Promise<void> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Only update items from active and non-deleted stocks
        await this.prisma['pPEStockItem'].updateMany({
            where: {
                expiryDate: {
                    lte: today,
                },
                status: {
                    not: 'EXPIRED',
                },
                stock: {
                    deletedAt: null,
                    isActive: true,
                },
            },
            data: {
                status: 'EXPIRED' as any,
            },
        });
    }

    /**
     * Create new stock entry with items
     */
    async createStock(createStockDto: CreatePPEStockDto, createdBy: string): Promise<PPEStockDto> {
        const stockCode = await this.generateStockCode();

        return await this.prisma.$transaction(async (tx) => {
            // Create stock header
            const stock = await tx["pPEStock"].create({
                data: {
                    stockCode,
                    receivedDate: new Date(createStockDto.receivedDate),
                    notes: createStockDto.notes,
                    isActive: createStockDto.isActive !== undefined ? createStockDto.isActive : true,
                    createdBy,
                },
            });

            // Create stock items
            const items = await Promise.all(
                createStockDto.items.map((item, index) =>
                    tx["pPEStockItem"].create({
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
            const stockWithItems = await tx["pPEStock"].findUnique({
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
        meta: { total: number; page: number; limit: number; totalPages: number };
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

        const where: Prisma.PPEStockWhereInput = {
            deletedAt: null, // Only get non-deleted records
        };

        if (search) {
            where.stockCode = {
                contains: search,
                mode: 'insensitive',
            };
        }

        if (isActive !== undefined && isActive !== null) {
            where.isActive = Boolean(isActive);
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

        const orderBy: Prisma.PPEStockOrderByWithRelationInput = {};
        if (sortBy) {
            orderBy[sortBy] = sortOrder || 'desc';
        }

        // Check and update expired items before fetching
        await this.checkAndUpdateExpiredItems();

        const [stocks, total] = await Promise.all([
            this.prisma["pPEStock"].findMany({
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
            this.prisma["pPEStock"].count({ where }),
        ]);

        return this.ppeStockPaginatedMapper({
            data: stocks,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    }

    /**
     * Find stock by ID
     */
    async findStockById(id: string): Promise<PPEStockDto> {
        // Check and update expired items before fetching
        await this.checkAndUpdateExpiredItems();

        const stock = await this.prisma["pPEStock"].findFirst({
            where: {
                id,
                deletedAt: null, // Only get non-deleted records
            },
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
        const existingStock = await this.prisma["pPEStock"].findFirst({
            where: {
                id,
                deletedAt: null, // Only update non-deleted records
            },
            include: {
                items: true,
            },
        });

        this.errorHandler.throwIfNotFoundById('PPEStock', id, existingStock);

        return await this.prisma.$transaction(async (tx) => {
            // Update stock header
            const stock = await tx["pPEStock"].update({
                where: { id },
                data: {
                    receivedDate: updateStockDto.receivedDate ? new Date(updateStockDto.receivedDate) : undefined,
                    notes: updateStockDto.notes,
                    isActive: updateStockDto.isActive,
                },
            });

            // Handle items update if provided
            if (updateStockDto.items !== undefined) {
                const existingItemIds = existingStock.items.map((item: any) => item.id);
                const requestItemIds = updateStockDto.items
                    .filter((item) => item.id)
                    .map((item) => item.id);

                // Delete items that are not in the request
                const itemsToDelete = existingItemIds.filter(
                    (itemId: string) => !requestItemIds.includes(itemId),
                );
                if (itemsToDelete.length > 0) {
                    await tx["pPEStockItem"].deleteMany({
                        where: {
                            id: { in: itemsToDelete },
                            stockId: id,
                        },
                    });
                }

                // Update or create items
                for (const itemDto of updateStockDto.items) {
                    if (itemDto.id && existingItemIds.includes(itemDto.id)) {
                        // Get existing item to preserve reservedQuantity
                        const existingItem = existingStock.items.find((item: any) => item.id === itemDto.id);
                        const currentReservedQty = existingItem?.reservedQuantity || 0;
                        const initialQty = itemDto.initialQuantity || existingItem?.initialQuantity || 0;

                        // Update existing item
                        // Note: We preserve reservedQuantity and adjust currentQuantity accordingly
                        // If initialQuantity is reduced, we need to ensure currentQuantity + reservedQuantity doesn't exceed new initialQuantity
                        const maxCurrentQty = Math.max(0, initialQty - currentReservedQty);
                        const newCurrentQty = Math.min(initialQty, existingItem?.currentQuantity || initialQty);

                        await tx["pPEStockItem"].update({
                            where: { id: itemDto.id },
                            data: {
                                safetyEquipmentId: itemDto.safetyEquipmentId || null,
                                equipmentName: itemDto.equipmentName || null,
                                equipmentType: itemDto.equipmentType || null,
                                equipmentSize: itemDto.equipmentSize || null,
                                expiryDate: itemDto.expiryDate ? new Date(itemDto.expiryDate) : null,
                                initialQuantity: initialQty,
                                currentQuantity: newCurrentQty,
                                // reservedQuantity is preserved (not updated)
                                order: itemDto.order || 0,
                            },
                        });
                    } else {
                        // Create new item
                        await tx["pPEStockItem"].create({
                            data: {
                                stockId: id,
                                safetyEquipmentId: itemDto.safetyEquipmentId || null,
                                equipmentName: itemDto.equipmentName || null,
                                equipmentType: itemDto.equipmentType || null,
                                equipmentSize: itemDto.equipmentSize || null,
                                expiryDate: itemDto.expiryDate ? new Date(itemDto.expiryDate) : null,
                                initialQuantity: itemDto.initialQuantity || 0,
                                currentQuantity: itemDto.initialQuantity || 0,
                                reservedQuantity: 0,
                                status: 'AVAILABLE' as any,
                                order: itemDto.order || 0,
                            },
                        });
                    }
                }
            }

            // Fetch updated stock with items
            const stockWithItems = await tx["pPEStock"].findUnique({
                where: { id },
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
     * Delete stock (soft delete)
     */
    async deleteStock(id: string): Promise<void> {
        const stock = await this.prisma["pPEStock"].findFirst({
            where: {
                id,
                deletedAt: null, // Only delete non-deleted records
            },
            include: {
                items: {
                    include: {
                        withdrawalItems: {
                            include: {
                                withdrawal: true,
                            },
                        },
                    },
                },
            },
        });

        this.errorHandler.throwIfNotFoundById('PPEStock', id, stock);

        // Check if stock has active withdrawals
        const activeWithdrawals = stock.items.some((item: any) =>
            item.withdrawalItems.some((wi: any) =>
                wi.withdrawal.status !== 'CANCELLED' && wi.withdrawal.deletedAt === null
            )
        );

        if (activeWithdrawals) {
            this.errorHandler.throwBadRequest('Cannot delete stock. It has active withdrawals.');
        }

        // Soft delete by setting deletedAt and isActive to false
        await this.prisma["pPEStock"].update({
            where: { id },
            data: {
                deletedAt: new Date(),
                isActive: false,
            },
        });
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
        // Validate stock is not deleted
        const stock = await this.prisma["pPEStock"].findFirst({
            where: {
                id: stockId,
                deletedAt: null,
            },
        });

        this.errorHandler.throwIfNotFoundById('PPEStock', stockId, stock);

        const stockItem = await this.prisma["pPEStockItem"].findFirst({
            where: {
                id: itemId,
                stockId,
            },
        });

        this.errorHandler.throwIfNotFoundById('PPEStockItem', itemId, stockItem);

        const updatedItem = await this.prisma["pPEStockItem"].update({
            where: { id: itemId },
            data: updateData as any,
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
        const stockItem = await this.prisma["pPEStockItem"].findFirst({
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
            await tx["pPEStockItem"].update({
                where: { id: itemId },
                data: {
                    currentQuantity: quantityAfter,
                },
            });

            // Create adjustment record
            await tx["pPEStockAdjustment"].create({
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
        meta: { total: number; page: number; limit: number; totalPages: number };
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
            groupBySafetyEquipment = false,
            includeExpired = false,
        } = options || {};

        const where: Prisma.PPEStockItemWhereInput = {
            stock: {
                isActive: true,
                deletedAt: null, // Only get items from non-deleted stocks
            },
        };

        // Handle status filtering
        if (availableOnly && !includeExpired) {
            where.status = 'AVAILABLE';
            where.currentQuantity = {
                gt: 0,
            };
        } else if (includeExpired) {
            // Include both AVAILABLE and EXPIRED items
            where.status = {
                in: ['AVAILABLE', 'EXPIRED'],
            };
            where.currentQuantity = {
                gt: 0,
            };
        }

        if (status && !includeExpired) {
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

        // If grouping by safety equipment, we need to fetch all items first, then group
        if (groupBySafetyEquipment) {
            const allItems = await this.prisma["pPEStockItem"].findMany({
                where,
                include: {
                    stock: true,
                    safetyEquipment: {
                        include: {
                            safetyEquipmentType: true,
                        },
                    },
                },
            });

            // Group by safetyEquipmentId
            const groupedMap = new Map<string, any>();

            for (const item of allItems) {
                const key = item.safetyEquipmentId || `free-text-${item.equipmentName}-${item.equipmentType}-${item.equipmentSize}`;

                if (!groupedMap.has(key)) {
                    const safetyEquipment = item.safetyEquipment as any;
                    groupedMap.set(key, {
                        safetyEquipmentId: item.safetyEquipmentId,
                        equipmentName: item.equipmentName || safetyEquipment?.name || 'Unknown',
                        equipmentType: item.equipmentType || safetyEquipment?.safetyEquipmentType?.name || null,
                        equipmentSize: item.equipmentSize || safetyEquipment?.size || null,
                        totalCurrentQuantity: 0,
                        totalReservedQuantity: 0,
                        stockItemIds: [] as string[],
                        stockItems: [] as any[],
                        earliestExpiryDate: item.expiryDate,
                    });
                }

                const group = groupedMap.get(key);
                group.totalCurrentQuantity += item.currentQuantity;
                group.totalReservedQuantity += item.reservedQuantity;
                group.stockItemIds.push(item.id);
                group.stockItems.push(item);

                // Track earliest expiry date
                if (item.expiryDate && (!group.earliestExpiryDate || item.expiryDate < group.earliestExpiryDate)) {
                    group.earliestExpiryDate = item.expiryDate;
                }
            }

            // Filter only groups with total stock > 1 and convert to DTO format
            const groupedItems = Array.from(groupedMap.values())
                .filter((group) => group.totalCurrentQuantity > 1)
                .map((group) => {
                    // Use the first stock item as base, but update quantities
                    const baseItem = group.stockItems[0];
                    const dto = this.ppeStockItemMapper({
                        ...baseItem,
                        currentQuantity: group.totalCurrentQuantity,
                        reservedQuantity: group.totalReservedQuantity,
                        expiryDate: group.earliestExpiryDate,
                    });
                    // Add metadata for grouping
                    (dto as any).stockItemIds = group.stockItemIds;
                    (dto as any).isGrouped = true;
                    return dto;
                });

            // Apply search filter on grouped items if needed
            let filteredItems = groupedItems;
            if (search) {
                const searchLower = search.toLowerCase();
                filteredItems = groupedItems.filter((item) => {
                    const name = (item.equipmentName || '').toLowerCase();
                    const type = (item.equipmentType || '').toLowerCase();
                    const size = (item.equipmentSize || '').toLowerCase();
                    return name.includes(searchLower) || type.includes(searchLower) || size.includes(searchLower);
                });
            }

            // Apply sorting
            if (sortBy) {
                filteredItems.sort((a, b) => {
                    let aVal: any = (a as any)[sortBy];
                    let bVal: any = (b as any)[sortBy];

                    if (sortBy === 'currentQuantity') {
                        aVal = a.currentQuantity;
                        bVal = b.currentQuantity;
                    }

                    if (aVal === null || aVal === undefined) return 1;
                    if (bVal === null || bVal === undefined) return -1;

                    if (typeof aVal === 'string') {
                        aVal = aVal.toLowerCase();
                        bVal = bVal.toLowerCase();
                    }

                    if (sortOrder === 'asc') {
                        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
                    } else {
                        return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
                    }
                });
            }

            // Apply pagination
            const total = filteredItems.length;
            const paginatedItems = filteredItems.slice((page - 1) * limit, page * limit);

            return {
                data: paginatedItems,
                meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
            };
        }

        // Original non-grouped logic
        const orderBy: Prisma.PPEStockItemOrderByWithRelationInput = {};
        if (sortBy) {
            orderBy[sortBy] = sortOrder || 'desc';
        }

        const [items, total] = await Promise.all([
            this.prisma["pPEStockItem"].findMany({
                where,
                include: {
                    stock: true,
                },
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma["pPEStockItem"].count({ where }),
        ]);

        return {
            data: this.ppeStockItemArrayMapper(items),
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
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
            const stockItem = await this.prisma["pPEStockItem"].findUnique({
                where: { id: item.stockItemId },
            });

            this.errorHandler.throwIfNotFoundById('PPEStockItem', item.stockItemId, stockItem);

            // Allow AVAILABLE and EXPIRED status for withdrawal (EXPIRED for disposal)
            if (stockItem.status !== 'AVAILABLE' && stockItem.status !== 'EXPIRED') {
                this.errorHandler.throwBadRequest(
                    `Stock item ${item.stockItemId} is not available for withdrawal. Current status: ${stockItem.status}`,
                );
            }

            const availableQuantity = stockItem.currentQuantity - stockItem.reservedQuantity;
            if (item.requestedQuantity > availableQuantity) {
                this.errorHandler.throwBadRequest(
                    `Insufficient stock for item ${item.stockItemId}. Available: ${availableQuantity}, Requested: ${item.requestedQuantity}`,
                );
            }
        }

        return await this.prisma.$transaction(async (tx) => {
            // Create withdrawal header
            const withdrawal = await tx["pPEWithdrawal"].create({
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
                    // Get current stock item to check status
                    const stockItem = await tx["pPEStockItem"].findUnique({
                        where: { id: item.stockItemId },
                    });

                    if (!stockItem) {
                        this.errorHandler.throwBadRequest(`Stock item ${item.stockItemId} not found`);
                    }

                    // Calculate new reserved quantity
                    const newReservedQuantity = stockItem.reservedQuantity + item.requestedQuantity;
                    const availableQuantity = stockItem.currentQuantity - newReservedQuantity;

                    // Determine new status
                    let newStatus = stockItem.status;
                    if (stockItem.status === 'EXPIRED') {
                        // Keep EXPIRED status for expired items
                        newStatus = 'EXPIRED' as any;
                    } else if (availableQuantity <= 0) {
                        // All stock is reserved
                        newStatus = 'RESERVED' as any;
                    } else if (newReservedQuantity > 0 && stockItem.status === 'AVAILABLE') {
                        // Some stock is reserved, but not all
                        newStatus = 'AVAILABLE' as any; // Keep as AVAILABLE if still has available stock
                    }

                    // Reserve stock
                    await tx["pPEStockItem"].update({
                        where: { id: item.stockItemId },
                        data: {
                            reservedQuantity: {
                                increment: item.requestedQuantity,
                            },
                            status: newStatus,
                        },
                    });

                    return tx["pPEWithdrawalItem"].create({
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
            const withdrawalWithItems = await tx["pPEWithdrawal"].findUnique({
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

            return this.ppeWithdrawalMapper(this.populateRequestedForName(withdrawalWithItems));
        });
    }

    /**
     * Find all withdrawals with pagination and filtering
     */
    async findAllWithdrawals(options?: FindPPEWithdrawalDto): Promise<{
        data: PPEWithdrawalDto[];
        meta: { total: number; page: number; limit: number; totalPages: number };
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

        const where: Prisma.PPEWithdrawalWhereInput = {
            deletedAt: null, // Only get non-deleted records
        };

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

        const orderBy: Prisma.PPEWithdrawalOrderByWithRelationInput = {};
        if (sortBy) {
            orderBy[sortBy] = sortOrder || 'desc';
        }

        const [withdrawals, total] = await Promise.all([
            this.prisma["pPEWithdrawal"].findMany({
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
            this.prisma["pPEWithdrawal"].count({ where }),
        ]);

        // Populate requestedForName from requestedForUser if not already set
        const withdrawalsWithNames = withdrawals.map((withdrawal: any) =>
            this.populateRequestedForName(withdrawal),
        );

        return this.ppeWithdrawalPaginatedMapper({
            data: withdrawalsWithNames,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    }

    /**
     * Find withdrawal by ID
     */
    async findWithdrawalById(id: string): Promise<PPEWithdrawalDto> {
        const withdrawal = await this.prisma["pPEWithdrawal"].findFirst({
            where: {
                id,
                deletedAt: null, // Only get non-deleted records
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

        this.errorHandler.throwIfNotFoundById('PPEWithdrawal', id, withdrawal);

        // Populate requestedForName from requestedForUser if not already set
        return this.ppeWithdrawalMapper(this.populateRequestedForName(withdrawal));
    }

    /**
     * Approve withdrawal
     */
    async approveWithdrawal(id: string, updateDto: UpdatePPEWithdrawalDto): Promise<PPEWithdrawalDto> {
        const withdrawal = await this.prisma["pPEWithdrawal"].findFirst({
            where: {
                id,
                deletedAt: null, // Only approve non-deleted records
            },
            include: {
                items: true,
            },
        });

        this.errorHandler.throwIfNotFoundById('PPEWithdrawal', id, withdrawal);

        if (withdrawal.status !== 'PENDING') {
            this.errorHandler.throwBadRequest(`Withdrawal ${id} cannot be approved. Current status: ${withdrawal.status}`);
        }

        return await this.prisma.$transaction(async (tx) => {
            // Update withdrawal items with approved quantities
            // If approvedQuantities not provided, default to requestedQuantity
            await Promise.all(
                withdrawal.items.map(async (item) => {
                    let approvedQty = item.requestedQuantity;

                    if (updateDto.approvedQuantities && updateDto.approvedQuantities[item.id] !== undefined) {
                        approvedQty = updateDto.approvedQuantities[item.id];

                        // Validate approved quantity
                        if (approvedQty > item.requestedQuantity) {
                            this.errorHandler.throwBadRequest(
                                `Approved quantity (${approvedQty}) cannot exceed requested quantity (${item.requestedQuantity}) for item ${item.id}`,
                            );
                        }

                        // Update reserved quantity if approved is less than requested
                        if (approvedQty < item.requestedQuantity) {
                            const difference = item.requestedQuantity - approvedQty;

                            // Get current stock item to check status
                            const stockItem = await tx["pPEStockItem"].findUnique({
                                where: { id: item.stockItemId },
                            });

                            if (!stockItem) {
                                this.errorHandler.throwBadRequest(`Stock item ${item.stockItemId} not found`);
                            }

                            const newReservedQuantity = Math.max(0, stockItem.reservedQuantity - difference);
                            const availableQuantity = stockItem.currentQuantity - newReservedQuantity;

                            // Determine new status after reducing reservation
                            let newStatus: any;
                            if (newReservedQuantity === 0) {
                                newStatus = 'AVAILABLE';
                            } else if (newReservedQuantity >= stockItem.currentQuantity) {
                                newStatus = 'RESERVED';
                            } else {
                                newStatus = 'AVAILABLE';
                            }

                            await tx["pPEStockItem"].update({
                                where: { id: item.stockItemId },
                                data: {
                                    reservedQuantity: newReservedQuantity,
                                    status: newStatus,
                                },
                            });
                        }
                    }

                    // Always update approvedQuantity (even if same as requestedQuantity for consistency)
                    await tx["pPEWithdrawalItem"].update({
                        where: { id: item.id },
                        data: {
                            approvedQuantity: approvedQty,
                        },
                    });
                }),
            );

            // Update withdrawal status
            const updatedWithdrawal = await tx["pPEWithdrawal"].update({
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

            return this.ppeWithdrawalMapper(this.populateRequestedForName(updatedWithdrawal));
        });
    }

    /**
     * Collect withdrawal (deduct stock)
     */
    async collectWithdrawal(id: string, updateDto: UpdatePPEWithdrawalDto): Promise<PPEWithdrawalDto> {
        const withdrawal = await this.prisma["pPEWithdrawal"].findFirst({
            where: {
                id,
                deletedAt: null, // Only collect non-deleted records
            },
            include: {
                items: true,
            },
        });

        this.errorHandler.throwIfNotFoundById('PPEWithdrawal', id, withdrawal);

        if (withdrawal.status !== 'APPROVED') {
            this.errorHandler.throwBadRequest(`Withdrawal ${id} cannot be collected. Current status: ${withdrawal.status}`);
        }

        return await this.prisma.$transaction(async (tx) => {
            // Process each withdrawal item
            await Promise.all(
                withdrawal.items.map(async (item) => {
                    const issuedQty = updateDto.issuedQuantities?.[item.id] || item.approvedQuantity || item.requestedQuantity;

                    // Validate issued quantity
                    if (issuedQty > (item.approvedQuantity || item.requestedQuantity)) {
                        this.errorHandler.throwBadRequest(
                            `Issued quantity (${issuedQty}) cannot exceed approved quantity (${item.approvedQuantity || item.requestedQuantity}) for item ${item.id}`,
                        );
                    }

                    const stockItem = await tx["pPEStockItem"].findUnique({
                        where: { id: item.stockItemId },
                    });

                    if (!stockItem) {
                        this.errorHandler.throwBadRequest(`Stock item ${item.stockItemId} not found`);
                    }

                    // Deduct from stock
                    const newCurrentQuantity = stockItem.currentQuantity - issuedQty;
                    const newReservedQuantity = Math.max(0, stockItem.reservedQuantity - issuedQty);

                    // Determine new status based on quantities
                    let newStatus: any;
                    if (newCurrentQuantity === 0) {
                        newStatus = 'ISSUED';
                    } else if (newReservedQuantity > 0 && newReservedQuantity >= newCurrentQuantity) {
                        newStatus = 'RESERVED';
                    } else if (newReservedQuantity > 0) {
                        newStatus = 'AVAILABLE'; // Has both available and reserved stock
                    } else {
                        newStatus = 'AVAILABLE';
                    }

                    await tx["pPEStockItem"].update({
                        where: { id: item.stockItemId },
                        data: {
                            currentQuantity: newCurrentQuantity,
                            reservedQuantity: newReservedQuantity,
                            status: newStatus,
                        },
                    });

                    // Create stock adjustment for audit trail
                    await tx["pPEStockAdjustment"].create({
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
                    await tx["pPEWithdrawalItem"].update({
                        where: { id: item.id },
                        data: {
                            issuedQuantity: issuedQty,
                        },
                    });
                }),
            );

            // Update withdrawal status
            const updatedWithdrawal = await tx["pPEWithdrawal"].update({
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

            return this.ppeWithdrawalMapper(this.populateRequestedForName(updatedWithdrawal));
        });
    }

    /**
     * Update withdrawal (only if status is PENDING)
     */
    async updateWithdrawal(id: string, updateDto: CreatePPEWithdrawalDto): Promise<PPEWithdrawalDto> {
        const withdrawal = await this.prisma["pPEWithdrawal"].findFirst({
            where: {
                id,
                deletedAt: null, // Only update non-deleted records
            },
            include: {
                items: true,
            },
        });

        this.errorHandler.throwIfNotFoundById('PPEWithdrawal', id, withdrawal);

        if (withdrawal.status !== 'PENDING') {
            this.errorHandler.throwBadRequest(`Withdrawal ${id} cannot be updated. Current status: ${withdrawal.status}. Only PENDING withdrawals can be updated.`);
        }

        // Validate stock items availability
        for (const item of updateDto.items) {
            const stockItem = await this.prisma["pPEStockItem"].findUnique({
                where: { id: item.stockItemId },
            });

            this.errorHandler.throwIfNotFoundById('PPEStockItem', item.stockItemId, stockItem);

            // Allow AVAILABLE and EXPIRED status for withdrawal (EXPIRED for disposal)
            if (stockItem.status !== 'AVAILABLE' && stockItem.status !== 'EXPIRED') {
                this.errorHandler.throwBadRequest(
                    `Stock item ${item.stockItemId} is not available for withdrawal. Current status: ${stockItem.status}`,
                );
            }

            // Calculate available quantity (considering current reserved quantity from this withdrawal)
            const currentReservedFromThis = withdrawal.items
                .filter((wi: any) => wi.stockItemId === item.stockItemId)
                .reduce((sum: number, wi: any) => sum + wi.requestedQuantity, 0);

            const availableQuantity = stockItem.currentQuantity - (stockItem.reservedQuantity - currentReservedFromThis);

            if (item.requestedQuantity > availableQuantity) {
                this.errorHandler.throwBadRequest(
                    `Insufficient stock for item ${item.stockItemId}. Available: ${availableQuantity}, Requested: ${item.requestedQuantity}`,
                );
            }
        }

        return await this.prisma.$transaction(async (tx) => {
            // Release reserved stock from old items
            for (const oldItem of withdrawal.items) {
                const stockItem = await tx["pPEStockItem"].findUnique({
                    where: { id: oldItem.stockItemId },
                });

                if (!stockItem) {
                    this.errorHandler.throwBadRequest(`Stock item ${oldItem.stockItemId} not found`);
                }

                const newReservedQuantity = Math.max(0, stockItem.reservedQuantity - oldItem.requestedQuantity);
                const availableQuantity = stockItem.currentQuantity - newReservedQuantity;

                // Determine new status after releasing reservation
                let newStatus: any;
                if (stockItem.status === 'EXPIRED') {
                    // Keep EXPIRED status for expired items
                    newStatus = 'EXPIRED';
                } else if (newReservedQuantity === 0) {
                    newStatus = 'AVAILABLE';
                } else if (newReservedQuantity >= stockItem.currentQuantity) {
                    newStatus = 'RESERVED';
                } else {
                    newStatus = 'AVAILABLE';
                }

                await tx["pPEStockItem"].update({
                    where: { id: oldItem.stockItemId },
                    data: {
                        reservedQuantity: newReservedQuantity,
                        status: newStatus,
                    },
                });
            }

            // Delete old items
            await tx["pPEWithdrawalItem"].deleteMany({
                where: { withdrawalId: id },
            });

            // Update withdrawal header
            await tx["pPEWithdrawal"].update({
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
                    // Get current stock item to check status
                    const stockItem = await tx["pPEStockItem"].findUnique({
                        where: { id: item.stockItemId },
                    });

                    if (!stockItem) {
                        this.errorHandler.throwBadRequest(`Stock item ${item.stockItemId} not found`);
                    }

                    // Calculate new reserved quantity
                    const newReservedQuantity = stockItem.reservedQuantity + item.requestedQuantity;
                    const availableQuantity = stockItem.currentQuantity - newReservedQuantity;

                    // Determine new status
                    let newStatus: any;
                    if (stockItem.status === 'EXPIRED') {
                        // Keep EXPIRED status for expired items
                        newStatus = 'EXPIRED' as any;
                    } else if (availableQuantity <= 0) {
                        // All stock is reserved
                        newStatus = 'RESERVED';
                    } else if (newReservedQuantity > 0 && stockItem.status === 'AVAILABLE') {
                        // Some stock is reserved, but not all
                        newStatus = 'AVAILABLE'; // Keep as AVAILABLE if still has available stock
                    } else {
                        newStatus = stockItem.status; // Preserve current status if already RESERVED or other
                    }

                    // Reserve stock
                    await tx["pPEStockItem"].update({
                        where: { id: item.stockItemId },
                        data: {
                            reservedQuantity: {
                                increment: item.requestedQuantity,
                            },
                            status: newStatus,
                        },
                    });

                    return tx["pPEWithdrawalItem"].create({
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
            const updatedWithdrawal = await tx["pPEWithdrawal"].findUnique({
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

            return this.ppeWithdrawalMapper(this.populateRequestedForName(updatedWithdrawal));
        });
    }

    /**
     * Cancel withdrawal
     */
    async cancelWithdrawal(id: string, updateDto?: UpdatePPEWithdrawalDto): Promise<PPEWithdrawalDto> {
        const withdrawal = await this.prisma["pPEWithdrawal"].findFirst({
            where: {
                id,
                deletedAt: null, // Only cancel non-deleted records
            },
            include: {
                items: true,
            },
        });

        this.errorHandler.throwIfNotFoundById('PPEWithdrawal', id, withdrawal);

        if (withdrawal.status === 'COLLECTED') {
            this.errorHandler.throwBadRequest(`Withdrawal ${id} cannot be cancelled. It has already been collected.`);
        }

        return await this.prisma.$transaction(async (tx) => {
            // Release reserved stock
            await Promise.all(
                withdrawal.items.map(async (item) => {
                    const reservedQty = item.approvedQuantity || item.requestedQuantity;

                    // Get current stock item to check status
                    const stockItem = await tx["pPEStockItem"].findUnique({
                        where: { id: item.stockItemId },
                    });

                    if (!stockItem) {
                        this.errorHandler.throwBadRequest(`Stock item ${item.stockItemId} not found`);
                    }

                    const newReservedQuantity = Math.max(0, stockItem.reservedQuantity - reservedQty);
                    const availableQuantity = stockItem.currentQuantity - newReservedQuantity;

                    // Determine new status after releasing reservation
                    let newStatus: any;
                    if (stockItem.status === 'EXPIRED') {
                        // Keep EXPIRED status for expired items
                        newStatus = 'EXPIRED';
                    } else if (newReservedQuantity === 0) {
                        newStatus = 'AVAILABLE';
                    } else if (newReservedQuantity >= stockItem.currentQuantity) {
                        newStatus = 'RESERVED';
                    } else {
                        newStatus = 'AVAILABLE';
                    }

                    await tx["pPEStockItem"].update({
                        where: { id: item.stockItemId },
                        data: {
                            reservedQuantity: newReservedQuantity,
                            status: newStatus,
                        },
                    });
                }),
            );

            // Update withdrawal status
            const updatedWithdrawal = await tx["pPEWithdrawal"].update({
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

            return this.ppeWithdrawalMapper(this.populateRequestedForName(updatedWithdrawal));
        });
    }

    /**
     * Delete withdrawal (soft delete)
     */
    async deleteWithdrawal(id: string): Promise<void> {
        const withdrawal = await this.prisma["pPEWithdrawal"].findFirst({
            where: {
                id,
                deletedAt: null, // Only delete non-deleted records
            },
            include: {
                items: true,
            },
        });

        this.errorHandler.throwIfNotFoundById('PPEWithdrawal', id, withdrawal);

        // Only allow delete if status is PENDING or CANCELLED
        if (withdrawal.status !== 'PENDING' && withdrawal.status !== 'CANCELLED') {
            this.errorHandler.throwBadRequest(`Cannot delete withdrawal. Current status: ${withdrawal.status}. Only PENDING or CANCELLED withdrawals can be deleted.`);
        }

        return await this.prisma.$transaction(async (tx) => {
            // Release reserved stock if status is APPROVED
            if (withdrawal.status === 'APPROVED') {
                await Promise.all(
                    withdrawal.items.map(async (item: any) => {
                        const reservedQty = item.approvedQuantity || item.requestedQuantity;

                        // Get current stock item to check status
                        const stockItem = await tx["pPEStockItem"].findUnique({
                            where: { id: item.stockItemId },
                        });

                        if (!stockItem) {
                            this.errorHandler.throwBadRequest(`Stock item ${item.stockItemId} not found`);
                        }

                        const newReservedQuantity = Math.max(0, stockItem.reservedQuantity - reservedQty);
                        const availableQuantity = stockItem.currentQuantity - newReservedQuantity;

                        // Determine new status after releasing reservation
                        let newStatus: any;
                        if (newReservedQuantity === 0) {
                            newStatus = 'AVAILABLE';
                        } else if (newReservedQuantity >= stockItem.currentQuantity) {
                            newStatus = 'RESERVED';
                        } else {
                            newStatus = 'AVAILABLE';
                        }

                        await tx["pPEStockItem"].update({
                            where: { id: item.stockItemId },
                            data: {
                                reservedQuantity: newReservedQuantity,
                                status: newStatus,
                            },
                        });
                    }),
                );
            }

            // Soft delete by setting deletedAt and isActive to false
            await tx["pPEWithdrawal"].update({
                where: { id },
                data: {
                    deletedAt: new Date(),
                    isActive: false,
                },
            });
        });
    }

    // ============================================================================
    // SAFETY EQUIPMENT TYPES METHODS
    // ============================================================================

    async createSafetyEquipmentType(
        createSafetyEquipmentTypeDto: CreateSafetyEquipmentTypeDto,
    ): Promise<SafetyEquipmentTypeDto> {
        const safetyEquipmentType = await this.prisma["safetyEquipmentType"].create({
            data: createSafetyEquipmentTypeDto,
        });

        return this.safetyEquipmentTypeMapper(safetyEquipmentType);
    }

    async findAllSafetyEquipmentTypes(options?: FindSafetyEquipmentTypeDto): Promise<{
        data: SafetyEquipmentTypeDto[];
        meta: { total: number; page: number; limit: number; totalPages: number };
    }> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'name',
            sortOrder = 'asc',
            isActive,
            search,
            name,
            code,
        } = options || {};

        // Build where clause
        const where: Prisma.SafetyEquipmentTypeWhereInput = {
            deletedAt: null, // Only get non-deleted records
        };

        // Handle name filter (exact match or contains)
        if (name) {
            where.name = { contains: name, mode: 'insensitive' };
        }

        // Handle code filter (exact match or contains)
        if (code) {
            where.code = { contains: code, mode: 'insensitive' };
        }

        // Handle search filter (OR logic for name, code, description)
        // Only apply search if name and code filters are not provided
        if (search && !name && !code) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        // Build order by clause
        const orderBy: Prisma.SafetyEquipmentTypeOrderByWithRelationInput = {};
        if (sortBy) {
            orderBy[sortBy] = sortOrder || 'asc';
        } else {
            orderBy.name = 'asc';
        }

        // Get total count
        const total = await this.prisma["safetyEquipmentType"].count({ where });

        // Get paginated data
        const safetyEquipmentTypes = await this.prisma["safetyEquipmentType"].findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
        });

        return this.safetyEquipmentTypePaginatedMapper({
            data: safetyEquipmentTypes,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    }

    async findOneSafetyEquipmentType(id: string): Promise<SafetyEquipmentTypeDto> {
        const safetyEquipmentType = await this.prisma["safetyEquipmentType"].findFirst({
            where: {
                id,
                deletedAt: null, // Only get non-deleted records
            },
        });

        this.errorHandler.throwIfNotFoundById('Safety Equipment Type', id, safetyEquipmentType);

        return this.safetyEquipmentTypeMapper(safetyEquipmentType);
    }

    async updateSafetyEquipmentType(
        id: string,
        updateSafetyEquipmentTypeDto: UpdateSafetyEquipmentTypeDto,
    ): Promise<SafetyEquipmentTypeDto> {
        const existingType = await this.prisma["safetyEquipmentType"].findFirst({
            where: {
                id,
                deletedAt: null, // Only update non-deleted records
            },
        });

        this.errorHandler.throwIfNotFoundById('Safety Equipment Type', id, existingType);

        const safetyEquipmentType = await this.prisma["safetyEquipmentType"].update({
            where: { id },
            data: updateSafetyEquipmentTypeDto,
        });

        return this.safetyEquipmentTypeMapper(safetyEquipmentType);
    }

    async removeSafetyEquipmentType(id: string): Promise<void> {
        const existingType = await this.prisma["safetyEquipmentType"].findFirst({
            where: {
                id,
                deletedAt: null, // Only delete non-deleted records
            },
        });

        this.errorHandler.throwIfNotFoundById('Safety Equipment Type', id, existingType);

        // Check if type has active equipment
        const activeEquipmentCount = await this.prisma["safetyEquipment"].count({
            where: {
                safetyEquipmentTypeId: id,
                deletedAt: null,
                isActive: true,
            },
        });

        if (activeEquipmentCount > 0) {
            this.errorHandler.throwBadRequest(`Cannot delete Safety Equipment Type. It has ${activeEquipmentCount} active equipment(s).`);
        }

        // Soft delete by setting deletedAt and isActive to false
        await this.prisma["safetyEquipmentType"].update({
            where: { id },
            data: {
                deletedAt: new Date(),
                isActive: false,
            },
        });
    }

    async findSafetyEquipmentTypeByCode(code: string): Promise<SafetyEquipmentTypeDto> {
        const safetyEquipmentType = await this.prisma["safetyEquipmentType"].findFirst({
            where: {
                code,
                deletedAt: null, // Only get non-deleted records
            },
        });

        this.errorHandler.throwIfNotFoundByField('Safety Equipment Type', 'code', code, safetyEquipmentType);

        return this.safetyEquipmentTypeMapper(safetyEquipmentType);
    }

    // ============================================================================
    // SAFETY EQUIPMENTS METHODS
    // ============================================================================

    async createSafetyEquipment(
        createSafetyEquipmentDto: CreateSafetyEquipmentDto,
    ): Promise<SafetyEquipmentDto> {
        // Validate safetyEquipmentTypeId exists and not deleted
        const type = await this.prisma["safetyEquipmentType"].findFirst({
            where: {
                id: createSafetyEquipmentDto.safetyEquipmentTypeId,
                deletedAt: null,
            },
        });

        this.errorHandler.throwIfNotFoundById(
            'Safety Equipment Type',
            createSafetyEquipmentDto.safetyEquipmentTypeId,
            type,
        );

        const safetyEquipment = await this.prisma["safetyEquipment"].create({
            data: createSafetyEquipmentDto,
            include: {
                safetyEquipmentType: true,
            },
        });

        return this.safetyEquipmentMapper(safetyEquipment);
    }

    async findAllSafetyEquipments(options?: FindSafetyEquipmentDto): Promise<{
        data: SafetyEquipmentDto[];
        meta: { total: number; page: number; limit: number; totalPages: number };
    }> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'name',
            sortOrder = 'asc',
            isActive,
            search,
            category,
            safetyEquipmentTypeId,
            name,
            code,
        } = options || {};

        console.log('DEBUG options:', JSON.stringify(options));

        // Build where clause
        const where: Prisma.SafetyEquipmentWhereInput = {
            deletedAt: null, // Only get non-deleted records
        };

        // Handle name filter (exact match or contains)
        if (name) {
            where.name = { contains: name, mode: 'insensitive' };
        }

        // Handle code filter (exact match or contains)
        if (code) {
            where.code = { contains: code, mode: 'insensitive' };
        }

        // Handle search filter (OR logic for name, code, description)
        // Only apply search if name and code filters are not provided
        // Use startsWith for name and code to be more strict (only match at the beginning)
        // Use contains for description to allow searching within longer text
        if (search && !name && !code) {
            const searchLower = search.toLowerCase().trim();
            where.OR = [
                { name: { startsWith: searchLower, mode: 'insensitive' } },
                { code: { startsWith: searchLower, mode: 'insensitive' } },
                { description: { contains: searchLower, mode: 'insensitive' } },
            ];
        }

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        if (category) {
            where.category = category;
        }

        if (safetyEquipmentTypeId) {
            where.safetyEquipmentTypeId = safetyEquipmentTypeId;
        }

        // Build order by clause
        const orderBy: Prisma.SafetyEquipmentOrderByWithRelationInput = {};
        if (sortBy) {
            orderBy[sortBy] = sortOrder || 'asc';
        } else {
            orderBy.name = 'asc';
        }

        // Get total count
        const total = await this.prisma["safetyEquipment"].count({ where });

        // Get paginated data
        const safetyEquipments = await this.prisma["safetyEquipment"].findMany({
            where,
            orderBy,
            skip: (page - 1) * limit,
            take: limit,
            include: {
                safetyEquipmentType: true,
            },
        });

        // Calculate current stock for each equipment
        const equipmentsWithStock = await Promise.all(
            safetyEquipments.map(async (equipment: any) => {
                // Get total currentQuantity from stock items that use this equipment
                // Only count items from active and non-deleted stocks
                const stockItems = await this.prisma["pPEStockItem"].findMany({
                    where: {
                        safetyEquipmentId: equipment.id,
                        stock: {
                            deletedAt: null,
                            isActive: true,
                        },
                    },
                    select: {
                        currentQuantity: true,
                    },
                });

                const currentStock = stockItems.reduce(
                    (sum: number, item: any) => sum + (item.currentQuantity || 0),
                    0,
                );

                return {
                    ...equipment,
                    currentStock,
                };
            }),
        );

        return this.safetyEquipmentPaginatedMapper({
            data: equipmentsWithStock,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        });
    }

    async findOneSafetyEquipment(id: string): Promise<SafetyEquipmentDto> {
        const safetyEquipment = await this.prisma["safetyEquipment"].findFirst({
            where: {
                id,
                deletedAt: null, // Only get non-deleted records
            },
            include: {
                safetyEquipmentType: true,
            },
        });

        this.errorHandler.throwIfNotFoundById('Safety Equipment', id, safetyEquipment);

        // Calculate current stock
        // Only count items from active and non-deleted stocks
        const stockItems = await this.prisma["pPEStockItem"].findMany({
            where: {
                safetyEquipmentId: id,
                stock: {
                    deletedAt: null,
                    isActive: true,
                },
            },
            select: {
                currentQuantity: true,
            },
        });

        const currentStock = stockItems.reduce(
            (sum: number, item: any) => sum + (item.currentQuantity || 0),
            0,
        );

        return this.safetyEquipmentMapper({
            ...safetyEquipment,
            currentStock,
        });
    }

    async updateSafetyEquipment(
        id: string,
        updateSafetyEquipmentDto: UpdateSafetyEquipmentDto,
    ): Promise<SafetyEquipmentDto> {
        const existingEquipment = await this.prisma["safetyEquipment"].findFirst({
            where: {
                id,
                deletedAt: null, // Only update non-deleted records
            },
        });

        this.errorHandler.throwIfNotFoundById('Safety Equipment', id, existingEquipment);

        // Validate safetyEquipmentTypeId if provided
        if (updateSafetyEquipmentDto.safetyEquipmentTypeId) {
            const type = await this.prisma["safetyEquipmentType"].findFirst({
                where: {
                    id: updateSafetyEquipmentDto.safetyEquipmentTypeId,
                    deletedAt: null,
                },
            });

            this.errorHandler.throwIfNotFoundById(
                'Safety Equipment Type',
                updateSafetyEquipmentDto.safetyEquipmentTypeId,
                type,
            );
        }

        const safetyEquipment = await this.prisma["safetyEquipment"].update({
            where: { id },
            data: updateSafetyEquipmentDto,
            include: {
                safetyEquipmentType: true,
            },
        });

        return this.safetyEquipmentMapper(safetyEquipment);
    }

    async removeSafetyEquipment(id: string): Promise<void> {
        const existingEquipment = await this.prisma["safetyEquipment"].findFirst({
            where: {
                id,
                deletedAt: null, // Only delete non-deleted records
            },
        });

        this.errorHandler.throwIfNotFoundById('Safety Equipment', id, existingEquipment);

        // Check if equipment is used in stock items
        const stockItemsCount = await this.prisma["pPEStockItem"].count({
            where: {
                safetyEquipmentId: id,
            },
        });

        if (stockItemsCount > 0) {
            this.errorHandler.throwBadRequest(`Cannot delete Safety Equipment. It is used in ${stockItemsCount} stock item(s).`);
        }

        // Soft delete by setting deletedAt and isActive to false
        await this.prisma["safetyEquipment"].update({
            where: { id },
            data: {
                deletedAt: new Date(),
                isActive: false,
            },
        });
    }

    async findSafetyEquipmentByCode(code: string): Promise<SafetyEquipmentDto> {
        const safetyEquipment = await this.prisma["safetyEquipment"].findFirst({
            where: {
                code,
                deletedAt: null, // Only get non-deleted records
            },
            include: {
                safetyEquipmentType: true,
            },
        });

        this.errorHandler.throwIfNotFoundByField('Safety Equipment', 'code', code, safetyEquipment);

        return this.safetyEquipmentMapper(safetyEquipment);
    }
}

