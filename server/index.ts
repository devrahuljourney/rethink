import 'dotenv/config';
import express, { Request, Response } from 'express';
import authRouter from './routes/auth';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(cookieParser());
app.use(express.json());
app.use('/api/v1/auth', authRouter);
app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!');
});


const PORT = Number(process.env.PORT) || 4000;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server started on port ${PORT} at 0.0.0.0`);
    });
}

export default app;