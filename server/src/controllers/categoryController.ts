import type { Request, Response } from 'express';
import { z } from 'zod';
import { getUserId } from '../middleware/auth';
import { CATEGORY_ICONS, CATEGORY_TYPES, HEX_COLOR } from '../models/Category';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '../services/categoryService';

const categoryFields = {
  name: z.string().trim().min(1, 'Name is required').max(40, 'Name must be at most 40 characters'),
  color: z
    .string()
    .regex(HEX_COLOR, 'Colour must be a hex value like #22c55e')
    .transform((c) => c.toLowerCase()),
  icon: z.enum(CATEGORY_ICONS, 'Choose a valid icon'),
};

const categoryType = z.enum(CATEGORY_TYPES, 'Type must be expense or income');

export const createCategorySchema = z.object({ ...categoryFields, type: categoryType });

export const updateCategorySchema = z
  .object({ ...categoryFields, archived: z.boolean() })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Provide at least one field to update');

const listQuerySchema = z.object({ type: categoryType.optional() });

type IdParams = { id: string };

export async function list(req: Request, res: Response): Promise<void> {
  const { type } = listQuerySchema.parse(req.query);
  res.json({ categories: await listCategories(getUserId(req), type) });
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = req.body as z.infer<typeof createCategorySchema>;
  res.status(201).json({ category: await createCategory(getUserId(req), input) });
}

export async function update(req: Request<IdParams>, res: Response): Promise<void> {
  const input = req.body as z.infer<typeof updateCategorySchema>;
  res.json({ category: await updateCategory(getUserId(req), req.params.id, input) });
}

export async function remove(req: Request<IdParams>, res: Response): Promise<void> {
  await deleteCategory(getUserId(req), req.params.id);
  res.status(204).end();
}
