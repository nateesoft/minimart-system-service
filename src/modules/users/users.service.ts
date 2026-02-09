import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto, UpdateUserDto, QueryUsersDto } from './dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    // Check if username already exists
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new ConflictException('ชื่อผู้ใช้นี้มีอยู่แล้ว');
    }

    // Check if email already exists (if provided)
    if (dto.email) {
      const existingEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new ConflictException('อีเมลนี้มีการใช้งานแล้ว');
      }
    }

    // Check if role exists
    const role = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
    });
    if (!role) {
      throw new NotFoundException('ไม่พบบทบาทที่ระบุ');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    return this.prisma.user.create({
      data: {
        username: dto.username,
        passwordHash,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        roleId: dto.roleId,
        isActive: dto.isActive ?? true,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
      },
    });
  }

  async findAll(query: QueryUsersDto) {
    const { search, isActive } = query;

    const where: any = {};

    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return this.prisma.user.findMany({
      where,
      include: {
        role: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`ไม่พบผู้ใช้ ID ${id}`);
    }

    return user;
  }

  async findByUsername(username: string) {
    return this.prisma.user.findUnique({
      where: { username },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
  }

  async update(id: number, dto: UpdateUserDto) {
    // Check if user exists
    await this.findById(id);

    const updateData: any = { ...dto };

    // Hash new password if provided
    if (dto.password) {
      updateData.passwordHash = await bcrypt.hash(dto.password, 10);
      delete updateData.password;
    }

    // Check email uniqueness if changing
    if (dto.email) {
      const existingEmail = await this.prisma.user.findFirst({
        where: {
          email: dto.email,
          id: { not: id },
        },
      });
      if (existingEmail) {
        throw new ConflictException('อีเมลนี้มีการใช้งานแล้ว');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        role: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
      },
    });
  }

  async delete(id: number) {
    // Check if user exists
    await this.findById(id);

    return this.prisma.user.delete({
      where: { id },
    });
  }

  async validatePassword(user: any, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  async updateLastLogin(id: number) {
    return this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }
}
