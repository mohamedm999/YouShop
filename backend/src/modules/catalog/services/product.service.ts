import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CatalogPrismaService } from '../prisma/catalog-prisma.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { ProductEntity } from '../entities/product.entity';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: CatalogPrismaService) {}

  async create(createProductDto: CreateProductDto): Promise<ProductEntity> {
    // Check if SKU already exists
    const existingSku = await this.prisma.product.findUnique({
      where: { sku: createProductDto.sku },
    });

    if (existingSku) {
      throw new ConflictException(`Product with SKU "${createProductDto.sku}" already exists`);
    }

    // Validate categoryId if provided
    if (createProductDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: createProductDto.categoryId },
      });

      if (!category) {
        throw new BadRequestException(`Category with ID "${createProductDto.categoryId}" not found`);
      }
    }

    const product = await this.prisma.product.create({
      data: createProductDto,
    });

    return plainToInstance(ProductEntity, product);
  }

  async findAll(): Promise<ProductEntity[]> {
    const products = await this.prisma.product.findMany({
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });

    return products.map((product) => plainToInstance(ProductEntity, product));
  }

  async findOne(id: string): Promise<ProductEntity> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID "${id}" not found`);
    }

    return plainToInstance(ProductEntity, product);
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductEntity> {
    // Check if product exists
    await this.findOne(id);

    // Check if new SKU conflicts with existing product
    if (updateProductDto.sku) {
      const existingSku = await this.prisma.product.findFirst({
        where: {
          sku: updateProductDto.sku,
          NOT: { id },
        },
      });

      if (existingSku) {
        throw new ConflictException(`Product with SKU "${updateProductDto.sku}" already exists`);
      }
    }

    // Validate categoryId if provided
    if (updateProductDto.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: updateProductDto.categoryId },
      });

      if (!category) {
        throw new BadRequestException(`Category with ID "${updateProductDto.categoryId}" not found`);
      }
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: updateProductDto,
      include: { category: true },
    });

    return plainToInstance(ProductEntity, product);
  }

  async remove(id: string): Promise<void> {
    // Check if product exists
    await this.findOne(id);

    await this.prisma.product.delete({
      where: { id },
    });
  }
}
