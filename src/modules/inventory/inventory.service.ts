import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryTransactionType } from '@prisma/client';
import {
  CreateReceivingDto,
  CreateIssuingDto,
  CreateStockCountDto,
  QueryInventoryTransactionsDto,
  QueryStockCountsDto,
} from './dto';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // RECEIVING - รับสินค้าเข้า (Bulk)
  // ============================================
  async createReceiving(dto: CreateReceivingDto, createdBy?: string) {
    // Validate all products exist
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('One or more products not found or inactive');
    }

    // Create a map for quick lookup
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Execute in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const transactions: any[] = [];

      for (const item of dto.items) {
        const product = productMap.get(item.productId)!;
        const previousStock = product.stock;
        const currentStock = previousStock + item.quantity;

        // Update product stock
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });

        // Create inventory transaction
        const invTx = await tx.inventoryTransaction.create({
          data: {
            productId: item.productId,
            type: InventoryTransactionType.RECEIVING,
            quantity: item.quantity,
            previousStock,
            currentStock,
            reference: dto.reference,
            notes: dto.notes,
            createdBy,
          },
          include: {
            product: {
              select: { id: true, name: true, barcode: true, image: true },
            },
          },
        });

        transactions.push(invTx);

        // Update the map for subsequent items of the same product
        productMap.set(item.productId, { ...product, stock: currentStock });
      }

      return transactions;
    });

    return {
      message: `Received ${dto.items.length} item(s) successfully`,
      transactions: result,
    };
  }

  // ============================================
  // ISSUING - จ่ายสินค้าออก
  // ============================================
  async createIssuing(dto: CreateIssuingDto, createdBy?: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, isActive: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${dto.productId} not found`);
    }

    if (product.stock < dto.quantity) {
      throw new BadRequestException(
        `Insufficient stock. Available: ${product.stock}, Requested: ${dto.quantity}`,
      );
    }

    const previousStock = product.stock;
    const currentStock = previousStock - dto.quantity;

    const result = await this.prisma.$transaction(async (tx) => {
      // Update product stock
      await tx.product.update({
        where: { id: dto.productId },
        data: { stock: { decrement: dto.quantity } },
      });

      // Create inventory transaction
      return tx.inventoryTransaction.create({
        data: {
          productId: dto.productId,
          type: InventoryTransactionType.ISSUING,
          quantity: -dto.quantity, // Negative for issuing
          previousStock,
          currentStock,
          reason: dto.reason,
          reference: dto.reference,
          notes: dto.notes,
          createdBy,
        },
        include: {
          product: {
            select: { id: true, name: true, barcode: true, image: true },
          },
        },
      });
    });

    return result;
  }

  // ============================================
  // INVENTORY TRANSACTIONS - ประวัติการเคลื่อนไหว
  // ============================================
  async findAllTransactions(query: QueryInventoryTransactionsDto) {
    const { productId, type, startDate, endDate, page = 1, limit = 20 } = query;

    const where: any = {};

    if (productId) {
      where.productId = productId;
    }

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z');
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.inventoryTransaction.findMany({
        where,
        include: {
          product: {
            select: { id: true, name: true, barcode: true, image: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.inventoryTransaction.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findProductTransactions(productId: number) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found`);
    }

    return this.prisma.inventoryTransaction.findMany({
      where: { productId },
      include: {
        product: {
          select: { id: true, name: true, barcode: true, image: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  // ============================================
  // STOCK OVERVIEW - ภาพรวมสต็อก
  // ============================================
  async getStockOverview() {
    const [totalProducts, lowStockCount, outOfStockCount, allProducts] =
      await Promise.all([
        this.prisma.product.count({ where: { isActive: true } }),
        this.prisma.product.count({
          where: {
            isActive: true,
            stock: { gt: 0, lte: this.prisma.product.fields.minStock },
          },
        }),
        this.prisma.product.count({
          where: { isActive: true, stock: { lte: 0 } },
        }),
        this.prisma.product.findMany({
          where: { isActive: true },
          select: { stock: true, price: true, costPrice: true },
        }),
      ]);

    // Calculate using raw query for proper comparison
    const lowStock = await this.prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM minimart."Product"
      WHERE "isActive" = true AND stock > 0 AND stock <= "minStock"
    `;

    const totalValue = allProducts.reduce(
      (sum, p) => sum + p.stock * p.price,
      0,
    );
    const totalCostValue = allProducts.reduce(
      (sum, p) => sum + p.stock * (p.costPrice || p.price),
      0,
    );

    return {
      totalProducts,
      lowStockCount: Number(lowStock[0]?.count || 0),
      outOfStockCount,
      totalValue,
      totalCostValue,
    };
  }

  async getLowStockProducts() {
    return this.prisma.$queryRaw`
      SELECT p.id, p.name, p.barcode, p.image, p.stock, p."minStock", p.unit,
             c.name as "categoryName"
      FROM minimart."Product" p
      LEFT JOIN minimart."Category" c ON p."categoryId" = c.id
      WHERE p."isActive" = true AND p.stock > 0 AND p.stock <= p."minStock"
      ORDER BY p.stock ASC
    `;
  }

  // ============================================
  // STOCK COUNT - นับสต็อก
  // ============================================
  async createStockCount(dto: CreateStockCountDto, countedBy?: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: dto.productId, isActive: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${dto.productId} not found`);
    }

    const variance = dto.countedQuantity - product.stock;

    return this.prisma.stockCount.create({
      data: {
        productId: dto.productId,
        systemQuantity: product.stock,
        countedQuantity: dto.countedQuantity,
        variance,
        notes: dto.notes,
        countedBy,
      },
      include: {
        product: {
          select: { id: true, name: true, barcode: true, image: true },
        },
      },
    });
  }

  async findAllStockCounts(query: QueryStockCountsDto) {
    const { productId, isAdjusted, page = 1, limit = 20 } = query;

    const where: any = {};

    if (productId) {
      where.productId = productId;
    }

    if (isAdjusted !== undefined) {
      where.isAdjusted = isAdjusted;
    }

    const [data, total] = await Promise.all([
      this.prisma.stockCount.findMany({
        where,
        include: {
          product: {
            select: { id: true, name: true, barcode: true, image: true, stock: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.stockCount.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async adjustStockFromCount(id: number, adjustedBy?: string) {
    const stockCount = await this.prisma.stockCount.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!stockCount) {
      throw new NotFoundException(`Stock count with ID ${id} not found`);
    }

    if (stockCount.isAdjusted) {
      throw new BadRequestException('This stock count has already been adjusted');
    }

    const previousStock = stockCount.product.stock;
    const currentStock = stockCount.countedQuantity;
    const adjustmentQty = currentStock - previousStock;

    const result = await this.prisma.$transaction(async (tx) => {
      // Update product stock to counted quantity
      await tx.product.update({
        where: { id: stockCount.productId },
        data: { stock: stockCount.countedQuantity },
      });

      // Create inventory transaction for adjustment
      await tx.inventoryTransaction.create({
        data: {
          productId: stockCount.productId,
          type: InventoryTransactionType.ADJUSTMENT,
          quantity: adjustmentQty,
          previousStock,
          currentStock,
          reference: `SC-${id}`,
          reason: 'Stock count adjustment',
          notes: stockCount.notes,
          createdBy: adjustedBy,
        },
      });

      // Mark stock count as adjusted
      return tx.stockCount.update({
        where: { id },
        data: {
          isAdjusted: true,
          adjustedAt: new Date(),
        },
        include: {
          product: {
            select: { id: true, name: true, barcode: true, image: true, stock: true },
          },
        },
      });
    });

    return result;
  }
}
