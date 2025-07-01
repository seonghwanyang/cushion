import { Router } from 'express';
import { authController, registerSchema, loginSchema, refreshSchema } from '../controllers/auth.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authenticateSupabase } from '../middleware/auth.middleware.supabase';
import { supabase } from '@/config/supabase';
import { config } from '@/config';

export const authRouter = Router();

// Select authentication middleware based on environment
const authMiddleware = config.features.useSupabaseAuth ? authenticateSupabase : authenticate;

// Legacy JWT routes - kept for backward compatibility during migration
if (!config.features.useSupabaseAuth) {
  // Public routes
  authRouter.post('/register', validate(registerSchema), authController.register.bind(authController));
  authRouter.post('/login', validate(loginSchema), authController.login.bind(authController));
  authRouter.post('/refresh', validate(refreshSchema), authController.refresh.bind(authController));
  authRouter.post('/logout', authMiddleware, authController.logout.bind(authController));
}

// Protected routes that work with both JWT and Supabase
authRouter.get('/me', authMiddleware, authController.me.bind(authController));

// New Supabase-specific routes
// Sync user data from Supabase to our database
authRouter.post('/sync', authenticate, async (req, res, next) => {
  try {
    // User is already authenticated via middleware
    const { user } = req;
    
    if (!user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    
    // TODO: Implement user sync logic to ensure user exists in our database
    // This would create or update the user record based on Supabase auth data
    
    res.json({ 
      message: 'User synced successfully',
      user 
    });
  } catch (error) {
    next(error);
  }
});