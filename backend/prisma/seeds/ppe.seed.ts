/**
 * PPE sample data seeder - Complete with all statuses
 * Following service logic flow for accurate status transitions
 */
import { seedPrisma as prisma } from './prisma-seed-client';

// Helper function to generate stock code
const generateStockCode = async (dateStr: string): Promise<string> => {
    const prefix = `PPE-STK-${dateStr}-`;
    const lastStock = await (prisma as any).pPEStock.findFirst({
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
};

// Helper function to generate withdrawal code
const generateWithdrawalCode = async (dateStr: string, tx?: any): Promise<string> => {
    const prefix = `PPE-WD-${dateStr}-`;
    const prismaClient = tx || prisma;

    const lastWithdrawal = await (prismaClient as any).pPEWithdrawal.findFirst({
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
};

// Helper: Create stock with items (following service logic)
const createStockWithItems = async (
    tx: any,
    stockCode: string,
    receivedDate: Date,
    items: Array<{
        equipmentName?: string;
        equipmentType?: string;
        equipmentSize?: string;
        expiryDate?: Date | null;
        initialQuantity: number;
        order: number;
        safetyEquipmentId?: string | null;
    }>,
    createdBy: string,
    isActive: boolean = true,
    notes?: string,
) => {
    const stockEntry = await tx.pPEStock.create({
        data: {
            stockCode,
            receivedDate,
            notes: notes || null,
            createdBy,
            isActive,
        },
    });

    const stockItems = await Promise.all(
        items.map((item, index) =>
            tx.pPEStockItem.create({
                data: {
                    stockId: stockEntry.id,
                    safetyEquipmentId: item.safetyEquipmentId || null,
                    equipmentName: item.equipmentName || null,
                    equipmentType: item.equipmentType || null,
                    equipmentSize: item.equipmentSize || null,
                    expiryDate: item.expiryDate || null,
                    initialQuantity: item.initialQuantity,
                    currentQuantity: item.initialQuantity,
                    reservedQuantity: 0,
                    status: 'AVAILABLE',
                    order: item.order || index + 1,
                },
            }),
        ),
    );

    return { stock: stockEntry, items: stockItems };
};

// Helper: Create withdrawal (following service logic)
const createWithdrawalForStock = async (
    tx: any,
    withdrawalCode: string,
    withdrawalDate: Date,
    stockItems: Array<{ id: string; currentQuantity: number; reservedQuantity: number; status?: string }>,
    requestedQuantities: number[],
    requestedBy: string,
    requestedFor: string | null,
    departmentId: string,
    jobPositionId: string | null,
    createdBy: string,
    notes?: string,
) => {
    // Validate stock items availability (following service logic)
    for (let i = 0; i < stockItems.length; i++) {
        const stockItem = stockItems[i];
        const requestedQty = requestedQuantities[i];

        // Fetch current stock item to get status
        const currentStockItem = await tx.pPEStockItem.findUnique({
            where: { id: stockItem.id },
        });

        if (!currentStockItem) {
            throw new Error(`Stock item ${stockItem.id} not found`);
        }

        if (currentStockItem.status !== 'AVAILABLE') {
            throw new Error(`Stock item ${stockItem.id} is not available. Current status: ${currentStockItem.status}`);
        }

        const availableQuantity = stockItem.currentQuantity - stockItem.reservedQuantity;
        if (requestedQty > availableQuantity) {
            throw new Error(`Insufficient stock for item ${stockItem.id}. Available: ${availableQuantity}, Requested: ${requestedQty}`);
        }
    }

    // Create withdrawal header (WAITING_APPROVAL to align with app create flow)
    const withdrawal = await tx.pPEWithdrawal.create({
        data: {
            withdrawalCode,
            withdrawalDate,
            requestedBy,
            requestedFor: requestedFor || null,
            departmentId,
            jobPositionId: jobPositionId || null,
            status: 'WAITING_APPROVAL',
            notes: notes || null,
            createdBy,
            isActive: true,
        },
    });

    // Create withdrawal items and reserve stock (following service logic)
    const withdrawalItems = await Promise.all(
        stockItems.map(async (stockItem, index) => {
            const requestedQty = requestedQuantities[index];

            // Get current stock item to check status
            const currentStockItem = await tx.pPEStockItem.findUnique({
                where: { id: stockItem.id },
            });

            if (!currentStockItem) {
                throw new Error(`Stock item ${stockItem.id} not found`);
            }

            // Calculate new reserved quantity
            const newReservedQuantity = currentStockItem.reservedQuantity + requestedQty;
            const availableQuantity = currentStockItem.currentQuantity - newReservedQuantity;

            // Determine new status (following service logic)
            let newStatus: any;
            if (availableQuantity <= 0) {
                // All stock is reserved
                newStatus = 'RESERVED';
            } else if (newReservedQuantity > 0 && currentStockItem.status === 'AVAILABLE') {
                // Some stock is reserved, but not all
                newStatus = 'AVAILABLE'; // Keep as AVAILABLE if still has available stock
            } else {
                newStatus = currentStockItem.status;
            }

            // Reserve stock
            await tx.pPEStockItem.update({
                where: { id: stockItem.id },
                data: {
                    reservedQuantity: {
                        increment: requestedQty,
                    },
                    status: newStatus,
                },
            });

            // Create withdrawal item
            return tx.pPEWithdrawalItem.create({
                data: {
                    withdrawalId: withdrawal.id,
                    stockItemId: stockItem.id,
                    requestedQuantity: requestedQty,
                    order: index + 1,
                },
            });
        }),
    );

    return { withdrawal, items: withdrawalItems };
};

// Helper: Approve withdrawal (following service logic)
const approveWithdrawal = async (
    tx: any,
    withdrawalId: string,
    approvedQuantities?: Record<string, number>,
) => {
    const withdrawal = await tx.pPEWithdrawal.findUnique({
        where: { id: withdrawalId },
        include: { items: true },
    });

    if (!withdrawal) {
        throw new Error(`Withdrawal ${withdrawalId} not found`);
    }

    if (withdrawal.status !== 'WAITING_APPROVAL') {
        throw new Error(`Withdrawal ${withdrawalId} cannot be approved. Current status: ${withdrawal.status}`);
    }

    // Update withdrawal items with approved quantities
    await Promise.all(
        withdrawal.items.map(async (item: any) => {
            let approvedQty = item.requestedQuantity;

            if (approvedQuantities && approvedQuantities[item.id] !== undefined) {
                approvedQty = approvedQuantities[item.id];

                // Validate approved quantity
                if (approvedQty > item.requestedQuantity) {
                    throw new Error(`Approved quantity (${approvedQty}) cannot exceed requested quantity (${item.requestedQuantity})`);
                }

                // Update reserved quantity if approved is less than requested
                if (approvedQty < item.requestedQuantity) {
                    const difference = item.requestedQuantity - approvedQty;

                    const stockItem = await tx.pPEStockItem.findUnique({
                        where: { id: item.stockItemId },
                    });

                    if (!stockItem) {
                        throw new Error(`Stock item ${item.stockItemId} not found`);
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

                    await tx.pPEStockItem.update({
                        where: { id: item.stockItemId },
                        data: {
                            reservedQuantity: newReservedQuantity,
                            status: newStatus,
                        },
                    });
                }
            }

            // Always update approvedQuantity
            await tx.pPEWithdrawalItem.update({
                where: { id: item.id },
                data: {
                    approvedQuantity: approvedQty,
                },
            });
        }),
    );

    // Update withdrawal status
    await tx.pPEWithdrawal.update({
        where: { id: withdrawalId },
        data: {
            status: 'APPROVED',
        },
    });
};

// Helper: Collect withdrawal (following service logic)
const collectWithdrawal = async (
    tx: any,
    withdrawalId: string,
    issuedQuantities?: Record<string, number>,
    collectedBy?: string,
) => {
    const withdrawal = await tx.pPEWithdrawal.findUnique({
        where: { id: withdrawalId },
        include: { items: true },
    });

    if (!withdrawal) {
        throw new Error(`Withdrawal ${withdrawalId} not found`);
    }

    if (withdrawal.status !== 'APPROVED') {
        throw new Error(`Withdrawal ${withdrawalId} cannot be collected. Current status: ${withdrawal.status}`);
    }

    // Process each withdrawal item
    await Promise.all(
        withdrawal.items.map(async (item: any) => {
            const issuedQty = issuedQuantities?.[item.id] || item.approvedQuantity || item.requestedQuantity;

            // Validate issued quantity
            if (issuedQty > (item.approvedQuantity || item.requestedQuantity)) {
                throw new Error(`Issued quantity (${issuedQty}) cannot exceed approved quantity (${item.approvedQuantity || item.requestedQuantity})`);
            }

            const stockItem = await tx.pPEStockItem.findUnique({
                where: { id: item.stockItemId },
            });

            if (!stockItem) {
                throw new Error(`Stock item ${item.stockItemId} not found`);
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

            await tx.pPEStockItem.update({
                where: { id: item.stockItemId },
                data: {
                    currentQuantity: newCurrentQuantity,
                    reservedQuantity: newReservedQuantity,
                    status: newStatus,
                },
            });

            // Update withdrawal item
            await tx.pPEWithdrawalItem.update({
                where: { id: item.id },
                data: {
                    issuedQuantity: issuedQty,
                },
            });
        }),
    );

    // Update withdrawal status
    await tx.pPEWithdrawal.update({
        where: { id: withdrawalId },
        data: {
            status: 'COLLECTED',
            collectedDate: new Date(),
            collectedBy: collectedBy || withdrawal.requestedBy,
        },
    });
};

// Helper: Cancel withdrawal (following service logic)
const cancelWithdrawal = async (tx: any, withdrawalId: string) => {
    const withdrawal = await tx.pPEWithdrawal.findUnique({
        where: { id: withdrawalId },
        include: { items: true },
    });

    if (!withdrawal) {
        throw new Error(`Withdrawal ${withdrawalId} not found`);
    }

    if (withdrawal.status === 'COLLECTED') {
        throw new Error(`Withdrawal ${withdrawalId} cannot be cancelled. It has already been collected.`);
    }

    // Release reserved stock
    await Promise.all(
        withdrawal.items.map(async (item: any) => {
            const reservedQty = item.approvedQuantity || item.requestedQuantity;

            const stockItem = await tx.pPEStockItem.findUnique({
                where: { id: item.stockItemId },
            });

            if (!stockItem) {
                throw new Error(`Stock item ${item.stockItemId} not found`);
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

            await tx.pPEStockItem.update({
                where: { id: item.stockItemId },
                data: {
                    reservedQuantity: newReservedQuantity,
                    status: newStatus,
                },
            });
        }),
    );

    // Update withdrawal status
    await tx.pPEWithdrawal.update({
        where: { id: withdrawalId },
        data: {
            status: 'CANCELLED',
        },
    });
};

export const seedPPE = async () => {
    console.log('🌱 Seeding PPE sample data with all statuses...');

    try {
        // Get admin user
        const adminUser = await prisma.user.findFirst({
            where: { email: 'admin@example.com' },
        });

        if (!adminUser) {
            console.log('⚠️  Admin user not found. Please run user seeds first.');
            return;
        }

        // Get first department
        const department = await prisma.department.findFirst({
            where: { isActive: true },
        });

        if (!department) {
            console.log('⚠️  No department found. Please run department seeds first.');
            return;
        }

        // Get first job position
        const jobPosition = await prisma.jobPosition.findFirst({
            where: { isActive: true },
        });

        // Get safety equipments for reference
        const safetyEquipments = await (prisma as any).safetyEquipment.findMany({
            where: { isActive: true },
            take: 10,
        });

        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

        // Track withdrawal sequence to avoid conflicts
        let withdrawalSequence = 0;
        const getNextWithdrawalCode = () => {
            withdrawalSequence++;
            return `PPE-WD-${dateStr}-${withdrawalSequence.toString().padStart(4, '0')}`;
        };

        // ========================================================================
        // STOCK ENTRY 1: AVAILABLE Items (Baseline)
        // ========================================================================
        console.log('📦 Creating Stock Entry 1: AVAILABLE items...');
        const stock1Code = await generateStockCode(dateStr);
        const stock1 = await prisma.$transaction(async (tx) => {
            const { stock, items } = await createStockWithItems(
                tx,
                stock1Code,
                new Date(),
                [
                    {
                        equipmentName: 'Safety Helmet',
                        equipmentType: 'Full Brim',
                        equipmentSize: 'M',
                        expiryDate: new Date('2025-12-31'),
                        initialQuantity: 50,
                        order: 1,
                        safetyEquipmentId: safetyEquipments[0]?.id || null,
                    },
                    {
                        equipmentName: 'Safety Shoes',
                        equipmentType: 'Steel Toe',
                        equipmentSize: '42',
                        expiryDate: null,
                        initialQuantity: 30,
                        order: 2,
                        safetyEquipmentId: safetyEquipments[1]?.id || null,
                    },
                    {
                        equipmentName: 'Safety Vest',
                        equipmentType: 'High Visibility',
                        equipmentSize: 'L',
                        expiryDate: new Date('2025-06-30'),
                        initialQuantity: 40,
                        order: 3,
                        safetyEquipmentId: safetyEquipments[2]?.id || null,
                    },
                    {
                        equipmentName: 'Safety Gloves',
                        equipmentType: 'Anti-cutting',
                        equipmentSize: 'M',
                        expiryDate: null,
                        initialQuantity: 100,
                        order: 4,
                        safetyEquipmentId: safetyEquipments[3]?.id || null,
                    },
                    {
                        equipmentName: 'Safety Goggles',
                        equipmentType: 'Clear Lens',
                        equipmentSize: 'One Size',
                        expiryDate: null,
                        initialQuantity: 25,
                        order: 5,
                        safetyEquipmentId: safetyEquipments[4]?.id || null,
                    },
                ],
                adminUser.id,
                true,
                'Stock Entry 1: AVAILABLE items baseline',
            );

            // Simulate some items with reservedQuantity > 0 (for testing withdrawals)
            await tx.pPEStockItem.update({
                where: { id: items[3].id },
                data: {
                    reservedQuantity: 5,
                    status: 'AVAILABLE', // Still AVAILABLE because currentQuantity > reservedQuantity
                },
            });

            return stock;
        });

        // ========================================================================
        // STOCK ENTRY 2: RESERVED Items
        // ========================================================================
        console.log('📦 Creating Stock Entry 2: RESERVED items...');
        const stock2Code = await generateStockCode(dateStr);
        const stock2 = await prisma.$transaction(async (tx) => {
            const { stock, items } = await createStockWithItems(
                tx,
                stock2Code,
                new Date(),
                [
                    {
                        equipmentName: 'Safety Helmet - Reserved',
                        equipmentType: 'Full Brim',
                        equipmentSize: 'L',
                        expiryDate: new Date('2025-12-31'),
                        initialQuantity: 20,
                        order: 1,
                    },
                    {
                        equipmentName: 'Safety Boots - Reserved',
                        equipmentType: 'Steel Toe',
                        equipmentSize: '43',
                        expiryDate: null,
                        initialQuantity: 15,
                        order: 2,
                    },
                ],
                adminUser.id,
                true,
                'Stock Entry 2: RESERVED items',
            );

            // Create withdrawal for all stock to make them RESERVED
            const withdrawalCode = getNextWithdrawalCode();
            const { withdrawal } = await createWithdrawalForStock(
                tx,
                withdrawalCode,
                new Date(),
                items,
                [20, 15], // Request all stock
                adminUser.id,
                adminUser.id,
                department.id,
                jobPosition?.id || null,
                adminUser.id,
                'Withdrawal to make stock RESERVED',
            );

            // Approve withdrawal (status will automatically become RESERVED if fully reserved)
            await approveWithdrawal(tx, withdrawal.id);

            return stock;
        });

        // ========================================================================
        // STOCK ENTRY 3: ISSUED Items
        // ========================================================================
        console.log('📦 Creating Stock Entry 3: ISSUED items...');
        const stock3Code = await generateStockCode(dateStr);
        const stock3 = await prisma.$transaction(async (tx) => {
            const { stock, items } = await createStockWithItems(
                tx,
                stock3Code,
                new Date(),
                [
                    {
                        equipmentName: 'Safety Helmet - Issued',
                        equipmentType: 'Full Brim',
                        equipmentSize: 'M',
                        expiryDate: new Date('2025-12-31'),
                        initialQuantity: 10,
                        order: 1,
                    },
                    {
                        equipmentName: 'Safety Shoes - Issued',
                        equipmentType: 'Steel Toe',
                        equipmentSize: '42',
                        expiryDate: null,
                        initialQuantity: 8,
                        order: 2,
                    },
                ],
                adminUser.id,
                true,
                'Stock Entry 3: ISSUED items',
            );

            // Create withdrawal for all stock
            const withdrawalCode = getNextWithdrawalCode();
            const { withdrawal } = await createWithdrawalForStock(
                tx,
                withdrawalCode,
                new Date(),
                items,
                [10, 8], // Request all stock
                adminUser.id,
                adminUser.id,
                department.id,
                jobPosition?.id || null,
                adminUser.id,
                'Withdrawal to make stock ISSUED',
            );

            // Approve withdrawal
            await approveWithdrawal(tx, withdrawal.id);

            // Collect withdrawal (status will automatically become ISSUED if currentQuantity = 0)
            await collectWithdrawal(tx, withdrawal.id, undefined, adminUser.id);

            return stock;
        });

        // ========================================================================
        // STOCK ENTRY 4: EXPIRED Items
        // ========================================================================
        console.log('📦 Creating Stock Entry 4: EXPIRED items...');
        const stock4Code = await generateStockCode(dateStr);
        const stock4 = await prisma.$transaction(async (tx) => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { stock, items } = await createStockWithItems(
                tx,
                stock4Code,
                new Date('2024-01-01'), // Old received date
                [
                    {
                        equipmentName: 'Safety Helmet - Expired Yesterday',
                        equipmentType: 'Full Brim',
                        equipmentSize: 'M',
                        expiryDate: yesterday,
                        initialQuantity: 20,
                        order: 1,
                    },
                    {
                        equipmentName: 'Safety Vest - Expired 7 Days Ago',
                        equipmentType: 'High Visibility',
                        equipmentSize: 'L',
                        expiryDate: sevenDaysAgo,
                        initialQuantity: 15,
                        order: 2,
                    },
                    {
                        equipmentName: 'Safety Gloves - Expired 30 Days Ago',
                        equipmentType: 'Anti-cutting',
                        equipmentSize: 'M',
                        expiryDate: thirtyDaysAgo,
                        initialQuantity: 30,
                        order: 3,
                    },
                ],
                adminUser.id,
                true,
                'Stock Entry 4: EXPIRED items',
            );

            // Set status to EXPIRED manually (or let checkAndUpdateExpiredItems handle it)
            await Promise.all(
                items.map((item) =>
                    tx.pPEStockItem.update({
                        where: { id: item.id },
                        data: {
                            status: 'EXPIRED',
                        },
                    }),
                ),
            );

            return stock;
        });

        // ========================================================================
        // STOCK ENTRY 5: DISPOSED Items
        // ========================================================================
        console.log('📦 Creating Stock Entry 5: DISPOSED items...');
        const stock5Code = await generateStockCode(dateStr);
        const stock5 = await prisma.$transaction(async (tx) => {
            const { stock, items } = await createStockWithItems(
                tx,
                stock5Code,
                new Date(),
                [
                    {
                        equipmentName: 'Safety Helmet - Disposed',
                        equipmentType: 'Full Brim',
                        equipmentSize: 'M',
                        expiryDate: new Date('2025-12-31'),
                        initialQuantity: 25,
                        order: 1,
                    },
                    {
                        equipmentName: 'Safety Shoes - Disposed',
                        equipmentType: 'Steel Toe',
                        equipmentSize: '42',
                        expiryDate: null,
                        initialQuantity: 20,
                        order: 2,
                    },
                ],
                adminUser.id,
                true,
                'Stock Entry 5: DISPOSED items',
            );

            // Update status to DISPOSED manually (no automatic flow for DISPOSED)
            await Promise.all(
                items.map((item) =>
                    tx.pPEStockItem.update({
                        where: { id: item.id },
                        data: {
                            status: 'DISPOSED',
                        },
                    }),
                ),
            );

            return stock;
        });

        // ========================================================================
        // STOCK ENTRY 6: Mixed Status (All statuses in one entry)
        // ========================================================================
        console.log('📦 Creating Stock Entry 6: Mixed status (all statuses)...');
        const stock6Code = await generateStockCode(dateStr);
        const stock6 = await prisma.$transaction(async (tx) => {
            const { stock, items } = await createStockWithItems(
                tx,
                stock6Code,
                new Date(),
                [
                    {
                        equipmentName: 'Item 1 - AVAILABLE',
                        equipmentType: 'Normal',
                        equipmentSize: 'M',
                        expiryDate: new Date('2025-12-31'),
                        initialQuantity: 50,
                        order: 1,
                    },
                    {
                        equipmentName: 'Item 2 - RESERVED',
                        equipmentType: 'Normal',
                        equipmentSize: 'L',
                        expiryDate: new Date('2025-12-31'),
                        initialQuantity: 30,
                        order: 2,
                    },
                    {
                        equipmentName: 'Item 3 - ISSUED',
                        equipmentType: 'Normal',
                        equipmentSize: 'XL',
                        expiryDate: null,
                        initialQuantity: 20,
                        order: 3,
                    },
                    {
                        equipmentName: 'Item 4 - EXPIRED',
                        equipmentType: 'Normal',
                        equipmentSize: 'M',
                        expiryDate: new Date('2024-01-01'), // Past date
                        initialQuantity: 40,
                        order: 4,
                    },
                    {
                        equipmentName: 'Item 5 - DISPOSED',
                        equipmentType: 'Normal',
                        equipmentSize: 'L',
                        expiryDate: new Date('2025-12-31'),
                        initialQuantity: 25,
                        order: 5,
                    },
                ],
                adminUser.id,
                true,
                'Stock Entry 6: Mixed status (all statuses)',
            );

            // Item 1: Keep as AVAILABLE (normal)
            // No changes needed

            // Item 2: Make RESERVED (fully reserved via withdrawal)
            const withdrawalCode2 = getNextWithdrawalCode();
            const { withdrawal: withdrawal2 } = await createWithdrawalForStock(
                tx,
                withdrawalCode2,
                new Date(),
                [items[1]],
                [30], // Request all stock
                adminUser.id,
                adminUser.id,
                department.id,
                jobPosition?.id || null,
                adminUser.id,
                'Withdrawal to make Item 2 RESERVED',
            );
            await approveWithdrawal(tx, withdrawal2.id);

            // Item 3: Make ISSUED (collected and exhausted)
            const withdrawalCode3 = getNextWithdrawalCode();
            const { withdrawal: withdrawal3 } = await createWithdrawalForStock(
                tx,
                withdrawalCode3,
                new Date(),
                [items[2]],
                [20], // Request all stock
                adminUser.id,
                adminUser.id,
                department.id,
                jobPosition?.id || null,
                adminUser.id,
                'Withdrawal to make Item 3 ISSUED',
            );
            await approveWithdrawal(tx, withdrawal3.id);
            await collectWithdrawal(tx, withdrawal3.id, undefined, adminUser.id);

            // Item 4: Make EXPIRED (expiryDate in past)
            await tx.pPEStockItem.update({
                where: { id: items[3].id },
                data: {
                    status: 'EXPIRED',
                },
            });

            // Item 5: Make DISPOSED (manual update)
            await tx.pPEStockItem.update({
                where: { id: items[4].id },
                data: {
                    status: 'DISPOSED',
                },
            });

            return stock;
        });

        // ========================================================================
        // WITHDRAWALS FROM STOCK ENTRY 1
        // ========================================================================

        // Get stock items from Stock Entry 1
        const stock1Items = await (prisma as any).pPEStockItem.findMany({
            where: { stockId: stock1.id },
            orderBy: { order: 'asc' },
        });

        // Withdrawal 1: WAITING_APPROVAL (no PENDING in seed; aligns with app create flow)
        console.log('📋 Creating Withdrawal 1: WAITING_APPROVAL...');
        const withdrawal1 = await prisma.$transaction(async (tx) => {
            const withdrawalCode = getNextWithdrawalCode();
            const { withdrawal } = await createWithdrawalForStock(
                tx,
                withdrawalCode,
                new Date(),
                [stock1Items[0]], // Use first item
                [5], // Request 5 items
                adminUser.id,
                adminUser.id,
                department.id,
                jobPosition?.id || null,
                adminUser.id,
                'Withdrawal 1: WAITING_APPROVAL status',
            );
            return withdrawal;
        });

        // Withdrawal 2: APPROVED
        console.log('📋 Creating Withdrawal 2: APPROVED...');
        const withdrawal2 = await prisma.$transaction(async (tx) => {
            const withdrawalCode = getNextWithdrawalCode();
            const { withdrawal } = await createWithdrawalForStock(
                tx,
                withdrawalCode,
                new Date(),
                [stock1Items[1]], // Use second item
                [10], // Request 10 items
                adminUser.id,
                adminUser.id,
                department.id,
                jobPosition?.id || null,
                adminUser.id,
                'Withdrawal 2: APPROVED status',
            );
            await approveWithdrawal(tx, withdrawal.id);
            return withdrawal;
        });

        // Withdrawal 3: COLLECTED
        console.log('📋 Creating Withdrawal 3: COLLECTED...');
        const withdrawal3 = await prisma.$transaction(async (tx) => {
            const withdrawalCode = getNextWithdrawalCode();
            const { withdrawal } = await createWithdrawalForStock(
                tx,
                withdrawalCode,
                new Date(),
                [stock1Items[2]], // Use third item
                [15], // Request 15 items
                adminUser.id,
                adminUser.id,
                department.id,
                jobPosition?.id || null,
                adminUser.id,
                'Withdrawal 3: COLLECTED status',
            );
            await approveWithdrawal(tx, withdrawal.id);
            await collectWithdrawal(tx, withdrawal.id, undefined, adminUser.id);
            return withdrawal;
        });

        // Withdrawal 4: CANCELLED
        console.log('📋 Creating Withdrawal 4: CANCELLED...');
        const withdrawal4 = await prisma.$transaction(async (tx) => {
            const withdrawalCode = getNextWithdrawalCode();
            const { withdrawal } = await createWithdrawalForStock(
                tx,
                withdrawalCode,
                new Date(),
                [stock1Items[3]], // Use fourth item (has reservedQuantity already)
                [8], // Request 8 items
                adminUser.id,
                adminUser.id,
                department.id,
                jobPosition?.id || null,
                adminUser.id,
                'Withdrawal 4: CANCELLED status',
            );
            await cancelWithdrawal(tx, withdrawal.id);
            return withdrawal;
        });

        // ========================================================================
        // EDGE CASES
        // ========================================================================
        console.log('🔍 Creating Edge Cases...');

        // Edge Case 1: Stock with various expired dates
        const stockEdge1Code = await generateStockCode(dateStr);
        const stockEdge1 = await prisma.$transaction(async (tx) => {
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { stock, items } = await createStockWithItems(
                tx,
                stockEdge1Code,
                new Date('2024-01-01'),
                [
                    {
                        equipmentName: 'Expired Yesterday',
                        equipmentType: 'Test',
                        equipmentSize: 'M',
                        expiryDate: yesterday,
                        initialQuantity: 10,
                        order: 1,
                    },
                    {
                        equipmentName: 'Expired 7 Days Ago',
                        equipmentType: 'Test',
                        equipmentSize: 'L',
                        expiryDate: sevenDaysAgo,
                        initialQuantity: 15,
                        order: 2,
                    },
                    {
                        equipmentName: 'Expired 30 Days Ago',
                        equipmentType: 'Test',
                        equipmentSize: 'XL',
                        expiryDate: thirtyDaysAgo,
                        initialQuantity: 20,
                        order: 3,
                    },
                ],
                adminUser.id,
                true,
                'Edge Case: Various expired dates',
            );

            // Set status to EXPIRED
            await Promise.all(
                items.map((item) =>
                    tx.pPEStockItem.update({
                        where: { id: item.id },
                        data: {
                            status: 'EXPIRED',
                        },
                    }),
                ),
            );

            return stock;
        });

        // Edge Case 2: Fully Reserved Stock
        const stockEdge2Code = await generateStockCode(dateStr);
        const stockEdge2 = await prisma.$transaction(async (tx) => {
            const { stock, items } = await createStockWithItems(
                tx,
                stockEdge2Code,
                new Date(),
                [
                    {
                        equipmentName: 'Fully Reserved Item',
                        equipmentType: 'Test',
                        equipmentSize: 'M',
                        expiryDate: new Date('2025-12-31'),
                        initialQuantity: 25,
                        order: 1,
                    },
                ],
                adminUser.id,
                true,
                'Edge Case: Fully Reserved',
            );

            // Create withdrawal for all stock
            const withdrawalCode = getNextWithdrawalCode();
            const { withdrawal } = await createWithdrawalForStock(
                tx,
                withdrawalCode,
                new Date(),
                items,
                [25], // Request all stock
                adminUser.id,
                adminUser.id,
                department.id,
                jobPosition?.id || null,
                adminUser.id,
                'Edge Case: Fully Reserved',
            );

            // Approve withdrawal (status will automatically become RESERVED)
            await approveWithdrawal(tx, withdrawal.id);

            return stock;
        });

        // Edge Case 3: Fully Issued Stock
        const stockEdge3Code = await generateStockCode(dateStr);
        const stockEdge3 = await prisma.$transaction(async (tx) => {
            const { stock, items } = await createStockWithItems(
                tx,
                stockEdge3Code,
                new Date(),
                [
                    {
                        equipmentName: 'Fully Issued Item',
                        equipmentType: 'Test',
                        equipmentSize: 'M',
                        expiryDate: new Date('2025-12-31'),
                        initialQuantity: 20,
                        order: 1,
                    },
                ],
                adminUser.id,
                true,
                'Edge Case: Fully Issued',
            );

            // Create withdrawal for all stock
            const withdrawalCode = getNextWithdrawalCode();
            const { withdrawal } = await createWithdrawalForStock(
                tx,
                withdrawalCode,
                new Date(),
                items,
                [20], // Request all stock
                adminUser.id,
                adminUser.id,
                department.id,
                jobPosition?.id || null,
                adminUser.id,
                'Edge Case: Fully Issued',
            );

            // Approve and collect withdrawal (status will automatically become ISSUED)
            await approveWithdrawal(tx, withdrawal.id);
            await collectWithdrawal(tx, withdrawal.id, undefined, adminUser.id);

            return stock;
        });

        // Edge Case 4: Partial Reserved Stock
        const stockEdge4Code = await generateStockCode(dateStr);
        const stockEdge4 = await prisma.$transaction(async (tx) => {
            const { stock, items } = await createStockWithItems(
                tx,
                stockEdge4Code,
                new Date(),
                [
                    {
                        equipmentName: 'Partial Reserved Item',
                        equipmentType: 'Test',
                        equipmentSize: 'M',
                        expiryDate: new Date('2025-12-31'),
                        initialQuantity: 50,
                        order: 1,
                    },
                ],
                adminUser.id,
                true,
                'Edge Case: Partial Reserved',
            );

            // Create withdrawal for partial stock (status will remain AVAILABLE)
            const withdrawalCode = getNextWithdrawalCode();
            await createWithdrawalForStock(
                tx,
                withdrawalCode,
                new Date(),
                items,
                [20], // Request only 20 out of 50
                adminUser.id,
                adminUser.id,
                department.id,
                jobPosition?.id || null,
                adminUser.id,
                'Edge Case: Partial Reserved',
            );

            return stock;
        });

        // Edge Case 5: Withdrawal with Approved Quantity < Requested Quantity
        const stockEdge5Code = await generateStockCode(dateStr);
        const stockEdge5 = await prisma.$transaction(async (tx) => {
            const { stock, items } = await createStockWithItems(
                tx,
                stockEdge5Code,
                new Date(),
                [
                    {
                        equipmentName: 'Partial Approval Item',
                        equipmentType: 'Test',
                        equipmentSize: 'M',
                        expiryDate: new Date('2025-12-31'),
                        initialQuantity: 30,
                        order: 1,
                    },
                ],
                adminUser.id,
                true,
                'Edge Case: Partial Approval',
            );

            // Create withdrawal
            const withdrawalCode = getNextWithdrawalCode();
            const { withdrawal } = await createWithdrawalForStock(
                tx,
                withdrawalCode,
                new Date(),
                items,
                [30], // Request 30
                adminUser.id,
                adminUser.id,
                department.id,
                jobPosition?.id || null,
                adminUser.id,
                'Edge Case: Partial Approval',
            );

            // Approve with less quantity (approvedQuantity < requestedQuantity)
            const withdrawalItem = await tx.pPEWithdrawalItem.findFirst({
                where: { withdrawalId: withdrawal.id },
            });

            if (!withdrawalItem) {
                throw new Error(`Withdrawal item not found for withdrawal ${withdrawal.id}`);
            }

            await approveWithdrawal(tx, withdrawal.id, {
                [withdrawalItem.id]: 20, // Approve only 20 out of 30 requested
            });

            return stock;
        });

        // ========================================================================
        // ADMIN OVERVIEW DASHBOARD: Low stock + expiring within 30 days
        // ========================================================================
        const in15Days = new Date(today);
        in15Days.setDate(in15Days.getDate() + 15);
        const in20Days = new Date(today);
        in20Days.setDate(in20Days.getDate() + 20);
        const in30Days = new Date(today);
        in30Days.setDate(in30Days.getDate() + 30);
        const existingLowStockOrExpiring = await prisma.pPEStockItem.count({
            where: {
                stock: { isActive: true, deletedAt: null },
                OR: [
                    { currentQuantity: { gt: 0, lte: 5 } },
                    {
                        expiryDate: { gte: today, lte: in30Days },
                        status: { in: ['AVAILABLE', 'RESERVED', 'ISSUED'] },
                    },
                ],
            },
        });
        if (existingLowStockOrExpiring < 3) {
            console.log('📦 Creating Stock Entry – Admin Overview (low stock & expiring soon)...');
            const adminOverviewStockCode = await generateStockCode(dateStr);
            await prisma.$transaction(async (tx) => {
                await createStockWithItems(
                    tx,
                    adminOverviewStockCode,
                    new Date(),
                    [
                        {
                            equipmentName: 'Safety Helmet - Low Stock',
                            equipmentType: 'Full Brim',
                            equipmentSize: 'M',
                            expiryDate: in15Days,
                            initialQuantity: 2,
                            order: 1,
                            safetyEquipmentId: safetyEquipments[0]?.id || null,
                        },
                        {
                            equipmentName: 'Safety Goggles - Expiring Soon',
                            equipmentType: 'Clear Lens',
                            equipmentSize: 'One Size',
                            expiryDate: in20Days,
                            initialQuantity: 3,
                            order: 2,
                            safetyEquipmentId: safetyEquipments[4]?.id || null,
                        },
                    ],
                    adminUser.id,
                    true,
                    'Admin Overview: low stock and expiring within 30 days',
                );
            });
            console.log(`✅ Created stock ${adminOverviewStockCode} for Admin Overview dashboard`);
        }

        // Summary
        console.log('✅ PPE sample data seeded successfully!');
        console.log('\n📊 Summary:');
        console.log(`   - Stock Entry 1 (AVAILABLE): ${stock1Code}`);
        console.log(`   - Stock Entry 2 (RESERVED): ${stock2Code}`);
        console.log(`   - Stock Entry 3 (ISSUED): ${stock3Code}`);
        console.log(`   - Stock Entry 4 (EXPIRED): ${stock4Code}`);
        console.log(`   - Stock Entry 5 (DISPOSED): ${stock5Code}`);
        console.log(`   - Stock Entry 6 (Mixed Status): ${stock6Code}`);
        console.log(`   - Withdrawal 1 (WAITING_APPROVAL): ${withdrawal1.withdrawalCode}`);
        console.log(`   - Withdrawal 2 (APPROVED): ${withdrawal2.withdrawalCode}`);
        console.log(`   - Withdrawal 3 (COLLECTED): ${withdrawal3.withdrawalCode}`);
        console.log(`   - Withdrawal 4 (CANCELLED): ${withdrawal4.withdrawalCode}`);
        console.log(`   - Edge Case 1 (Various Expired): ${stockEdge1Code}`);
        console.log(`   - Edge Case 2 (Fully Reserved): ${stockEdge2Code}`);
        console.log(`   - Edge Case 3 (Fully Issued): ${stockEdge3Code}`);
        console.log(`   - Edge Case 4 (Partial Reserved): ${stockEdge4Code}`);
        console.log(`   - Edge Case 5 (Partial Approval): ${stockEdge5Code}`);
    } catch (error) {
        console.error('❌ Error seeding PPE data:', error);
        throw error;
    }
};

export default seedPPE;
