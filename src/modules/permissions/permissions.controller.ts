import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Permissions')
@Controller('permissions')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get all permissions (Admin only)' })
  @ApiResponse({ status: 200, description: 'Return all permissions' })
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get('grouped')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get permissions grouped by module (Admin only)' })
  @ApiResponse({ status: 200, description: 'Return permissions grouped by module' })
  getGrouped() {
    return this.permissionsService.getGroupedByModule();
  }
}
