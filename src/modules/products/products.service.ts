import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateProductDto,
  UpdateProductDto,
  QueryProductsDto,
  UpdateStockDto,
} from './dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryProductsDto) {
    const {
      categoryId,
      category,
      search,
      lowStock,
      page = 1,
      limit = 50,
    } = query;

    const where: Prisma.ProductWhereInput = { isActive: true };

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (category) {
      where.category = { slug: category };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search } },
      ];
    }

    if (lowStock === 'true') {
      where.stock = { lte: where.stock as any };
      // Use raw filtering for low stock
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              slug: true,
              name: true,
              icon: true,
              color: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { id: 'asc' },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    return product;
  }

  async findByBarcode(barcode: string) {
    const product = await this.prisma.product.findUnique({
      where: { barcode },
      include: {
        category: {
          select: {
            id: true,
            slug: true,
            name: true,
            icon: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(
        `Product with barcode '${barcode}' not found`,
      );
    }

    return product;
  }

  async getStats() {
    const [totalProducts, lowStockCount, outOfStockCount, allProducts] =
      await Promise.all([
        this.prisma.product.count({ where: { isActive: true } }),
        this.prisma.product.count({
          where: {
            isActive: true,
            stock: { gt: 0, lte: 10 },
          },
        }),
        this.prisma.product.count({
          where: { isActive: true, stock: { lte: 0 } },
        }),
        this.prisma.product.findMany({
          where: { isActive: true },
          select: { stock: true, price: true },
        }),
      ]);

    const totalValue = allProducts.reduce(
      (sum, p) => sum + p.stock * p.price,
      0,
    );

    return {
      totalProducts,
      lowStockCount,
      outOfStockCount,
      totalValue,
    };
  }

  async getLowStockItems() {
    return this.prisma.product.findMany({
      where: {
        isActive: true,
        stock: { lte: 10, gt: 0 },
      },
      include: {
        category: {
          select: { id: true, slug: true, name: true },
        },
      },
      orderBy: { stock: 'asc' },
    });
  }

  async create(dto: CreateProductDto) {
    // Check barcode uniqueness
    const existing = await this.prisma.product.findUnique({
      where: { barcode: dto.barcode },
    });

    if (existing) {
      throw new ConflictException(
        `Product with barcode '${dto.barcode}' already exists`,
      );
    }

    // Verify category exists
    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException(
        `Category with ID ${dto.categoryId} not found`,
      );
    }

    return this.prisma.product.create({
      data: dto,
      include: { category: true },
    });
  }

  async update(id: number, dto: UpdateProductDto) {
    await this.findOne(id);

    // Check barcode uniqueness for other products
    if (dto.barcode) {
      const existing = await this.prisma.product.findFirst({
        where: {
          barcode: dto.barcode,
          id: { not: id },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Product with barcode '${dto.barcode}' already exists`,
        );
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
  }

  async updateStock(id: number, dto: UpdateStockDto) {
    await this.findOne(id);

    return this.prisma.product.update({
      where: { id },
      data: { stock: dto.quantity },
    });
  }

  async remove(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { _count: { select: { transactionItems: true } } },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Soft delete if transaction items exist
    if (product._count.transactionItems > 0) {
      return this.prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return this.prisma.product.delete({ where: { id } });
  }
}
