import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, InventoryTransactionType, PointTransactionType } from '@prisma/client';
import { CreateTransactionDto, QueryTransactionsDto } from './dto';

// Points configuration: 25 บาท = 1 แต้ม
const BAHT_PER_POINT = 25;

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTransactionDto) {
    // Validate products and calculate totals
    const productIds = dto.items.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException(
        'One or more products not found or inactive',
      );
    }

    // Check stock availability
    for (const item of dto.items) {
      const product = products.find((p) => p.id === item.productId);
      if (product && product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product '${product.name}'. Available: ${product.stock}`,
        );
      }
    }

    // Calculate subtotal
    const subtotal = dto.items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    const discount = dto.discount ?? 0;
    const total = subtotal - discount;

    if (dto.payment.amount < total) {
      throw new BadRequestException(
        `Payment amount (${dto.payment.amount}) is less than total (${total})`,
      );
    }

    // Generate transaction ID
    const transactionId = `TXN-${Date.now()}`;

    // Validate member if provided
    let member: { id: number; totalPoints: number; totalSpent: number; isActive: boolean } | null = null;
    if (dto.memberId) {
      const foundMember = await this.prisma.member.findUnique({
        where: { id: dto.memberId },
      });
      if (!foundMember) {
        throw new BadRequestException(`Member with ID ${dto.memberId} not found`);
      }
      if (!foundMember.isActive) {
        throw new BadRequestException('Member is inactive');
      }
      member = foundMember;
    }

    // Calculate points earned (total / 25 บาท = 1 แต้ม)
    const pointsEarned = member ? Math.floor(total / BAHT_PER_POINT) : 0;

    // Create transaction with items and payment in a single transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          transactionId,
          subtotal,
          discount,
          total,
          notes: dto.notes,
          memberId: dto.memberId,
          pointsEarned,
          items: {
            create: dto.items.map((item) => {
              const product = products.find((p) => p.id === item.productId)!;
              return {
                productId: item.productId,
                productName: product.name,
                productBarcode: product.barcode,
                quantity: item.quantity,
                unitPrice: product.price,
                totalPrice: product.price * item.quantity,
              };
            }),
          },
          payment: {
            create: {
              method: dto.payment.method.toUpperCase() as any,
              amount: dto.payment.amount,
              change: dto.payment.amount - total,
            },
          },
        },
        include: {
          items: true,
          payment: true,
        },
      });

      // Deduct stock and create inventory transactions
      for (const item of dto.items) {
        const product = products.find((p) => p.id === item.productId)!;
        const previousStock = product.stock;
        const currentStock = previousStock - item.quantity;

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });

        // Create inventory transaction for SALE
        await tx.inventoryTransaction.create({
          data: {
            productId: item.productId,
            type: InventoryTransactionType.SALE,
            quantity: -item.quantity,
            previousStock,
            currentStock,
            reference: transactionId,
            reason: 'POS Sale',
          },
        });
      }

      // Handle member points accumulation
      if (member && pointsEarned > 0) {
        const balanceBefore = member.totalPoints;
        const balanceAfter = balanceBefore + pointsEarned;

        // Create point transaction
        await tx.pointTransaction.create({
          data: {
            memberId: member.id,
            transactionId: transaction.id,
            type: PointTransactionType.EARN,
            points: pointsEarned,
            balanceBefore,
            balanceAfter,
            description: `สะสมแต้มจากการซื้อ ${transactionId}`,
          },
        });

        // Update member's total points and total spent
        await tx.member.update({
          where: { id: member.id },
          data: {
            totalPoints: balanceAfter,
            totalSpent: { increment: total },
          },
        });
      }

      return transaction;
    });

    return result;
  }

  async findAll(query: QueryTransactionsDto) {
    const {
      startDate,
      endDate,
      paymentMethod,
      status,
      page = 1,
      limit = 20,
    } = query;

    const where: Prisma.TransactionWhereInput = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    if (status) {
      where.status = status as any;
    }

    if (paymentMethod) {
      where.payment = { method: paymentMethod.toUpperCase() as any };
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, image: true },
              },
            },
          },
          payment: true,
          member: {
            select: { id: true, phone: true, firstName: true, lastName: true, totalPoints: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, barcode: true } },
          },
        },
        payment: true,
        member: {
          select: { id: true, phone: true, firstName: true, lastName: true, totalPoints: true },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return transaction;
  }

  async void(id: number) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { id: true, stock: true } },
          },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    if (transaction.status !== 'COMPLETED') {
      throw new BadRequestException(
        `Transaction is already ${transaction.status}`,
      );
    }

    // Void and restore stock
    return this.prisma.$transaction(async (tx) => {
      const voided = await tx.transaction.update({
        where: { id },
        data: { status: 'VOIDED' },
        include: { items: true, payment: true },
      });

      // Restore stock and create inventory transactions
      for (const item of transaction.items) {
        const previousStock = item.product.stock;
        const currentStock = previousStock + item.quantity;

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });

        // Create inventory transaction for VOID (same as REFUND type)
        await tx.inventoryTransaction.create({
          data: {
            productId: item.productId,
            type: InventoryTransactionType.REFUND,
            quantity: item.quantity,
            previousStock,
            currentStock,
            reference: transaction.transactionId,
            reason: 'Transaction Voided',
          },
        });
      }

      return voided;
    });
  }

  async refund(id: number, reason?: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { id: true, stock: true } },
          },
        },
        payment: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    if (transaction.status !== 'COMPLETED') {
      throw new BadRequestException(
        `Cannot refund transaction with status ${transaction.status}`,
      );
    }

    // Refund and restore stock
    return this.prisma.$transaction(async (tx) => {
      const refunded = await tx.transaction.update({
        where: { id },
        data: {
          status: 'REFUNDED',
          notes: reason
            ? `${transaction.notes || ''} [REFUND: ${reason}]`.trim()
            : transaction.notes,
        },
        include: {
          items: {
            include: {
              product: {
                select: { id: true, name: true, image: true },
              },
            },
          },
          payment: true,
        },
      });

      // Restore stock and create inventory transactions
      for (const item of transaction.items) {
        const previousStock = item.product.stock;
        const currentStock = previousStock + item.quantity;

        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });

        // Create inventory transaction for REFUND
        await tx.inventoryTransaction.create({
          data: {
            productId: item.productId,
            type: InventoryTransactionType.REFUND,
            quantity: item.quantity,
            previousStock,
            currentStock,
            reference: transaction.transactionId,
            reason: reason || 'Customer Refund',
          },
        });
      }

      return refunded;
    });
  }
}
