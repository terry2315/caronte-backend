import { authCookieOptions } from '../config/cookieOptions.js';

const logoutUser = (req, res) => {
    try {
        res.clearCookie('accessToken', authCookieOptions);

        return res.status(200).json({
            status: 'success',
            message: 'Sesión cerrada correctamente'
        });

    } catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'Error al cerrar sesión'
        });
    }
};

export default logoutUser;