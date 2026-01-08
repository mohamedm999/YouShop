import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  ClassSerializerInterceptor,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StockService } from '../services/stock.service';
import { UpdateStockDto } from '../dto/stock/update-stock.dto';
import { ReserveStockDto } from '../dto/stock/reserve-stock.dto';
import { ReleaseStockDto } from '../dto/stock/release-stock.dto';
import { ConfirmStockDto } from '../dto/stock/confirm-stock.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../auth/generated/prisma';
import { apiResponse } from '../../../common/helpers/api-response.helper';
import { StockEntity } from '../entities/stock.entity';
import type { ApiResponse } from '../../../common/interfaces/api-response.interface';

@ApiTags('Inventory - Stock')
@Controller('inventory/stocks')
@UseInterceptors(ClassSerializerInterceptor)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get(':sku')
  @Roles(Role.ADMIN, Role.SELLER, Role.CUSTOMER)
  @ApiOperation({ summary: 'Get stock by SKU' })
  async getStockBySku(
    @Param('sku') sku: string,
  ): Promise<ApiResponse<StockEntity[]>> {
    const data = await this.stockService.getStockBySku(sku);
    return apiResponse(data, 'Stock retrieved successfully');
  }

  @Post(':sku/:warehouseId/add')
  @Roles(Role.ADMIN, Role.SELLER)
  @ApiOperation({ summary: 'Add stock (increase quantity)' })
  async addStock(
    @Param('sku') sku: string,
    @Param('warehouseId', ParseUUIDPipe) warehouseId: string,
    @Body() dto: UpdateStockDto,
  ): Promise<ApiResponse<StockEntity>> {
    const data = await this.stockService.addStock(sku, warehouseId, dto);
    return apiResponse(data, 'Stock added successfully');
  }

  @Post(':sku/:warehouseId/reserve')
  @Roles(Role.ADMIN, Role.SELLER)
  @ApiOperation({ summary: 'Reserve stock' })
  async reserveStock(
    @Param('sku') sku: string,
    @Param('warehouseId', ParseUUIDPipe) warehouseId: string,
    @Body() dto: ReserveStockDto,
  ): Promise<ApiResponse<StockEntity>> {
    const data = await this.stockService.reserveStock(sku, warehouseId, dto);
    return apiResponse(data, 'Stock reserved successfully');
  }

  @Post(':sku/:warehouseId/release')
  @Roles(Role.ADMIN, Role.SELLER)
  @ApiOperation({ summary: 'Release reserved stock' })
  async releaseStock(
    @Param('sku') sku: string,
    @Param('warehouseId', ParseUUIDPipe) warehouseId: string,
    @Body() dto: ReleaseStockDto,
  ): Promise<ApiResponse<StockEntity>> {
    const data = await this.stockService.releaseStock(sku, warehouseId, dto);
    return apiResponse(data, 'Stock released successfully');
  }

  @Post(':sku/:warehouseId/confirm')
  @Roles(Role.ADMIN, Role.SELLER)
  @ApiOperation({ summary: 'Confirm stock (Finalize sale)' })
  async confirmStock(
    @Param('sku') sku: string,
    @Param('warehouseId', ParseUUIDPipe) warehouseId: string,
    @Body() dto: ConfirmStockDto,
  ): Promise<ApiResponse<StockEntity>> {
    const data = await this.stockService.confirmStock(sku, warehouseId, dto.quantity);
    return apiResponse(data, 'Stock confirmed successfully');
  }
}
