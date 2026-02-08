import { ApiProperty, PartialType, OmitType } from '@nestjs/swagger';
import { IsString, MinLength, IsOptional } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['username', 'password'] as const),
) {
  @ApiProperty({ example: 'newpassword123', required: false })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}
