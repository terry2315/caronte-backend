import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRouter from './routes/user.js';
import vehicleRouter from './routes/vehicles.js';

const app = express();

app.set('trust proxy', 1);

const allowedOrigins = [
    'http://localhost:5173',
    'https://caronte-client.vercel.app',
    process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error('Origen no permitido por CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
    return res.status(200).json({
        status: 'success',
        message: 'Caronte API funcionando correctamente',
    });
});

app.use('/api', userRouter);
app.use('/api/vehicles', vehicleRouter);

export default app;