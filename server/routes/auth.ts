import { userLogin, userSignup } from '@controllers/auth'
import express from 'express'
const authRouter = express.Router()
authRouter.post('/signup', userSignup);
authRouter.post('/login', userLogin);
export default authRouter