import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

// Create Prisma client with pg adapter (same as PrismaService)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool, { schema: 'minimart' });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding auth data...');

  // Create Permissions
  const permissions = [
    { code: 'pos.access', name: 'เข้าถึงหน้าขาย', module: 'pos' },
    { code: 'pos.refund', name: 'คืนเงิน/ยกเลิกรายการ', module: 'pos' },
    { code: 'inventory.view', name: 'ดูคลังสินค้า', module: 'inventory' },
    { code: 'inventory.manage', name: 'จัดการคลังสินค้า', module: 'inventory' },
    { code: 'products.view', name: 'ดูสินค้า', module: 'products' },
    { code: 'products.manage', name: 'จัดการสินค้า', module: 'products' },
    { code: 'promotions.view', name: 'ดูโปรโมชั่น', module: 'promotions' },
    { code: 'promotions.manage', name: 'จัดการโปรโมชั่น', module: 'promotions' },
    { code: 'members.view', name: 'ดูข้อมูลสมาชิก', module: 'members' },
    { code: 'members.manage', name: 'จัดการสมาชิก', module: 'members' },
    { code: 'reports.view', name: 'ดูรายงาน', module: 'reports' },
    { code: 'users.view', name: 'ดูรายชื่อผู้ใช้', module: 'users' },
    { code: 'users.manage', name: 'จัดการผู้ใช้', module: 'users' },
    { code: 'roles.manage', name: 'จัดการบทบาท', module: 'roles' },
    { code: 'settings.manage', name: 'ตั้งค่าระบบ', module: 'settings' },
  ];

  console.log('Creating permissions...');
  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
  }
  console.log(`Created ${permissions.length} permissions`);

  // Create Roles
  console.log('Creating roles...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      displayName: 'ผู้ดูแลระบบ',
      description: 'สิทธิ์เต็มระบบ',
    },
  });

  const managerRole = await prisma.role.upsert({
    where: { name: 'MANAGER' },
    update: {},
    create: {
      name: 'MANAGER',
      displayName: 'ผู้จัดการ',
      description: 'จัดการสินค้าและโปรโมชั่น',
    },
  });

  const cashierRole = await prisma.role.upsert({
    where: { name: 'CASHIER' },
    update: {},
    create: {
      name: 'CASHIER',
      displayName: 'พนักงานขาย',
      description: 'ขายหน้าร้าน',
    },
  });
  console.log('Created 3 roles: ADMIN, MANAGER, CASHIER');

  // Assign all permissions to ADMIN
  console.log('Assigning permissions to roles...');
  const allPermissions = await prisma.permission.findMany();
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id },
      },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  // Assign specific permissions to MANAGER
  const managerPermCodes = [
    'pos.access',
    'pos.refund',
    'inventory.view',
    'inventory.manage',
    'products.view',
    'products.manage',
    'promotions.view',
    'promotions.manage',
    'members.view',
    'members.manage',
    'reports.view',
  ];
  for (const code of managerPermCodes) {
    const perm = allPermissions.find((p) => p.code === code);
    if (perm) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: managerRole.id, permissionId: perm.id },
        },
        update: {},
        create: { roleId: managerRole.id, permissionId: perm.id },
      });
    }
  }

  // Assign specific permissions to CASHIER
  const cashierPermCodes = ['pos.access', 'members.view'];
  for (const code of cashierPermCodes) {
    const perm = allPermissions.find((p) => p.code === code);
    if (perm) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: { roleId: cashierRole.id, permissionId: perm.id },
        },
        update: {},
        create: { roleId: cashierRole.id, permissionId: perm.id },
      });
    }
  }
  console.log('Assigned permissions to roles');

  // Create default admin user
  console.log('Creating default users...');
  const adminPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      roleId: adminRole.id,
    },
  });

  // Create default cashier user
  const cashierPassword = await bcrypt.hash('pos1234', 10);
  await prisma.user.upsert({
    where: { username: 'cashier' },
    update: {},
    create: {
      username: 'cashier',
      passwordHash: cashierPassword,
      firstName: 'Minimart',
      lastName: 'Cashier',
      roleId: cashierRole.id,
    },
  });

  console.log('Created 2 users:');
  console.log('  - admin / admin123 (ADMIN)');
  console.log('  - cashier / pos1234 (CASHIER)');

  console.log('\n✅ Auth seed completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding auth data:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
