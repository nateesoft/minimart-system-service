import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, PointTransactionType } from '@prisma/client';
import {
  CreateMemberDto,
  UpdateMemberDto,
  QueryMembersDto,
  QueryPointTransactionsDto,
  PointAdjustmentDto,
} from './dto';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateMemberDto) {
    // Check if phone already exists
    const existing = await this.prisma.member.findUnique({
      where: { phone: dto.phone },
    });

    if (existing) {
      throw new ConflictException('เบอร์โทรนี้มีการลงทะเบียนแล้ว');
    }

    // Check if email already exists (if provided)
    if (dto.email) {
      const existingEmail = await this.prisma.member.findUnique({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new ConflictException('อีเมลนี้มีการลงทะเบียนแล้ว');
      }
    }

    return this.prisma.member.create({
      data: {
        phone: dto.phone,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
      },
    });
  }

  async findAll(query: QueryMembersDto) {
    const { search, isActive, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.MemberWhereInput = {};

    if (search) {
      where.OR = [
        { phone: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [data, total] = await Promise.all([
      this.prisma.member.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.member.count({ where }),
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

  async findById(id: number) {
    const member = await this.prisma.member.findUnique({
      where: { id },
    });

    if (!member) {
      throw new NotFoundException(`ไม่พบสมาชิก ID ${id}`);
    }

    return member;
  }

  async findByPhone(phone: string) {
    const member = await this.prisma.member.findUnique({
      where: { phone },
    });

    if (!member) {
      throw new NotFoundException(`ไม่พบสมาชิกเบอร์โทร ${phone}`);
    }

    return member;
  }

  async update(id: number, dto: UpdateMemberDto) {
    const member = await this.findById(id);

    // Check email uniqueness if changing
    if (dto.email && dto.email !== member.email) {
      const existingEmail = await this.prisma.member.findUnique({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new ConflictException('อีเมลนี้มีการใช้งานแล้ว');
      }
    }

    return this.prisma.member.update({
      where: { id },
      data: dto,
    });
  }

  async getPointHistory(memberId: number, query: QueryPointTransactionsDto) {
    // Verify member exists
    await this.findById(memberId);

    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.pointTransaction.findMany({
        where: { memberId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          transaction: {
            select: {
              id: true,
              transactionId: true,
              total: true,
            },
          },
        },
      }),
      this.prisma.pointTransaction.count({ where: { memberId } }),
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

  async adjustPoints(memberId: number, dto: PointAdjustmentDto, createdBy?: string) {
    const member = await this.findById(memberId);

    if (dto.points === 0) {
      throw new BadRequestException('จำนวนแต้มต้องไม่เป็น 0');
    }

    const balanceBefore = member.totalPoints;
    const balanceAfter = balanceBefore + dto.points;

    if (balanceAfter < 0) {
      throw new BadRequestException('แต้มสะสมไม่เพียงพอ');
    }

    return this.prisma.$transaction(async (tx) => {
      // Create point transaction
      await tx.pointTransaction.create({
        data: {
          memberId,
          type: dto.points > 0 ? PointTransactionType.BONUS : PointTransactionType.ADJUSTMENT,
          points: dto.points,
          balanceBefore,
          balanceAfter,
          description: dto.description || (dto.points > 0 ? 'เพิ่มแต้มโดยแอดมิน' : 'หักแต้มโดยแอดมิน'),
          createdBy,
        },
      });

      // Update member points
      return tx.member.update({
        where: { id: memberId },
        data: {
          totalPoints: balanceAfter,
        },
      });
    });
  }
}
