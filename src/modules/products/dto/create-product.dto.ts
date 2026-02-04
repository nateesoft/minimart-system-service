import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsInt,
  Min,
  MinLength,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({ example: 'น้ำดื่ม 600ml' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: 1, description: 'Category ID' })
  @IsInt()
  categoryId: number;

  @ApiProperty({ example: 8, description: 'Selling price in Baht' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 5, description: 'Cost price in Baht' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  costPrice?: number;

  @ApiProperty({ example: '8851234560001', description: 'EAN-13 barcode' })
  @IsString()
  barcode: string;

  @ApiProperty({ example: 150, description: 'Current stock quantity' })
  @IsInt()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({ example: 10, description: 'Minimum stock threshold' })
  @IsInt()
  @Min(0)
  @IsOptional()
  minStock?: number;

  @ApiPropertyOptional({ example: '💧', description: 'Emoji or image URL' })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiProperty({ example: 'ขวด', description: 'Unit of measurement' })
  @IsString()
  unit: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
