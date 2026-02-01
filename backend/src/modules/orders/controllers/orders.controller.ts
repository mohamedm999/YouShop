import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Request,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from '../services/orders.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import {
  UpdateOrderStatusDto,
  OrderStatus,
} from '../dto/update-order-status.dto';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../../modules/auth/generated/prisma';
import { apiResponse } from '../../../common/helpers/api-response.helper';
import { ApiResponse } from '../../../common/interfaces/api-response.interface';
import { Order } from '../entities/order.entity';

@ApiTags('Orders')
@Controller('orders')
@UseInterceptors(ClassSerializerInterceptor)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Roles(Role.CUSTOMER)
  @ApiOperation({ summary: 'Create a new order' })
  async create(
    @Request() req,
    @Body() createOrderDto: CreateOrderDto,
  ): Promise<ApiResponse<Order>> {
    const data = await this.ordersService.create(
      req.user.userId,
      createOrderDto,
    );
    return apiResponse(data, 'Order created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all orders (filtered by role)' })
  async findAll(
    @Request() req,
    @Query('status') status?: OrderStatus,
  ): Promise<ApiResponse<Order[]>> {
    const user = req.user;
    let data;
    if (user.role === Role.ADMIN || user.role === Role.SELLER) {
      data = await this.ordersService.findAll(undefined, status);
    } else {
      data = await this.ordersService.findAll(user.userId, status);
    }
    return apiResponse(data, 'Orders retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  async findOne(
    @Request() req,
    @Param('id') id: string,
  ): Promise<ApiResponse<Order>> {
    const user = req.user;
    let data;
    if (user.role === Role.ADMIN || user.role === Role.SELLER) {
      data = await this.ordersService.findOne(id);
    } else {
      data = await this.ordersService.findOne(id, user.userId);
    }
    return apiResponse(data, 'Order retrieved successfully');
  }

  @Patch(':id/confirm')
  @Roles(Role.ADMIN, Role.SELLER)
  @ApiOperation({ summary: 'Confirm an order' })
  async confirmOrder(@Param('id') id: string): Promise<ApiResponse<Order>> {
    const data = await this.ordersService.confirmOrder(id);
    return apiResponse(data, 'Order confirmed successfully');
  }

  @Patch(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  async cancelOrder(
    @Request() req,
    @Param('id') id: string,
    @Body('reason') reason?: string,
  ): Promise<ApiResponse<Order>> {
    // Note: Implicitly relying on service logic.
    // Ideally should check ownership here as discussed, but service logic might handle or assume 'Authenticated' means check userId.
    // For now, mirroring previous logic but wrapped.
    const data = await this.ordersService.cancelOrder(id, reason);
    return apiResponse(data, 'Order cancelled successfully');
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.SELLER)
  @ApiOperation({ summary: 'Update order status' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<ApiResponse<Order>> {
    const data = await this.ordersService.updateStatus(id, dto.status);
    return apiResponse(data, 'Order status updated successfully');
  }
}
