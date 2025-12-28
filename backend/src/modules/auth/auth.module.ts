import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import * as dotenv from 'dotenv';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { AuthPrismaService } from './prisma/auth-prisma.service';

// Load Auth module specific environment variables
dotenv.config({ path: 'src/modules/auth/.env' });

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'fallback_secret',
      signOptions: { expiresIn: '1h' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthPrismaService],
  exports: [AuthService], // Export if other modules need to guard routes
})
export class AuthModule {}
