import { Router } from 'express';
import {
  create,
  createAccountSchema,
  getOne,
  list,
  remove,
  update,
  updateAccountSchema,
} from '../controllers/accountController';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

export const accountRouter = Router();

accountRouter.use(requireAuth);

accountRouter.get('/', list);
accountRouter.post('/', validateBody(createAccountSchema), create);
accountRouter.get('/:id', getOne);
accountRouter.patch('/:id', validateBody(updateAccountSchema), update);
accountRouter.delete('/:id', remove);
