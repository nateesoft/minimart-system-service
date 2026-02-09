import {
  IsArray,
  IsInt,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CartItemDto {
  @ApiProperty({ example: 1, description: 'Product ID' })
  @IsInt()
  @Type(() => Number)
  productId: number;

  @ApiProperty({ example: 3, description: 'Quantity' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  quantity: number;

  @ApiProperty({ example: 25, description: 'Unit price' })
  @IsInt()
  @Min(0)
  @Type(() => Number)
  unitPrice: number;
}

export class CalculateCartDto {
  @ApiProperty({ type: [CartItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CartItemDto)
  items: CartItemDto[];
}

export interface AppliedPromotion {
  promotionId: number;
  name: string;
  type: string;
  discount: number;
  description: string;
}

export interface CalculationResult {
  originalTotal: number;
  totalDiscount: number;
  finalTotal: number;
  appliedPromotions: AppliedPromotion[];
}
