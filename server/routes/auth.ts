import { userSignup } from '@controllers/auth'
import express from 'express'
const authRouter = express.Router()
authRouter.post('/signup', userSignup);
export default authRouter