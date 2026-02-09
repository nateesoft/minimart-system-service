import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReceivingItemDto {
  @ApiProperty({ example: 1, description: 'Product ID' })
  @IsInt()
  productId: number;

  @ApiProperty({ example: 10, description: 'Quantity to receive' })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateReceivingDto {
  @ApiProperty({
    type: [ReceivingItemDto],
    description: 'List of items to receive',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReceivingItemDto)
  items: ReceivingItemDto[];

  @ApiPropertyOptional({
    example: 'PO-2024-001',
    description: 'Reference number (PO, Invoice)',
  })
  @IsString()
  @IsOptional()
  reference?: string;

  @ApiPropertyOptional({ example: 'Received from supplier ABC' })
  @IsString()
  @IsOptional()
  notes?: string;
}
