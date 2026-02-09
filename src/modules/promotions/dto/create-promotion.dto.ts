import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsArray,
  IsInt,
  Min,
  IsDateString,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export enum PromotionTypeDto {
  BUY_X_GET_Y = 'BUY_X_GET_Y',
  QUANTITY_DISCOUNT = 'QUANTITY_DISCOUNT',
  BUNDLE_FREE = 'BUNDLE_FREE',
  NEXT_ITEM_DISCOUNT = 'NEXT_ITEM_DISCOUNT',
}

export class CreatePromotionDto {
  @ApiProperty({ example: 'ซื้อ 2 แถม 1', description: 'ชื่อโปรโมชั่น' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'น้ำดื่มทุกชนิด ซื้อ 2 ขวด แถมฟรี 1 ขวด' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ enum: PromotionTypeDto, example: 'BUY_X_GET_Y' })
  @IsEnum(PromotionTypeDto)
  type: PromotionTypeDto;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ example: '2026-02-01T00:00:00Z' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-02-28T23:59:59Z' })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  // Rule parameters
  @ApiPropertyOptional({ example: 2, description: 'จำนวนที่ต้องซื้อ (X)' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  buyQuantity?: number;

  @ApiPropertyOptional({ example: 1, description: 'จำนวนที่แถม (Y)' })
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @IsOptional()
  freeQuantity?: number;

  @ApiPropertyOptional({ example: 10, description: 'เปอร์เซ็นต์ส่วนลด' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  discountPercent?: number;

  @ApiPropertyOptional({ example: 5, description: 'ส่วนลดเป็นจำนวนเงิน' })
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @IsOptional()
  discountAmount?: number;

  // Product IDs
  @ApiProperty({
    type: [Number],
    example: [1, 2],
    description: 'สินค้าที่ trigger โปรโมชั่น',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsInt({ each: true })
  @Type(() => Number)
  triggerProductIds: number[];

  @ApiPropertyOptional({
    type: [Number],
    example: [3],
    description: 'สินค้าที่แถม (สำหรับ BUNDLE_FREE)',
  })
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  @IsOptional()
  freeProductIds?: number[];
}
