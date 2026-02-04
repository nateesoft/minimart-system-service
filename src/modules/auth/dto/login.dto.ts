import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'cashier' })
  @IsString()
  username: string;

  @ApiProperty({ example: 'pos1234' })
  @IsString()
  @MinLength(4)
  password: string;
}
