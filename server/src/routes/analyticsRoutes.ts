import { Router } from 'express';
import { monthly } from '../controllers/analyticsController';
import { requireAuth } from '../middleware/auth';

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth);

analyticsRouter.get('/monthly', monthly);
