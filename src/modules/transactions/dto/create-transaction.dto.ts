import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  IsEnum,
  IsArray,
  ValidateNested,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateTransactionItemDto {
  @ApiProperty({ example: 1, description: 'Product ID' })
  @IsInt()
  productId: number;

  @ApiProperty({ example: 2, description: 'Quantity purchased' })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreatePaymentDto {
  @ApiProperty({ enum: ['cash', 'card', 'qr'], example: 'cash' })
  @IsString()
  @IsEnum(['cash', 'card', 'qr'])
  method: 'cash' | 'card' | 'qr';

  @ApiProperty({ example: 100, description: 'Amount paid' })
  @IsNumber()
  @Min(0)
  amount: number;
}

export class CreateTransactionDto {
  @ApiProperty({ type: [CreateTransactionItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateTransactionItemDto)
  items: CreateTransactionItemDto[];

  @ApiPropertyOptional({ example: 0, description: 'Discount amount in Baht' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @ApiProperty({ type: CreatePaymentDto })
  @ValidateNested()
  @Type(() => CreatePaymentDto)
  payment: CreatePaymentDto;

  @ApiPropertyOptional({ example: 'Customer requested receipt' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: 1, description: 'Member ID for points accumulation' })
  @IsInt()
  @IsOptional()
  memberId?: number;
}
