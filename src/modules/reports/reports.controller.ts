import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('daily-sales')
  @ApiOperation({ summary: 'Get daily sales report' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date (ISO format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (ISO format)',
  })
  @ApiResponse({ status: 200, description: 'Daily sales data' })
  getDailySales(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getDailySales(startDate, endDate);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get sales summary' })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date (ISO format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (ISO format)',
  })
  @ApiResponse({ status: 200, description: 'Sales summary' })
  getSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getSummary(startDate, endDate);
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Get top selling products' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of products (default 10)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date (ISO format)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date (ISO format)',
  })
  @ApiResponse({ status: 200, description: 'Top selling products' })
  getTopProducts(
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getTopProducts(
      limit ? parseInt(limit, 10) : 10,
      startDate,
      endDate,
    );
  }
}
