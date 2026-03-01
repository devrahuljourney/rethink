import express from 'express';
import { syncUsage } from '../controllers/usage';
import { userAuthMiddleware } from '../middlewares/auth';

const usageRouter = express.Router();

usageRouter.post('/sync', userAuthMiddleware, syncUsage);

export default usageRouter;
