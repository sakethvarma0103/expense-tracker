import type { Request, Response } from 'express';
import { z } from 'zod';
import { getUserId } from '../middleware/auth';
import { getMonthlyAnalytics } from '../services/analyticsService';
import { MONTH_PATTERN } from '../services/dateRange';

const monthlyQuerySchema = z.object({
  month: z.string().regex(MONTH_PATTERN, 'Month must be YYYY-MM'),
});

export async function monthly(req: Request, res: Response): Promise<void> {
  const { month } = monthlyQuerySchema.parse(req.query);
  res.json({ analytics: await getMonthlyAnalytics(getUserId(req), month) });
}
