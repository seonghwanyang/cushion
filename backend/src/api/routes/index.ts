import { Router } from 'express';
import { authRouter } from './auth.routes';
import { diaryRouter } from './diary.routes';
import insightRouter from './insight.routes';

export const apiRouter = Router();

// Mount routes
apiRouter.use('/auth', authRouter);
apiRouter.use('/diaries', diaryRouter);
apiRouter.use('/insights', insightRouter);

// API info
apiRouter.get('/', (_req, res) => {
  res.json({
    message: 'Cushion API v1',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /auth/register',
        login: 'POST /auth/login',
        refresh: 'POST /auth/refresh',
        logout: 'POST /auth/logout',
        me: 'GET /auth/me',
      },
      diaries: {
        create: 'POST /diaries',
        list: 'GET /diaries',
        get: 'GET /diaries/:id',
        update: 'PUT /diaries/:id',
        delete: 'DELETE /diaries/:id',
        stats: 'GET /diaries/stats',
      },
      insights: {
        latest: 'GET /insights/latest',
        list: 'GET /insights',
        weekly: 'GET /insights/weekly',
        generateWeekly: 'POST /insights/weekly',
        portfolio: 'GET /insights/portfolio',
      },
    },
  });
});