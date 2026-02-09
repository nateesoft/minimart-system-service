import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, IsBoolean } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class QueryMembersDto {
  @ApiPropertyOptional({ example: 'สมชาย', description: 'ค้นหาด้วยชื่อหรือเบอร์โทร' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: true, description: 'กรองตามสถานะ' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}

export class QueryPointTransactionsDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
