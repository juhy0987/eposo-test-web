import { Injectable, ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SignUpDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly MAX_FAILED_ATTEMPTS = 5;
  private readonly LOCK_DURATION_MINUTES = 10;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    const { email, password } = signUpDto;

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Return distinct error for non-existent account
    if (!user) {
      throw new UnauthorizedException('No account found with this email address.');
    }

    // Check if account is locked
    if (user.accountLockedUntil && new Date() < user.accountLockedUntil) {
      const remainingMinutes = Math.ceil(
        (user.accountLockedUntil.getTime() - new Date().getTime()) / 60000
      );
      throw new UnauthorizedException(
        `Account is locked due to too many failed login attempts. Please try again in ${remainingMinutes} minute(s).`
      );
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // Increment failed login attempts
      const newFailedAttempts = user.failedLoginAttempts + 1;
      
      let accountLockedUntil = null;
      if (newFailedAttempts >= this.MAX_FAILED_ATTEMPTS) {
        accountLockedUntil = new Date(Date.now() + this.LOCK_DURATION_MINUTES * 60000);
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newFailedAttempts,
          accountLockedUntil,
        },
      });

      if (accountLockedUntil) {
        throw new UnauthorizedException(
          `Account locked for ${this.LOCK_DURATION_MINUTES} minutes due to too many failed login attempts.`
        );
      }

      const attemptsRemaining = this.MAX_FAILED_ATTEMPTS - newFailedAttempts;
      throw new UnauthorizedException(
        `Invalid password. ${attemptsRemaining} attempt(s) remaining before account lock.`
      );
    }

    // Reset failed attempts on successful login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        accountLockedUntil: null,
      },
    });

    // Generate tokens
    const payload = { sub: user.id, email: user.email };
    
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
      expiresIn: '1h',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '14d',
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }
}
