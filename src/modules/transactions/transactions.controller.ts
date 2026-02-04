import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, QueryTransactionsDto } from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new transaction (sale)' })
  @ApiResponse({ status: 201, description: 'Transaction created' })
  @ApiResponse({ status: 400, description: 'Invalid data or insufficient stock' })
  create(@Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all transactions with filters' })
  @ApiResponse({ status: 200, description: 'List of transactions' })
  findAll(@Query() query: QueryTransactionsDto) {
    return this.transactionsService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get transaction by ID' })
  @ApiResponse({ status: 200, description: 'Transaction found' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transactionsService.findOne(id);
  }

  @Patch(':id/void')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Void a transaction' })
  @ApiResponse({ status: 200, description: 'Transaction voided' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  @ApiResponse({ status: 400, description: 'Transaction already voided' })
  void(@Param('id', ParseIntPipe) id: number) {
    return this.transactionsService.void(id);
  }
}
