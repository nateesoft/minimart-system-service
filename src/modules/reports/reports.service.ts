import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDailySales(startDate?: string, endDate?: string) {
    const where: any = {};

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    return this.prisma.dailySales.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  }

  async getSummary(startDate?: string, endDate?: string) {
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const completedWhere = { ...where, status: 'COMPLETED' as const };

    const [totalTransactions, totalRevenue, totalItems] = await Promise.all([
      this.prisma.transaction.count({ where: completedWhere }),
      this.prisma.transaction.aggregate({
        where: completedWhere,
        _sum: { total: true },
      }),
      this.prisma.transactionItem.aggregate({
        where: { transaction: completedWhere },
        _sum: { quantity: true },
      }),
    ]);

    return {
      totalTransactions,
      totalRevenue: totalRevenue._sum.total ?? 0,
      totalItems: totalItems._sum.quantity ?? 0,
    };
  }

  async getTopProducts(limit = 10, startDate?: string, endDate?: string) {
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    where.transaction = { status: 'COMPLETED' };

    const items = await this.prisma.transactionItem.groupBy({
      by: ['productId', 'productName'],
      where,
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: limit,
    });

    return items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      totalQuantity: item._sum.quantity ?? 0,
      totalRevenue: item._sum.totalPrice ?? 0,
    }));
  }
}
