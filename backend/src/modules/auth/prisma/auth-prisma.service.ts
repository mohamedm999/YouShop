import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma';

@Injectable()
export class AuthPrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(AuthPrismaService.name);

  // Removed constructor with datasource override as it's now handled by the schema and generated client configuration


  async onModuleInit() {
    this.logger.log(`Initializing with AUTH_DATABASE_URL: ${process.env.AUTH_DATABASE_URL}`);
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
