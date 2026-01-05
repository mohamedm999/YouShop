import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma';

@Injectable()
export class CatalogPrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  // Removed constructor with datasource override as it's now handled by the schema and generated client configuration


  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
