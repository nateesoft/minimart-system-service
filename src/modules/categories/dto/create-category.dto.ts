import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  MinLength,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'drink', description: 'Category slug identifier' })
  @IsString()
  @MinLength(1)
  slug: string;

  @ApiProperty({ example: 'เครื่องดื่ม', description: 'Category display name' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiPropertyOptional({ example: 'เครื่องดื่มทุกชนิด' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: '🥤', description: 'Emoji icon' })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional({ example: '#3B82F6', description: 'Color for UI' })
  @IsString()
  @IsOptional()
  color?: string;

  @ApiPropertyOptional({ example: 1, default: 0 })
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
