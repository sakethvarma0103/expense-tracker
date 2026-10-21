import { Router } from 'express';
import {
  create,
  getOne,
  list,
  remove,
  transactionSchema,
  transactionUpdateSchema,
  update,
} from '../controllers/transactionController';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

export const transactionRouter = Router();

transactionRouter.use(requireAuth);

transactionRouter.get('/', list);
transactionRouter.post('/', validateBody(transactionSchema), create);
transactionRouter.get('/:id', getOne);
// Only checks the shape here; the controller merges and fully validates
transactionRouter.patch('/:id', validateBody(transactionUpdateSchema), update);
transactionRouter.delete('/:id', remove);
