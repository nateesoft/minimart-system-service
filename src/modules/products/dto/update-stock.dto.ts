import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, IsOptional } from 'class-validator';

export class UpdateStockDto {
  @ApiProperty({ example: 100, description: 'New stock quantity' })
  @IsInt()
  quantity: number;

  @ApiPropertyOptional({ example: 'Restocked from supplier' })
  @IsString()
  @IsOptional()
  reason?: string;
}
