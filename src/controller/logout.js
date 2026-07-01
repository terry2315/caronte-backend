import { authCookieOptions } from '../config/cookieOptions.js';

export const logouth = async (req, res) => {

    res.clearCookie('accesToken', authCookieOptions);

    return res.status(200).json({
        status: 'success',
        message: 'Sesion cerrada correctamente'
    });

};


