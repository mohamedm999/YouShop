import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { winstonLogger } from './common/config/winston.config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { HttpExceptionFilter } from './common/filters/http-exception.filter';

import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: winstonLogger,
  });

  app.use(cookieParser());
  app.use(helmet());
  
  app.enableCors({
    origin: 'http://localhost:4000', // Frontend URL
    credentials: true,
  });

  // Register Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remove properties that are not in the DTO
      forbidNonWhitelisted: true, // Return error if non-whitelisted properties are present
      transform: true, // Transform input data to match the DTO structure
    }),
  );

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('YouShop API')
    .setDescription('E-commerce API documentation for YouShop')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT || 4000);
}
bootstrap();
