import express from 'express';
import cors from 'cors';
import router from './routes/user.js';

const app = express();

const allowedOrigins = [
    'http://localhost:5173',
    'https://caronte-client.vercel.app',
    process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Permite peticiones sin origin, como Postman o curl
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error(`Origen no permitido por CORS: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    return res.status(200).json({
        status: 'success',
        message: 'Caronte API funcionando correctamente',
    });
});

app.use('/', router);

export default app;