import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { code: 'asc' }],
    });
  }

  async findByModule(module: string) {
    return this.prisma.permission.findMany({
      where: { module },
      orderBy: { code: 'asc' },
    });
  }

  async getGroupedByModule() {
    const permissions = await this.findAll();

    // Group by module
    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    }, {} as Record<string, typeof permissions>);

    return grouped;
  }
}
