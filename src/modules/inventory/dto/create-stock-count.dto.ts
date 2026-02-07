import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateStockCountDto {
  @ApiProperty({ example: 1, description: 'Product ID' })
  @IsInt()
  productId: number;

  @ApiProperty({ example: 45, description: 'Actual counted quantity' })
  @IsInt()
  @Min(0)
  countedQuantity: number;

  @ApiPropertyOptional({ example: 'นับสต็อกประจำเดือน' })
  @IsString()
  @IsOptional()
  notes?: string;
}
