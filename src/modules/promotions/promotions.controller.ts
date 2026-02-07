import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
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
import { PromotionsService } from './promotions.service';
import {
  CreatePromotionDto,
  UpdatePromotionDto,
  QueryPromotionsDto,
  CalculateCartDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Promotions')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all promotions with filters' })
  @ApiResponse({ status: 200, description: 'List of promotions' })
  findAll(@Query() query: QueryPromotionsDto) {
    return this.promotionsService.findAll(query);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active promotions for POS' })
  @ApiResponse({ status: 200, description: 'List of active promotions' })
  findActive() {
    return this.promotionsService.findActive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get promotion by ID' })
  @ApiResponse({ status: 200, description: 'Promotion details' })
  @ApiResponse({ status: 404, description: 'Promotion not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.promotionsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new promotion (Admin only)' })
  @ApiResponse({ status: 201, description: 'Promotion created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() dto: CreatePromotionDto) {
    return this.promotionsService.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a promotion (Admin only)' })
  @ApiResponse({ status: 200, description: 'Promotion updated' })
  @ApiResponse({ status: 404, description: 'Promotion not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePromotionDto,
  ) {
    return this.promotionsService.update(id, dto);
  }

  @Patch(':id/toggle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle promotion active status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Promotion status toggled' })
  @ApiResponse({ status: 404, description: 'Promotion not found' })
  toggleActive(@Param('id', ParseIntPipe) id: number) {
    return this.promotionsService.toggleActive(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a promotion (Admin only)' })
  @ApiResponse({ status: 200, description: 'Promotion deleted' })
  @ApiResponse({ status: 404, description: 'Promotion not found' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.promotionsService.remove(id);
  }

  @Post('calculate')
  @ApiOperation({
    summary: 'Calculate cart discounts based on active promotions',
  })
  @ApiResponse({
    status: 200,
    description: 'Calculation result with applied promotions',
  })
  calculateCart(@Body() dto: CalculateCartDto) {
    return this.promotionsService.calculateCart(dto.items);
  }
}
