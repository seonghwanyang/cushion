import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { config } from '../config';
import { prisma } from '../config/database';
import { UnauthorizedError } from '../utils/errors';
import { IJWTService, TokenPayload } from '@/interfaces/services/jwt.service.interface';
import type { User } from '@prisma/client';

export class JWTService implements IJWTService {
  async generateTokens(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  }> {
    const jti = randomBytes(32).toString('hex');
    
    // Generate access token
    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: 'access',
      } as TokenPayload,
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn,
        issuer: 'cushion.app',
        audience: 'cushion-users',
      }
    );
    
    // Generate refresh token
    const refreshToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        type: 'refresh',
        jti,
      } as TokenPayload,
      config.jwt.refreshSecret,
      {
        expiresIn: config.jwt.refreshExpiresIn,
        issuer: 'cushion.app',
        audience: 'cushion-users',
      }
    );
    
    // Save refresh token to database
    // await prisma.refreshToken.create({
    //   data: {
    //     jti,
    //     userId: user.id,
    //     token: this.hashToken(refreshToken),
    //     expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    //   },
    // });
    
    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    };
  }
  
  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(token, config.jwt.secret, {
        issuer: 'cushion.app',
        audience: 'cushion-users',
      }) as TokenPayload;
      
      if (payload.type !== 'access') {
        throw new Error('Invalid token type');
      }
      
      return payload;
    } catch (error) {
      throw new UnauthorizedError('Invalid access token');
    }
  }
  
  async verifyRefreshToken(token: string): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(token, config.jwt.refreshSecret, {
        issuer: 'cushion.app',
        audience: 'cushion-users',
      }) as TokenPayload;
      
      if (payload.type !== 'refresh' || !payload.jti) {
        throw new Error('Invalid token type');
      }
      
      // Check if token exists in database
      const dbToken = await prisma.refreshToken.findUnique({
        where: { jti: payload.jti },
      });
      
      if (!dbToken || dbToken.revoked) {
        throw new Error('Token revoked or not found');
      }
      
      // Check if token matches
      if (!this.compareTokenHash(token, dbToken.token)) {
        throw new Error('Token mismatch');
      }
      
      return payload;
    } catch (error) {
      throw new UnauthorizedError('Invalid refresh token');
    }
  }
  
  async revokeRefreshToken(jti: string): Promise<void> {
    await prisma.refreshToken.update({
      where: { jti },
      data: { revoked: true },
    });
  }
  
  private hashToken(token: string): string {
    return require('crypto')
      .createHash('sha256')
      .update(token)
      .digest('hex');
  }
  
  private compareTokenHash(token: string, hash: string): boolean {
    return this.hashToken(token) === hash;
  }
}

export const jwtService = new JWTService();