import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(isActive?: boolean) {
    const where: any = {};
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.prisma.category.findMany({
      where,
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findOne(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async create(dto: CreateCategoryDto) {
    // Check for duplicate slug or name
    const existing = await this.prisma.category.findFirst({
      where: {
        OR: [{ slug: dto.slug }, { name: dto.name }],
      },
    });

    if (existing) {
      throw new ConflictException(
        `Category with slug '${dto.slug}' or name '${dto.name}' already exists`,
      );
    }

    return this.prisma.category.create({ data: dto });
  }

  async update(id: number, dto: UpdateCategoryDto) {
    await this.findOne(id);

    // Check for duplicate slug or name (excluding current)
    if (dto.slug || dto.name) {
      const existing = await this.prisma.category.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(dto.slug ? [{ slug: dto.slug }] : []),
                ...(dto.name ? [{ name: dto.name }] : []),
              ],
            },
          ],
        },
      });

      if (existing) {
        throw new ConflictException(
          'Category with this slug or name already exists',
        );
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: number) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    if (category._count.products > 0) {
      throw new ConflictException(
        `Cannot delete category with ${category._count.products} products. Remove products first.`,
      );
    }

    return this.prisma.category.delete({ where: { id } });
  }
}
