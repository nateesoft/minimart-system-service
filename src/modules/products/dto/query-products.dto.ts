import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryProductsDto {
  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsInt()
  @Type(() => Number)
  @IsOptional()
  categoryId?: number;

  @ApiPropertyOptional({ description: 'Filter by category slug' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ description: 'Search by name or barcode' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter low stock only' })
  @IsString()
  @IsOptional()
  lowStock?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({ default: 50 })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  limit?: number = 50;
}
