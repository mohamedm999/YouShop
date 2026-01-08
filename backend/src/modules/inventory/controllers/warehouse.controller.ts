import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { WarehouseService } from '../services/warehouse.service';
import { CreateWarehouseDto } from '../dto/warehouse/create-warehouse.dto';
import { UpdateWarehouseDto } from '../dto/warehouse/update-warehouse.dto';
import { apiResponse } from '../../../common/helpers/api-response.helper';
import type { ApiResponse } from '../../../common/interfaces/api-response.interface';
import { WarehouseEntity } from '../entities/warehouse.entity';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../auth/generated/prisma';

@ApiTags('Inventory - Warehouses')
@Controller('inventory/warehouses')
@UseInterceptors(ClassSerializerInterceptor)
export class WarehouseController {
  constructor(
    private readonly warehouseService: WarehouseService,
  ) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a warehouse' })
  async create(
    @Body() dto: CreateWarehouseDto,
  ): Promise<ApiResponse<WarehouseEntity>> {
    const data = await this.warehouseService.create(dto);
    return apiResponse(data, 'Warehouse created successfully');
  }

  @Get()
  @Roles(Role.ADMIN, Role.SELLER)
  @ApiOperation({ summary: 'Get all warehouses' })
  async findAll(): Promise<ApiResponse<WarehouseEntity[]>> {
    const data = await this.warehouseService.findAll();
    return apiResponse(data, 'Warehouses retrieved successfully');
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.SELLER)
  @ApiOperation({ summary: 'Get warehouse by ID' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<WarehouseEntity>> {
    const data = await this.warehouseService.findOne(id);
    return apiResponse(data, 'Warehouse retrieved successfully');
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a warehouse' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWarehouseDto,
  ): Promise<ApiResponse<WarehouseEntity>> {
    const data = await this.warehouseService.update(id, dto);
    return apiResponse(data, 'Warehouse updated successfully');
  }

  @Patch(':id/deactivate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Deactivate a warehouse' })
  async deactivate(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<ApiResponse<WarehouseEntity>> {
    const data = await this.warehouseService.deactivate(id);
    return apiResponse(data, 'Warehouse deactivated successfully');
  }
}
