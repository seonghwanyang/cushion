import { Request, Response, NextFunction } from 'express';
import { serviceFactory } from '@/factories/service.factory';
import { UnauthorizedError } from '@/utils/errors';
import { supabase } from '@/config/supabase';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
      tokenId?: string;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Extract token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }
    
    const token = authHeader.substring(7);
    
    // Check if we should use Supabase or fallback to JWT
    if (supabase) {
      // Verify Supabase token
      const { data: { user }, error } = await supabase.auth.getUser(token);
      
      if (error || !user) {
        throw new UnauthorizedError('Invalid token');
      }
      
      // Get authService to check if user exists in our database
      const authService = serviceFactory.getAuthService();
      
      try {
        // Try to get user from our database
        const dbUser = await authService.validateUser(user.id);
        
        // Attach user to request
        req.user = {
          id: dbUser.id,
          email: dbUser.email,
          role: dbUser.role,
        };
      } catch (dbError) {
        // User doesn't exist in our database yet, create a minimal user object
        req.user = {
          id: user.id,
          email: user.email!,
          role: 'USER',
        };
      }
    } else {
      // Fallback to JWT for development/testing
      const jwtService = serviceFactory.getJWTService();
      const authService = serviceFactory.getAuthService();
      
      // Verify token
      const payload = await jwtService.verifyAccessToken(token);
      
      // Validate user
      const user = await authService.validateUser(payload.sub);
      
      // Attach user to request
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Not authenticated'));
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new UnauthorizedError('Insufficient permissions'));
    }
    
    next();
  };
};