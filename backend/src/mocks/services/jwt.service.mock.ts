import { IJWTService, TokenPayload } from '@/interfaces/services/jwt.service.interface';
import { UnauthorizedError } from '@/utils/errors';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '@prisma/client';
import { logger } from '@/utils/logger';

interface ExtendedTokenPayload extends TokenPayload {
  exp: number;
  iat: number;
}

export class MockJWTService implements IJWTService {
  private tokens = new Map<string, ExtendedTokenPayload>();
  private refreshTokens = new Map<string, { jti: string; userId: string; revoked: boolean; exp: number }>();

  constructor() {
    logger.info('Mock JWT Service initialized with token expiration support');
    // Clean up expired tokens every 5 minutes
    setInterval(() => this.cleanupExpiredTokens(), 5 * 60 * 1000);
  }

  async generateTokens(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const now = Date.now();
    const jti = uuidv4();
    const accessToken = `mock-jwt-${uuidv4()}`;
    const refreshToken = `mock-refresh-${uuidv4()}`;
    const expiresIn = 900; // 15 minutes in seconds

    // Access token payload with expiration
    this.tokens.set(accessToken, {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
      iat: now,
      exp: now + (expiresIn * 1000), // 15 minutes
    });

    // Refresh token payload with expiration
    const refreshExpiry = now + (7 * 24 * 60 * 60 * 1000); // 7 days
    this.tokens.set(refreshToken, {
      sub: user.id,
      email: user.email,
      role: user.role,
      type: 'refresh',
      jti,
      iat: now,
      exp: refreshExpiry,
    });

    // Refresh token DB simulation
    this.refreshTokens.set(jti, {
      jti,
      userId: user.id,
      revoked: false,
      exp: refreshExpiry,
    });

    logger.info(`Generated mock tokens for user ${user.id} (access expires in ${expiresIn}s)`);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    const payload = this.tokens.get(token);
    
    if (!payload || payload.type !== 'access') {
      throw new UnauthorizedError('Invalid access token');
    }

    // Check if token is expired
    if (payload.exp < Date.now()) {
      this.tokens.delete(token);
      throw new UnauthorizedError('Access token expired');
    }

    return payload;
  }

  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    const payload = this.tokens.get(token);
    
    if (!payload || payload.type !== 'refresh' || !payload.jti) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Check if token is expired
    if (payload.exp < Date.now()) {
      this.tokens.delete(token);
      if (payload.jti) {
        this.refreshTokens.delete(payload.jti);
      }
      throw new UnauthorizedError('Refresh token expired');
    }

    const dbToken = this.refreshTokens.get(payload.jti);
    if (!dbToken || dbToken.revoked) {
      throw new UnauthorizedError('Token revoked or not found');
    }

    return payload;
  }

  async revokeRefreshToken(jti: string): Promise<void> {
    const token = this.refreshTokens.get(jti);
    if (token) {
      token.revoked = true;
      // Also remove the token from the tokens map
      for (const [tokenString, payload] of this.tokens.entries()) {
        if (payload.jti === jti) {
          this.tokens.delete(tokenString);
          break;
        }
      }
      logger.info(`Revoked refresh token with jti ${jti}`);
    }
  }

  // Clean up expired tokens periodically
  private cleanupExpiredTokens(): void {
    const now = Date.now();
    let cleanedCount = 0;

    // Clean up expired tokens
    for (const [token, payload] of this.tokens.entries()) {
      if (payload.exp < now) {
        this.tokens.delete(token);
        cleanedCount++;
      }
    }

    // Clean up expired refresh tokens
    for (const [jti, tokenData] of this.refreshTokens.entries()) {
      if (tokenData.exp < now) {
        this.refreshTokens.delete(jti);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.info(`Cleaned up ${cleanedCount} expired tokens`);
    }
  }
}