import { Module } from '@nestjs/common';
import { CatalogPrismaService } from './prisma/catalog-prisma.service';
import { CategoryController } from './controllers/category.controller';
import { CategoryService } from './services/category.service';
import { ProductController } from './controllers/product.controller';
import { ProductService } from './services/product.service';

@Module({
  imports: [],
  controllers: [CategoryController, ProductController],
  providers: [CatalogPrismaService, CategoryService, ProductService],
  exports: [CategoryService, ProductService],
})
export class CatalogModule {}

