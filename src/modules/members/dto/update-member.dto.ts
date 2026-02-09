import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsBoolean, MinLength } from 'class-validator';

export class UpdateMemberDto {
  @ApiPropertyOptional({ example: 'สมชาย', description: 'ชื่อ' })
  @IsString()
  @MinLength(1)
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'ใจดี', description: 'นามสกุล' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: 'somchai@example.com', description: 'อีเมล' })
  @IsEmail({}, { message: 'รูปแบบอีเมลไม่ถูกต้อง' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: true, description: 'สถานะการใช้งาน' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
