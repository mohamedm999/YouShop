import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CategoryService } from '../services/category.service';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { apiResponse } from '../../../common/helpers/api-response.helper';
import type { ApiResponse } from '../../../common/interfaces/api-response.interface';
import { CategoryEntity } from '../entities/category.entity';

@ApiTags('Catalog - Categories')
@Controller('catalog/categories')
@UseInterceptors(ClassSerializerInterceptor)
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  async create(@Body() createCategoryDto: CreateCategoryDto): Promise<ApiResponse<CategoryEntity>> {
    const data = await this.categoryService.create(createCategoryDto);
    return apiResponse(data, 'Category created successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  async findAll(): Promise<ApiResponse<CategoryEntity[]>> {
    const data = await this.categoryService.findAll();
    return apiResponse(data, 'Categories retrieved successfully');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponse<CategoryEntity>> {
    const data = await this.categoryService.findOne(id);
    return apiResponse(data, 'Category retrieved successfully');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<ApiResponse<CategoryEntity>> {
    const data = await this.categoryService.update(id, updateCategoryDto);
    return apiResponse(data, 'Category updated successfully');
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a category' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponse<null>> {
    await this.categoryService.remove(id);
    return apiResponse(null, 'Category deleted successfully');
  }
}
