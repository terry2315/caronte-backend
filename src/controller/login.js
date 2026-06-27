import bcrypt from 'bcrypt';
import User from '../models/user.js';

export const validateLogin = async (req, res) => {

    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Debes ingresar los datos solicitados'
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({ email: normalizedEmail });

        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Credenciales invalidas'
            });
        }

        if (!user.password) {
            return res.status(400).json({
                status: 'error',
                message: 'Esta cuenta fue creada con Google, Inicia sesion con Google.'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                status: 'error',
                message: 'Datos invalidos'
            });
        }

        return res.status(200).json({
            status: 'success',
            message: 'Login exitoso',
            user: {
                is: user._id,
                name: user.name,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                profiledCompleted: user.profileCompleted,
                authProvider: user.authProvider
            }
        });

    } catch (error) {
        console.log('Error al intentar conectar con la base de datos', error);
        return res.status(500).json({
            status: 'error',
            messagge: 'error al buscar articulo'
        });
    }

}