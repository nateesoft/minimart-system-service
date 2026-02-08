import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from './dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRoleDto) {
    // Check if role name already exists
    const existing = await this.prisma.role.findUnique({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException('ชื่อบทบาทนี้มีอยู่แล้ว');
    }

    // Create role with permissions
    return this.prisma.role.create({
      data: {
        name: dto.name.toUpperCase(),
        displayName: dto.displayName,
        description: dto.description,
        permissions: {
          create: dto.permissionIds.map((permissionId) => ({
            permissionId,
          })),
        },
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.role.findMany({
      where: { isActive: true },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: number) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`ไม่พบบทบาท ID ${id}`);
    }

    return role;
  }

  async update(id: number, dto: UpdateRoleDto) {
    // Check if role exists
    await this.findById(id);

    // Update role and permissions
    return this.prisma.$transaction(async (tx) => {
      // Delete existing permissions if new ones provided
      if (dto.permissionIds) {
        await tx.rolePermission.deleteMany({
          where: { roleId: id },
        });

        // Create new permissions
        await tx.rolePermission.createMany({
          data: dto.permissionIds.map((permissionId) => ({
            roleId: id,
            permissionId,
          })),
        });
      }

      // Update role
      return tx.role.update({
        where: { id },
        data: {
          displayName: dto.displayName,
          description: dto.description,
        },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });
    });
  }

  async delete(id: number) {
    const role = await this.findById(id);

    // Prevent deleting system roles
    if (['ADMIN', 'CASHIER'].includes(role.name)) {
      throw new ConflictException('ไม่สามารถลบบทบาทระบบได้');
    }

    // Check if role has users
    const userCount = await this.prisma.user.count({
      where: { roleId: id },
    });

    if (userCount > 0) {
      throw new ConflictException('ไม่สามารถลบบทบาทที่มีผู้ใช้งานอยู่');
    }

    return this.prisma.role.delete({
      where: { id },
    });
  }
}
