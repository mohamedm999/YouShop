import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { CatalogPrismaService } from '../prisma/catalog-prisma.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoryEntity } from '../entities/category.entity';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: CatalogPrismaService) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<CategoryEntity> {
    // Check if category name already exists
    const existing = await this.prisma.category.findUnique({
      where: { name: createCategoryDto.name },
    });

    if (existing) {
      throw new ConflictException(`Category "${createCategoryDto.name}" already exists`);
    }

    const category = await this.prisma.category.create({
      data: createCategoryDto,
    });

    return plainToInstance(CategoryEntity, category);
  }

  async findAll(): Promise<CategoryEntity[]> {
    const categories = await this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });

    return categories.map((cat) => plainToInstance(CategoryEntity, cat));
  }

  async findOne(id: string): Promise<CategoryEntity> {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    return plainToInstance(CategoryEntity, category);
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<CategoryEntity> {
    // Check if category exists
    await this.findOne(id);

    // Check if new name conflicts with existing category
    if (updateCategoryDto.name) {
      const existing = await this.prisma.category.findFirst({
        where: {
          name: updateCategoryDto.name,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException(`Category "${updateCategoryDto.name}" already exists`);
      }
    }

    const category = await this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
    });

    return plainToInstance(CategoryEntity, category);
  }

  async remove(id: string): Promise<void> {
    // Check if category exists
    await this.findOne(id);

    await this.prisma.category.delete({
      where: { id },
    });
  }
}
