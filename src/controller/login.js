

/*
Recibir email y password desde req.body.
Validar que ambos datos existan.
Buscar el usuario en MongoDB por email.
Verificar si existe.
Comparar la contraseña recibida con la contraseña encriptada usando bcrypt.compare().
Si todo está bien, responder con los datos seguros del usuario.
Más adelante, generar un token JWT para mantener la sesión.
*/

/*
1. Usuario hace login.
2. Backend valida email/password.
3. Backend responde con token.
4. Frontend guarda el token.
5. Frontend envía ese token en cada petición privada.
6. Backend verifica el token con un middleware.
7. Si el token es válido, permite acceso.
*/

import bcrypt from 'bcrypt';
import User from '../models/user.js';
import { generateToken } from '../utils/generateToken.js';


export const validateLogin = async (req, res) => {

    try {

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(401).json({
                "status": "error",
                "message": "Debes ingresar los datos de forma correcta"
            });
        }

        const emailNormalized = email.trim().toLowerCase();

        const user = await User.findOne({ email: emailNormalized }).select('+passwordHash');

        if (!user) {
            return res.status(401).json({
                "status": "error",
                "message": "Los datos ingresados son invalidos"
            });
        }

        const isPasswordValidate = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValidate) {
            return res.status(401).json({
                "status": "error",
                "message": "Los datos ingresados son invalidos"
            });
        }

        const token = generateToken(user);

        return res.status(200).json({
            status: "success",
            message: "Login exitoso",
            token,
            user: {
                id: user._id,
                name: user.name,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                profileCompleted: user.profileCompleted,
                authProvider: user.authProvider
            }
        });




    } catch (error) {
        return res.status(500).json({
            "status": "error",
            "message": "Error al intentar conectar con la base de datos"
        });
    }

}