import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class PointAdjustmentDto {
  @ApiProperty({ example: 100, description: 'จำนวนแต้ม (+ เพิ่ม, - ลด)' })
  @IsInt()
  points: number;

  @ApiPropertyOptional({ example: 'โบนัสวันเกิด', description: 'รายละเอียด' })
  @IsString()
  @IsOptional()
  description?: string;
}
