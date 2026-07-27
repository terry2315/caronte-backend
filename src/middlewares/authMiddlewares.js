import jwt from 'jsonwebtoken';
import User from '../models/user.js';

export const authMiddleware = async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken;

        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'Token no proporcionado'
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (!decoded.id) {
            return res.status(401).json({
                status: 'error',
                message:
                    'Token inválido: no contiene id de usuario'
            });
        }

        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Usuario no encontrado'
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                status: 'error',
                message: 'La cuenta está desactivada'
            });
        }

        req.user = user;

        return next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                status: 'error',
                message: 'La sesión ha expirado'
            });
        }

        return res.status(401).json({
            status: 'error',
            message: 'Token inválido'
        });
    }
};