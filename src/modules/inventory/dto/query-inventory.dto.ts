import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsDateString, Min, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { InventoryTransactionType } from '@prisma/client';

export class QueryInventoryTransactionsDto {
  @ApiPropertyOptional({ example: 1, description: 'Filter by product ID' })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  productId?: number;

  @ApiPropertyOptional({
    enum: InventoryTransactionType,
    description: 'Filter by transaction type',
  })
  @IsEnum(InventoryTransactionType)
  @IsOptional()
  type?: InventoryTransactionType;

  @ApiPropertyOptional({
    example: '2024-01-01',
    description: 'Start date filter',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2024-12-31',
    description: 'End date filter',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}

export class QueryStockCountsDto {
  @ApiPropertyOptional({ example: 1, description: 'Filter by product ID' })
  @IsInt()
  @IsOptional()
  @Type(() => Number)
  productId?: number;

  @ApiPropertyOptional({
    example: false,
    description: 'Filter by adjustment status',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  isAdjusted?: boolean;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
