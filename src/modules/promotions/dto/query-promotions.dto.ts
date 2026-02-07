import { IsOptional, IsBoolean, IsEnum, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { PromotionTypeDto } from './create-promotion.dto';

export class QueryPromotionsDto {
  @ApiPropertyOptional({ enum: PromotionTypeDto })
  @IsEnum(PromotionTypeDto)
  @IsOptional()
  type?: PromotionTypeDto;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  isActive?: boolean;

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
