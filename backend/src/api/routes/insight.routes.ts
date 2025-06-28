import { Router } from 'express';
import { 
  insightController, 
  getWeeklyInsightsSchema, 
  generateWeeklyInsightSchema 
} from '@/api/controllers/insight.controller';
import { authenticate } from '@/api/middleware/auth.middleware';
import { validate } from '@/api/middleware/validation.middleware';

const router = Router();

// All insight routes require authentication
router.use(authenticate);

// Get latest insight for the user
router.get(
  '/latest',
  insightController.getLatest.bind(insightController)
);

// List all insights for the user
router.get(
  '/',
  insightController.list.bind(insightController)
);

// Get weekly insights
router.get(
  '/weekly',
  validate(getWeeklyInsightsSchema),
  insightController.getWeeklyInsights.bind(insightController)
);

// Generate new weekly insight
router.post(
  '/weekly',
  validate(generateWeeklyInsightSchema),
  insightController.generateWeeklyInsight.bind(insightController)
);

// Get portfolio summary
router.get(
  '/portfolio',
  insightController.getPortfolio.bind(insightController)
);

export default router;