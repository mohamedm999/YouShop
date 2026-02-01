import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { OrdersPrismaService } from '../prisma/orders-prisma.service';
import { OrdersEventsService } from './orders-events.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { UpdateOrderStatusDto, OrderStatus } from '../dto/update-order-status.dto';
import { v4 as uuidv4 } from 'uuid';
import { plainToInstance } from 'class-transformer';
import { Order } from '../entities/order.entity';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: OrdersPrismaService,
    private eventsService: OrdersEventsService,
  ) {}

  async create(userId: string, dto: CreateOrderDto) {
    const { items, shippingAddr } = dto;

    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

    // Create Order and Items in a transaction
    const order = await this.prisma.order.create({
      data: {
        userId,
        totalAmount,
        shippingAddr,
        status: OrderStatus.PENDING,
        items: {
          create: items.map((item) => ({
            sku: item.sku,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            warehouseId: item.warehouseId,
          })),
        },
      },
      include: { items: true },
    });

    this.eventsService.emitOrderCreated({
      orderId: order.id,
      userId: order.userId,
      items: items.map((item) => ({
        sku: item.sku,
        quantity: item.quantity,
        warehouseId: item.warehouseId,
      })),
      timestamp: new Date(),
    });

    this.logger.log(`Order created: ${order.id}`);
    return plainToInstance(Order, order, { excludeExtraneousValues: true });
  }

  async findAll(userId?: string, status?: OrderStatus) {
    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const orders = await this.prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map(order => plainToInstance(Order, order, { excludeExtraneousValues: true }));
  }

  async findOne(id: string, userId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    if (userId && order.userId !== userId) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return plainToInstance(Order, order, { excludeExtraneousValues: true });
  }

  async confirmOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) throw new NotFoundException(`Order ${id} not found`);
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(`Order cannot be confirmed. Current status: ${order.status}`);
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CONFIRMED },
      include: { items: true },
    });

    this.eventsService.emitOrderConfirmed({
      orderId: updatedOrder.id,
      userId: updatedOrder.userId,
      items: updatedOrder.items.map(i => ({
        sku: i.sku,
        quantity: i.quantity,
        warehouseId: i.warehouseId,
      })),
      timestamp: new Date(),
    });

    return plainToInstance(Order, updatedOrder, { excludeExtraneousValues: true });
  }

  async cancelOrder(id: string, reason?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) throw new NotFoundException(`Order ${id} not found`);
    if (order.status === OrderStatus.CANCELLED || order.status === OrderStatus.DELIVERED) {
      throw new BadRequestException(`Order cannot be cancelled. Current status: ${order.status}`);
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
      include: { items: true },
    });

    this.eventsService.emitOrderCancelled({
      orderId: updatedOrder.id,
      userId: updatedOrder.userId,
      items: updatedOrder.items.map(i => ({
        sku: i.sku,
        quantity: i.quantity,
        warehouseId: i.warehouseId,
      })),
      reason,
      timestamp: new Date(),
    });

    return plainToInstance(Order, updatedOrder, { excludeExtraneousValues: true });
  }

  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException(`Order ${id} not found`);

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true },
    });
    return plainToInstance(Order, updatedOrder, { excludeExtraneousValues: true });
  }
}
