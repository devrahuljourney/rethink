import { getProfile, logout, userLogin, userSignup } from '@controllers/auth'
import express from 'express'
import { userAuthMiddleware } from '@middleware/auth';
const authRouter = express.Router()
authRouter.post('/signup', userSignup);
authRouter.post('/login', userLogin);
authRouter.post('/logout', userAuthMiddleware, logout);
authRouter.get('/profile', userAuthMiddleware, getProfile);
export default authRouter