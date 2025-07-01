import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { UnauthorizedError } from '@/utils/errors';
import { serviceFactory } from '@/factories/service.factory';
import { config } from '@/config';

/**
 * Supabase Auth Middleware
 * This middleware will be used when USE_SUPABASE_AUTH=true
 * After 2 weeks (2025-02-12), the original auth.middleware.ts will be deprecated
 */
export const authenticateSupabase = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('[Auth Middleware Supabase] Starting authentication...');
    
    // Check if Supabase is configured
    if (!supabaseAdmin) {
      console.error('[Auth Middleware Supabase] Supabase Admin client is not initialized');
      throw new UnauthorizedError('Supabase is not configured');
    }
    
    // Extract token from header
    const authHeader = req.headers.authorization;
    console.log('[Auth Middleware Supabase] Auth header present:', !!authHeader);
    
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('[Auth Middleware Supabase] Invalid auth header format');
      throw new UnauthorizedError('No token provided');
    }
    
    const token = authHeader.substring(7);
    console.log('[Auth Middleware Supabase] Token extracted, length:', token.length);
    
    // Verify Supabase token using admin client
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error) {
      console.error('[Auth Middleware Supabase] Token verification error:', error.message);
      throw new UnauthorizedError('Invalid token');
    }
    
    if (!user) {
      console.error('[Auth Middleware Supabase] No user found for token');
      throw new UnauthorizedError('Invalid token');
    }
    
    console.log('[Auth Middleware Supabase] User verified:', user.id, user.email);
    
    // Try to get user from our database
    const authService = serviceFactory.getAuthService();
    
    try {
      // Check if user exists in our database
      const dbUser = await authService.validateUser(user.id);
      console.log('[Auth Middleware Supabase] User found in database:', dbUser.id);
      
      // Attach user to request
      req.user = {
        id: dbUser.id,
        email: dbUser.email,
        role: dbUser.role || 'USER',
      };
    } catch (dbError) {
      console.log('[Auth Middleware Supabase] User not in database, creating new user...');
      
      try {
        // When using real database, create user directly
        if (!config.features.useMockDatabase) {
          const { prisma } = await import('@/config/database');
          
          // Check if user already exists first
          const existingUser = await prisma.user.findUnique({
            where: { id: user.id }
          });
          
          if (!existingUser) {
            const newUser = await prisma.user.create({
              data: {
                id: user.id, // Use Supabase ID directly
                email: user.email!,
                password: '', // No password needed for Supabase users
                name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                profile: {
                  create: {
                    bio: '',
                    currentSituation: '',
                    goals: [],
                  },
                },
              },
            });
            
            console.log('[Auth Middleware Supabase] New user created in database:', newUser.id);
            
            req.user = {
              id: newUser.id,
              email: newUser.email,
              role: newUser.role,
            };
          } else {
            console.log('[Auth Middleware Supabase] User already exists, using existing:', existingUser.id);
            req.user = {
              id: existingUser.id,
              email: existingUser.email,
              role: existingUser.role,
            };
          }
        } else {
          // Mock mode: just use Supabase data
          req.user = {
            id: user.id,
            email: user.email!,
            role: 'USER',
          };
        }
      } catch (createError) {
        console.error('[Auth Middleware Supabase] Failed to create user:', createError);
        // Fallback: Use Supabase data without DB record
        req.user = {
          id: user.id,
          email: user.email!,
          role: 'USER',
        };
      }
    }
    
    console.log('[Auth Middleware Supabase] Authentication successful for:', req.user.email);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Authorization middleware - same as original
 */
export const authorizeSupabase = (...roles: string[]) => {
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