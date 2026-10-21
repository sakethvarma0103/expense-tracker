import { Router } from 'express';
import {
  create,
  createCategorySchema,
  list,
  remove,
  update,
  updateCategorySchema,
} from '../controllers/categoryController';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

export const categoryRouter = Router();

categoryRouter.use(requireAuth);

categoryRouter.get('/', list);
categoryRouter.post('/', validateBody(createCategorySchema), create);
categoryRouter.patch('/:id', validateBody(updateCategorySchema), update);
categoryRouter.delete('/:id', remove);
