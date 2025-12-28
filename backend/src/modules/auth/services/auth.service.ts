import { plainToInstance } from 'class-transformer';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthPrismaService } from '../prisma/auth-prisma.service';
import { SignupDto } from '../dto/signup.dto';
import { LoginDto } from '../dto/login.dto';
import { User } from '../generated/prisma';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { UserEntity } from '../entities/user.entity';
import { LoginResponse } from '../../../common/interfaces/auth.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: AuthPrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async signup(signupDto: SignupDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName } = signupDto;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
      },
    });

    // Generate token (only accessToken for signup)
    const { accessToken, user: userEntity } = await this.generateTokens(user);
    return { accessToken, user: userEntity };
  }

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    return this.generateTokens(user);
  }

  async refresh(refreshToken: string): Promise<LoginResponse> {
    // 1. Check if token exists in DB
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token'); // Revoked or fake
    }

    // 2. Check Expiry
    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    // 3. Rotate Token (Delete old, generate new)
    await this.prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    return this.generateTokens(storedToken.user); // Generates & saves new one
  }

  async logout(refreshToken: string): Promise<void> {
    // Delete the token from DB (Revoke access)
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }


  private async generateTokens(user: User): Promise<LoginResponse> {
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' }); 
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' }); 

    // Store in DB
    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id, // Ensure your schema maps this correctly (usually 'userId' or via 'user' relation)
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    return {
      accessToken,
      refreshToken,
      user: plainToInstance(UserEntity, user),
    };
  }
}
