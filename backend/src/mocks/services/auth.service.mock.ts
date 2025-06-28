import { IAuthService, RegisterInput, LoginInput, AuthTokens } from '@/interfaces/services/auth.service.interface';
import { mockUsers } from '../data/users.mock';
import { ConflictError, UnauthorizedError } from '@/utils/errors';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '@prisma/client';
import { serviceFactory } from '@/factories/service.factory';

export class MockAuthService implements IAuthService {
  private users = new Map(mockUsers.map(u => [u.id, { ...u }]));
  private usersByEmail = new Map(mockUsers.map(u => [u.email, u.id]));
  private refreshTokenStore = new Map<string, { userId: string; token: string }>();

  private get jwtService() {
    return serviceFactory.getJWTService();
  }

  async register(input: RegisterInput): Promise<{ user: User; tokens: AuthTokens }> {
    console.log('[MockAuthService.register] Input:', JSON.stringify(input, null, 2));
    
    // 시뮬레이션 딜레이
    await this.simulateDelay();

    if (this.usersByEmail.has(input.email)) {
      console.log('[MockAuthService.register] Email already exists:', input.email);
      throw new ConflictError('Email already registered');
    }

    const user: User = {
      id: `mock-user-${uuidv4()}`,
      email: input.email,
      password: await bcrypt.hash(input.password, 10),
      name: input.name || null,
      profileImage: null,
      role: 'USER',
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: null,
    };

    console.log('[MockAuthService.register] Created user:', JSON.stringify({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }, null, 2));

    this.users.set(user.id, user);
    this.usersByEmail.set(user.email, user.id);

    const tokens = await this.jwtService.generateTokens(user);
    console.log('[MockAuthService.register] Generated tokens:', {
      accessToken: tokens.accessToken.substring(0, 20) + '...',
      refreshToken: tokens.refreshToken.substring(0, 20) + '...'
    });
    
    return { user, tokens };
  }

  async login(input: LoginInput): Promise<{ user: User; tokens: AuthTokens }> {
    await this.simulateDelay();

    const userId = this.usersByEmail.get(input.email);
    if (!userId) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const user = this.users.get(userId);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    user.lastLoginAt = new Date();
    const tokens = await this.jwtService.generateTokens(user);

    return { user, tokens };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    await this.simulateDelay();

    const tokenData = this.refreshTokenStore.get(refreshToken);
    if (!tokenData) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // 새 토큰 생성
    this.refreshTokenStore.delete(refreshToken);
    const user = this.users.get(tokenData.userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    return this.jwtService.generateTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.simulateDelay();
    
    // 해당 사용자의 모든 refresh token 삭제
    for (const [token, data] of this.refreshTokenStore.entries()) {
      if (data.userId === userId) {
        this.refreshTokenStore.delete(token);
      }
    }
  }

  async validateUser(userId: string): Promise<User> {
    const user = this.users.get(userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedError('User not found or inactive');
    }
    return user;
  }


  private async simulateDelay(ms: number = 100): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}