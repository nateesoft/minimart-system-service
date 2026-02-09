import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsInt, MinLength } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'MANAGER' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'ผู้จัดการ' })
  @IsString()
  displayName: string;

  @ApiProperty({ example: 'จัดการสินค้าและโปรโมชั่น', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: [1, 2, 3], description: 'Array of permission IDs' })
  @IsArray()
  @IsInt({ each: true })
  permissionIds: number[];
}
