


import express from 'express';
import cors from 'cors';
import router from './routes/user.js';


const app = express();

const allowedOrigins = [
    'http://localhost:5173',
    'https://caronte-backend.onrender.com',
];

app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    return res.status(200).json({
        status: 'success',
        message: 'Caronte API funcionando correctamente'
    });
});

app.use('/', router);


export default app;