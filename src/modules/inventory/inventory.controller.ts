import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import {
  CreateReceivingDto,
  CreateIssuingDto,
  CreateStockCountDto,
  QueryInventoryTransactionsDto,
  QueryStockCountsDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';

@ApiTags('Inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  // ============================================
  // RECEIVING - รับสินค้าเข้า
  // ============================================
  @Post('receiving')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Receive goods into inventory (bulk)' })
  @ApiResponse({ status: 201, description: 'Goods received successfully' })
  createReceiving(
    @Body() dto: CreateReceivingDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.inventoryService.createReceiving(dto, user?.name || user?.username);
  }

  // ============================================
  // ISSUING - จ่ายสินค้าออก
  // ============================================
  @Post('issuing')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Issue goods from inventory' })
  @ApiResponse({ status: 201, description: 'Goods issued successfully' })
  createIssuing(
    @Body() dto: CreateIssuingDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.inventoryService.createIssuing(dto, user?.name || user?.username);
  }

  // ============================================
  // TRANSACTIONS - ประวัติการเคลื่อนไหว
  // ============================================
  @Get('transactions')
  @ApiOperation({ summary: 'Get inventory transactions with filters' })
  @ApiResponse({ status: 200, description: 'Return inventory transactions' })
  findAllTransactions(@Query() query: QueryInventoryTransactionsDto) {
    return this.inventoryService.findAllTransactions(query);
  }

  @Get('transactions/product/:productId')
  @ApiOperation({ summary: 'Get inventory transactions for a specific product' })
  @ApiResponse({ status: 200, description: 'Return product inventory history' })
  findProductTransactions(@Param('productId', ParseIntPipe) productId: number) {
    return this.inventoryService.findProductTransactions(productId);
  }

  // ============================================
  // STOCK OVERVIEW - ภาพรวมสต็อก
  // ============================================
  @Get('stock-overview')
  @ApiOperation({ summary: 'Get stock overview statistics' })
  @ApiResponse({ status: 200, description: 'Return stock overview' })
  getStockOverview() {
    return this.inventoryService.getStockOverview();
  }

  @Get('low-stock')
  @ApiOperation({ summary: 'Get products with low stock' })
  @ApiResponse({ status: 200, description: 'Return low stock products' })
  getLowStockProducts() {
    return this.inventoryService.getLowStockProducts();
  }

  // ============================================
  // STOCK COUNT - นับสต็อก
  // ============================================
  @Post('stock-count')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a stock count record' })
  @ApiResponse({ status: 201, description: 'Stock count created' })
  createStockCount(
    @Body() dto: CreateStockCountDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.inventoryService.createStockCount(dto, user?.name || user?.username);
  }

  @Get('stock-counts')
  @ApiOperation({ summary: 'Get stock count records' })
  @ApiResponse({ status: 200, description: 'Return stock counts' })
  findAllStockCounts(@Query() query: QueryStockCountsDto) {
    return this.inventoryService.findAllStockCounts(query);
  }

  @Patch('stock-counts/:id/adjust')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Adjust stock based on stock count' })
  @ApiResponse({ status: 200, description: 'Stock adjusted successfully' })
  adjustStockFromCount(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.inventoryService.adjustStockFromCount(id, user?.name || user?.username);
  }
}
