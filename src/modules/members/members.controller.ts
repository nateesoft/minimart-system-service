import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MembersService } from './members.service';
import {
  CreateMemberDto,
  UpdateMemberDto,
  QueryMembersDto,
  QueryPointTransactionsDto,
  PointAdjustmentDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../../common/decorators/current-user.decorator';

@ApiTags('Members')
@Controller('members')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  @ApiOperation({ summary: 'ลงทะเบียนสมาชิกใหม่' })
  @ApiResponse({ status: 201, description: 'สร้างสมาชิกสำเร็จ' })
  @ApiResponse({ status: 409, description: 'เบอร์โทรหรืออีเมลซ้ำ' })
  create(@Body() dto: CreateMemberDto) {
    return this.membersService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'ค้นหารายชื่อสมาชิก' })
  @ApiResponse({ status: 200, description: 'รายการสมาชิก' })
  findAll(@Query() query: QueryMembersDto) {
    return this.membersService.findAll(query);
  }

  @Get('phone/:phone')
  @ApiOperation({ summary: 'ค้นหาสมาชิกด้วยเบอร์โทร' })
  @ApiResponse({ status: 200, description: 'ข้อมูลสมาชิก' })
  @ApiResponse({ status: 404, description: 'ไม่พบสมาชิก' })
  findByPhone(@Param('phone') phone: string) {
    return this.membersService.findByPhone(phone);
  }

  @Get(':id')
  @ApiOperation({ summary: 'ดูข้อมูลสมาชิก' })
  @ApiResponse({ status: 200, description: 'ข้อมูลสมาชิก' })
  @ApiResponse({ status: 404, description: 'ไม่พบสมาชิก' })
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.membersService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'แก้ไขข้อมูลสมาชิก' })
  @ApiResponse({ status: 200, description: 'แก้ไขสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบสมาชิก' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.membersService.update(id, dto);
  }

  @Get(':id/points')
  @ApiOperation({ summary: 'ดูประวัติแต้มของสมาชิก' })
  @ApiResponse({ status: 200, description: 'ประวัติแต้ม' })
  @ApiResponse({ status: 404, description: 'ไม่พบสมาชิก' })
  getPointHistory(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryPointTransactionsDto,
  ) {
    return this.membersService.getPointHistory(id, query);
  }

  @Post(':id/points/adjust')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  @ApiOperation({ summary: 'ปรับแต้มสมาชิก (Admin only)' })
  @ApiResponse({ status: 200, description: 'ปรับแต้มสำเร็จ' })
  @ApiResponse({ status: 404, description: 'ไม่พบสมาชิก' })
  @ApiResponse({ status: 400, description: 'แต้มไม่เพียงพอ' })
  adjustPoints(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: PointAdjustmentDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.membersService.adjustPoints(id, dto, user?.name || user?.username);
  }
}
