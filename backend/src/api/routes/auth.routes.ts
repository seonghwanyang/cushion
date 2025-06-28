import { Router } from 'express';
import { authController, registerSchema, loginSchema, refreshSchema } from '../controllers/auth.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';

export const authRouter = Router();

// Public routes
authRouter.post('/register', validate(registerSchema), authController.register.bind(authController));
authRouter.post('/login', validate(loginSchema), authController.login.bind(authController));
authRouter.post('/refresh', validate(refreshSchema), authController.refresh.bind(authController));

// Protected routes
authRouter.post('/logout', authenticate, authController.logout.bind(authController));
authRouter.get('/me', authenticate, authController.me.bind(authController));