import 'dotenv/config';
import express, { Request, Response } from 'express';
import authRouter from '@routes/auth';
const app = express();
app.use(express.json());
app.use('/api/v1/auth', authRouter);
app.get('/', (req: Request, res: Response) => {
    console.log(req);
    res.send('Hello World!');
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});