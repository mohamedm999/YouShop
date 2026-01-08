import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { InventoryPrismaService } from '../prisma/inventory-prisma.service';
import { CreateWarehouseDto } from '../dto/warehouse/create-warehouse.dto';
import { UpdateWarehouseDto } from '../dto/warehouse/update-warehouse.dto';
import { WarehouseEntity } from '../entities/warehouse.entity';

@Injectable()
export class WarehouseService {
  constructor(
    private readonly prisma: InventoryPrismaService,
  ) {}

  // ===============================
  // CREATE
  // ===============================
  async create(dto: CreateWarehouseDto): Promise<WarehouseEntity> {
    const existing = await this.prisma.warehouse.findFirst({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException(
        `Warehouse with name "${dto.name}" already exists`,
      );
    }

    const warehouse = await this.prisma.warehouse.create({
      data: {
        name: dto.name,
        location: dto.location,
        isActive: true, // Use boolean directly or from DTO if provided/extended
      },
    });

    return plainToInstance(WarehouseEntity, warehouse);
  }

  // ===============================
  // FIND ALL
  // ===============================
  async findAll(): Promise<WarehouseEntity[]> {
    const warehouses = await this.prisma.warehouse.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return warehouses.map((w) =>
      plainToInstance(WarehouseEntity, w),
    );
  }

  // ===============================
  // FIND ONE
  // ===============================
  async findOne(id: string): Promise<WarehouseEntity> {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
    });

    if (!warehouse) {
      throw new NotFoundException(
        `Warehouse with ID "${id}" not found`,
      );
    }

    return plainToInstance(WarehouseEntity, warehouse);
  }

  // ===============================
  // UPDATE
  // ===============================
  async update(
    id: string,
    dto: UpdateWarehouseDto,
  ): Promise<WarehouseEntity> {
    await this.findOne(id);

    if (dto.name) {
      const conflict = await this.prisma.warehouse.findFirst({
        where: {
          name: dto.name,
          NOT: { id },
        },
      });

      if (conflict) {
        throw new ConflictException(
          `Warehouse with name "${dto.name}" already exists`,
        );
      }
    }

    const warehouse = await this.prisma.warehouse.update({
      where: { id },
      data: dto,
    });

    return plainToInstance(WarehouseEntity, warehouse);
  }

  // ===============================
  // DEACTIVATE (Soft Disable)
  // ===============================
  async deactivate(id: string): Promise<WarehouseEntity> {
    await this.findOne(id);

    const warehouse = await this.prisma.warehouse.update({
      where: { id },
      data: { isActive: false },
    });

    return plainToInstance(WarehouseEntity, warehouse);
  }
}
