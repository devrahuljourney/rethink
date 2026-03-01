import express from 'express';
import { getInsights } from '../controllers/coach';
import { userAuthMiddleware } from '../middlewares/auth';

const coachRouter = express.Router();

coachRouter.get('/insights', userAuthMiddleware, getInsights);

export default coachRouter;
