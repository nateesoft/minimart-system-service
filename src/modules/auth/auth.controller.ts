import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private jwtService: JwtService,
    private authService: AuthService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Login and receive JWT token' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto) {
    const user = await this.authService.login(dto.username, dto.password);

    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        roleName: user.roleName,
        permissions: user.permissions,
      },
    };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info' })
  @ApiResponse({ status: 200, description: 'Return current user info' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(
    @CurrentUser() user: { id: number; username: string; role: string },
  ) {
    const fullUser = await this.authService.validateUser(user.id);
    return fullUser;
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh JWT token' })
  @ApiResponse({ status: 200, description: 'Return new token' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async refresh(
    @CurrentUser() user: { id: number; username: string; role: string },
  ) {
    const payload = {
      sub: user.id,
      username: user.username,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
