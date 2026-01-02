import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../generated/prisma';

@Injectable()
export class AuthPrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(AuthPrismaService.name);

  constructor() {
    const url = process.env.AUTH_DATABASE_URL;
    console.log('!!! DEBUG: AUTH_DATABASE_URL value is:', url);
    super({
      datasources: {
        db: {
          url,
        },
      },
    });
  }

  async onModuleInit() {
    this.logger.log(`Initializing with AUTH_DATABASE_URL: ${process.env.AUTH_DATABASE_URL}`);
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
