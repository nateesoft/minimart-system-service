import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CreateIssuingDto {
  @ApiProperty({ example: 1, description: 'Product ID' })
  @IsInt()
  productId: number;

  @ApiProperty({ example: 5, description: 'Quantity to issue' })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    example: 'เสียหาย',
    description: 'Reason for issuing (damaged, expired, transfer, etc.)',
  })
  @IsString()
  @MinLength(1)
  reason: string;

  @ApiPropertyOptional({
    example: 'TRF-2024-001',
    description: 'Reference number',
  })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiPropertyOptional({ example: 'สินค้าหมดอายุ batch 2024-01' })
  @IsString()
  @IsOptional()
  notes?: string;
}
