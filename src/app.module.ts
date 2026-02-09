import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ProductsModule } from './modules/products/products.module';
import { TransactionsModule } from './modules/transactions/transactions.module';
import { ReportsModule } from './modules/reports/reports.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { MembersModule } from './modules/members/members.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    CategoriesModule,
    ProductsModule,
    TransactionsModule,
    ReportsModule,
    PromotionsModule,
    InventoryModule,
    MembersModule,
  ],
})
export class AppModule {}
