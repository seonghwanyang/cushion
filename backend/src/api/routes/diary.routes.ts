import { Router } from 'express';
import { diaryController, createDiarySchema, updateDiarySchema, getDiarySchema, listDiariesSchema } from '../controllers/diary.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authenticateSupabase } from '../middleware/auth.middleware.supabase';
import { config } from '@/config';

export const diaryRouter = Router();

// All diary routes require authentication
// Use Supabase auth if enabled, otherwise use JWT
const authMiddleware = config.features.useSupabaseAuth ? authenticateSupabase : authenticate;
diaryRouter.use(authMiddleware);

// Routes
diaryRouter.post('/', validate(createDiarySchema), diaryController.create.bind(diaryController));
diaryRouter.get('/', validate(listDiariesSchema), diaryController.list.bind(diaryController));
diaryRouter.get('/stats', diaryController.stats.bind(diaryController));
diaryRouter.get('/:id', validate(getDiarySchema), diaryController.findById.bind(diaryController));
diaryRouter.put('/:id', validate(updateDiarySchema), diaryController.update.bind(diaryController));
diaryRouter.delete('/:id', validate(getDiarySchema), diaryController.delete.bind(diaryController));