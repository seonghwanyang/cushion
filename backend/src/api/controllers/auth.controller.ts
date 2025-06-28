import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { serviceFactory } from '@/factories/service.factory';
import { sendSuccess } from '@/utils/response';

// Validation schemas
const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6).max(100),
    // 프로덕션에서는 아래 regex를 사용
    // password: z.string().min(8).regex(
    //   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    //   'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    // ),
    name: z.string().min(2).max(100).optional(),
  }),
});

const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string(),
  }),
});

const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string(),
  }),
});

export class AuthController {
  private get authService() {
    return serviceFactory.getAuthService();
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // 디버깅: 요청 데이터 로깅
      console.log('[AuthController.register] Request body:', JSON.stringify(req.body, null, 2));
      console.log('[AuthController.register] Headers:', req.headers);
      
      const { user, tokens } = await this.authService.register(req.body);
      
      // 디버깅: 응답 데이터 로깅
      const responseData = {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
        tokens,
      };
      console.log('[AuthController.register] Response data:', JSON.stringify(responseData, null, 2));
      
      sendSuccess(res, responseData, 201);
    } catch (error) {
      console.error('[AuthController.register] Error:', error);
      next(error);
    }
  }
  
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, tokens } = await this.authService.login(req.body);
      
      sendSuccess(res, {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        tokens,
      });
    } catch (error) {
      next(error);
    }
  }
  
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tokens = await this.authService.refreshTokens(req.body.refreshToken);
      
      sendSuccess(res, tokens);
    } catch (error) {
      next(error);
    }
  }
  
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await this.authService.logout(req.user!.id);
      
      sendSuccess(res, { message: '로그아웃되었습니다' });
    } catch (error) {
      next(error);
    }
  }
  
  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await this.authService.validateUser(req.user!.id);
      
      sendSuccess(res, {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
export { registerSchema, loginSchema, refreshSchema };