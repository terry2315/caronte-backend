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

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded.id) {
            return res.status(401).json({
                status: 'error',
                message: 'Token inválido: no contiene id de usuario'
            });
        }

        const user = await User.findById(decoded.id).select('-password');

        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Usuario no encontrado'
            });
        }

        req.user = user;

        next();

    } catch (error) {
        return res.status(401).json({
            status: 'error',
            message: 'Token inválido o expirado'
        });
    }
};