import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { jwtService } from './jwt.service';
import { 
  ConflictError, 
  UnauthorizedError
} from '../utils/errors';
import { IAuthService, RegisterInput, LoginInput, AuthTokens } from '@/interfaces/services/auth.service.interface';
import type { User } from '@prisma/client';

export class AuthService implements IAuthService {
  async register(input: RegisterInput): Promise<{ user: User; tokens: AuthTokens }> {
    const { email, password, name } = input;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      throw new ConflictError('Email already registered');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user with profile
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        profile: {
          create: {},
        },
      },
    });
    
    // Generate tokens
    const tokens = await jwtService.generateTokens(user);
    
    return { user, tokens };
  }
  
  async login(input: LoginInput): Promise<{ user: User; tokens: AuthTokens }> {
    const { email, password } = input;
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }
    
    // Check if user is active
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError('Account is not active');
    }
    
    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    
    // Generate tokens
    const tokens = await jwtService.generateTokens(user);
    
    return { user, tokens };
  }
  
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    // Verify refresh token
    const payload = await jwtService.verifyRefreshToken(refreshToken);
    
    // Get user
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
    });
    
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedError('User not found or inactive');
    }
    
    // Revoke old refresh token
    if (payload.jti) {
      await jwtService.revokeRefreshToken(payload.jti);
    }
    
    // Generate new tokens
    return jwtService.generateTokens(user);
  }
  
  async logout(userId: string): Promise<void> {
    // Revoke all user's refresh tokens
    await prisma.refreshToken.updateMany({
      where: { 
        userId,
        revoked: false,
      },
      data: { revoked: true },
    });
  }
  
  async validateUser(userId: string): Promise<User> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedError('User not found or inactive');
    }
    
    return user;
  }
}

export const authService = new AuthService();