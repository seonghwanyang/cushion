import type { User } from '@prisma/client';

export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface IAuthService {
  register(input: RegisterInput): Promise<{ user: User; tokens: AuthTokens }>;
  login(input: LoginInput): Promise<{ user: User; tokens: AuthTokens }>;
  refreshTokens(refreshToken: string): Promise<AuthTokens>;
  logout(userId: string): Promise<void>;
  validateUser(userId: string): Promise<User>;
}