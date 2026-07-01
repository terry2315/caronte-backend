import jwt from 'jsonwebtoken';
import User from '../models/user.js';


export const authMiddleware = async (req, res, next) => {

    try {
        const token = req.cookies.accessToken;

        if (!token) {
            return res.status(401).json({
                status: 'error',
                message: 'No autorizado'
            });
        }

        const decode = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decode.id).select('-password');

        if (!user) {
            return res.staus(401).json({
                status: 'error',
                message: 'Usuari no encontrado'
            });
        }

        if (user.isActive === false) {
            return res.status(403).json({
                status: 'error',
                message: 'Cuenta desactivada'
            });
        }

        req.user = user;

        next();

    } catch (error) {
        return res.status(401).json({
            status: 'error',
            message: 'Sesion invalida o expirada'
        });
    };

}