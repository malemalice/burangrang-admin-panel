/**
 * PPE sample data seeder
 * Following TRD.md patterns for seed data
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const seedPPE = async () => {
    console.log('🌱 Seeding PPE sample data...');

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

        // Generate stock code
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const stockCode = `PPE-STK-${dateStr}-0001`;

        // Create sample stock entry
        const stock = await prisma.$transaction(async (tx) => {
            const stockEntry = await (tx as any).pPEStock.create({
                data: {
                    stockCode,
                    receivedDate: new Date(),
                    notes: 'Sample stock entry for testing',
                    createdBy: adminUser.id,
                    isActive: true,
                },
            });

            // Create sample stock items
            const items = [
                {
                    stockId: stockEntry.id,
                    equipmentName: 'Safety Helmet',
                    equipmentType: 'Full Brim',
                    equipmentSize: 'M',
                    expiryDate: new Date('2025-12-31'),
                    initialQuantity: 50,
                    currentQuantity: 50,
                    reservedQuantity: 0,
                    status: 'AVAILABLE',
                    order: 1,
                },
                {
                    stockId: stockEntry.id,
                    equipmentName: 'Safety Shoes',
                    equipmentType: 'Steel Toe',
                    equipmentSize: '42',
                    expiryDate: null,
                    initialQuantity: 30,
                    currentQuantity: 30,
                    reservedQuantity: 0,
                    status: 'AVAILABLE',
                    order: 2,
                },
                {
                    stockId: stockEntry.id,
                    equipmentName: 'Safety Vest',
                    equipmentType: 'High Visibility',
                    equipmentSize: 'L',
                    expiryDate: new Date('2025-06-30'),
                    initialQuantity: 40,
                    currentQuantity: 40,
                    reservedQuantity: 0,
                    status: 'AVAILABLE',
                    order: 3,
                },
                {
                    stockId: stockEntry.id,
                    equipmentName: 'Safety Gloves',
                    equipmentType: 'Anti-cutting',
                    equipmentSize: 'M',
                    expiryDate: null,
                    initialQuantity: 100,
                    currentQuantity: 95,
                    reservedQuantity: 5,
                    status: 'AVAILABLE',
                    order: 4,
                },
                {
                    stockId: stockEntry.id,
                    equipmentName: 'Safety Goggles',
                    equipmentType: 'Clear Lens',
                    equipmentSize: 'One Size',
                    expiryDate: null,
                    initialQuantity: 25,
                    currentQuantity: 25,
                    reservedQuantity: 0,
                    status: 'AVAILABLE',
                    order: 5,
                },
            ];

            await Promise.all(
                items.map((item) =>
                    (tx as any).pPEStockItem.create({
                        data: item,
                    }),
                ),
            );

            return stockEntry;
        });

        // Create sample withdrawal
        const withdrawalCode = `PPE-WD-${dateStr}-0001`;
        const withdrawal = await prisma.$transaction(async (tx) => {
            // Get stock items for withdrawal
            const stockItems = await (tx as any).pPEStockItem.findMany({
                where: {
                    stockId: stock.id,
                    status: 'AVAILABLE',
                },
                take: 2,
            });

            if (stockItems.length === 0) {
                console.log('⚠️  No available stock items for withdrawal');
                return null;
            }

            // Create withdrawal
            const withdrawalEntry = await (tx as any).pPEWithdrawal.create({
                data: {
                    withdrawalCode,
                    withdrawalDate: new Date(),
                    requestedBy: adminUser.id,
                    requestedFor: adminUser.id,
                    departmentId: department.id,
                    jobPositionId: jobPosition?.id || null,
                    status: 'PENDING',
                    notes: 'Sample withdrawal request for testing',
                    createdBy: adminUser.id,
                    isActive: true,
                },
            });

            // Create withdrawal items
            await Promise.all(
                stockItems.map(async (item: any, index: number) => {
                    const requestedQty = Math.min(5, item.currentQuantity - item.reservedQuantity);

                    // Reserve stock
                    await (tx as any).pPEStockItem.update({
                        where: { id: item.id },
                        data: {
                            reservedQuantity: {
                                increment: requestedQty,
                            },
                        },
                    });

                    // Create withdrawal item
                    return (tx as any).pPEWithdrawalItem.create({
                        data: {
                            withdrawalId: withdrawalEntry.id,
                            stockItemId: item.id,
                            requestedQuantity: requestedQty,
                            order: index + 1,
                        },
                    });
                }),
            );

            return withdrawalEntry;
        });

        console.log('✅ PPE sample data seeded successfully');
        console.log(`   - Created stock: ${stock.stockCode}`);
        console.log(`   - Created ${await (prisma as any).pPEStockItem.count({ where: { stockId: stock.id } })} stock items`);
        if (withdrawal) {
            console.log(`   - Created withdrawal: ${withdrawalCode}`);
        }
    } catch (error) {
        console.error('❌ Error seeding PPE data:', error);
        throw error;
    }
};

export default seedPPE;

