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
import { ProductService } from '../services/product.service';
import { CreateProductDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { apiResponse } from '../../../common/helpers/api-response.helper';
import type { ApiResponse } from '../../../common/interfaces/api-response.interface';
import { ProductEntity } from '../entities/product.entity';
import { Public } from '../../../common/decorators/public.decorator';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Role } from '../../auth/generated/prisma';

@ApiTags('Catalog - Products')
@Controller('catalog/products')
@UseInterceptors(ClassSerializerInterceptor)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new product' })
  async create(@Body() createProductDto: CreateProductDto): Promise<ApiResponse<ProductEntity>> {
    const data = await this.productService.create(createProductDto);
    return apiResponse(data, 'Product created successfully');
  }

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all products' })
  async findAll(): Promise<ApiResponse<ProductEntity[]>> {
    const data = await this.productService.findAll();
    return apiResponse(data, 'Products retrieved successfully');
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponse<ProductEntity>> {
    const data = await this.productService.findOne(id);
    return apiResponse(data, 'Product retrieved successfully');
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update a product' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ApiResponse<ProductEntity>> {
    const data = await this.productService.update(id, updateProductDto);
    return apiResponse(data, 'Product updated successfully');
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a product' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<ApiResponse<null>> {
    await this.productService.remove(id);
    return apiResponse(null, 'Product deleted successfully');
  }
}
