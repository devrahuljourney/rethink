import { getProfile, logout, userLogin, userSignup, updateProfile } from '../controllers/auth'
import express from 'express'
import { userAuthMiddleware } from '../middlewares/auth';
const authRouter = express.Router()
authRouter.post('/signup', userSignup);
authRouter.post('/login', userLogin);
authRouter.post('/logout', userAuthMiddleware, logout);
authRouter.get('/profile', userAuthMiddleware, getProfile);
authRouter.put('/update', userAuthMiddleware, updateProfile);
export default authRouter