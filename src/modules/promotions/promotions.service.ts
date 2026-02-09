import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Promotion, PromotionType } from '@prisma/client';
import {
  CreatePromotionDto,
  UpdatePromotionDto,
  QueryPromotionsDto,
  CartItemDto,
  AppliedPromotion,
  CalculationResult,
} from './dto';

type PromotionWithProducts = Promotion & {
  products: {
    id: number;
    productId: number;
    role: string;
    product: { id: number; name: string; price: number };
  }[];
};

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: QueryPromotionsDto) {
    const { type, isActive, page = 1, limit = 50 } = query;

    const where: Prisma.PromotionWhereInput = {};

    if (type) {
      where.type = type as PromotionType;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [promotions, total] = await Promise.all([
      this.prisma.promotion.findMany({
        where,
        include: {
          products: {
            include: {
              product: {
                select: { id: true, name: true, price: true, image: true },
              },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.promotion.count({ where }),
    ]);

    return {
      data: promotions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
      include: {
        products: {
          include: {
            product: {
              select: { id: true, name: true, price: true, image: true },
            },
          },
        },
      },
    });

    if (!promotion) {
      throw new NotFoundException(`Promotion with ID ${id} not found`);
    }

    return promotion;
  }

  async findActive() {
    const now = new Date();

    return this.prisma.promotion.findMany({
      where: {
        isActive: true,
        OR: [
          { startDate: null, endDate: null },
          { startDate: { lte: now }, endDate: null },
          { startDate: null, endDate: { gte: now } },
          { startDate: { lte: now }, endDate: { gte: now } },
        ],
      },
      include: {
        products: {
          include: {
            product: {
              select: { id: true, name: true, price: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreatePromotionDto) {
    // Validate products exist
    const allProductIds = [
      ...dto.triggerProductIds,
      ...(dto.freeProductIds || []),
    ];

    const products = await this.prisma.product.findMany({
      where: { id: { in: allProductIds } },
    });

    if (products.length !== allProductIds.length) {
      throw new BadRequestException('One or more product IDs are invalid');
    }

    // Create promotion with products
    return this.prisma.promotion.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type as PromotionType,
        isActive: dto.isActive ?? true,
        startDate: dto.startDate ? new Date(dto.startDate) : null,
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        buyQuantity: dto.buyQuantity,
        freeQuantity: dto.freeQuantity,
        discountPercent: dto.discountPercent,
        discountAmount: dto.discountAmount,
        products: {
          create: [
            ...dto.triggerProductIds.map((productId) => ({
              productId,
              role: 'trigger',
            })),
            ...(dto.freeProductIds || []).map((productId) => ({
              productId,
              role: 'free',
            })),
          ],
        },
      },
      include: {
        products: {
          include: {
            product: {
              select: { id: true, name: true, price: true, image: true },
            },
          },
        },
      },
    });
  }

  async update(id: number, dto: UpdatePromotionDto) {
    await this.findOne(id);

    // Delete existing product relations if updating products
    if (dto.triggerProductIds || dto.freeProductIds) {
      await this.prisma.promotionProduct.deleteMany({
        where: { promotionId: id },
      });
    }

    const updateData: Prisma.PromotionUpdateInput = {
      ...(dto.name && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.type && { type: dto.type as PromotionType }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.startDate !== undefined && {
        startDate: dto.startDate ? new Date(dto.startDate) : null,
      }),
      ...(dto.endDate !== undefined && {
        endDate: dto.endDate ? new Date(dto.endDate) : null,
      }),
      ...(dto.buyQuantity !== undefined && { buyQuantity: dto.buyQuantity }),
      ...(dto.freeQuantity !== undefined && { freeQuantity: dto.freeQuantity }),
      ...(dto.discountPercent !== undefined && {
        discountPercent: dto.discountPercent,
      }),
      ...(dto.discountAmount !== undefined && {
        discountAmount: dto.discountAmount,
      }),
    };

    // Add new product relations
    if (dto.triggerProductIds || dto.freeProductIds) {
      updateData.products = {
        create: [
          ...(dto.triggerProductIds || []).map((productId) => ({
            productId,
            role: 'trigger',
          })),
          ...(dto.freeProductIds || []).map((productId) => ({
            productId,
            role: 'free',
          })),
        ],
      };
    }

    return this.prisma.promotion.update({
      where: { id },
      data: updateData,
      include: {
        products: {
          include: {
            product: {
              select: { id: true, name: true, price: true, image: true },
            },
          },
        },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.promotion.delete({ where: { id } });
  }

  async toggleActive(id: number) {
    const promotion = await this.findOne(id);
    return this.prisma.promotion.update({
      where: { id },
      data: { isActive: !promotion.isActive },
    });
  }

  // ============================================
  // PROMOTION CALCULATION LOGIC
  // ============================================

  async calculateCart(items: CartItemDto[]): Promise<CalculationResult> {
    const activePromotions = await this.findActive();
    let totalDiscount = 0;
    const appliedPromotions: AppliedPromotion[] = [];

    // Calculate original total
    const originalTotal = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );

    for (const promo of activePromotions) {
      const result = this.applyPromotion(promo as PromotionWithProducts, items);
      if (result.discount > 0) {
        totalDiscount += result.discount;
        appliedPromotions.push({
          promotionId: promo.id,
          name: promo.name,
          type: promo.type,
          discount: result.discount,
          description: result.description,
        });
      }
    }

    return {
      originalTotal,
      totalDiscount,
      finalTotal: originalTotal - totalDiscount,
      appliedPromotions,
    };
  }

  private applyPromotion(
    promo: PromotionWithProducts,
    items: CartItemDto[],
  ): { discount: number; description: string } {
    switch (promo.type) {
      case 'BUY_X_GET_Y':
        return this.applyBuyXGetY(promo, items);
      case 'QUANTITY_DISCOUNT':
        return this.applyQuantityDiscount(promo, items);
      case 'BUNDLE_FREE':
        return this.applyBundleFree(promo, items);
      case 'NEXT_ITEM_DISCOUNT':
        return this.applyNextItemDiscount(promo, items);
      default:
        return { discount: 0, description: '' };
    }
  }

  /**
   * ซื้อ X แถม Y
   * Example: ซื้อ 2 แถม 1 (buyQuantity=2, freeQuantity=1)
   * If customer buys 6, they pay for 4 (6/3*2), get 2 free
   */
  private applyBuyXGetY(
    promo: PromotionWithProducts,
    items: CartItemDto[],
  ): { discount: number; description: string } {
    const buyQty = promo.buyQuantity || 2;
    const freeQty = promo.freeQuantity || 1;
    const triggerProductIds = promo.products
      .filter((p) => p.role === 'trigger')
      .map((p) => p.productId);

    let totalDiscount = 0;
    let freeItemsCount = 0;

    for (const item of items) {
      if (triggerProductIds.includes(item.productId)) {
        const groupSize = buyQty + freeQty;
        const completeGroups = Math.floor(item.quantity / groupSize);
        const freeItems = completeGroups * freeQty;
        freeItemsCount += freeItems;
        totalDiscount += freeItems * item.unitPrice;
      }
    }

    return {
      discount: totalDiscount,
      description: freeItemsCount > 0 ? `แถมฟรี ${freeItemsCount} ชิ้น` : '',
    };
  }

  /**
   * ซื้อ X ชิ้น ลด %
   * Example: ซื้อ 3 ชิ้น ลด 10% (buyQuantity=3, discountPercent=10)
   */
  private applyQuantityDiscount(
    promo: PromotionWithProducts,
    items: CartItemDto[],
  ): { discount: number; description: string } {
    const minQty = promo.buyQuantity || 1;
    const discountPct = promo.discountPercent || 0;
    const triggerProductIds = promo.products
      .filter((p) => p.role === 'trigger')
      .map((p) => p.productId);

    let totalDiscount = 0;
    let qualifiedProducts = 0;

    for (const item of items) {
      if (
        triggerProductIds.includes(item.productId) &&
        item.quantity >= minQty
      ) {
        const itemTotal = item.unitPrice * item.quantity;
        const discount = (itemTotal * discountPct) / 100;
        totalDiscount += discount;
        qualifiedProducts++;
      }
    }

    return {
      discount: totalDiscount,
      description:
        qualifiedProducts > 0
          ? `ลด ${discountPct}% สำหรับ ${qualifiedProducts} รายการ`
          : '',
    };
  }

  /**
   * ซื้อ A+B แถม C
   * Example: ซื้อน้ำ+ขนม แถมน้ำ (triggers=[น้ำ, ขนม], free=[น้ำ])
   */
  private applyBundleFree(
    promo: PromotionWithProducts,
    items: CartItemDto[],
  ): { discount: number; description: string } {
    const triggerProductIds = promo.products
      .filter((p) => p.role === 'trigger')
      .map((p) => p.productId);
    const freeProducts = promo.products.filter((p) => p.role === 'free');

    // Check if all trigger products are in cart
    const cartProductIds = items.map((i) => i.productId);
    const allTriggersPresent = triggerProductIds.every((id) =>
      cartProductIds.includes(id),
    );

    if (!allTriggersPresent || freeProducts.length === 0) {
      return { discount: 0, description: '' };
    }

    // Find the minimum quantity among trigger products
    const triggerQuantities = items
      .filter((item) => triggerProductIds.includes(item.productId))
      .map((item) => item.quantity);
    const bundleCount = Math.min(...triggerQuantities);

    // Calculate discount for free items
    let totalDiscount = 0;
    const freeQty = promo.freeQuantity || 1;

    for (const freeProduct of freeProducts) {
      const freeItemPrice = freeProduct.product.price;
      totalDiscount += bundleCount * freeQty * freeItemPrice;
    }

    return {
      discount: totalDiscount,
      description: `แถมฟรี ${bundleCount * freeQty} ชิ้น`,
    };
  }

  /**
   * ซื้อ X ชิ้น ชิ้นต่อไปลด %
   * Example: ซื้อ 2 ชิ้น ชิ้นที่ 3 ลด 50% (buyQuantity=2, discountPercent=50)
   */
  private applyNextItemDiscount(
    promo: PromotionWithProducts,
    items: CartItemDto[],
  ): { discount: number; description: string } {
    const buyQty = promo.buyQuantity || 2;
    const discountPct = promo.discountPercent || 0;
    const triggerProductIds = promo.products
      .filter((p) => p.role === 'trigger')
      .map((p) => p.productId);

    let totalDiscount = 0;
    let discountedItems = 0;

    for (const item of items) {
      if (triggerProductIds.includes(item.productId)) {
        // For every (buyQty + 1) items, the last one gets discount
        const groupSize = buyQty + 1;
        const discountedCount = Math.floor(item.quantity / groupSize);
        const discount = discountedCount * item.unitPrice * (discountPct / 100);
        totalDiscount += discount;
        discountedItems += discountedCount;
      }
    }

    return {
      discount: totalDiscount,
      description:
        discountedItems > 0
          ? `ลด ${discountPct}% สำหรับ ${discountedItems} ชิ้น`
          : '',
    };
  }
}
