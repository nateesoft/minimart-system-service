import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, Matches, MinLength } from 'class-validator';

export class CreateMemberDto {
  @ApiProperty({ example: '0812345678', description: 'เบอร์โทรศัพท์ (10 หลัก)' })
  @IsString()
  @Matches(/^0[0-9]{9}$/, { message: 'เบอร์โทรต้องเป็นตัวเลข 10 หลัก เริ่มต้นด้วย 0' })
  phone: string;

  @ApiProperty({ example: 'สมชาย', description: 'ชื่อ' })
  @IsString()
  @MinLength(1, { message: 'กรุณากรอกชื่อ' })
  firstName: string;

  @ApiPropertyOptional({ example: 'ใจดี', description: 'นามสกุล' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: 'somchai@example.com', description: 'อีเมล' })
  @IsEmail({}, { message: 'รูปแบบอีเมลไม่ถูกต้อง' })
  @IsOptional()
  email?: string;
}
