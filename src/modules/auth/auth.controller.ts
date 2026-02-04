import { Controller, Post, Body, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private jwtService: JwtService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login and receive JWT token' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    // Dev mode: accept hardcoded POS credentials
    if (dto.username === 'cashier' && dto.password === 'pos1234') {
      const payload = { sub: 1, username: 'cashier', role: 'ADMIN' };
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: 1,
          username: 'cashier',
          name: 'Minimart Cashier',
          role: 'ADMIN',
        },
      };
    }

    throw new UnauthorizedException('Invalid credentials');
  }
}
